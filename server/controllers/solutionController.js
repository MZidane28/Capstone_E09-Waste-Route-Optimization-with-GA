import Solution from '../models/Solution.js';

export const getSolutions = async (req, res) => {
  try {
    const { method, day, from, to } = req.query;

    const query = {};

    // Filter by method (ga or nn)
    if (method) {
      if (!['ga', 'nn'].includes(method)) {
        return res.status(400).json({
          success: false,
          error: 'Method must be either "ga" or "nn"'
        });
      }
      query.method = method;
    }

    // Filter by specific day
    if (day) {
      query.simulation_day = parseInt(day);
    } else if (from && to) {
      query.simulation_day = {
        $gte: parseInt(from),
        $lte: parseInt(to)
      };
    } else if (from) {
      query.simulation_day = { $gte: parseInt(from) };
    } else if (to) {
      query.simulation_day = { $lte: parseInt(to) };
    }

    const solutions = await Solution.find(query).sort({ simulation_day : 1, });

    res.json({
      success : true,
      count : solutions.length,
      data : solutions
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    }); 
  }
};

export const compareSolutions = async (req, res) => {
  try {
    const { from, to, days } = req.query;
    
    let dateFilter = {};

    if (from && to) {
      dateFilter = {
        $gte: parseInt(from),
        $lte: parseInt(to)
      };
    } else if (days) {
      const latestSolution = await Solution.findOne().sort({ simulation_day: -1 });
      if (latestSolution) {
        const latestDay = latestSolution.simulation_day;
        dateFilter = {
          $gte: latestDay - parseInt(days) + 1,
          $lte: latestDay
        };
      }
    }

    const query = Object.keys(dateFilter).length > 0 
      ? { simulation_day: dateFilter }
      : {};


    const gaSolutions = await Solution.find({ ...query, method: 'ga'}).sort({ simulation_day : 1, });
    const nnSolutions = await Solution.find({ ...query, method: 'nn' }).sort({ simulation_day : 1, });

    // calculate statistics
    const calculateStats = (solutions) => {
      if (solutions.length === 0) return null;

      const totalDistance = solutions.reduce((sum, sol) => sum + sol.total_distance, 0);
      const totalEmissions = solutions.reduce((sum, sol) => sum + sol.total_emissions, 0);
      const totalTrucks = solutions.reduce((sum, sol) => sum + sol.number_of_trucks, 0);

      return {
        total_distance: totalDistance,
        total_emissions: totalEmissions,
        total_trucks: totalTrucks,
        days_count: solutions.length,
      };
    };

    const gaStats = calculateStats(gaSolutions);
    const nnStats = calculateStats(nnSolutions);

    // calculate improvements 
    let improvements = null;
    if (gaStats && nnStats) {
      const distanceImprovement = ((nnStats.total_distance - gaStats.total_distance) / nnStats.total_distance) * 100;
      const emissionsImprovement = ((nnStats.total_emissions - gaStats.total_emissions) / nnStats.total_emissions) * 100;

      improvements = {
        distance_improvement_percentage: distanceImprovement,
        distance_saved_km: parseFloat((nnStats.total_distance - gaStats.total_distance).toFixed(2)),
        emissions_improvement_percentage: emissionsImprovement,
        emissions_saved_kg: parseFloat((nnStats.total_emissions - gaStats.total_emissions).toFixed(2)),
      };
    }

    res.json({
      success: true,
      data: {
        ga: {
          summary : gaStats,
          daily_data : gaSolutions.map(sol => ({
            simulation_day: sol.simulation_day,
            total_distance: sol.total_distance,
            total_emissions: sol.total_emissions,
            number_of_trucks: sol.number_of_trucks,
          }))
        },
        nn: {
          summary : nnStats,
          daily_data: nnSolutions.map(sol => ({
            simulation_day: sol.simulation_day,
            total_distance: sol.total_distance,
            total_emissions: sol.total_emissions,
            number_of_trucks: sol.number_of_trucks,
        }))
        },
        improvements: improvements
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }  
};

export const getSummary = async (req, res) => {
  try {
    const latestSolution = await Solution.findOne().sort({ simulation_day : -1});
    const currentDay = latestSolution ? latestSolution.simulation_day : 0;

    const totalSolutions = await Solution.countDocuments();
    
    const gaSolutions = await Solution.find({method: "ga"});
    const nnSolutions = await Solution.find({method: "nn"});

    const gaTotalDistance = gaSolutions.reduce((sum, sol) => sum + sol.total_distance, 0);
    const nnTotalDistance = nnSolutions.reduce((sum, sol) => sum + sol.total_distance, 0);

    const gaTotalEmissions = gaSolutions.reduce((sum, sol) => sum + sol.total_emissions, 0);
    const nnTotalEmissions = nnSolutions.reduce((sum, sol) => sum + sol.total_emissions, 0);

    res.json({
      success: true,
      data: {
        current_simulation_day: currentDay,
        total_solutions_generated: totalSolutions,
        ga: {
          total_distance: parseFloat(gaTotalDistance.toFixed(2)),
          total_emissions: parseFloat(gaTotalEmissions.toFixed(2)),
          days_simulated: gaSolutions.length
        },
        nn: {
          total_distance: parseFloat(nnTotalDistance.toFixed(2)),
          total_emissions: parseFloat(nnTotalEmissions.toFixed(2)),
          days_simulated: nnSolutions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};