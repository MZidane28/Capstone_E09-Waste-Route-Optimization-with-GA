"use client";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { SOURCE_POINTS, generateCollectionPoints, generateMockRoutes } from '@/lib/mapUtils';
import TruckSelector from './TruckSelector';
import '@/styles/map.css';

// Helper function to calculate crow-fly distance
function calculateApproximateDistance(coordinates) {
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lat1, lon1] = coordinates[i - 1];
    const [lat2, lon2] = coordinates[i];
    totalDistance += getDistanceFromLatLonInM(lat1, lon1, lat2, lon2);
  }
  return totalDistance;
}

// Helper function to calculate approximate time (assuming average speed of 30 km/h)
function calculateApproximateTime(coordinates) {
  const distance = calculateApproximateDistance(coordinates);
  return (distance / 1000) * (60 / 30) * 60; // Convert to seconds at 30 km/h
}

// Haversine formula for calculating crow-fly distance
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Custom icons
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.3s ease;
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const truckIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #000;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function MapComponent({ onRandomize, showRoutes = false, onDataChange }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Initialize collection points
  useEffect(() => {
    setCollectionPoints(generateCollectionPoints());
  }, []);

  // Update parent component with current data
  useEffect(() => {
    if (onDataChange) {
      const needsCollection = collectionPoints.filter(point => point.fillLevel >= 80).length;
      onDataChange({
        total: collectionPoints.length,
        needsCollection,
        points: collectionPoints
      });
    }
  }, [collectionPoints, onDataChange]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [-7.797068, 110.370529], // Yogyakarta coordinates
        zoom: 13,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapRef.current = map;

      // Force a resize after map is initialized
      const resizeTimer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(resizeTimer);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Update markers when collection points change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add collection points
    collectionPoints.forEach(point => {
      // Determine marker color based on fill level and type
      let color;
      if (point.fillLevel >= 80) {
        color = '#ef4444'; // Red for bins that need collection
      } else {
        color = point.type === 'Organik' ? '#22c55e' : '#3b82f6';
      }

      const marker = L.marker([point.lat, point.lng], {
        icon: createIcon(color)
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="text-black">
            <b>ID: ${point.id}</b><br>
            Type: ${point.type}<br>
            Fill Level: ${point.fillLevel}%<br>
            Status: ${point.fillLevel >= 80 ? 'Needs Collection' : 'OK'}
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Add source points (truck locations)
    SOURCE_POINTS.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: truckIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${point.name}</b>`);
      markersRef.current.push(marker);
    });
  }, [collectionPoints]);

  // Update routes when showRoutes or selectedTruck changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing routes and loading state
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'route-loading';
    loadingDiv.innerHTML = 'Calculating routes...';

    if (showRoutes) {
      const routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruck 
        ? routes.filter(route => route.id.toString() === selectedTruck)
        : routes;

      routesToShow.forEach(route => {
        if (route.points.length > 1) { // Only show routes with collection points
          const waypoints = route.points.map(point => L.latLng(point[0], point[1]));
          
          // Create a routing control for real road routing
          // Create route waypoints
          // const waypoints = route.points.map(point => L.latLng(point[0], point[1]));
          
          // Create routing control
          // Create routing control with OSRM
          const routingControl = L.Routing.control({
            waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1',
              profile: 'driving'
            }),
            lineOptions: {
              styles: [
                { color: route.color, weight: 4, opacity: 0.8 },
                { color: 'white', weight: 2, opacity: 0.3, dashArray: '10,10' }
              ],
              extendToWaypoints: true,
              missingRouteTolerance: 100
            },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            showAlternatives: false,
            show: false,
            createMarker: () => null // Don't create markers for waypoints
          }).addTo(mapRef.current);

          // Add popup to the route line
          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const totalDistance = routes.reduce((total, route) => total + route.summary.totalDistance, 0) / 1000; // Convert to km
            const totalTime = routes.reduce((total, route) => total + route.summary.totalTime, 0) / 60; // Convert to minutes

            const line = document.querySelector('.leaflet-routing-line');
            if (line) {
              L.DomEvent.on(line, 'click', function() {
                L.popup()
                  .setLatLng(waypoints[0])
                  .setContent(`
                    <div class="route-popup">
                      <div class="route-popup-header">${route.name}</div>
                      <div class="route-popup-content">
                        <div class="route-popup-stat">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                            <path fill-rule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
                          </svg>
                          <span>${route.binCount} bins to collect</span>
                        </div>
                        <div class="route-popup-stat">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                          </svg>
                          <span>${totalDistance.toFixed(1)} km total distance</span>
                        </div>
                        <div class="route-popup-stat">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
                          </svg>
                          <span>${totalTime.toFixed(0)} minutes estimated</span>
                        </div>
                      </div>
                    </div>
                  `)
                  .openOn(mapRef.current);
              });
            }
          });

          // Add error handling
          routingControl.on('routingerror', function(e) {
            console.error('Routing error:', e);
            // Create a fallback straight-line route
            const points = waypoints.map(wp => [wp.lat, wp.lng]);
            const polyline = L.polyline(points, {
              color: route.color,
              weight: 4,
              opacity: 0.8
            }).addTo(mapRef.current);
            
            const distance = calculateApproximateDistance(points);
            const time = calculateApproximateTime(points);
            
            polyline.bindPopup(`
              <div class="route-popup">
                <div class="route-popup-header">${route.name}</div>
                <div class="route-popup-content">
                  <div class="route-popup-stat">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                      <path fill-rule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
                    </svg>
                    <span>${route.binCount} bins to collect</span>
                  </div>
                  <div class="route-popup-stat">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                    </svg>
                    <span>${(distance / 1000).toFixed(1)} km (approximate)</span>
                  </div>
                  <div class="route-popup-stat">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
                    </svg>
                    <span>${Math.round(time / 60)} minutes (approximate)</span>
                  </div>
                </div>
              </div>
            `);
            
            routesRef.current.push({ remove: () => polyline.remove() });
          });

          // Store the routing control for cleanup
          routesRef.current.push(routingControl);
        }
      });
    }
  }, [showRoutes, collectionPoints, selectedTruck]);

  // Define randomize function
  const handleRandomize = () => {
    setCollectionPoints(prevPoints => 
      prevPoints.map(point => ({
        ...point,
        fillLevel: Math.floor(Math.random() * 100),
        needsCollection: Math.random() >= 0.2 // 20% chance of needing collection
      }))
    );
    setSelectedTruck(null); // Reset truck selection
  };

  // Set up randomize callback
  useEffect(() => {
    if (onRandomize) {
      onRandomize(handleRandomize);
    }
  }, [onRandomize]);

  return (
    <div className="bg-white p-6 rounded-[18px] shadow-md border-3 border-black">
      <h2 className="text-xl text-black font-bold mb-4">Peta Rute</h2>
      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        {showRoutes && (
          <TruckSelector
            trucks={SOURCE_POINTS}
            selectedTruck={selectedTruck}
            onSelect={setSelectedTruck}
          />
        )}
        <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      </div>
    </div>
  );
}
