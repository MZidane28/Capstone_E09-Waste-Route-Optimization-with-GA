import mongoose from 'mongoose';

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
  status: {
    type: String,
    enum: ['pending', 'arrived', 'collecting', 'completed'],
    default: 'arrived'
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    latitude: Number,
    longitude: Number
  }
});

const truckAssignmentSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  driverName: {
    type: String,
    default: 'N/A'
  },
  driverPhone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'completed', 'maintenance'],
    default: 'idle'
  },
  route: [{
    id: String,
    name: String,
    latitude: Number,
    longitude: Number,
    fillLevel: Number
  }],
  checkIns: [checkInSchema],
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  totalBins: {
    type: Number,
    default: 0
  },
  checkedInBins: {
    type: Number,
    default: 0
  },
  currentBin: {
    type: String,
    default: null
  },
  lastCheckIn: {
    type: Date,
    default: null
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
truckAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate checked-in bins
truckAssignmentSchema.methods.updateProgress = function() {
  this.checkedInBins = this.checkIns.filter(c => c.status === 'completed').length;
  this.totalBins = this.route.length;
  
  if (this.checkedInBins > 0) {
    const lastCheckIn = this.checkIns[this.checkIns.length - 1];
    this.lastCheckIn = lastCheckIn.timestamp;
    this.currentBin = lastCheckIn.binName;
  }
  
  if (this.checkedInBins === this.totalBins && this.totalBins > 0) {
    this.status = 'completed';
    this.endTime = new Date();
  }
};

const TruckAssignment = mongoose.model('TruckAssignment', truckAssignmentSchema);

export default TruckAssignment;
