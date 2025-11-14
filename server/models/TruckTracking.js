import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true
  },
  binName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  location: {
    lat: Number,
    lng: Number
  }
});

const truckTrackingSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'completed', 'returning'],
    default: 'idle'
  },
  currentLocation: {
    type: String,
    default: 'Depot'
  },
  currentCoordinates: {
    lat: Number,
    lng: Number
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  checkIns: [checkInSchema],
  totalBins: {
    type: Number,
    default: 0
  },
  completedBins: {
    type: Number,
    default: 0
  },
  estimatedCompletion: {
    type: String,
    default: 'Not started'
  },
  route: [{
    binId: String,
    binName: String,
    location: {
      lat: Number,
      lng: Number
    }
  }],
  startTime: Date,
  endTime: Date,
  totalDistance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
truckTrackingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TruckTracking = mongoose.model('TruckTracking', truckTrackingSchema);

export default TruckTracking;
