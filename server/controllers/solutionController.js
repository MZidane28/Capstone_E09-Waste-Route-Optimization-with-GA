import Solution from '../models/Solution.js';

// Get all solutions
export const getAllSolutions = async (req, res) => {
  try {
    const solutions = await Solution.find();
    res.status(200).json(solutions);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching solutions",
      error: error.message,
    });
  }
};

// Get solution by ID
export const getSolutionById = async (req, res) => {
  try {
        const solution = await Solution.findById(req.params.id);
        if (!solution) return res.status(404).json({ message: 'Solution not found' });
        res.status(200).json(solution);
    } catch (error) {
        res.status(500).json({ 
            message: "Error fetching solution",
            error: error.message,
        });
    }
};