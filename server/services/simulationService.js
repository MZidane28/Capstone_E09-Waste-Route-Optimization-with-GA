import Bin from "../models/Bin.js";
import Solution from "../models/Solution.js";
import { optimizeWithGA, optimizeWithNN } from "./optimizationService.js";

const GA_THRESHOLD = parseFloat(process.env.GA_THRESHOLD) || 80;
const NN_INTERVAL = parseInt(process.env.NN_COLLECTION_INTERVAL) || 3;
const TRUCK_CAPACITY = parseInt(process.env.TRUCK_CAPACITY) || 1000;

export async function getCurrentSimulationDay(){
    try {
        const latestSolution = await Solution.findOne().sort({ simulation_day: -1});
        return latestSolution ? latestSolution.simulation_day : 0;
    } catch (error) {
        console.error('error getting current simulation day:', error);
        return 0;
    }
}

export async function initializeSimulation(clearHistory = false) {
    try {
        await Bin.updateMany({}, {
            current_fill_ga: 0,
            current_fill_nn: 0
        });

        if (clearHistory) {
            console.log('🗑️  Clearing historical data...');
            await Solution.deleteMany({});
        }

        const currentSimulationDay = 0;
        return {
            message: 'Simulation initialized', 
            current_day: currentSimulationDay,
            clear_history: clearHistory 
        };
    } catch (error) {
        throw new Error(`Simulation initialization failed: ${error.message}`);
    }
}

export async function updateBinFillLevels() {
    try {
        const bins = await Bin.find({});
        let skippedCount = 0;
        let updatedCount = 0;

        for (const bin of bins) {
            // Skip real bins - they get updates from MQTT sensor
            if (bin.is_real) {
                console.log(`⏭️  Skipping real bin: ${bin.name} (${bin.bin_id}) - gets data from sensor`);
                skippedCount++;
                continue;
            }

            bin.updateFill('ga');
            bin.updateFill('nn');
            await bin.save();
            updatedCount++;
        }

        console.log(`📊 Fill levels updated: ${updatedCount} simulated bins, ${skippedCount} real bins skipped`);
        return bins;
    } catch (error) {
        throw new Error(`Failed to update bin fill levels: ${error.message}`);
    }
}

export async function selectBinsforGA() {
    try {
        const bins = await Bin.getBinsForGA(GA_THRESHOLD);
        return bins;
    } catch (error) {
        throw new Error(`Failed to select bins for GA: ${error.message}`);
    }
}

export async function selectBinsforNN(day) {
    try {
        if (day % NN_INTERVAL === 0) {
            const bins = await Bin.getBinsForNN();
            return bins;
        } else {
            return [];
        }
    } catch (error) {
        throw new Error(`Failed to select bins for NN: ${error.message}`);
    }
}

export async function runGAoptimization(day) {
    try {
        const binsToCollect = await selectBinsforGA();
        if (binsToCollect.length === 0) {
            
            // Use findOneAndUpdate with upsert to avoid duplicate key error
            const emptySolution = await Solution.findOneAndUpdate(
                { simulation_day: day, method: 'ga' },
                {
                    simulation_day: day,
                    method: 'ga',
                    total_distance: 0,
                    total_emissions: 0,
                    avg_utilization: 0,
                    number_of_trucks: 0,
                    execution_time: 0,
                    routes: []
                },
                { upsert: true, new: true }
            );

            console.log(`⚠️  GA: No bins to collect on day ${day}. Saved empty solution.`);
            return { solution: emptySolution };
        }

        const gaResult = await optimizeWithGA(binsToCollect);
        
        // VALIDATION: Ensure all routes start and end with 'depot'
        const validatedRoutes = gaResult.routes.map(route => {
            const routePath = route.route || [];
            const startsWithDepot = routePath[0] === 'depot';
            const endsWithDepot = routePath[routePath.length - 1] === 'depot';
            
            let fixedRoute = [...routePath];
            
            if (!startsWithDepot) {
                console.warn(`⚠️ Route for truck ${route.truck_no} doesn't start with depot - adding it`);
                fixedRoute = ['depot', ...fixedRoute];
            }
            if (!endsWithDepot) {
                console.warn(`⚠️ Route for truck ${route.truck_no} doesn't end with depot - adding it`);
                fixedRoute = [...fixedRoute, 'depot'];
            }
            
            if (!startsWithDepot || !endsWithDepot) {
                console.log(`✅ Fixed route for truck ${route.truck_no}:`, fixedRoute);
            }
            
            return {
                ...route,
                route: fixedRoute
            };
        });
        
        // Use findOneAndUpdate with upsert to avoid duplicate key error
        const newSolution = await Solution.findOneAndUpdate(
            { simulation_day: day, method: 'ga' },
            {
                simulation_day: day,
                method: 'ga',
                total_distance: gaResult.total_distance,
                total_emissions: gaResult.total_emissions,
                avg_utilization: gaResult.avg_utilization,
                number_of_trucks: gaResult.number_of_trucks,
                execution_time: gaResult.computation_time,
                routes: validatedRoutes  // Use validated routes with depot
            },
            { upsert: true, new: true }
        );

        console.log('GA solution is saved to database.');

        console.log('Return FULL data with locations for frontend visualization');
        const binDetails = {};
        binsToCollect.forEach(bin => {
            binDetails[bin.bin_id] = {
                name: bin.name,
                lat: bin.location.lat,
                lng: bin.location.lon,
                current_fill_ga: bin.current_fill_ga,
                capacity: bin.capacity
            };
        });

        for(const bin of binsToCollect){
            bin.emptyBin('ga');
            await bin.save();
        }

        console.log('\n GA current fill is empty.');

        return { 
            solution: newSolution,
            binDetails: binDetails
        };

    } catch (error) {
        throw new Error(`GA optimization failed: ${error.message}`);
    }
}

export async function runNNoptimization(day) {
    try {
        const binsToCollect = await selectBinsforNN(day);
        if (binsToCollect.length === 0) {
            
            // Use findOneAndUpdate with upsert to avoid duplicate key error
            const emptySolution = await Solution.findOneAndUpdate(
                { simulation_day: day, method: 'nn' },
                {
                    simulation_day: day,
                    method: 'nn',
                    total_distance: 0,
                    total_emissions: 0,
                    avg_utilization: 0,
                    number_of_trucks: 0,
                    execution_time: 0,
                    routes: []
                },
                { upsert: true, new: true }
            );

            console.log(`⚠️  NN : No bins to collect on day ${day}. Saved empty solution.`);
            return { success: true };
        }

        const nnResult = await optimizeWithNN(binsToCollect);
        
        // Use findOneAndUpdate with upsert to avoid duplicate key error
        const newSolution = await Solution.findOneAndUpdate(
            { simulation_day: day, method: 'nn' },
            {
                simulation_day: day,
                method: 'nn',
                total_distance: nnResult.total_distance,
                total_emissions: nnResult.total_emissions,
                avg_utilization: nnResult.avg_utilization,
                number_of_trucks: nnResult.number_of_trucks,
                execution_time: nnResult.computation_time,
                routes: nnResult.routes
            },
            { upsert: true, new: true }
        );

        console.log('NN solution is saved to database.');

        for(const bin of binsToCollect){
            bin.emptyBin('nn');
            await bin.save();
        }
        console.log('\n NN current fill is empty.');

        return { success: true };

    } catch (error) {
        throw new Error(`NN optimization failed: ${error.message}`);
    }
}

export async function runDailySimulation() {
    try {
        const lastDay = await getCurrentSimulationDay();
        const day = lastDay + 1;

        // Update bin fill levels
        await updateBinFillLevels();

        // Run GA optimization
        const gaResult = await runGAoptimization(day);

        // Run NN simulation
        await runNNoptimization(day);

        return {
            gaResult
        };

    } catch (error) {
        throw new Error(`Daily simulation failed: ${error.message}`)
        ;
    }
}

export async function getSimulationStatus() {
    const currentSimulationDay = await getCurrentSimulationDay();

    return {
        current_day: currentSimulationDay,
        ga_threshold: GA_THRESHOLD,
        nn_interval: NN_INTERVAL,
        truck_capacity: TRUCK_CAPACITY
    };
}

export async function testRunSimulation() {
  try {
    const lastDay = await getCurrentSimulationDay();
    const day = (typeof lastDay === 'number' ? lastDay : 0) + 1;

    // 1️⃣ Update fill levels before running optimizations
    await updateBinFillLevels();

    // Helper for empty solution
    const emptySolution = (method) => ({
      simulation_day: day,
      method,
      total_distance: 0,
      total_emissions: 0,
      bins_collected: 0,
      number_of_trucks: 0,
      execution_time: 0,
      routes: []
    });

    // 2️⃣ GA simulation
    const GAbinsToCollect = await selectBinsforGA();
    const gaResult = (GAbinsToCollect.length > 0)
      ? await optimizeWithGA(GAbinsToCollect)
      : emptySolution("ga");

    // 3️⃣ NN simulation
    const NNbinsToCollect = await selectBinsforNN(day);
    const nnResult = (NNbinsToCollect.length > 0)
      ? await optimizeWithNN(NNbinsToCollect)
      : emptySolution("nn");

    // 4️⃣ Return both results
    return {
      day,
      ga: gaResult,
      nn: nnResult
    };

  } catch (error) {
    throw new Error(`Daily simulation failed: ${error.message}`);
  }
}