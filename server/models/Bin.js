import mongoose from "mongoose";

const binSchema = new mongoose.Schema({
  bin_id: { type: String, required: true, unique: true},
  name: { type: String, required: true, trim: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  capacity: { type: Number, required: true, default: 100 }, // adjust later
  fill_rate: { type: Number, required: true, default: 10 }, // units per time period
  current_fill_ga : { type: Number, required: true, default: 0 }, // for GA optimization
  current_fill_nn : { type: Number, required: true, default: 0 }, // for conventional method
  is_real: { type: Boolean, default: false }
}, { 
  timestamps: true
});

// Get fill percentage for GA
binSchema.virtual('fill_percentage_ga').get(function() {
  return (this.current_fill_ga / this.capacity) * 100;
});

// Get fill percentage for NN
binSchema.virtual('fill_percentage_nn').get(function() {
  return (this.current_fill_nn / this.capacity) * 100;
});

binSchema.methods.updateFill = function(method) {
  const fillKey = method === 'ga' ? 'current_fill_ga' : 'current_fill_nn';
  
  // Apply a random variation to fill_rate (±20%)
  const variation = (Math.random() * 0.4 - 0.2); // -0.2 to +0.2
  const adjustedRate = this.fill_rate * (1 + variation)

  this[fillKey] += adjustedRate;

  return this[fillKey];
};

binSchema.methods.emptyBin = function(method) {
  const fillKey = method === 'ga' ? 'current_fill_ga' : 'current_fill_nn';
  this[fillKey] = 0;
};

binSchema.methods.getFillPercentage = function(method) {
  const fillKey = method === 'ga' ? 'current_fill_ga' : 'current_fill_nn';
  return (this[fillKey] / this.capacity) * 100;
};

// Check if bin needs collection (for GA)
binSchema.methods.needsCollection = function(threshold = 80) {
  return this.getFillPercentage('ga') >= threshold;
};

binSchema.statics.getBinsForGA = async function(threshold = 80) {
  return this.find({
    $expr: {
      $gte: [
        { $multiply: [{ $divide: ['$current_fill_ga', '$capacity'] }, 100] },
        threshold
      ]
    }
  });
};

binSchema.statics.getBinsForNN = async function() {
  return this.find({});
};

const Bin = mongoose.model("Bin", binSchema);

export default Bin;