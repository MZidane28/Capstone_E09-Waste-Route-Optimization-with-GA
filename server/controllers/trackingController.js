import TruckAssignment from '../models/TruckAssignment.js';

// GET all trucks with status
export const getAllTrucks = async (req, res) => {
  try {
    const trucks = await TruckAssignment.find().sort({ createdAt: -1 });
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trucks', error: error.message });
  }
};

// GET specific truck by ID
export const getTruckById = async (req, res) => {
  try {
    const truck = await TruckAssignment.findOne({ truckId: req.params.truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching truck', error: error.message });
  }
};

// POST create new truck assignment
export const createTruckAssignment = async (req, res) => {
  try {
    const { truckId, name, driverName, driverPhone, route } = req.body;

    // Check if truck already exists
    const existingTruck = await TruckAssignment.findOne({ truckId });
    if (existingTruck) {
      // Update existing truck assignment with new route
      existingTruck.name = name;
      existingTruck.driverName = driverName;
      existingTruck.driverPhone = driverPhone;
      existingTruck.route = route;
      existingTruck.totalBins = route ? route.length : 0;
      existingTruck.checkedInBins = 0;
      existingTruck.checkIns = []; // Reset check-ins
      existingTruck.status = 'idle';
      existingTruck.startTime = null;
      existingTruck.endTime = null;
      existingTruck.currentBin = null;
      existingTruck.lastCheckIn = null;

      await existingTruck.save();
      console.log(`♻️  Updated existing assignment for ${truckId} with ${route.length} bins`);
      return res.status(200).json(existingTruck);
    }

    const truckAssignment = new TruckAssignment({
      truckId,
      name,
      driverName,
      driverPhone,
      route,
      totalBins: route ? route.length : 0,
      status: 'idle'
    });

    await truckAssignment.save();
    console.log(`✅ Created new assignment for ${truckId} with ${route.length} bins`);
    res.status(201).json(truckAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating truck assignment', error: error.message });
  }
};

// POST check-in at a bin
export const checkIn = async (req, res) => {
  try {
    const { truckId, binId, binName, status, notes, location } = req.body;

    const truck = await TruckAssignment.findOne({ truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Add check-in
    truck.checkIns.push({
      binId,
      binName,
      timestamp: new Date(),
      status: status || 'completed',
      notes: notes || '',
      location: location || {}
    });

    // Update progress
    truck.updateProgress();

    await truck.save();
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Error checking in', error: error.message });
  }
};

// POST start route
export const startRoute = async (req, res) => {
  try {
    const truck = await TruckAssignment.findOne({ truckId: req.params.truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    truck.status = 'active';
    truck.startTime = new Date();
    await truck.save();

    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Error starting route', error: error.message });
  }
};

// POST complete route
export const completeRoute = async (req, res) => {
  try {
    const truck = await TruckAssignment.findOne({ truckId: req.params.truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    truck.status = 'completed';
    truck.endTime = new Date();
    await truck.save();

    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Error completing route', error: error.message });
  }
};

// DELETE truck assignment
export const deleteTruckAssignment = async (req, res) => {
  try {
    const truck = await TruckAssignment.findOneAndDelete({ truckId: req.params.truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }
    res.json({ message: 'Truck assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting truck assignment', error: error.message });
  }
};

// DELETE all truck assignments
export const deleteAllTrucks = async (req, res) => {
  try {
    const result = await TruckAssignment.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} truck assignments`);
    res.json({ 
      message: 'All truck assignments deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting truck assignments', error: error.message });
  }
};
