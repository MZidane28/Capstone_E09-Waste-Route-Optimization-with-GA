import Bin from '../models/Bin.js';

// Get all bins
export const getAllBins = async (req, res) => {
    try {
        const bins = await Bin.find();
        res.status(200).json(bins);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching bins', 
            error: error.message, 
        });
    }
};

// Get bin by ID
export const getBinById = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id);
        if (!bin) return res.status(404).json({ message: 'Bin not found' });
        res.status(200).json(bin);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching bin', 
            error: error.message, 
        });
    }
};

// Create a new bin
export const createBin = async (req, res) => {
    try {
        const { name, location, capacity, demand, is_real } = req.body;
        const newBin = new Bin({
            name,
            location,
            capacity,
            demand,
            is_real,
        });
        await newBin.save().then(() => {
            res.status(201).json({
                statusCode: 201,
                message: "Bin created successfully",
                data: newBin,
            });
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error creating bin", 
            error: error.message, 
        });
    }
};

// Update a bin
export const updateBin = async (req, res) => {
    try {
        const updatedBin = await Bin.findByIdAndUpdate(
            req.params.id,
            { ...req.body, last_update: Date.now() },
            { new: true, runValidators: true }
        );
        if (!updatedBin) {
            return res.status(404).json({ message: "Bin not found" });
        } else {
            res.status(200).json({
                message: "Bin updated successfully",
                data: updatedBin,
            });
        }
    } catch (error) {
        res.status(500).json({ 
            message: "Error updating bin", 
            error: error.message, 
        });
    }
};

// Delete a bin
export const deleteBin = async (req, res) => {
  try {
    const deletedBin = await Bin.findByIdAndDelete(req.params.id);
    if (!deletedBin) return res.status(404).json({ message: "Bin not found" });
    res.status(200).json({ message: "Bin deleted", bin: deletedBin });
  } catch (error) {
    res.status(500).json({ 
        message: "Error deleting bin", 
        error: error.message, 
    });
  }
};

// Get random bins
export const getRandomBins = async (req, res) => {
  try {
    const { count } = req.body;
    if (!count || count <= 0) {
      return res.status(400).json({ message: "Please provide a valid count" });
    }

    const randomBins = await Bin.aggregate([{ $sample: { size: count } }]);
    res.status(200).json(randomBins);
  } catch (error) {
    res.status(500).json({ 
        message: "Error fetching random bins", 
        error: error.message,
    });
  }
};