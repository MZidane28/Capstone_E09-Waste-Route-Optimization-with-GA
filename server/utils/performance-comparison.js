/**
 * Performance Comparison Tool
 * Compares Traditional Route (Random/Nearest Neighbor) vs GA Optimized Route
 */

import { generateMockBins, calculateRouteMetrics, optimizeWithGA } from './route-optimizer.js';

/**
 * Calculate total route metrics
 */
function calculateTotalMetrics(routes) {
  let totalDistance = 0;
  let totalTime = 0;
  
  routes.forEach(route => {
    totalDistance += route.totalDistance;
    totalTime += route.totalTime;
  });
  
  // Calculate derived metrics
  const fuelCost = (totalDistance / 100) * 15 * 6500; // 15L/100km, Rp 6500/L
  const co2Emission = (totalDistance / 100) * 15 * 2.31; // 15L/100km, 2.31kg CO2/L
  
  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalTime: parseFloat(totalTime.toFixed(2)),
    fuelCost: Math.round(fuelCost),
    co2Emission: parseFloat(co2Emission.toFixed(2))
  };
}

/**
 * Generate Traditional (Baseline) Route
 * Using simple nearest neighbor algorithm
 */
function generateTraditionalRoute(bins, numTrucks, depot) {
  const routes = [];
  const binsPerTruck = Math.ceil(bins.length / numTrucks);
  
  for (let i = 0; i < numTrucks; i++) {
    const truckBins = bins.slice(i * binsPerTruck, (i + 1) * binsPerTruck);
    
    if (truckBins.length === 0) break;
    
    // Simple nearest neighbor
    const route = [depot];
    const remaining = [...truckBins];
    let current = depot;
    
    while (remaining.length > 0) {
      // Find nearest bin
      let nearestIdx = 0;
      let minDist = distance(current, remaining[0]);
      
      for (let j = 1; j < remaining.length; j++) {
        const dist = distance(current, remaining[j]);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = j;
        }
      }
      
      const nearest = remaining[nearestIdx];
      route.push(nearest);
      current = nearest;
      remaining.splice(nearestIdx, 1);
    }
    
    route.push(depot); // Return to depot
    
    // Calculate metrics
    const metrics = calculateRouteMetrics(route);
    routes.push({
      truckId: i + 1,
      bins: truckBins.length,
      ...metrics
    });
  }
  
  return routes;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function distance(point1, point2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Run complete performance comparison
 */
export async function runPerformanceComparison(config = {}) {
  const {
    numBins = 100,
    numTrucks = 3,
    depot = { lat: -7.797068, lng: 110.370529, name: 'Depot' },
    gaGenerations = 50,
    gaPopulationSize = 100
  } = config;
  
  console.log('🚀 Starting Performance Comparison...');
  console.log(`   Bins: ${numBins}, Trucks: ${numTrucks}`);
  console.log('');
  
  // Generate test bins
  const bins = generateMockBins(numBins, depot);
  
  // 1. Traditional Route
  console.log('📍 Generating Traditional Route (Nearest Neighbor)...');
  const traditionalRoutes = generateTraditionalRoute(bins, numTrucks, depot);
  const traditionalMetrics = calculateTotalMetrics(traditionalRoutes);
  console.log('✅ Traditional Route Complete');
  console.log(`   Distance: ${traditionalMetrics.totalDistance} km`);
  console.log(`   Time: ${traditionalMetrics.totalTime} min`);
  console.log('');
  
  // 2. GA Optimized Route
  console.log('🧬 Generating GA Optimized Route...');
  const gaRoutes = await optimizeWithGA(bins, numTrucks, depot, {
    generations: gaGenerations,
    populationSize: gaPopulationSize
  });
  const gaMetrics = calculateTotalMetrics(gaRoutes);
  console.log('✅ GA Optimization Complete');
  console.log(`   Distance: ${gaMetrics.totalDistance} km`);
  console.log(`   Time: ${gaMetrics.totalTime} min`);
  console.log('');
  
  // 3. Calculate Improvements
  const improvements = {
    distance: ((traditionalMetrics.totalDistance - gaMetrics.totalDistance) / traditionalMetrics.totalDistance * 100).toFixed(1),
    time: ((traditionalMetrics.totalTime - gaMetrics.totalTime) / traditionalMetrics.totalTime * 100).toFixed(1),
    fuelCost: ((traditionalMetrics.fuelCost - gaMetrics.fuelCost) / traditionalMetrics.fuelCost * 100).toFixed(1),
    co2: ((traditionalMetrics.co2Emission - gaMetrics.co2Emission) / traditionalMetrics.co2Emission * 100).toFixed(1)
  };
  
  // 4. Generate Report
  const report = {
    testConfig: {
      numBins,
      numTrucks,
      gaGenerations,
      gaPopulationSize,
      timestamp: new Date().toISOString()
    },
    traditional: {
      ...traditionalMetrics,
      routes: traditionalRoutes
    },
    gaOptimized: {
      ...gaMetrics,
      routes: gaRoutes
    },
    improvements,
    summary: {
      distanceSaved: (traditionalMetrics.totalDistance - gaMetrics.totalDistance).toFixed(2),
      timeSaved: (traditionalMetrics.totalTime - gaMetrics.totalTime).toFixed(2),
      costSaved: traditionalMetrics.fuelCost - gaMetrics.fuelCost,
      co2Reduced: (traditionalMetrics.co2Emission - gaMetrics.co2Emission).toFixed(2)
    }
  };
  
  return report;
}

/**
 * Print comparison table to console
 */
export function printComparisonTable(report) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                 PERFORMANCE COMPARISON REPORT                  ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('┌────────────────────┬──────────────┬──────────────┬─────────────┐');
  console.log('│ Metric             │ Traditional  │ GA Optimized │ Improvement │');
  console.log('├────────────────────┼──────────────┼──────────────┼─────────────┤');
  console.log(`│ Total Distance     │ ${report.traditional.totalDistance.toString().padEnd(12)} │ ${report.gaOptimized.totalDistance.toString().padEnd(12)} │ ${('-' + report.improvements.distance + '%').padEnd(11)} │`);
  console.log(`│ Total Time (min)   │ ${report.traditional.totalTime.toString().padEnd(12)} │ ${report.gaOptimized.totalTime.toString().padEnd(12)} │ ${('-' + report.improvements.time + '%').padEnd(11)} │`);
  console.log(`│ Fuel Cost (Rp)     │ ${report.traditional.fuelCost.toLocaleString('id-ID').padEnd(12)} │ ${report.gaOptimized.fuelCost.toLocaleString('id-ID').padEnd(12)} │ ${('-' + report.improvements.fuelCost + '%').padEnd(11)} │`);
  console.log(`│ CO₂ Emission (kg)  │ ${report.traditional.co2Emission.toString().padEnd(12)} │ ${report.gaOptimized.co2Emission.toString().padEnd(12)} │ ${('-' + report.improvements.co2 + '%').padEnd(11)} │`);
  console.log('└────────────────────┴──────────────┴──────────────┴─────────────┘\n');
  
  console.log('💰 COST SAVINGS:');
  console.log(`   Fuel Cost Saved: Rp ${report.summary.costSaved.toLocaleString('id-ID')}`);
  console.log(`   Distance Saved: ${report.summary.distanceSaved} km`);
  console.log(`   Time Saved: ${report.summary.timeSaved} minutes`);
  console.log(`   CO₂ Reduced: ${report.summary.co2Reduced} kg\n`);
  
  console.log('═══════════════════════════════════════════════════════════════\n');
}

/**
 * Export report to CSV
 */
export function exportToCSV(report, filename = 'performance-comparison.csv') {
  const csv = [
    'Metric,Traditional Route,GA Optimized,Improvement (%)',
    `Total Distance (km),${report.traditional.totalDistance},${report.gaOptimized.totalDistance},${report.improvements.distance}`,
    `Total Time (min),${report.traditional.totalTime},${report.gaOptimized.totalTime},${report.improvements.time}`,
    `Fuel Cost (Rp),${report.traditional.fuelCost},${report.gaOptimized.fuelCost},${report.improvements.fuelCost}`,
    `CO₂ Emission (kg),${report.traditional.co2Emission},${report.gaOptimized.co2Emission},${report.improvements.co2}`,
    '',
    'Summary',
    `Distance Saved (km),${report.summary.distanceSaved}`,
    `Time Saved (min),${report.summary.timeSaved}`,
    `Cost Saved (Rp),${report.summary.costSaved}`,
    `CO₂ Reduced (kg),${report.summary.co2Reduced}`
  ].join('\n');
  
  return csv;
}
