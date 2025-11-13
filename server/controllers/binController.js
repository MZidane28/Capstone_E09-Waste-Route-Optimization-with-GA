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
        const { bin_id, name, location, capacity, fill_rate, current_fill_ga, current_fill_nn, is_real } = req.body;
        const newBin = new Bin({
            bin_id,
            name,
            location,
            capacity,
            fill_rate, 
            current_fill_ga, 
            current_fill_nn,
            is_real,
        });
        await newBin.save();
        
        res.status(201).json({
            success: true,
            message: "Bin created successfully",
            data: newBin,
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