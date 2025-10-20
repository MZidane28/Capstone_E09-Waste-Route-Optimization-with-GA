import mongoose from "mongoose";

const solutionSchema = new mongoose.Schema({
    created_at: { type: Date, default: Date.now },
    total_distance: { type: Number, required: true },
    total_time: { type: Number, required: true },
    utilization: { type: Number },
    emissions: { type: Number },

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

const Solution = mongoose.model("Solution", solutionSchema);

export default Solution;