import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  truck_no : { type: Number, required: true},
  distance : { type: Number, required: true, min : 0 },
  load : { type: Number, required: true, min : 0 },
  utilization : { type: Number, required: true},
  unused_capacity : { type: Number, required: true},
  emissions : { type: Number, required: true, min : 0 },
  route : [{ type: String, required: true }]
}, { _id : false});

const solutionSchema = new mongoose.Schema({
  simulation_day : { type: Number, required: true, min : 0 },
  method : { type: String, required: true, enum: ['ga', 'nn']},
  total_distance : { type: Number, required: true, min : 0 },
  total_emissions : { type: Number, required: true, min : 0 },
  avg_utilization : { type: Number, required: true},
  number_of_trucks : { type: Number, required: true},
  execution_time : { type: Number, required: true},
  routes : [routeSchema]
});

solutionSchema.index({ simulation_day: 1, method: 1 }, { unique: true });
solutionSchema.index({ method: 1 });
solutionSchema.index({ simulation_day: 1 });

solutionSchema.virtual('average_load_per_trip').get(function() {
  if (this.routes.length === 0) return 0;
  const totalLoad = this.routes.reduce((sum, trip) => sum + trip.load, 0);
  return (totalLoad / this.routes.length).toFixed(2);
});

solutionSchema.virtual('average_utilization_per_trip').get(function() {
  if (this.routes.length === 0) return 0;
  const totalUtilization = this.routes.reduce((sum, trip) => sum + trip.utilization, 0);
  return (totalUtilization / this.routes.length).toFixed(2);
});

solutionSchema.methods.getAllBinIds = function() {
  const binIds = [];
  this.routes.forEach(trip => {
    binIds.push(...trip.bin_sequence);
  });
  return [...new Set(binIds)];
};

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