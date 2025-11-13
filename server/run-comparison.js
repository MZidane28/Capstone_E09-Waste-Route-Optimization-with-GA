#!/usr/bin/env node

/**
 * Performance Comparison CLI Tool
 * 
 * Usage:
 *   node run-comparison.js [options]
 * 
 * Options:
 *   --bins <number>        Number of bins (default: 100)
 *   --trucks <number>      Number of trucks (default: 3)
 *   --generations <number> GA generations (default: 50)
 *   --population <number>  GA population size (default: 100)
 *   --output <filename>    Output CSV filename (default: performance-comparison.csv)
 *   --runs <number>        Number of test runs for averaging (default: 1)
 */

import { runPerformanceComparison, printComparisonTable, exportToCSV } from './utils/performance-comparison.js';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    numBins: 100,
    numTrucks: 3,
    gaGenerations: 50,
    gaPopulationSize: 100,
    outputFile: 'performance-comparison.csv',
    runs: 1
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bins':
        config.numBins = parseInt(args[++i]);
        break;
      case '--trucks':
        config.numTrucks = parseInt(args[++i]);
        break;
      case '--generations':
        config.gaGenerations = parseInt(args[++i]);
        break;
      case '--population':
        config.gaPopulationSize = parseInt(args[++i]);
        break;
      case '--output':
        config.outputFile = args[++i];
        break;
      case '--runs':
        config.runs = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  return config;
}

function printHelp() {
  console.log(`
Performance Comparison CLI Tool

Usage:
  node run-comparison.js [options]

Options:
  --bins <number>        Number of bins (default: 100)
  --trucks <number>      Number of trucks (default: 3)
  --generations <number> GA generations (default: 50)
  --population <number>  GA population size (default: 100)
  --output <filename>    Output CSV filename (default: performance-comparison.csv)
  --runs <number>        Number of test runs for averaging (default: 1)
  --help, -h            Show this help message

Examples:
  node run-comparison.js --bins 50 --trucks 2
  node run-comparison.js --bins 200 --trucks 5 --generations 100
  node run-comparison.js --bins 100 --trucks 3 --runs 5 --output results.csv
  `);
}

// Average multiple run results
function averageResults(reports) {
  if (reports.length === 1) return reports[0];
  
  const avg = {
    testConfig: { ...reports[0].testConfig, runs: reports.length },
    traditional: {
      totalDistance: 0,
      totalTime: 0,
      fuelCost: 0,
      co2Emission: 0
    },
    gaOptimized: {
      totalDistance: 0,
      totalTime: 0,
      fuelCost: 0,
      co2Emission: 0
    }
  };
  
  reports.forEach(report => {
    avg.traditional.totalDistance += report.traditional.totalDistance;
    avg.traditional.totalTime += report.traditional.totalTime;
    avg.traditional.fuelCost += report.traditional.fuelCost;
    avg.traditional.co2Emission += report.traditional.co2Emission;
    
    avg.gaOptimized.totalDistance += report.gaOptimized.totalDistance;
    avg.gaOptimized.totalTime += report.gaOptimized.totalTime;
    avg.gaOptimized.fuelCost += report.gaOptimized.fuelCost;
    avg.gaOptimized.co2Emission += report.gaOptimized.co2Emission;
  });
  
  const n = reports.length;
  avg.traditional.totalDistance = parseFloat((avg.traditional.totalDistance / n).toFixed(2));
  avg.traditional.totalTime = parseFloat((avg.traditional.totalTime / n).toFixed(2));
  avg.traditional.fuelCost = Math.round(avg.traditional.fuelCost / n);
  avg.traditional.co2Emission = parseFloat((avg.traditional.co2Emission / n).toFixed(2));
  
  avg.gaOptimized.totalDistance = parseFloat((avg.gaOptimized.totalDistance / n).toFixed(2));
  avg.gaOptimized.totalTime = parseFloat((avg.gaOptimized.totalTime / n).toFixed(2));
  avg.gaOptimized.fuelCost = Math.round(avg.gaOptimized.fuelCost / n);
  avg.gaOptimized.co2Emission = parseFloat((avg.gaOptimized.co2Emission / n).toFixed(2));
  
  // Calculate improvements
  avg.improvements = {
    distance: ((avg.traditional.totalDistance - avg.gaOptimized.totalDistance) / avg.traditional.totalDistance * 100).toFixed(1),
    time: ((avg.traditional.totalTime - avg.gaOptimized.totalTime) / avg.traditional.totalTime * 100).toFixed(1),
    fuelCost: ((avg.traditional.fuelCost - avg.gaOptimized.fuelCost) / avg.traditional.fuelCost * 100).toFixed(1),
    co2: ((avg.traditional.co2Emission - avg.gaOptimized.co2Emission) / avg.traditional.co2Emission * 100).toFixed(1)
  };
  
  avg.summary = {
    distanceSaved: (avg.traditional.totalDistance - avg.gaOptimized.totalDistance).toFixed(2),
    timeSaved: (avg.traditional.totalTime - avg.gaOptimized.totalTime).toFixed(2),
    costSaved: avg.traditional.fuelCost - avg.gaOptimized.fuelCost,
    co2Reduced: (avg.traditional.co2Emission - avg.gaOptimized.co2Emission).toFixed(2)
  };
  
  return avg;
}

// Main execution
async function main() {
  const config = parseArgs();
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       WASTE COLLECTION ROUTE OPTIMIZATION BENCHMARK        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Configuration:');
  console.log(`  • Bins: ${config.numBins}`);
  console.log(`  • Trucks: ${config.numTrucks}`);
  console.log(`  • GA Generations: ${config.gaGenerations}`);
  console.log(`  • GA Population: ${config.gaPopulationSize}`);
  console.log(`  • Test Runs: ${config.runs}`);
  console.log('');
  
  const reports = [];
  
  for (let run = 1; run <= config.runs; run++) {
    if (config.runs > 1) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`RUN ${run}/${config.runs}`);
      console.log('='.repeat(60));
    }
    
    const report = await runPerformanceComparison({
      numBins: config.numBins,
      numTrucks: config.numTrucks,
      gaGenerations: config.gaGenerations,
      gaPopulationSize: config.gaPopulationSize
    });
    
    reports.push(report);
    
    if (config.runs === 1) {
      printComparisonTable(report);
    }
  }
  
  // If multiple runs, print averaged results
  if (config.runs > 1) {
    const avgReport = averageResults(reports);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`AVERAGED RESULTS (${config.runs} runs)`);
    console.log('='.repeat(60));
    printComparisonTable(avgReport);
    
    // Export averaged results
    const csv = exportToCSV(avgReport, config.outputFile);
    const outputPath = path.join(process.cwd(), config.outputFile);
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ Results exported to: ${outputPath}\n`);
  } else {
    // Export single run
    const csv = exportToCSV(reports[0], config.outputFile);
    const outputPath = path.join(process.cwd(), config.outputFile);
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ Results exported to: ${outputPath}\n`);
  }
  
  // Also export full JSON report
  const jsonPath = path.join(process.cwd(), config.outputFile.replace('.csv', '.json'));
  fs.writeFileSync(jsonPath, JSON.stringify(reports.length > 1 ? averageResults(reports) : reports[0], null, 2));
  console.log(`✅ Full report exported to: ${jsonPath}\n`);
  
  console.log('🎉 Benchmark completed successfully!\n');
}

// Run
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
