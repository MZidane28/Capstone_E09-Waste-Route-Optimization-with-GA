import axios from "axios";
import 'dotenv/config';
import { performance } from 'perf_hooks';
import { getSubMatrix } from "../utils/distance-helper.js";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL;

function createSingleBinRoute(bin, distanceMatrix, method, truckCapacity  = 120){
    const startTime = performance.now();

    const fillField = method === 'ga' ? 'current_fill_ga' : 'current_fill_nn';
    const demand = bin[fillField] || 0; // Get actual numeric value from bin
    const utilization = demand / truckCapacity;

    const depotToBin = distanceMatrix[0][1];
    const binToDepot = distanceMatrix[1][0];
    const totalDistance = depotToBin + binToDepot;
    const emissions = totalDistance * 0.27;

    const route = {
        truck_no: 1,
        route: ['depot', bin.bin_id, 'depot'],
        distance: totalDistance,
        load: demand,
        emissions: emissions,
        utilization: utilization,
        avg_utilization: utilization,
        unused_capacity: truckCapacity - demand
    };

    const computationTime = performance.now() - startTime;

    return {
        routes: [route],
        number_of_trucks: 1,
        total_distance: totalDistance,
        total_emissions: emissions,
        avg_utilization: utilization,
        best_fitness: (truckCapacity - demand) + totalDistance,
        generations_run: 1,
        computation_time: computationTime
    };
}

export async function optimizeWithGA(bins) {
    try {
        if (!bins || bins.length === 0){
            return {
                routes: [],
                total_distance: 0,
                total_emissions: 0,
                avg_utilization: 0,
                number_of_trips: 0,
                computation_time: 0
            }
        }

        console.log(`Running GA optimization for ${bins.length} bins...`);
        console.log('   First bin:', JSON.stringify(bins[0], null, 2));

        console.log('\n 2 Calculating distance matrix...');
        const binIdsForMatrix = bins.map(b => b.bin_id);
        const distanceMatrix = getSubMatrix(binIdsForMatrix);
        console.log('   Matrix size:', distanceMatrix.length, 'x', distanceMatrix[0]?.length);

        if (bins.length === 1) {
            console.log('⚡ Single bin detected - Creating simple route (bypassing GA)');
            
            const result = createSingleBinRoute(bins[0], distanceMatrix, 'ga');
            
            console.log('✅ Simple route created:');
            console.log('   Route: depot → ' + bins[0].bin_id + ' → depot');
            console.log('   Distance:', result.total_distance, 'km');
            console.log('='.repeat(70) + '\n');
            return result;
        }

        const binsData = bins.map(b => ({
            id: b.bin_id,
            demand : b.current_fill_ga
        }));

        console.log('\n 3️⃣ Preparing bins data...');
        console.log('   Sample bins data:', JSON.stringify(binsData.slice(0, 3), null, 2));
        
        // Validate bins data
        const invalidBins = binsData.filter(b => !b.id || b.demand === null || b.demand === undefined || isNaN(b.demand));
        if (invalidBins.length > 0) {
            console.error('❌ Invalid bins found:', invalidBins);
            throw new Error(`Invalid bin data: ${invalidBins.length} bins have missing/invalid demand values`);
        }
        
        const payload = {
            bins : binsData,
            distance_matrix : distanceMatrix
        };

        console.log('\n 4️⃣ Payload validation:');
        console.log('   Bins count:', payload.bins.length);
        console.log('   Matrix size:', payload.distance_matrix.length, 'x', payload.distance_matrix[0]?.length);
        console.log('   Size match:', payload.distance_matrix.length === payload.bins.length + 1 ? '✅' : '❌');
        
        if (payload.distance_matrix.length !== payload.bins.length + 1) {
            throw new Error(`Matrix size mismatch! Expected ${payload.bins.length + 1}, got ${payload.distance_matrix.length}`);
        }
    
        console.log('\n 5️⃣ Calling Azure:', PYTHON_SERVICE_URL);
        console.log('   Full payload:', JSON.stringify(payload, null, 2).substring(0, 500) + '...');
        
        const response = await axios.post(
            `${PYTHON_SERVICE_URL}/solve-ga`,
            payload,
            {
                timeout: 60000, // 60 second timeout
                headers: {
                'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n 6️⃣ ✅ GA Optimization Success!');
        console.log('   Total distance:', response.data.total_distance, 'km');
        console.log('   Routes:', response.data.routes.length);
        console.log('   Avg utilization:', (response.data.avg_utilization * 100).toFixed(1) + '%');
        console.log('   Execution time:', response.data.computation_time.toFixed(2) + 's');
        
        // VALIDATION: Log each route to check depot presence
        response.data.routes.forEach((route, idx) => {
            const routePath = route.route || [];
            const startsWithDepot = routePath[0] === 'depot';
            const endsWithDepot = routePath[routePath.length - 1] === 'depot';
            console.log(`   Route ${idx + 1} (Truck ${route.truck_no}):`, {
                length: routePath.length,
                startsWithDepot,
                endsWithDepot,
                route: routePath
            });
        });
        
        console.log('='.repeat(70) + '\n');
        
        return response.data;
    } catch (error) {
        console.error('\n❌ GA Optimization Error:');
        console.error('   Message:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        console.error('='.repeat(70) + '\n');
        throw new Error(`GA optimization failed: ${error.message}`);
    }
}

export async function optimizeWithNN(bins) {
    try {
        if (!bins || bins.length === 0){
            return {
                routes: [],
                total_distance: 0,
                total_emissions: 0,
                avg_utilization: 0,
                number_of_trips: 0,
                computation_time: 0
            }
        }

        console.log(`Running NN optimization for ${bins.length} bins...`);
        console.log('   First bin:', JSON.stringify(bins[0], null, 2));

        console.log('\n 2 Calculating distance matrix...');
        const binIdsForMatrix = bins.map(b => b.bin_id);
        const distanceMatrix = getSubMatrix(binIdsForMatrix);
        console.log('   Matrix size:', distanceMatrix.length, 'x', distanceMatrix[0]?.length);

        if (bins.length === 1) {
            console.log('⚡ Single bin detected - Creating simple route (bypassing NN)');
            
            const result = createSingleBinRoute(bins[0], distanceMatrix, 'nn');
            
            console.log('✅ Simple route created:');
            console.log('   Route: depot → ' + bins[0].bin_id + ' → depot');
            console.log('   Distance:', result.total_distance, 'km');
            console.log('='.repeat(70) + '\n');
            return result;
        }

        const binsData = bins.map(b => ({
            id: b.bin_id,
            demand : b.current_fill_nn
        }));

        console.log('\n 3 Preparing bins data...');
        const payload = {
            bins : binsData,
            distance_matrix : distanceMatrix
        };

        console.log('\n 4 Payload validation:');
        console.log('   Bins count:', payload.bins.length);
        console.log('   Matrix size:', payload.distance_matrix.length, 'x', payload.distance_matrix[0]?.length);
        console.log('   Size match:', payload.distance_matrix.length === payload.bins.length + 1 ? '✅' : '❌');

        console.log('\n 5 Calling Azure:', PYTHON_SERVICE_URL);

        const response = await axios.post(
            `${PYTHON_SERVICE_URL}/solve-nn`,
            payload,
            {
                timeout: 60000, // 60 second timeout
                headers: {
                'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n 6 ✅ NN Optimization Success!');
        console.log('   Total distance:', response.data.total_distance, 'km');
        console.log('   Routes:', response.data.routes.length);
        console.log('   Avg utilization:', (response.data.avg_utilization * 100).toFixed(1) + '%');
        console.log('   Execution time:', response.data.computation_time.toFixed(2) + 's');
        console.log('='.repeat(70) + '\n');
        
        return response.data;
    } catch (error) {
        throw new Error(`NN optimization failed: ${error.message}`);
    }
}