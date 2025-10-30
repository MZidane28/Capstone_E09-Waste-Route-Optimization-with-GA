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

// Generate smart routes for visualization
export const generateMockRoutes = (sourcePoints, collectionPoints) => {
  const routes = [];
  
  // Filter points that need collection (fill level >= 80%)
  const pointsNeedingCollection = collectionPoints.filter(point => point.fillLevel >= 80);
  
  if (pointsNeedingCollection.length === 0) {
    // If no points need collection, return empty routes
    return sourcePoints.map(source => ({
      id: source.id,
      name: source.name,
      color: getRouteColor(sourcePoints.indexOf(source)),
      points: [[source.lat, source.lng]],
      binCount: 0
    }));
  }

  // Distribute points to nearest trucks
  sourcePoints.forEach((source, index) => {
    // Calculate distances from this source to all points
    const pointsWithDistance = pointsNeedingCollection.map(point => ({
      ...point,
      distance: Math.sqrt(
        Math.pow(source.lat - point.lat, 2) + 
        Math.pow(source.lng - point.lng, 2)
      )
    }));

    // Sort points by distance
    pointsWithDistance.sort((a, b) => a.distance - b.distance);

    // Take the closest third of points for this truck
    const truckPoints = pointsWithDistance.filter((_, idx) => 
      idx % sourcePoints.length === index
    );

    // Create route with only points that need collection
    routes.push({
      id: source.id,
      name: source.name,
      color: getRouteColor(index),
      points: [
        [source.lat, source.lng],
        ...truckPoints.map(point => [point.lat, point.lng]),
        [source.lat, source.lng] // Return to source
      ],
      binCount: truckPoints.length
    });
  });
  
  return routes;
};

// Get a distinct color for each route
const getRouteColor = (index) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
  return colors[index % colors.length];
};