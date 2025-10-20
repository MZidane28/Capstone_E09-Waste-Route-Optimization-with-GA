import mongoose from "mongoose";

const binSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  capacity: { type: Number, required: true },
  demand: { type: Number, required: true },
  is_real: { type: Boolean, default: false },
  last_update: { type: Date, default: Date.now }
});

const Bin = mongoose.model("Bin", binSchema);

export default Bin;