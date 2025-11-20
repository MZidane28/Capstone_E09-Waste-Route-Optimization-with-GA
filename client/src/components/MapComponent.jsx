"use client";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-polylinedecorator';
import { SOURCE_POINTS, DEPOT, generateCollectionPoints, generateMockRoutes } from '@/lib/mapUtils';
import { API_ENDPOINTS } from '@/lib/config';
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
    <div style="position: relative;">
      <!-- Pulsing circle animation -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 70%);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      "></div>
      
      <!-- Main depot icon -->
      <div style="
        position: relative;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6), 0 0 0 2px rgba(239, 68, 68, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      </div>
      
      <!-- DEPOT label -->
      <div style="
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        font-size: 11px;
        font-weight: bold;
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        border: 2px solid white;
        letter-spacing: 0.5px;
      ">DEPOT</div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.3);
          opacity: 0.5;
        }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
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

// Real sensor bin icon (with sensor indicator)
const createRealBinIcon = (color) => {
  return L.divIcon({
    className: 'custom-real-bin-icon',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
      ">
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
          position: absolute;
          top: 4px;
          left: 4px;
        "></div>
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #10b981, #059669);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          animation: pulse 2s infinite;
        ">📡</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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
  onRoutesGenerated,
  savedRoutes = null
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]); // Markers for bins (collection points)
  const routeMarkersRef = useRef([]); // Markers for numbered stops when route is shown
  const routesRef = useRef([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previousDataRef = useRef(null); // Track previous data sent to parent
  const hasInitialized = useRef(false); // Track if initial data is loaded

  // Initialize collection points
  useEffect(() => {
    // If useRealData is true, use external collection points from parent (Beranda)
    if (useRealData && externalCollectionPoints && externalCollectionPoints.length > 0) {
      console.log('🗺️ MapComponent received external bins:', externalCollectionPoints.length);
      setCollectionPoints(externalCollectionPoints);
      hasInitialized.current = true;
      return;
    }
    
    // For simulation page, generate mock data only once
    if (!useRealData && !hasInitialized.current) {
      const initialData = generateCollectionPoints();
      console.log('🎲 MapComponent generated random bins:', initialData.length);
      setCollectionPoints(initialData);
      hasInitialized.current = true;
    }
  }, [useRealData, externalCollectionPoints, externalCollectionPoints?.length]);

  // Update parent component with current data (for simulation page when useRealData)
  useEffect(() => {
    if (!onDataChange || collectionPoints.length === 0) {
      return;
    }
    
    const needsCollection = collectionPoints.filter(point => point.fillLevel >= 80).length;
    const newData = {
      total: collectionPoints.length,
      needsCollection,
      points: collectionPoints
    };
    
    // Only call onDataChange if data actually changed
    const prevData = previousDataRef.current;
    if (!prevData || 
        prevData.total !== newData.total || 
        prevData.needsCollection !== newData.needsCollection) {
      previousDataRef.current = newData;
      onDataChange(newData);
    }
  }, [collectionPoints, onDataChange]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [DEPOT.lat, DEPOT.lng], // Center on depot (TPS Piyungan)
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
    if (!mapRef.current) {
      console.log('⚠️ Map not ready yet for markers');
      return;
    }

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
      
      // Determine marker color based on fill level (matching list page colors)
      let color;
      if (point.fillLevel >= 80) {
        color = '#ef4444'; // Red for bins that need collection (≥80%)
      } else if (point.fillLevel >= 60) {
        color = '#eab308'; // Yellow/amber for medium fill (60-79%)
      } else {
        color = '#3b82f6'; // Blue for bins under threshold (<60%)
      }

      // Use different icon for real sensor bins
      const binIcon = point.isReal ? createRealBinIcon(color) : createIcon(color);

      const marker = L.marker([point.lat, point.lng], {
        icon: binIcon
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="text-black">
            <b>ID: ${point.id}</b>${point.isReal ? ' <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">📡 SENSOR</span>' : ''}<br>
            Fill Level: ${point.fillLevel}%<br>
            Status: ${point.fillLevel >= 80 ? 'Needs Collection' : point.fillLevel >= 60 ? 'Medium' : 'OK'}${point.isReal ? '<br><span style="color: #059669; font-size: 11px;">Real-time data from IoT sensor</span>' : ''}
          </div>
        `);
      markersRef.current.push(marker);
    });
    
    console.log('✅ Rendered', markersRef.current.length - 1, 'bin markers');

    // Add single depot marker (all trucks start and end here)
    const depotMarker = L.marker([DEPOT.lat, DEPOT.lng], { icon: truckIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 10px; text-align: center;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${DEPOT.name}</div>
          <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #10b981; font-size: 12px;">🚀 START</span>
            <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
          </div>
          <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">All trucks start & end here</div>
          <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${DEPOT.lat.toFixed(5)}, ${DEPOT.lng.toFixed(5)}</div>
          <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">3 trucks operate from this depot</div>
        </div>
      `);
    markersRef.current.push(depotMarker);
  }, [collectionPoints]);

  // Update routes when showRoutes or selectedTruck changes
  useEffect(() => {
    const generateAndDisplayRoutes = async () => {
      // Extra defensive check
      if (!mapRef.current || !mapRef.current._loaded || !mapRef.current._container) {
        console.debug('Map not ready for route updates');
        return;
      }

      // Clear existing routes with improved null check and error handling
      routesRef.current.forEach(route => {
        if (route && route.remove) {
          try {
            route.remove();
          } catch (error) {
            // Silently fail - map might be in transition
            if (process.env.NODE_ENV === 'development') {
              console.debug('Error removing route:', error.message);
            }
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
      
      // Re-add single depot marker (all trucks use same depot)
      const depotMarker = L.marker([DEPOT.lat, DEPOT.lng], { icon: truckIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="padding: 10px; text-align: center;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${DEPOT.name}</div>
            <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #10b981; font-size: 12px;">🚀 START</span>
              <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">All trucks start & end here</div>
            <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${DEPOT.lat.toFixed(5)}, ${DEPOT.lng.toFixed(5)}</div>
            <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">3 trucks operate from this depot</div>
          </div>
        `);
      
      // Use savedRoutes if available, otherwise generate mock routes for testing
      let routes;
      if (savedRoutes && savedRoutes.length > 0) {
        console.log('📦 Using saved routes from parent component');
        routes = savedRoutes;
      } else {
        console.log('⚠️ No saved routes available - using mock data for preview');
        // Generate mock routes only for testing/preview
        routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
        
        // Notify parent that we generated mock routes
        if (onRoutesGenerated) {
          onRoutesGenerated(routes);
        }
      }
      
      // If routes is still empty after generation, return early
      if (!routes || routes.length === 0) {
        console.warn('⚠️ No routes available to display');
        return;
      }
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruckId !== null && selectedTruckId !== undefined
        ? routes.filter(route => route.id === selectedTruckId)
        : routes;

      const isMultipleRoutes = routesToShow.length > 1;
      console.log(`🚛 Rendering ${routesToShow.length} route(s)${isMultipleRoutes ? ' (All Trucks - sequential with delay)' : ''}`);

      // Process routes sequentially with delay for "All Trucks" to avoid OSRM rate limiting
      const processRoute = (route, index) => {
        const delay = isMultipleRoutes ? index * 500 : 0; // 500ms delay between each route for multiple trucks
        
        setTimeout(() => {
          if (route.points.length > 1) { // Only show routes with collection points
          // Safety check: ensure map is still mounted
          if (!mapRef.current) {
            console.warn('⚠️ Map is not mounted, skipping route generation');
            return;
          }
          
          const waypoints = route.points.map(point => L.latLng(point[0], point[1]));
          
          // All trucks use the same depot (DEPOT constant)
          const depotLatLng = L.latLng(DEPOT.lat, DEPOT.lng);
          
          // Log route generation with detailed waypoint info
          console.log(`🗺️ Generating route for ${route.name} with ${route.binCount} bins`);
          console.log(`   Depot: [${DEPOT.lat}, ${DEPOT.lng}] (shared depot)`);
          console.log(`   Total waypoints: ${waypoints.length} (depot → bins → depot)`);
          console.log(`   First waypoint: [${waypoints[0].lat.toFixed(5)}, ${waypoints[0].lng.toFixed(5)}]`);
          console.log(`   Last waypoint: [${waypoints[waypoints.length-1].lat.toFixed(5)}, ${waypoints[waypoints.length-1].lng.toFixed(5)}]`);
          console.log(`   Is first = depot? ${waypoints[0].lat === DEPOT.lat && waypoints[0].lng === DEPOT.lng}`);
          console.log(`   Is last = depot? ${waypoints[waypoints.length-1].lat === DEPOT.lat && waypoints[waypoints.length-1].lng === DEPOT.lng}`);
          
          // Try OSRM routing with automatic fallback to direct routes
          // Always use OSRM for real routes, even for multiple trucks
          const USE_OSRM_ROUTING = true;
          let routingFailed = false;
          
          // Helper function to create direct route (used as fallback)
          const createDirectRoute = (isDirect = false) => {
            const points = waypoints.map(wp => [wp.lat, wp.lng]);
            const polyline = L.polyline(points, {
              color: route.color,
              weight: 6,
              opacity: 0.7,
              dashArray: isDirect ? '5, 5' : undefined // Dashed only if direct fallback
            }).addTo(mapRef.current);
            
            routesRef.current.push(polyline);
            
            // Add arrows
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
            });
            
            if (mapRef.current) {
              arrowDecorator.addTo(mapRef.current);
              routesRef.current.push(arrowDecorator);
            }
            
            // Add popup
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
                    <span>~${(distance / 1000).toFixed(1)} km${isDirect ? ' (direct)' : ''}</span>
                  </div>
                  <div class="route-popup-stat">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
                    </svg>
                    <span>~${(time / 60).toFixed(0)} minutes</span>
                  </div>
                </div>
              </div>
            `);
            
            // Add numbered markers
            for (let i = 1; i < waypoints.length - 1; i++) {
              const stopNumber = i;
              const waypointCoords = route.points[i];
              
              if (!mapRef.current) {
                console.warn('⚠️ Map was unmounted before numbered markers could be added');
                return;
              }
              
              const markerPosition = L.latLng(waypointCoords[0], waypointCoords[1]);
              
              const numberedMarker = L.marker(markerPosition, {
                icon: createNumberedIcon(stopNumber, route.color),
                zIndexOffset: 1000
              })
                .addTo(mapRef.current)
                .bindPopup(`
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; color: ${route.color}; margin-bottom: 4px;">Stop #${stopNumber}</div>
                    <div style="color: #4b5563; font-size: 14px;">${route.name}</div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Bin Location</div>
                  </div>
                `);
              
              routeMarkersRef.current.push(numberedMarker);
            }
            
            console.log(`✅ ${isDirect ? 'Direct' : 'Road'} route created for ${route.name}`);
          };
          
          if (USE_OSRM_ROUTING) {
          // Try OSRM routing (may show network errors in console)
          
          // Create routing control with OSRM (with better configuration)
          const routingControl = L.Routing.control({
            waypoints,
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1',
              profile: 'car', // Use 'car' instead of 'driving' for better compatibility
              timeout: 20000, // 10 seconds timeout for all routes
              suppressDemoServerWarning: true,
              // Add request parameters for better routing
              routingOptions: {
                alternatives: false,
                steps: true,
                geometries: 'geojson',
                overview: 'full'
              },
              // Suppress fetch errors
              useHints: false
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
            createMarker: () => null, // Don't create markers for waypoints
            
            // SUPPRESS DEFAULT ERROR HANDLER
            errorHandler: function(error) {
              // Completely suppress OSRM errors - fallback handler will take care of it
              // Do not log anything to console
              return; // Silent suppression
            }
          });
          
          // Safety check before adding to map
          if (!mapRef.current) {
            console.warn('⚠️ Map was unmounted before routing control could be added');
            return;
          }
          
          routingControl.addTo(mapRef.current);

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
            });
            
            // Safety check before adding to map
            if (mapRef.current) {
              arrowDecorator.addTo(mapRef.current);
              // Store decorator for cleanup
              routesRef.current.push(arrowDecorator);
            }
            
            // Add numbered markers for collection points AFTER route is created
            // Route structure: [depot, bin1, bin2, ..., binN, depot]
            // So we want markers for index 1 to length-2 (the bins only)
            console.log(`   Creating ${waypoints.length - 2} numbered markers for bins`);
            
            for (let i = 1; i < waypoints.length - 1; i++) {
              const stopNumber = i;
              // Use waypoints directly (from route.points) which has correct coordinates
              const waypointLatLng = waypoints[i];
              
              console.log(`   📍 Marker #${stopNumber}: [${waypointLatLng.lat.toFixed(5)}, ${waypointLatLng.lng.toFixed(5)}]`);
              
              // Safety check before creating marker
              if (!mapRef.current) {
                console.warn('⚠️ Map was unmounted before numbered markers could be added');
                return;
              }
              
              const numberedMarker = L.marker(waypointLatLng, {
                icon: createNumberedIcon(stopNumber, route.color),
                zIndexOffset: 1000 // High z-index to appear on top
              })
                .addTo(mapRef.current)
                .bindPopup(`
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; color: ${route.color}; margin-bottom: 4px;">Collection Stop #${stopNumber}</div>
                    <div style="color: #4b5563; font-size: 14px;">${route.name}</div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Bin Location</div>
                    <div style="color: #9ca3af; font-size: 11px; margin-top: 2px;">Lat: ${waypointLatLng.lat.toFixed(5)}, Lng: ${waypointLatLng.lng.toFixed(5)}</div>
                  </div>
                `);
              
              console.log(`      ✅ Marker created successfully`);
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
            console.log(`⚠️ OSRM unavailable for ${route.name}, using direct route fallback`);
            routingFailed = true;
            
            // Remove the failed routing control
            if (mapRef.current && routingControl) {
              try {
                mapRef.current.removeControl(routingControl);
              } catch (err) {
                // Ignore removal errors
              }
            }
            
            // Create direct route as fallback
            if (mapRef.current && mapRef.current._loaded) {
              createDirectRoute(true); // true = isDirect fallback
            }
          });
          
          // Store routing control for cleanup with safe wrapper
          const safeRoutingControl = {
            _control: routingControl,
            _map: mapRef.current,
            remove: function() {
              try {
                // Check if control and map still exist
                if (!this._control || !this._map) {
                  return;
                }
                
                // Remove event listeners first
                if (this._control.off) {
                  this._control.off('routesfound');
                  this._control.off('routingerror');
                }
                
                // Check if control is still attached to map
                if (this._map.hasLayer && this._map.hasLayer(this._control)) {
                  // Try to remove using Leaflet's removeControl
                  if (this._map.removeControl) {
                    this._map.removeControl(this._control);
                  }
                } else if (this._control.remove && typeof this._control.remove === 'function') {
                  // Try control's own remove method
                  this._control.remove();
                }
              } catch (error) {
                // Silently ignore - map might be unmounting
                if (process.env.NODE_ENV === 'development') {
                  console.debug('Routing control cleanup (expected during unmount):', error.message);
                }
              }
            }
          };
          
          routesRef.current.push(safeRoutingControl);
          
          } else {
            // USE_OSRM_ROUTING is false, use direct routes
            createDirectRoute(false);
          }
          // End of routing section
        } // close if (route.points.length > 1)
        }, delay); // close setTimeout
      }; // close processRoute function
      
      // Execute processRoute for each route
      routesToShow.forEach((route, index) => {
        processRoute(route, index);
      });
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
        // Determine marker color based on fill level (matching list page colors)
        let color;
        if (point.fillLevel >= 80) {
          color = '#ef4444'; // Red for bins that need collection (≥80%)
        } else if (point.fillLevel >= 60) {
          color = '#eab308'; // Yellow/amber for medium fill (60-79%)
        } else {
          color = '#3b82f6'; // Blue for bins under threshold (<60%)
        }

        // Use different icon for real sensor bins
        const binIcon = point.isReal ? createRealBinIcon(color) : createIcon(color);

        const marker = L.marker([point.lat, point.lng], {
          icon: binIcon
        })
          .addTo(mapRef.current)
          .bindPopup(`
            <div class="text-black">
              <b>ID: ${point.id}</b>${point.isReal ? ' <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">📡 SENSOR</span>' : ''}<br>
              Fill Level: ${point.fillLevel}%<br>
              Status: ${point.fillLevel >= 80 ? 'Needs Collection' : point.fillLevel >= 60 ? 'Medium' : 'OK'}${point.isReal ? '<br><span style="color: #059669; font-size: 11px;">Real-time data from IoT sensor</span>' : ''}
            </div>
          `);
        markersRef.current.push(marker);
      });

      // Add single depot marker (all trucks use same depot)
      const depotMarker = L.marker([DEPOT.lat, DEPOT.lng], { icon: truckIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="padding: 10px; text-align: center;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${DEPOT.name}</div>
            <div style="background: linear-gradient(135deg, #10b981 50%, #ef4444 50%); height: 4px; margin: 8px 0; border-radius: 2px;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #10b981; font-size: 12px;">🚀 START</span>
              <span style="color: #ef4444; font-size: 12px;">🏁 FINISH</span>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 6px;">All trucks start & end here</div>
            <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${DEPOT.lat.toFixed(5)}, ${DEPOT.lng.toFixed(5)}</div>
            <div style="color: #9ca3af; font-size: 10px; font-style: italic; margin-top: 4px;">3 trucks operate from this depot</div>
          </div>
        `);
      markersRef.current.push(depotMarker);
    }
    };
    
    generateAndDisplayRoutes();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Clear routes when component unmounts or dependencies change
      routesRef.current.forEach(route => {
        if (route && route.remove) {
          try {
            route.remove();
          } catch (error) {
            // Silently ignore cleanup errors
            if (process.env.NODE_ENV === 'development') {
              console.debug('Route cleanup error (expected):', error.message);
            }
          }
        }
      });
      
      // Clear route markers
      routeMarkersRef.current.forEach(marker => {
        if (marker && marker.remove) {
          try {
            marker.remove();
          } catch (error) {
            // Silently ignore
          }
        }
      });
    };
  }, [showRoutes, collectionPoints, selectedTruckId, savedRoutes]);

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
    if (mapRef.current && mapRef.current.invalidateSize) {
      setTimeout(() => {
        if (mapRef.current && mapRef.current.invalidateSize) {
          mapRef.current.invalidateSize();
        }
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
    // Check if map instance is valid with extra checks
    if (!mapInstance || !mapInstance._loaded || !mapInstance._container) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('⚠️ Map instance not available for route update');
      }
      return;
    }
    
    // Clear existing routes with null check
    routesContainer.forEach(route => {
      if (route && route.remove) {
        try {
          route.remove();
        } catch (error) {
          // Silently fail during cleanup
          if (process.env.NODE_ENV === 'development') {
            console.debug('Error removing route in updateMapRoutes:', error.message);
          }
        }
      }
    });
    routesContainer.length = 0;

    if (showRoutes) {
      // Use savedRoutes if available, otherwise generate new routes
      let routes;
      if (savedRoutes && savedRoutes.length > 0) {
        console.log('📦 Using saved routes in updateMapRoutes');
        routes = savedRoutes;
      } else {
        console.log('🆕 Generating new routes in updateMapRoutes');
        routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
      }
      
      // If routes is still empty after generation, return early
      if (!routes || routes.length === 0) {
        console.warn('⚠️ No routes available to display in updateMapRoutes');
        return;
      }
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruckId !== null && selectedTruckId !== undefined
        ? routes.filter(route => route.id === selectedTruckId)
        : routes;

      const isMultipleRoutes = routesToShow.length > 1;
      
      // Process routes sequentially with delay for "All Trucks"
      const processFullscreenRoute = (route, index) => {
        const delay = isMultipleRoutes ? index * 500 : 0;
        
        setTimeout(() => {
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
              timeout: 10000, // 10 seconds timeout
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
            createMarker: () => null,
            
            // SUPPRESS DEFAULT ERROR HANDLER
            errorHandler: function() {
              // Custom error handler that does nothing (suppress console errors)
              // Our 'routingerror' event handler below will handle errors gracefully
            }
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
            // Suppress error logging (graceful fallback)
            if (process.env.NODE_ENV === 'development') {
              console.debug('ℹ️ OSRM routing unavailable - using fallback for', route.name);
            }
            
            // Check if map instance still exists
            if (!mapInstance || !mapInstance._loaded) {
              return;
            }
            
            try {
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
            } catch (fallbackError) {
              // Silently fail if map is no longer available
              if (process.env.NODE_ENV === 'development') {
                console.debug('Failed to create fallback route:', fallbackError.message);
              }
            }
          });

          // Safe cleanup wrapper for fullscreen routing control
          routesContainer.push({
            remove: () => {
              try {
                // Check if map still exists and routing control is valid
                if (routingControl && mapInstance && mapInstance.hasLayer) {
                  // Remove event listeners first
                  routingControl.off('routesfound');
                  routingControl.off('routingerror');
                  
                  // Safely remove from map
                  if (typeof routingControl.remove === 'function') {
                    routingControl.remove();
                  } else if (routingControl._map) {
                    mapInstance.removeControl(routingControl);
                  }
                }
              } catch (error) {
                // Silently ignore cleanup errors
                if (process.env.NODE_ENV === 'development') {
                  console.debug('Routing control cleanup (expected):', error.message);
                }
              }
            }
          });
        }
        }, delay); // close setTimeout
      }; // close processFullscreenRoute function
      
      // Execute processFullscreenRoute for each route
      routesToShow.forEach((route, index) => {
        processFullscreenRoute(route, index);
      });
    }
  };

  // Effect to handle routes on fullscreen map only (main map handled by main useEffect)
  useEffect(() => {
    // Only update fullscreen map, not main map (to avoid duplicate rendering)
    if (fullscreenMapInstanceRef.current) {
      updateMapRoutes(fullscreenMapInstanceRef.current, fullscreenRoutesRef.current, fullscreenMarkersRef.current);
    }
  }, [showRoutes, collectionPoints, selectedTruckId, savedRoutes]); // Added savedRoutes dependency

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
            {showRoutes && savedRoutes && savedRoutes.length > 0 && (
              <div className="truck-selector">
                <TruckSelector
                  trucks={savedRoutes}
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
              {showRoutes && savedRoutes && savedRoutes.length > 0 && (
                <div className="ml-8">
                  <TruckSelector
                    trucks={savedRoutes}
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
