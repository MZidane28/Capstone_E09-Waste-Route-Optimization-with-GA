"use client";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-polylinedecorator';
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

// Start point icon (green flag)
const createStartIcon = () => {
  return L.divIcon({
    className: 'custom-start-icon',
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 8px;
          width: 3px;
          height: 25px;
          background-color: #059669;
          border-radius: 2px;
        "></div>
        <div style="
          position: absolute;
          top: 2px;
          left: 11px;
          width: 0;
          height: 0;
          border-left: 12px solid #10b981;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
        "></div>
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">START</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

// End point icon (red checkered flag)
const createEndIcon = () => {
  return L.divIcon({
    className: 'custom-end-icon',
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 30px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 8px;
          width: 3px;
          height: 25px;
          background-color: #dc2626;
          border-radius: 2px;
        "></div>
        <div style="
          position: absolute;
          top: 2px;
          left: 11px;
          width: 16px;
          height: 12px;
          background: repeating-linear-gradient(
            45deg,
            #ef4444,
            #ef4444 3px,
            white 3px,
            white 6px
          );
          border: 1px solid #dc2626;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
        "></div>
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">FINISH</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

// Numbered waypoint icon
const createNumberedIcon = (number, color) => {
  return L.divIcon({
    className: 'custom-numbered-icon',
    html: `
      <div style="
        position: relative;
        background-color: ${color};
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        font-family: system-ui, -apple-system, sans-serif;
      ">${number}</div>
    `,
    iconSize: [34, 34], // Slightly larger to account for border
    iconAnchor: [17, 17], // Center of the icon
    popupAnchor: [0, -17], // Popup appears above the icon
  });
};

export default function MapComponent({ 
  onRandomize, 
  showRoutes = false, 
  onDataChange,
  selectedTruckId,
  onTruckSelect,
  collectionPoints: externalCollectionPoints = null,
  useRealData = false,
  onRoutesGenerated
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]); // Markers for bins (collection points)
  const routeMarkersRef = useRef([]); // Markers for numbered stops when route is shown
  const routesRef = useRef([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize collection points
  useEffect(() => {
    if (useRealData && externalCollectionPoints) {
      // Use data from backend
      setCollectionPoints(externalCollectionPoints);
    } else if (!useRealData) {
      // Use mock data for simulation page
      setCollectionPoints(generateCollectionPoints());
    }
  }, [externalCollectionPoints, useRealData]);

  // Update parent component with current data (only for simulation/mock data)
  useEffect(() => {
    if (onDataChange && !useRealData && collectionPoints.length > 0) {
      const needsCollection = collectionPoints.filter(point => point.fillLevel >= 80).length;
      onDataChange({
        total: collectionPoints.length,
        needsCollection,
        points: collectionPoints
      });
    }
  }, [collectionPoints, onDataChange, useRealData]);

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

    // Clear existing markers with null check
    markersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      }
    });
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

    // Add source points (truck locations) - these serve as START and FINISH points
    SOURCE_POINTS.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: truckIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="padding: 10px; text-align: center;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${point.name}</div>
            <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #10b981; font-size: 12px;">🚀 START</span>
              <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">Depot & Base Location</div>
            <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</div>
            <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">Routes start and end here</div>
          </div>
        `);
      markersRef.current.push(marker);
    });
  }, [collectionPoints]);

  // Update routes when showRoutes or selectedTruck changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing routes with null check
    routesRef.current.forEach(route => {
      if (route && route.remove) {
        try {
          route.remove();
        } catch (error) {
          console.warn('Error removing route:', error);
        }
      }
    });
    routesRef.current = [];
    
    // Clear existing route markers (numbered stops)
    routeMarkersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error removing route marker:', error);
        }
      }
    });
    routeMarkersRef.current = [];
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'route-loading';
    loadingDiv.innerHTML = 'Calculating routes...';

    if (showRoutes) {
      // HIDE collection point markers (bins) when showing routes
      markersRef.current.forEach(marker => {
        if (marker && marker.remove) {
          try {
            marker.remove();
          } catch (error) {
            console.warn('Error hiding marker:', error);
          }
        }
      });
      // Don't clear the array - we'll need to restore them later
      
      // Re-add truck depot markers only
      SOURCE_POINTS.forEach(point => {
        const marker = L.marker([point.lat, point.lng], { icon: truckIcon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="padding: 10px; text-align: center;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${point.name}</div>
              <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #10b981; font-size: 12px;">🚀 START</span>
                <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
              </div>
              <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">Depot & Base Location</div>
              <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</div>
              <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">Routes start and end here</div>
            </div>
          `);
      }); // Close SOURCE_POINTS.forEach
      
      const routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
      
      // Send routes to parent component
      if (onRoutesGenerated) {
        onRoutesGenerated(routes);
      }
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruckId !== null && selectedTruckId !== undefined
        ? routes.filter(route => route.id === selectedTruckId)
        : routes;

      routesToShow.forEach(route => {
        if (route.points.length > 1) { // Only show routes with collection points
          const waypoints = route.points.map(point => L.latLng(point[0], point[1]));
          
          // Get depot location from SOURCE_POINTS
          const depot = SOURCE_POINTS.find(source => source.id === route.id);
          const depotLatLng = L.latLng(depot.lat, depot.lng);
          
          // Log route generation
          console.log(`🗺️ Generating route for ${route.name} with ${route.binCount} bins`);
          console.log(`   Depot: [${depot.lat}, ${depot.lng}]`);
          console.log(`   Total waypoints: ${waypoints.length} (depot → bins → depot)`);
          
          // Create routing control with OSRM (with better configuration)
          const routingControl = L.Routing.control({
            waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1',
              profile: 'car', // Use 'car' instead of 'driving' for better compatibility
              timeout: 10000, // Increase timeout to 10 seconds
              suppressDemoServerWarning: true,
              // Add request parameters for better routing
              routingOptions: {
                alternatives: false,
                steps: true,
                geometries: 'geojson',
                overview: 'full'
              }
            }),
            lineOptions: {
              styles: [
                { color: route.color, weight: 6, opacity: 0.7 },
                { color: 'white', weight: 3, opacity: 0.4, dashArray: '10, 10' }
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

          // Add popup and arrows to the route line
          routingControl.on('routesfound', function(e) {
            console.log(`✅ Route found successfully for ${route.name}`);
            const routes = e.routes;
            const totalDistance = routes.reduce((total, route) => total + route.summary.totalDistance, 0) / 1000; // Convert to km
            const totalTime = routes.reduce((total, route) => total + route.summary.totalTime, 0) / 60; // Convert to minutes
            console.log(`   Distance: ${totalDistance.toFixed(2)} km, Time: ${totalTime.toFixed(1)} min`);

            // Get the route coordinates for arrow decorator
            const routeCoords = routes[0].coordinates.map(coord => [coord.lat, coord.lng]);
            
            // Add animated arrows to show direction
            const arrowDecorator = L.polylineDecorator(routeCoords, {
              patterns: [
                {
                  offset: '5%',
                  repeat: 100,
                  symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: {
                      stroke: true,
                      weight: 3,
                      color: route.color,
                      opacity: 0.8,
                      fillOpacity: 0
                    }
                  })
                }
              ]
            }).addTo(mapRef.current);
            
            // Store decorator for cleanup
            routesRef.current.push(arrowDecorator);
            
            // Add numbered markers for collection points AFTER route is created
            // Route structure: [depot, bin1, bin2, ..., binN, depot]
            // So we want markers for index 1 to length-2 (the bins only)
            console.log(`   Creating ${waypoints.length - 2} numbered markers for bins`);
            console.log(`   Route waypoints:`, waypoints.map((wp, idx) => `${idx}: [${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}]`));
            
            for (let i = 1; i < waypoints.length - 1; i++) {
              const waypointCoords = route.points[i];
              const waypointLatLng = waypoints[i];
              const stopNumber = i;
              
              console.log(`   📍 Creating Marker #${stopNumber}:`);
              console.log(`      From route.points: [${waypointCoords[0].toFixed(5)}, ${waypointCoords[1].toFixed(5)}]`);
              console.log(`      From waypoints: [${waypointLatLng.lat.toFixed(5)}, ${waypointLatLng.lng.toFixed(5)}]`);
              
              // Use explicit L.latLng to ensure proper coordinate object
              const markerPosition = L.latLng(waypointCoords[0], waypointCoords[1]);
              
              const numberedMarker = L.marker(markerPosition, {
                icon: createNumberedIcon(stopNumber, route.color),
                zIndexOffset: 1000 // High z-index to appear on top
              })
                .addTo(mapRef.current)
                .bindPopup(`
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; color: ${route.color}; margin-bottom: 4px;">Collection Stop #${stopNumber}</div>
                    <div style="color: #4b5563; font-size: 14px;">${route.name}</div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Bin Location</div>
                    <div style="color: #9ca3af; font-size: 11px; margin-top: 2px;">Lat: ${waypointCoords[0].toFixed(5)}, Lng: ${waypointCoords[1].toFixed(5)}</div>
                  </div>
                `);
              
              console.log(`      ✅ Marker created at:`, numberedMarker.getLatLng());
              routeMarkersRef.current.push(numberedMarker);
            }
            console.log(`   ✅ Created ${waypoints.length - 2} numbered markers`);

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

          // Add error handling with fallback to straight-line route
          routingControl.on('routingerror', function(e) {
            // Use console.warn instead of error since we have a fallback
            console.warn('⚠️ OSRM routing failed for', route.name);
            console.warn('   Error details:', e.error || 'No error details');
            console.warn('   Falling back to straight-line route');
            
            // Create a fallback straight-line route
            const points = waypoints.map(wp => [wp.lat, wp.lng]);
            const polyline = L.polyline(points, {
              color: route.color,
              weight: 6,
              opacity: 0.7,
              dashArray: '10, 5'
            }).addTo(mapRef.current);
            
            // Add arrows to fallback route
            const arrowDecorator = L.polylineDecorator(polyline, {
              patterns: [
                {
                  offset: '5%',
                  repeat: 100,
                  symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: {
                      stroke: true,
                      weight: 3,
                      color: route.color,
                      opacity: 0.8,
                      fillOpacity: 0
                    }
                  })
                }
              ]
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
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
                    ⚠️ Showing approximate straight-line route
                  </div>
                </div>
              </div>
            `);
            
            routesRef.current.push({ remove: () => {
              try {
                if (polyline && polyline.remove) polyline.remove();
                if (arrowDecorator && arrowDecorator.remove) arrowDecorator.remove();
              } catch (error) {
                console.warn('Error removing fallback route:', error);
              }
            } });
          });

          // Store the routing control for cleanup
          routesRef.current.push(routingControl);
        } // close if (route.points.length > 1)
      }); // close routesToShow.forEach
    } else { // close if (showRoutes)
      // When showRoutes = false, restore collection point markers
      // First, clear any existing markers from map
      markersRef.current.forEach(marker => {
        if (marker && marker.remove) {
          try {
            marker.remove();
          } catch (error) {
            console.warn('Error removing marker:', error);
          }
        }
      });
      markersRef.current = [];
      
      // Re-add all markers (bins and trucks)
      collectionPoints.forEach(point => {
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
          .bindPopup(`
            <div style="padding: 10px; text-align: center;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${point.name}</div>
              <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #10b981; font-size: 12px;">🚀 START</span>
                <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
              </div>
              <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">Depot & Base Location</div>
              <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</div>
              <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">Routes start and end here</div>
            </div>
          `);
        markersRef.current.push(marker);
      });
    }
  }, [showRoutes, collectionPoints, selectedTruckId]);

  // Define randomize function
  const handleRandomize = () => {
    setCollectionPoints(prevPoints => 
      prevPoints.map(point => {
        const newFillLevel = Math.floor(Math.random() * 100);
        return {
          ...point,
          fillLevel: newFillLevel,
          needsCollection: newFillLevel >= 80
        };
      })
    );
  };

  // Set up randomize callback
  useEffect(() => {
    if (onRandomize) {
      onRandomize(() => handleRandomize);
    }
  }, [onRandomize]);

  // Effect to handle map resize when fullscreen changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [isFullscreen]);

  // Create refs for fullscreen mode
  const fullscreenMapRef = useRef(null);
  const fullscreenRoutesRef = useRef([]);
  const fullscreenMarkersRef = useRef([]);
  const fullscreenMapInstanceRef = useRef(null);

  // Function to update routes on a specific map instance
  const updateMapRoutes = (mapInstance, routesContainer, markersContainer) => {
    // Clear existing routes with null check
    routesContainer.forEach(route => {
      if (route && route.remove) {
        try {
          route.remove();
        } catch (error) {
          console.warn('Error removing route in updateMapRoutes:', error);
        }
      }
    });
    routesContainer.length = 0;

    if (showRoutes) {
      const routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruckId !== null && selectedTruckId !== undefined
        ? routes.filter(route => route.id === selectedTruckId)
        : routes;

      routesToShow.forEach(route => {
        if (route.points.length > 1) {
          const waypoints = route.points.map(point => L.latLng(point[0], point[1]));
          
          // Get depot location from SOURCE_POINTS
          const depot = SOURCE_POINTS.find(source => source.id === route.id);
          
          // Don't add START/FINISH markers - depot marker (black circle) already shows start/end point
          // Route naturally starts and ends at depot, so the truck marker serves as both START and FINISH

          // Add numbered markers for collection points ONLY (skip first and last - they are depot)
          for (let i = 1; i < waypoints.length - 1; i++) {
            const waypointCoords = route.points[i];
            const stopNumber = i;
            
            const numberedMarker = L.marker(waypoints[i], {
              icon: createNumberedIcon(stopNumber, route.color),
              zIndexOffset: 500
            })
              .addTo(mapInstance)
              .bindPopup(`
                <div style="padding: 8px;">
                  <div style="font-weight: bold; color: ${route.color}; margin-bottom: 4px;">Collection Stop #${stopNumber}</div>
                  <div style="color: #4b5563; font-size: 14px;">${route.name}</div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Bin Location</div>
                </div>
              `);
            markersContainer.push(numberedMarker);
          }
          
          const routingControl = L.Routing.control({
            waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1',
              profile: 'car',
              timeout: 10000,
              suppressDemoServerWarning: true,
              routingOptions: {
                alternatives: false,
                steps: true,
                geometries: 'geojson',
                overview: 'full'
              }
            }),
            lineOptions: {
              styles: [
                { color: route.color, weight: 6, opacity: 0.7 },
                { color: 'white', weight: 3, opacity: 0.4, dashArray: '10, 10' }
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
            createMarker: () => null
          }).addTo(mapInstance);

          // Add arrows when route is found
          routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const routeCoords = routes[0].coordinates.map(coord => [coord.lat, coord.lng]);
            
            const arrowDecorator = L.polylineDecorator(routeCoords, {
              patterns: [
                {
                  offset: '5%',
                  repeat: 100,
                  symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: {
                      stroke: true,
                      weight: 3,
                      color: route.color,
                      opacity: 0.8,
                      fillOpacity: 0
                    }
                  })
                }
              ]
            }).addTo(mapInstance);
            
            routesContainer.push(arrowDecorator);
          });

          // Add error handling for fullscreen/other map instances
          routingControl.on('routingerror', function(e) {
            console.warn('⚠️ Road routing unavailable for', route.name, '- using direct route');
            
            // Create fallback straight-line route
            const points = waypoints.map(wp => [wp.lat, wp.lng]);
            const fallbackLine = L.polyline(points, {
              color: route.color,
              weight: 6,
              opacity: 0.7,
              dashArray: '10, 5'
            }).addTo(mapInstance);
            
            const arrowDecorator = L.polylineDecorator(fallbackLine, {
              patterns: [
                {
                  offset: '5%',
                  repeat: 100,
                  symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: {
                      stroke: true,
                      weight: 3,
                      color: route.color,
                      opacity: 0.8,
                      fillOpacity: 0
                    }
                  })
                }
              ]
            }).addTo(mapInstance);
            
            routesContainer.push({ remove: () => {
              try {
                if (fallbackLine && fallbackLine.remove) fallbackLine.remove();
                if (arrowDecorator && arrowDecorator.remove) arrowDecorator.remove();
              } catch (error) {
                console.warn('Error removing fallback route in updateMapRoutes:', error);
              }
            } });
          });

          routesContainer.push(routingControl);
        }
      });
    }
  };

  // Effect to handle routes on both maps
  useEffect(() => {
    if (mapRef.current) {
      updateMapRoutes(mapRef.current, routesRef.current, markersRef.current);
    }
    if (fullscreenMapInstanceRef.current) {
      updateMapRoutes(fullscreenMapInstanceRef.current, fullscreenRoutesRef.current, fullscreenMarkersRef.current);
    }
  }, [showRoutes, collectionPoints, selectedTruckId]);

  // Effect to handle map in fullscreen mode
  useEffect(() => {
    if (isFullscreen && mapRef.current && fullscreenMapRef.current) {
      // Clear previous fullscreen routes with null check
      fullscreenRoutesRef.current.forEach(route => {
        if (route && route.remove) {
          try {
            route.remove();
          } catch (error) {
            console.warn('Error removing fullscreen route:', error);
          }
        }
      });
      fullscreenRoutesRef.current = [];
      
      // Clear previous fullscreen markers with null check
      fullscreenMarkersRef.current.forEach(marker => {
        if (marker && marker.remove) {
          try {
            marker.remove();
          } catch (error) {
            console.warn('Error removing fullscreen marker:', error);
          }
        }
      });
      fullscreenMarkersRef.current = [];

      // Create new map in fullscreen container
      const fullscreenMap = L.map(fullscreenMapRef.current, {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom(),
        scrollWheelZoom: true
      });

      fullscreenMapInstanceRef.current = fullscreenMap;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(fullscreenMap);

      // Copy markers to fullscreen map
      markersRef.current.forEach(marker => {
        const newMarker = L.marker(marker.getLatLng(), {
          icon: marker.options.icon
        }).addTo(fullscreenMap);
        if (marker._popup) {
          newMarker.bindPopup(marker._popup._content);
        }
        fullscreenMarkersRef.current.push(newMarker);
      });

      // Update routes for fullscreen map
      updateMapRoutes(fullscreenMap, fullscreenRoutesRef.current, fullscreenMarkersRef.current);

      return () => {
        fullscreenMapInstanceRef.current = null;
        if (fullscreenMap && fullscreenMap.remove) {
          try {
            fullscreenMap.remove();
          } catch (error) {
            console.warn('Error removing fullscreen map:', error);
          }
        }
      };
    }
  }, [isFullscreen]);

  return (
    <>
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-[18px] shadow-md border-2 sm:border-3 border-black">
        <h2 className="text-xl sm:text-2xl text-black font-bold mb-3 sm:mb-4 px-2">Peta Rute</h2>
        <div className="map-container">
          <div className="map-controls">
            {showRoutes && (
              <div className="truck-selector">
                <TruckSelector
                  trucks={SOURCE_POINTS}
                  selectedTruck={selectedTruckId}
                  onSelect={onTruckSelect}
                />
              </div>
            )}
            <button 
              onClick={() => setIsFullscreen(true)}
              className="fullscreen-button"
              title="View fullscreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M3.75 3.75v4.5a.75.75 0 001.5 0V5.56l3.97 3.97a.75.75 0 001.06-1.06L6.31 4.5h2.69a.75.75 0 000-1.5H3.75a.75.75 0 00-.75.75zM20.25 3.75a.75.75 0 00-.75-.75H15a.75.75 0 000 1.5h2.69l-3.97 3.97a.75.75 0 101.06 1.06L18.75 5.56v2.69a.75.75 0 001.5 0v-4.5zM3.75 20.25a.75.75 0 00.75.75H9a.75.75 0 000-1.5H6.31l3.97-3.97a.75.75 0 10-1.06-1.06L5.25 18.44v-2.69a.75.75 0 00-1.5 0v4.5zM20.25 20.25a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.69l-3.97-3.97a.75.75 0 10-1.06 1.06l3.97 3.97h-2.69a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div ref={mapContainerRef} className="w-full h-full rounded-lg relative" />
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <>
          <div 
            className={`map-fullscreen-overlay ${isFullscreen ? 'active' : ''}`}
            onClick={() => setIsFullscreen(false)}
          />
          <div className={`map-fullscreen-container ${isFullscreen ? 'active' : ''}`}>
            <div className="map-fullscreen-header">
              <h2 className="text-xl font-bold text-black">Peta Rute</h2>
              {showRoutes && (
                <div className="ml-8">
                  <TruckSelector
                    trucks={SOURCE_POINTS}
                    selectedTruck={selectedTruckId}
                    onSelect={onTruckSelect}
                  />
                </div>
              )}
              <button 
                onClick={() => setIsFullscreen(false)}
                className="fullscreen-button"
                title="Exit fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M3.75 3.75v4.5a.75.75 0 001.5 0V5.56l3.97 3.97a.75.75 0 001.06-1.06L6.31 4.5h2.69a.75.75 0 000-1.5H3.75a.75.75 0 00-.75.75zM20.25 3.75a.75.75 0 00-.75-.75H15a.75.75 0 000 1.5h2.69l-3.97 3.97a.75.75 0 101.06 1.06L18.75 5.56v2.69a.75.75 0 001.5 0v-4.5zM3.75 20.25a.75.75 0 00.75.75H9a.75.75 0 000-1.5H6.31l3.97-3.97a.75.75 0 10-1.06-1.06L5.25 18.44v-2.69a.75.75 0 00-1.5 0v4.5zM20.25 20.25a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.69l-3.97-3.97a.75.75 0 10-1.06 1.06l3.97 3.97h-2.69a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div style={{ height: 'calc(100% - 60px)', marginTop: '60px' }}>
              <div ref={fullscreenMapRef} className="w-full h-full rounded-b-2xl" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
