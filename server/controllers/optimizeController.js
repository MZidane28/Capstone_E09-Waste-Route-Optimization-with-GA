import { optimizeWithGA, calculateDistance, calculateRouteMetrics } from '../utils/route-optimizer.js';
import Bin from '../models/Bin.js';

/**
 * Optimize routes using Genetic Algorithm
 * POST /api/v1/optimize
 * Body: { bins: [...], numTrucks: 3, depot: {lat, lng} }
 */
export const optimizeRoutes = async (req, res) => {
  try {
    const { bins, numTrucks = 3, depot } = req.body;

    if (!bins || bins.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bins data is required'
      });
    }

    if (!depot || !depot.lat || !depot.lng) {
      return res.status(400).json({
        success: false,
        error: 'Depot location is required'
      });
    }

    // Filter bins with fillLevel >= 80%
    const binsNeedingCollection = bins.filter(bin => bin.fillLevel >= 80);

    console.log(`🧬 Starting GA optimization for ${binsNeedingCollection.length} bins with ${numTrucks} trucks`);

    if (binsNeedingCollection.length === 0) {
      // No bins need collection
      return res.json({
        success: true,
        data: {
          routes: Array.from({ length: numTrucks }, (_, i) => ({
            id: i + 1,
            name: `Truck ${i + 1}`,
            bins: [],
            points: [[depot.lat, depot.lng], [depot.lat, depot.lng]],
            binCount: 0,
            totalDistance: 0,
            totalTime: 0,
            color: getRouteColor(i)
          })),
          totalBins: 0,
          totalDistance: 0,
          totalTime: 0
        }
      });
    }

    // Divide bins among trucks using balanced assignment
    const truckAssignments = assignBinsToTrucks(binsNeedingCollection, numTrucks, depot);

    const routes = [];
    let totalDistance = 0;
    let totalTime = 0;

    // Optimize each truck's route using GA
    for (let truckIdx = 0; truckIdx < numTrucks; truckIdx++) {
      const assignedBins = truckAssignments[truckIdx];

      if (assignedBins.length === 0) {
        // Empty route - just depot
        routes.push({
          id: truckIdx + 1,
          name: `Truck ${truckIdx + 1}`,
          bins: [],
          points: [[depot.lat, depot.lng], [depot.lat, depot.lng]],
          binCount: 0,
          totalDistance: 0,
          totalTime: 0,
          color: getRouteColor(truckIdx)
        });
        continue;
      }

      // Run GA to optimize bin order
      const optimizedOrder = await optimizeRouteWithGA(assignedBins, depot);

      // Build route: depot -> bins -> depot
      const routePoints = [
        [depot.lat, depot.lng],
        ...optimizedOrder.map(bin => [bin.lat, bin.lng]),
        [depot.lat, depot.lng]
      ];

      // Calculate metrics
      const metrics = calculateRouteMetrics(
        routePoints.map(p => ({ lat: p[0], lng: p[1] }))
      );

      routes.push({
        id: truckIdx + 1,
        name: `Truck ${truckIdx + 1}`,
        bins: optimizedOrder,
        points: routePoints,
        binCount: assignedBins.length,
        totalDistance: metrics.totalDistance,
        totalTime: metrics.totalTime,
        color: getRouteColor(truckIdx)
      });

      totalDistance += metrics.totalDistance;
      totalTime += metrics.totalTime;
    }

    console.log(`✅ GA optimization complete: ${routes.length} routes generated`);

    res.json({
      success: true,
      data: {
        routes,
        totalBins: binsNeedingCollection.length,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalTime: parseFloat(totalTime.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Assign bins to trucks using nearest neighbor heuristic
 */
function assignBinsToTrucks(bins, numTrucks, depot) {
  const assignments = Array.from({ length: numTrucks }, () => []);
  const assigned = new Set();

  // Calculate distance from depot to each bin
  const binsWithDistance = bins.map(bin => ({
    ...bin,
    distanceFromDepot: calculateDistance(depot, bin)
  }));

  // Sort by distance (nearest first)
  binsWithDistance.sort((a, b) => a.distanceFromDepot - b.distanceFromDepot);

  // Round-robin assignment
  binsWithDistance.forEach((bin, index) => {
    const truckIdx = index % numTrucks;
    assignments[truckIdx].push(bin);
  });

  return assignments;
}

/**
 * Optimize single route using Genetic Algorithm
 */
async function optimizeRouteWithGA(bins, depot, options = {}) {
  const {
    generations = 100,
    populationSize = 50,
    mutationRate = 0.15,
    crossoverRate = 0.85,
    eliteCount = 5
  } = options;

  if (bins.length <= 2) {
    return bins; // No need to optimize small routes
  }

  // Initialize population with random permutations, seeded with a nearest
  // neighbor tour. Starting purely at random leaves the GA unable to catch up
  // with the greedy baseline within the generation budget.
  let population = [];
  for (let i = 0; i < populationSize; i++) {
    population.push(shuffle([...bins]));
  }
  population[0] = nearestNeighborOrder(bins, depot);

  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Calculate fitness (lower distance = higher fitness)
    const fitness = population.map(individual => {
      const route = [depot, ...individual, depot];
      const metrics = calculateRouteMetrics(route);
      return 1 / (metrics.totalDistance + 1);
    });

    // Elitism: carry the fittest routes into the next generation untouched
    const newPopulation = fitness
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .slice(0, eliteCount)
      .map(({ index }) => [...population[index]]);

    while (newPopulation.length < populationSize) {
      if (Math.random() < crossoverRate) {
        const parent1 = tournamentSelection(population, fitness);
        const parent2 = tournamentSelection(population, fitness);
        const child = orderCrossover(parent1, parent2);
        newPopulation.push(child);
      } else {
        newPopulation.push([...tournamentSelection(population, fitness)]);
      }
    }

    // Mutation (elites are left untouched)
    for (let i = eliteCount; i < newPopulation.length; i++) {
      if (Math.random() < mutationRate) {
        swapMutation(newPopulation[i]);
      }
    }

    population = newPopulation;
  }

  // Get best solution
  const fitness = population.map(individual => {
    const route = [depot, ...individual, depot];
    const metrics = calculateRouteMetrics(route);
    return 1 / (metrics.totalDistance + 1);
  });

  const bestIdx = fitness.indexOf(Math.max(...fitness));
  return population[bestIdx];
}

// GA Helper Functions
function tournamentSelection(population, fitness, tournamentSize = 3) {
  let best = null;
  let bestFitness = -Infinity;

  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    if (fitness[idx] > bestFitness) {
      bestFitness = fitness[idx];
      best = population[idx];
    }
  }

  return best;
}

function orderCrossover(parent1, parent2) {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = start + Math.floor(Math.random() * (size - start));

  const child = new Array(size).fill(null);

  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }

  let childIdx = (end + 1) % size;
  let parent2Idx = (end + 1) % size;

  while (child.includes(null)) {
    if (!child.includes(parent2[parent2Idx])) {
      child[childIdx] = parent2[parent2Idx];
      childIdx = (childIdx + 1) % size;
    }
    parent2Idx = (parent2Idx + 1) % size;
  }

  return child;
}

function swapMutation(individual) {
  const idx1 = Math.floor(Math.random() * individual.length);
  const idx2 = Math.floor(Math.random() * individual.length);
  [individual[idx1], individual[idx2]] = [individual[idx2], individual[idx1]];
}

function nearestNeighborOrder(bins, depot) {
  const order = [];
  const remaining = [...bins];
  let current = depot;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDist = calculateDistance(current, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const dist = calculateDistance(current, remaining[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    current = remaining[nearestIdx];
    order.push(current);
    remaining.splice(nearestIdx, 1);
  }

  return order;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRouteColor(index) {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
  return colors[index % colors.length];
}
