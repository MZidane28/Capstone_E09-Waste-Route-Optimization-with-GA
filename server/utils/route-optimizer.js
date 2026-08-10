/**
 * Route Optimization Utilities
 * Includes mock bin generation, GA optimization, and metric calculations
 */

/**
 * Generate mock bins around a depot
 */
export function generateMockBins(count, depot, radius = 0.05) {
  const bins = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;
    
    const lat = depot.lat + (distance * Math.cos(angle));
    const lng = depot.lng + (distance * Math.sin(angle));
    
    bins.push({
      id: `bin-${i + 1}`,
      lat,
      lng,
      fillLevel: 80 + Math.floor(Math.random() * 20), // 80-100%
      name: `Bin ${i + 1}`
    });
  }
  
  return bins;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(point1, point2) {
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
 * Calculate metrics for a single route
 */
export function calculateRouteMetrics(route) {
  let totalDistance = 0;
  
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(route[i], route[i + 1]);
  }
  
  // Estimate time: avg 30 km/h + 5 min per bin
  const drivingTime = (totalDistance / 30) * 60; // minutes
  const collectionTime = (route.length - 2) * 5; // 5 min per bin (exclude depot start/end)
  const totalTime = drivingTime + collectionTime;
  
  return {
    totalDistance,
    totalTime
  };
}

/**
 * Simple Genetic Algorithm for route optimization
 */
export async function optimizeWithGA(bins, numTrucks, depot, options = {}) {
  const {
    generations = 50,
    populationSize = 100,
    mutationRate = 0.1,
    crossoverRate = 0.8,
    eliteCount = 5
  } = options;
  
  // Divide bins among trucks (balanced distribution)
  const binsPerTruck = Math.ceil(bins.length / numTrucks);
  const truckBins = [];
  
  for (let i = 0; i < numTrucks; i++) {
    const start = i * binsPerTruck;
    const end = Math.min((i + 1) * binsPerTruck, bins.length);
    truckBins.push(bins.slice(start, end));
  }
  
  // Optimize each truck's route independently
  const optimizedRoutes = [];
  
  for (let truckIdx = 0; truckIdx < numTrucks; truckIdx++) {
    const bins = truckBins[truckIdx];
    
    if (bins.length === 0) continue;
    
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
        return 1 / (metrics.totalDistance + 1); // Inverse distance as fitness
      });
      
      // Elitism: carry the fittest routes into the next generation untouched
      const newPopulation = fitness
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .slice(0, eliteCount)
        .map(({ index }) => [...population[index]]);

      // Selection: Tournament selection
      while (newPopulation.length < populationSize) {
        if (Math.random() < crossoverRate) {
          // Crossover
          const parent1 = tournamentSelection(population, fitness);
          const parent2 = tournamentSelection(population, fitness);
          const child = orderCrossover(parent1, parent2);
          newPopulation.push(child);
        } else {
          // Direct copy
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
    const bestRoute = [depot, ...population[bestIdx], depot];
    const metrics = calculateRouteMetrics(bestRoute);
    
    optimizedRoutes.push({
      truckId: truckIdx + 1,
      bins: bins.length,
      ...metrics
    });
  }
  
  return optimizedRoutes;
}

/**
 * Tournament selection
 */
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

/**
 * Order crossover (OX)
 */
function orderCrossover(parent1, parent2) {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = start + Math.floor(Math.random() * (size - start));
  
  const child = new Array(size).fill(null);
  
  // Copy slice from parent1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }
  
  // Fill remaining from parent2
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

/**
 * Swap mutation
 */
function swapMutation(individual) {
  const idx1 = Math.floor(Math.random() * individual.length);
  const idx2 = Math.floor(Math.random() * individual.length);
  
  [individual[idx1], individual[idx2]] = [individual[idx2], individual[idx1]];
}

/**
 * Order bins greedily by nearest neighbor, used to seed the GA population
 */
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

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
