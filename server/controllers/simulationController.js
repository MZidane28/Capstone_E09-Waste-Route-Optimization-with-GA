import {
    initializeSimulation,
    runDailySimulation,
    getSimulationStatus,
    testRunSimulation
} from '../services/simulationService.js';
import Solution from '../models/Solution.js';

export const getStatus = async (req, res) => {
    try {
        const status = await getSimulationStatus();
        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const initialize = async (req, res) => {
    try {
        const { clearHistory = false } = req.body;

        const result = await initializeSimulation(clearHistory);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: "Failed to initialize simulation" 
        });
    }
};

export const runStep = async (req, res) => {
    try {
        const result = await runDailySimulation();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const clearHistory = async (req, res) => {
  try {
    const solutionResult = await Solution.deleteMany({});
    
    console.log(`🗑️  Cleared ${solutionResult.deletedCount} solutions`);
    
    res.json({
      success: true,
      message: 'All simulation history cleared',
      solutions_deleted: solutionResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const testSimulation = async (req, res) => {
    try {
        const result = await testRunSimulation();

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}