import TruckTracking from "../models/TruckTracking.js";

// Get all trucks status
export const getAllTrucks = async (req, res) => {
  try {
    const trucks = await TruckTracking.find().sort({ truckId: 1 });
    
    res.status(200).json({
      success: true,
      count: trucks.length,
      data: trucks
    });
  } catch (error) {
    console.error('Error getting trucks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trucks'
    });
  }
};

// Get single truck by ID
export const getTruckById = async (req, res) => {
  try {
    const truck = await TruckTracking.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error getting truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch truck'
    });
  }
};

// Initialize/Create truck tracking
export const createTruck = async (req, res) => {
  try {
    const truck = await TruckTracking.create(req.body);
    
    res.status(201).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error creating truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create truck'
    });
  }
};

// Update truck status
export const updateTruckStatus = async (req, res) => {
  try {
    const { status, currentLocation, currentCoordinates, progress, estimatedCompletion } = req.body;
    
    const truck = await TruckTracking.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    if (status) truck.status = status;
    if (currentLocation) truck.currentLocation = currentLocation;
    if (currentCoordinates) truck.currentCoordinates = currentCoordinates;
    if (progress !== undefined) truck.progress = progress;
    if (estimatedCompletion) truck.estimatedCompletion = estimatedCompletion;
    
    // Set start time if starting route
    if (status === 'active' && !truck.startTime) {
      truck.startTime = new Date();
    }
    
    // Set end time if completed
    if (status === 'completed' && !truck.endTime) {
      truck.endTime = new Date();
    }
    
    await truck.save();
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error updating truck status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update truck status'
    });
  }
};

// Add check-in to truck
export const addCheckIn = async (req, res) => {
  try {
    const { binId, binName, duration, location } = req.body;
    
    const truck = await TruckTracking.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    const checkIn = {
      binId,
      binName,
      timestamp: new Date(),
      duration: duration || 0,
      location
    };
    
    truck.checkIns.push(checkIn);
    truck.completedBins = truck.checkIns.length;
    truck.currentLocation = binName;
    
    if (location) {
      truck.currentCoordinates = location;
    }
    
    // Update progress
    if (truck.totalBins > 0) {
      truck.progress = Math.round((truck.completedBins / truck.totalBins) * 100);
    }
    
    // Auto-complete if all bins are done
    if (truck.completedBins >= truck.totalBins && truck.totalBins > 0) {
      truck.status = 'completed';
      truck.progress = 100;
      truck.estimatedCompletion = 'Completed';
      if (!truck.endTime) {
        truck.endTime = new Date();
      }
    }
    
    await truck.save();
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error adding check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add check-in'
    });
  }
};

// Assign route to truck
export const assignRoute = async (req, res) => {
  try {
    const { route, totalBins } = req.body;
    
    const truck = await TruckTracking.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    truck.route = route;
    truck.totalBins = totalBins || route.length;
    truck.status = 'idle'; // Ready to start
    
    await truck.save();
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error assigning route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign route'
    });
  }
};

// Reset truck (clear all data)
export const resetTruck = async (req, res) => {
  try {
    const truck = await TruckTracking.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    truck.status = 'idle';
    truck.currentLocation = 'Depot';
    truck.currentCoordinates = undefined;
    truck.progress = 0;
    truck.checkIns = [];
    truck.completedBins = 0;
    truck.estimatedCompletion = 'Not started';
    truck.startTime = undefined;
    truck.endTime = undefined;
    truck.totalDistance = 0;
    
    await truck.save();
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error resetting truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset truck'
    });
  }
};

// Delete truck
export const deleteTruck = async (req, res) => {
  try {
    const truck = await TruckTracking.findByIdAndDelete(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete truck'
    });
  }
};
