import { getSubMatrix } from '../utils/distance-helper.js';
import Solution from '../models/Solution.js';

const GA_SERVICE_URL = process.env.GA_SERVICE_URL || 'http://localhost:8000';

export const optimizeRoutes = async (req, res) => {
  try {
    const selectedBins = req.body.bins; // e.g. [{ id: "bin1", name: "...", location: {...}, capacity: 100, demand: 75 }]
    const numTrucks = req.body.num_trucks || 3;
    const populationSize = req.body.population_size || 100;
    const generations = req.body.generations || 500;

    // Validate input
    if (!selectedBins || selectedBins.length === 0) {
      return res.status(400).json({ error: 'No bins selected' });
    }

    // Build submatrix
    const subMatrix = getSubMatrix(selectedBins.map(b => b.id));

    console.log(`🧬 Running GA for ${selectedBins.length} bins with ${numTrucks} trucks...`);

    // 🚀 Connect to GA microservice
    const gaResponse = await fetch(`${GA_SERVICE_URL}/run_ga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bins: selectedBins,
        distance_matrix: subMatrix,
        num_trucks: numTrucks,
        population_size: populationSize,
        generations: generations
      })
    });

    if (!gaResponse.ok) {
      throw new Error(`GA Service error: ${gaResponse.statusText}`);
    }

    const gaResult = await gaResponse.json();
    console.log('✅ GA optimization completed!');

    // 💾 Save solution to database
    const solution = new Solution({
      total_distance: gaResult.total_distance,
      total_time: gaResult.total_time || gaResult.total_distance / 40, // Assume 40 km/h
      utilization: gaResult.utilization || 0,
      emissions: gaResult.emissions || 0,
      trucks: gaResult.trucks.map(truck => ({
        truck_no: truck.truck_no,
        distance: truck.distance,
        load: truck.load,
        bins: truck.bins.map(bin => ({
          bin_id: bin.bin_id,
          visit_order: bin.visit_order,
          demand: bin.demand
        }))
      }))
    });

    await solution.save();
    console.log('💾 Solution saved to database with ID:', solution._id);

    // Return result to frontend
    res.json({
      success: true,
      message: 'Optimization completed successfully',
      solution_id: solution._id,
      data: {
        total_distance: gaResult.total_distance,
        total_time: solution.total_time,
        num_trucks: gaResult.trucks.length,
        trucks: gaResult.trucks,
        selectedBins: selectedBins.map(b => b.id),
        subMatrix: subMatrix
      }
    });

  } catch (error) {
    console.error('❌ Error optimizing routes:', error);
    
    // If GA service is not available, return mock data
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.warn('⚠️ GA Service not available, returning mock optimization');
      return res.json({
        success: false,
        message: 'GA Service not available - using mock data',
        mock: true,
        selectedBins: req.body.bins.map(b => b.id),
        subMatrix: getSubMatrix(req.body.bins.map(b => b.id))
      });
    }

    res.status(500).json({ 
      error: error.message,
      details: 'Failed to optimize routes. Check if GA service is running.'
    });
  }
};