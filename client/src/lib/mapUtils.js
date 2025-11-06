"use client";

// Yogyakarta boundaries (approximately)
const BOUNDS = {
  north: -7.7470,
  south: -7.8330,
  east: 110.4300,
  west: 110.3300
};

// Fixed source points (truck depots)
export const SOURCE_POINTS = [
  { id: 1, lat: -7.797068, lng: 110.370529, name: "Truck 1" },
  { id: 2, lat: -7.792068, lng: 110.375529, name: "Truck 2" },
  { id: 3, lat: -7.802068, lng: 110.373529, name: "Truck 3" }
];

// Generate a random point within Yogyakarta bounds
const generateRandomPoint = () => {
  const lat = BOUNDS.south + Math.random() * (BOUNDS.north - BOUNDS.south);
  const lng = BOUNDS.west + Math.random() * (BOUNDS.east - BOUNDS.west);
  return { lat, lng };
};

// Generate collection points with IDs and random coordinates
export const generateCollectionPoints = (count = 200) => {
  return Array.from({ length: count }, (_, index) => {
    const { lat, lng } = generateRandomPoint();
    const fillLevel = Math.floor(Math.random() * 100);
    return {
      id: `bin-${index + 1}`,
      lat,
      lng,
      type: Math.random() > 0.5 ? "Organik" : "Anorganik",
      fillLevel,
      needsCollection: fillLevel >= 80
    };
  });
};

// Calculate distance between two points
const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1.lat - point2.lat, 2) + 
    Math.pow(point1.lng - point2.lng, 2)
  );
};

// Nearest Neighbor algorithm to optimize route order
const optimizeRouteOrder = (depot, points) => {
  if (points.length === 0) return [];
  
  const visited = new Set();
  const orderedPoints = [];
  let currentPoint = { lat: depot.lat, lng: depot.lng };
  
  // Visit each point using nearest neighbor approach
  while (visited.size < points.length) {
    let nearestPoint = null;
    let minDistance = Infinity;
    
    // Find the nearest unvisited point
    points.forEach((point, index) => {
      if (!visited.has(index)) {
        const distance = calculateDistance(currentPoint, point);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = { point, index };
        }
      }
    });
    
    if (nearestPoint) {
      visited.add(nearestPoint.index);
      orderedPoints.push(nearestPoint.point);
      currentPoint = nearestPoint.point;
    }
  }
  
  return orderedPoints;
};

// Generate smart routes for visualization
export const generateMockRoutes = (sourcePoints, collectionPoints) => {
  const routes = [];
  
  // Filter points that need collection (fill level >= 80%)
  const pointsNeedingCollection = collectionPoints.filter(point => point.fillLevel >= 80);
  
  if (pointsNeedingCollection.length === 0) {
    // If no points need collection, return routes starting and ending at depot
    return sourcePoints.map(source => ({
      id: source.id,
      name: source.name,
      color: getRouteColor(sourcePoints.indexOf(source)),
      points: [
        [source.lat, source.lng], // Start at depot
        [source.lat, source.lng]  // End at depot (no bins to collect)
      ],
      binCount: 0
    }));
  }

  // Assign each bin to the nearest truck
  const truckAssignments = sourcePoints.map(() => []);
  
  pointsNeedingCollection.forEach(point => {
    let nearestTruckIndex = 0;
    let minDistance = Infinity;
    
    sourcePoints.forEach((source, index) => {
      const distance = calculateDistance(source, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTruckIndex = index;
      }
    });
    
    truckAssignments[nearestTruckIndex].push(point);
  });

  // Create optimized routes for each truck
  sourcePoints.forEach((source, index) => {
    const assignedPoints = truckAssignments[index];
    
    // Optimize the route order using nearest neighbor
    const optimizedPoints = optimizeRouteOrder(source, assignedPoints);
    
    // Create route: START at depot → visit bins in optimized order → RETURN to depot
    const routePoints = [
      [source.lat, source.lng],                                    // START: Depot
      ...optimizedPoints.map(point => [point.lat, point.lng]),    // VISIT: Bins (optimized order)
      [source.lat, source.lng]                                     // END: Return to Depot
    ];
    
    // Log route creation
    console.log(`🚛 ${source.name} Route Created:`);
    console.log(`   📍 Start: Depot (${source.lat.toFixed(4)}, ${source.lng.toFixed(4)})`);
    console.log(`   🗑️  Bins to collect: ${optimizedPoints.length}`);
    console.log(`   🏁 End: Return to Depot (${source.lat.toFixed(4)}, ${source.lng.toFixed(4)})`);
    console.log(`   📊 Total waypoints: ${routePoints.length} (including depot start & return)`);
    
    routes.push({
      id: source.id,
      name: source.name,
      color: getRouteColor(index),
      points: routePoints,
      binCount: optimizedPoints.length
    });
  });
  
  return routes;
};

// Get a distinct color for each route
const getRouteColor = (index) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
  return colors[index % colors.length];
};