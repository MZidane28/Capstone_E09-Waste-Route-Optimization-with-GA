import axios from "axios";
import { getSubMatrix } from "../utils/distance-helper.js";

export async function optimizeWithGA(bins) {
    try {
        if (!bins || bins.length === 0){
            return {
                routes: [],
                total_distance: 0,
                total_emissions: 0,
                bins_collected: 0,
                number_of_trips: 0,
                execution_time: 0
            }
        }

        console.log(`Running GA optimization for ${bins.length} bins...`)

        const binsData = bins.map(b => ({
            bin_id: b.bin_id,
            demand : b.current_fill_ga
        }));

        const binIdsForMatrix = bins.map(b => b.bin_id);
        const distanceMatrix = getSubMatrix(binIdsForMatrix);

        const payload = {
            bins : binsData,
            distance_matrix : distanceMatrix
        };

        /* // Call Python service
        const response = await axios.post(
            `${PYTHON_SERVICE_URL}/optimize/ga`,
            payload,
            {
                timeout: 60000, // 60 second timeout
                headers: {
                'Content-Type': 'application/json'
                }
            }
        ); */

        return payload;
    } catch (error) {
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
                bins_collected: 0,
                number_of_trips: 0,
                execution_time: 0
            }
        }

        console.log(`Running NN optimization for ${bins.length} bins...`)

        const binsData = bins.map(b => ({
            bin_id: b.bin_id,
            demand : b.current_fill_nn
        }));

        const binIdsForMatrix = bins.map(b => b.bin_id);
        const distanceMatrix = getSubMatrix(binIdsForMatrix);

        const payload = {
            bins : binsData,
            distance_matrix : distanceMatrix
        };

        /* // Call Python service
        const response = await axios.post(
            `${PYTHON_SERVICE_URL}/optimize/nn`,
            payload,
            {
                timeout: 60000, // 60 second timeout
                headers: {
                'Content-Type': 'application/json'
                }
            }
        ); */

        return payload;
    } catch (error) {
        throw new Error(`NN optimization failed: ${error.message}`);
    }
}