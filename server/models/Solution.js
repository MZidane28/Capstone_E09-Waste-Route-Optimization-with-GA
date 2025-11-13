import mongoose from "mongoose";

// Route schema for detailed route information
const routeSchema = new mongoose.Schema({
  truck_no: { type: Number, required: true },
  distance: { type: Number, required: true, min: 0 },
  load: { type: Number, required: true, min: 0 },
  utilization: { type: Number, required: true },
  unused_capacity: { type: Number, required: true },
  emissions: { type: Number, required: true, min: 0 },
  route: [{ type: String, required: true }]
}, { _id: false });

// Main solution schema
const solutionSchema = new mongoose.Schema({
  // Timestamp
  created_at: { type: Date, default: Date.now },
  
  // Simulation metadata (optional - for comparison studies)
  simulation_day: { type: Number, min: 0 },
  method: { type: String, enum: ['ga', 'nn', 'manual'], default: 'manual' },
  
  // Summary metrics
  total_distance: { type: Number, required: true, min: 0 },
  total_time: { type: Number, required: true, min: 0 },
  total_emissions: { type: Number, default: 0, min: 0 },
  avg_utilization: { type: Number, default: 0 },
  number_of_trucks: { type: Number, required: true },
  execution_time: { type: Number }, // Algorithm execution time (ms)
  
  // Legacy field for backward compatibility
  utilization: { type: Number, default: 0 },
  emissions: { type: Number, default: 0 },
  
  // Detailed routes (new format)
  routes: [routeSchema],
  
  // Legacy trucks format (for backward compatibility)
  trucks: [
    {
      truck_no: { type: Number, required: true },
      distance: { type: Number, required: true },
      load: { type: Number, required: true },
      bins: [
        {
          bin_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Bin" 
          },
          visit_order: { type: Number, required: true },
          demand: { type: Number, required: true }
        }
      ]
    }
  ]
});

// Indexes for efficient querying
solutionSchema.index({ simulation_day: 1, method: 1 });
solutionSchema.index({ method: 1 });
solutionSchema.index({ simulation_day: 1 });
solutionSchema.index({ created_at: -1 });

// Virtual properties
solutionSchema.virtual('average_load_per_trip').get(function() {
  if (!this.routes || this.routes.length === 0) return 0;
  const totalLoad = this.routes.reduce((sum, trip) => sum + trip.load, 0);
  return parseFloat((totalLoad / this.routes.length).toFixed(2));
});

solutionSchema.virtual('average_utilization_per_trip').get(function() {
  if (!this.routes || this.routes.length === 0) return 0;
  const totalUtilization = this.routes.reduce((sum, trip) => sum + trip.utilization, 0);
  return parseFloat((totalUtilization / this.routes.length).toFixed(2));
});

// Instance methods
solutionSchema.methods.getAllBinIds = function() {
  const binIds = [];
  
  // Try new routes format first
  if (this.routes && this.routes.length > 0) {
    this.routes.forEach(trip => {
      if (trip.route) {
        binIds.push(...trip.route);
      }
    });
  }
  
  // Fallback to legacy trucks format
  if (binIds.length === 0 && this.trucks && this.trucks.length > 0) {
    this.trucks.forEach(truck => {
      if (truck.bins) {
        truck.bins.forEach(bin => {
          if (bin.bin_id) {
            binIds.push(bin.bin_id.toString());
          }
        });
      }
    });
  }
  
  return [...new Set(binIds)];
};

// Static methods
solutionSchema.statics.getByDay = async function(day) {
  return this.find({ simulation_day: day }).sort({ method: 1 });
};

solutionSchema.statics.getByMethodAndDateRange = async function(method, startDay, endDay) {
  return this.find({
    method: method,
    simulation_day: { $gte: startDay, $lte: endDay }
  }).sort({ simulation_day: 1 });
};

solutionSchema.statics.getRecent = async function(limit = 10) {
  return this.find().sort({ created_at: -1 }).limit(limit);
};

const Solution = mongoose.model("Solution", solutionSchema);

export default Solution;