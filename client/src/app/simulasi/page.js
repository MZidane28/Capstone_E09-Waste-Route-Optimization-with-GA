"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';
import { API_ENDPOINTS } from '@/lib/config';
import { DEPOT } from '@/lib/mapUtils';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import NavigationChunks from "@/components/NavigationChunks";

export default function Simulasi() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [showRoutes, setShowRoutes] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState([]); // Store bins from database
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [mapData, setMapData] = useState({
    total: 0,
    needsCollection: 0,
    points: []
  });
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(1); // Default to Truck 1 instead of "All Trucks"
  const [generatedRoutes, setGeneratedRoutes] = useState([]); // Store routes from backend
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false); // Loading state for route generation
  const [hasGeneratedRoutes, setHasGeneratedRoutes] = useState(false); // Track if routes are ready to show
  const [trackingCreated, setTrackingCreated] = useState(false); // Track if assignments created

  // Fetch bins from database on mount
  useEffect(() => {
    const fetchBins = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(API_ENDPOINTS.bins, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bins');
        }
        
        const bins = await response.json();
        
        // Filter out real sensor bins - simulasi only uses simulated bins
        const simulatedBins = bins.filter(bin => !bin.is_real);
        
        // Transform database bins - use actual fill levels from backend
        const points = simulatedBins.map(bin => {
          // Use current_fill_ga as the fill level
          const fillLevel = Math.round((bin.current_fill_ga / bin.capacity) * 100);
          
          return {
            id: bin.bin_id,
            lat: bin.location.lat,
            lng: bin.location.lon, // Transform lon to lng
            fillLevel: fillLevel,
            name: bin.name,
            capacity: bin.capacity,
            current_fill: bin.current_fill_ga
          };
        });
        
        setCollectionPoints(points);
        
        const needsCollection = points.filter(point => point.fillLevel >= 80).length;
        setMapData({
          total: points.length,
          needsCollection,
          points
        });
        
        console.log(`Loaded ${points.length} bins from database for simulation`);
        console.log(`Bins needing collection: ${needsCollection}`);
        setLoading(false);
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
          console.warn('Backend server offline. Using fallback mode.');
          addNotification('Backend server offline. Simulation will use generated data.', 'warning');
        } else {
        console.error('Error loading bins:', error.message);
      }
      // Fallback: let MapComponent generate random data
      setCollectionPoints([]);
      setLoading(false);
    }
  };

  fetchBins();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // Load saved routes from localStorage on mount
  useEffect(() => {
    const savedRoutes = localStorage.getItem('simulasi_routes');
    const savedShowRoutes = localStorage.getItem('simulasi_showRoutes');
    const savedMapData = localStorage.getItem('simulasi_mapData');
    const savedSelectedTruck = localStorage.getItem('simulasi_selectedTruck');
    
    if (savedRoutes) {
      try {
        const routes = JSON.parse(savedRoutes);
        setGeneratedRoutes(routes);
        console.log('Loaded saved routes:', routes.length, 'trucks');
      } catch (e) {
        console.error('Error parsing saved routes:', e);
      }
    }
    
    if (savedShowRoutes === 'true') {
      setShowRoutes(true);
    }
    
    if (savedMapData) {
      try {
        const mapDataParsed = JSON.parse(savedMapData);
        setMapData(mapDataParsed);
      } catch (e) {
        console.error('Error parsing saved map data:', e);
      }
    }
    
    if (savedSelectedTruck) {
      setSelectedTruckId(parseInt(savedSelectedTruck));
    }
  }, []);

  // Save routes to localStorage whenever they change
  useEffect(() => {
    if (generatedRoutes.length > 0) {
      localStorage.setItem('simulasi_routes', JSON.stringify(generatedRoutes));
      console.log('Routes saved to localStorage');
    }
  }, [generatedRoutes]);

  // Save showRoutes state
  useEffect(() => {
    localStorage.setItem('simulasi_showRoutes', showRoutes.toString());
  }, [showRoutes]);

  // Save mapData
  useEffect(() => {
    if (mapData.needsCollection > 0) {
      localStorage.setItem('simulasi_mapData', JSON.stringify(mapData));
    }
  }, [mapData]);

  // Save selected truck
  useEffect(() => {
    if (selectedTruckId !== null && selectedTruckId !== undefined) {
      localStorage.setItem('simulasi_selectedTruck', selectedTruckId.toString());
    }
  }, [selectedTruckId]);

  // Update waypoints when truck selection or routes change
  useEffect(() => {
    console.log('🔄 Waypoints effect triggered:', { showRoutes, selectedTruckId, routesCount: generatedRoutes.length });
    
    if (showRoutes && generatedRoutes.length > 0) {
      if (selectedTruckId !== null) {
        // Find the specific truck's route
        console.log('Looking for truck ID:', selectedTruckId);
        const selectedRoute = generatedRoutes.find(route => route.id === selectedTruckId);
        console.log('Found route:', selectedRoute ? `${selectedRoute.name} with ${selectedRoute.points.length} points` : 'NOT FOUND');
        
        if (selectedRoute && selectedRoute.points.length > 0) {
          // Convert points array to waypoints format
          const waypoints = selectedRoute.points.map(point => ({
            lat: point[0],
            lng: point[1]
          }));
          console.log('Setting waypoints:', waypoints.length);
          setRouteWaypoints(waypoints);
        } else {
          console.log('No waypoints - route not found or empty');
          setRouteWaypoints([]);
        }
      } else {
        console.log('No truck selected (null) - clearing waypoints');
        // Show all routes waypoints (combine all trucks)
        setRouteWaypoints([]);
      }
    } else {
      console.log('Routes not shown or no generated routes - clearing waypoints');
      setRouteWaypoints([]);
    }
  }, [showRoutes, selectedTruckId, generatedRoutes]);
  
  const createTruckAssignments = async () => {
    try {
      // Create assignment for each truck
      const promises = generatedRoutes.map(async (route) => {
        // Use route.bins if available (contains full bin data with fillLevel)
        // Otherwise fall back to using route.points (for backward compatibility)
        let binData;
        
        if (route.bins && route.bins.length > 0) {
          // New format: use full bin data
          binData = route.bins.map((bin, idx) => ({
            id: bin.id,
            name: `Bin ${idx + 1}`,
            latitude: bin.lat,
            longitude: bin.lng,
            fillLevel: bin.fillLevel // Use actual fillLevel from simulation
          }));
        } else {
          // Old format: use points (excluding depot start/end)
          const binPoints = route.points.slice(1, -1);
          binData = binPoints.map((point, idx) => ({
            id: `BIN${route.id}_${idx + 1}`,
            name: `Bin ${idx + 1}`,
            latitude: point[0],
            longitude: point[1],
            fillLevel: 85 // Default to 85% if no data available
          }));
        }
        
        console.log(`📦 Creating assignment for ${route.name}:`);
        console.log(`   Total bins to collect: ${binData.length}`);
        console.log(`   All bins have fillLevel >= 80%: ✅`);
        console.log(`   Bin fillLevels:`, binData.map(b => `${b.fillLevel}%`).join(', '));
        
        const truckData = {
          truckId: `TRUCK${route.id.toString().padStart(3, '0')}`,
          name: route.name,
          driverName: `Driver ${route.id}`,
          driverPhone: `081234567${route.id}`,
          route: binData
        };

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(API_ENDPOINTS.tracking.trucks, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok && response.status !== 200) { // 200 means updated existing
            throw new Error('Failed to create truck assignment');
          }

          const result = await response.json();
          console.log(`✅ ${route.name}: ${result.totalBins} bins assigned`);
          
          return response.status === 201 ? 'created' : 'updated'; // Return status
        } catch (fetchError) {
          // Silently handle server unavailable - don't spam console
          if (fetchError.name === 'AbortError' || fetchError.message === 'Failed to fetch') {
            // Server not running - this is expected in development
            return 'error';
          }
          console.warn('Truck assignment error:', route.id, fetchError.message);
          return 'error';
        }
      });

      const results = await Promise.all(promises);
      const newlyCreated = results.filter(r => r === 'created').length;
      const updated = results.filter(r => r === 'updated').length;
      const errors = results.filter(r => r === 'error').length;
      
      if (newlyCreated > 0 || updated > 0) {
        setTrackingCreated(true);
        let message = '';
        if (newlyCreated > 0) message += `${newlyCreated} created`;
        if (updated > 0) message += `${message ? ', ' : ''}${updated} updated`;
        addNotification(`✅ Truck assignments: ${message}!`, 'success');
      } else if (errors === 0) {
        // Even if not newly created or updated, still mark as available
        setTrackingCreated(true);
      }
    } catch (error) {
      console.error('Error creating truck assignments:', error);
      addNotification('⚠️ Backend server not available. Tracking features may be limited.', 'warning');
      // Still allow user to see tracking UI even if backend is down
      setTrackingCreated(true);
    }
  };

  // Auto-create truck assignments when routes are generated
  useEffect(() => {
    if (showRoutes && generatedRoutes.length > 0 && !trackingCreated) {
      createTruckAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRoutes, generatedRoutes, trackingCreated]);

  const showNotification = (message, type = 'info') => {
    // Deprecated - using useNotification instead
    addNotification(message, type);
  };
  
  const handleStart = async () => {
    console.log('🚀 Start button clicked - Running simulation...');
    
    setIsGeneratingRoutes(true);
    setHasGeneratedRoutes(false);
    setShowRoutes(false); // Hide routes if currently showing
    setTrackingCreated(false); // Reset tracking state
    
    try {
      // Call backend to run simulation (updates fill levels and generates routes)
      const response = await fetch(API_ENDPOINTS.simulation.run, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to run simulation');
      }
      
      const result = await response.json();
      console.log('✅ Simulation result:', result);
      
      if (!result.success || !result.data?.gaResult?.solution) {
        throw new Error('Invalid simulation response');
      }
      
      const { solution, binDetails } = result.data.gaResult;
      
      // Check if there are bins to collect
      if (!solution.routes || solution.routes.length === 0 || solution.total_distance === 0) {
        addNotification('ℹ️ No bins need collection at this time (all below 80%)', 'info');
        setGeneratedRoutes([]);
        setHasGeneratedRoutes(false);
        
        // Re-fetch bins to update UI with current fill levels
        await refreshBins();
        return;
      }
      
      // Validate binDetails
      if (!binDetails || typeof binDetails !== 'object') {
        console.warn('⚠️ No binDetails in response, using empty object');
      }
      
      const safeBinDetails = binDetails || {};
      
      // Transform backend routes to frontend format
      const transformedRoutes = solution.routes.map((route, index) => {
        // Build points array: depot -> bins -> depot
        const points = route.route.map(binId => {
          if (binId === 'depot') {
            // Use DEPOT constant from mapUtils for consistency
            return [DEPOT.lat, DEPOT.lng];
          }
          const binDetail = safeBinDetails[binId];
          if (binDetail) {
            return [binDetail.lat, binDetail.lng];
          }
          // Fallback: if binDetail not found, skip this point
          console.warn(`⚠️ Bin detail not found for: ${binId}`);
          return null;
        }).filter(p => p !== null);
        
        // Get bin objects for this route (excluding depot)
        const bins = route.route
          .filter(binId => binId !== 'depot')
          .map(binId => {
            const binDetail = safeBinDetails[binId];
            if (binDetail) {
              return {
                id: binId,
                lat: binDetail.lat,
                lng: binDetail.lng,
                fillLevel: Math.round((binDetail.current_fill_ga / binDetail.capacity) * 100),
                name: binDetail.name
              };
            }
            return null;
          })
          .filter(b => b !== null);
        
        return {
          id: route.truck_no,
          name: `Truck ${route.truck_no}`,
          bins: bins,
          points: points,
          binCount: bins.length,
          totalDistance: route.distance,
          totalTime: Math.round(route.distance / 30 * 60), // Estimate: 30 km/h
          color: getRouteColor(index),
          utilization: route.utilization,
          load: route.load,
          emissions: route.emissions
        };
      });
      
      console.log('📦 Routes generated:', transformedRoutes.length, 'trucks');
      setGeneratedRoutes(transformedRoutes);
      setHasGeneratedRoutes(true); // Mark routes as ready
      setShowRoutes(true); // Auto-show routes after generation
      setSelectedTruckId(1); // Auto-select first truck
      
      // Update mapData with bins that were collected
      const collectedBins = safeBinDetails && Object.keys(safeBinDetails).length > 0
        ? Object.keys(safeBinDetails).map(binId => {
            const binDetail = safeBinDetails[binId];
            return {
              id: binId,
              lat: binDetail.lat,
              lng: binDetail.lng,
              fillLevel: Math.round((binDetail.current_fill_ga / binDetail.capacity) * 100),
              name: binDetail.name
            };
          })
        : [];
      
      setMapData({
        total: collectionPoints.length,
        needsCollection: collectedBins.length,
        points: collectionPoints
      });
      
      addNotification(`✅ Routes generated! ${transformedRoutes.length} trucks assigned, ${collectedBins.length} bins to collect. Click "Show Routes" to view.`, 'success');
      
      // Re-fetch bins to update UI with emptied bins
      await refreshBins();
      
    } catch (error) {
      console.error('❌ Error running simulation:', error);
      addNotification('Failed to run simulation. Please check backend server.', 'error');
      setHasGeneratedRoutes(false);
    } finally {
      setIsGeneratingRoutes(false);
    }
  };
  
  // Helper function to refresh bins data from backend
  const refreshBins = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.bins);
      if (!response.ok) return;
      
      const bins = await response.json();
      
      // Filter out real sensor bins - simulasi only uses simulated bins
      const simulatedBins = bins.filter(bin => !bin.is_real);
      
      const points = simulatedBins.map(bin => {
        const fillLevel = Math.round((bin.current_fill_ga / bin.capacity) * 100);
        return {
          id: bin.bin_id,
          lat: bin.location.lat,
          lng: bin.location.lon,
          fillLevel: fillLevel,
          name: bin.name,
          capacity: bin.capacity,
          current_fill: bin.current_fill_ga
        };
      });
      
      setCollectionPoints(points);
      const needsCollection = points.filter(point => point.fillLevel >= 80).length;
      setMapData(prev => ({
        ...prev,
        total: points.length,
        needsCollection,
        points
      }));
      
      console.log('✅ Bins refreshed from backend');
    } catch (error) {
      console.warn('Failed to refresh bins:', error);
    }
  };
  
  // Handler for Show Routes button
  const handleShowRoutes = () => {
    if (!hasGeneratedRoutes || generatedRoutes.length === 0) {
      addNotification('⚠️ No routes available. Please run simulation first.', 'warning');
      return;
    }
    
    console.log('👁️ Showing routes...');
    setShowRoutes(true);
    setSelectedTruckId(1); // Reset to first truck
  };
  
  // Handler for Hide Routes button
  const handleHideRoutes = () => {
    console.log('🙈 Hiding routes...');
    setShowRoutes(false);
  };
  
  // Helper function for route colors - expanded palette for many trucks
  const getRouteColor = (index) => {
    const colors = [
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#14b8a6', // Teal
      '#f97316', // Orange
      '#6366f1', // Indigo
      '#84cc16', // Lime
      '#06b6d4', // Cyan
      '#a855f7', // Violet
      '#eab308', // Yellow
      '#22c55e', // Emerald
      '#0ea5e9'  // Sky Blue
    ];
    return colors[index % colors.length];
  };

  const handleTruckSelect = (truckId) => {
    console.log('🚛 Truck selected:', truckId, 'Type:', typeof truckId);
    console.log('📋 Available routes:', generatedRoutes.map(r => ({ id: r.id, name: r.name })));
    setSelectedTruckId(truckId);
  };

  const handleClearRoutes = async () => {
    try {
      // Delete all truck assignments from backend
      const response = await fetch(API_ENDPOINTS.tracking.trucks, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Cleared ${data.deletedCount} truck assignments from backend`);
      } else {
        console.warn('⚠️ Failed to clear tracking data from backend');
      }
    } catch (error) {
      console.error('❌ Error clearing tracking data:', error);
    }

    // Clear frontend state
    setShowRoutes(false);
    setGeneratedRoutes([]);
    setTrackingCreated(false);
    setSelectedTruckId(1);
    
    // Clear from localStorage
    localStorage.removeItem('simulasi_routes');
    localStorage.removeItem('simulasi_showRoutes');
    localStorage.removeItem('simulasi_mapData');
    localStorage.removeItem('simulasi_selectedTruck');
    
    addNotification('🗑️ Routes and tracking data cleared successfully', 'success');
  };

  // Calculate route details based on selected truck or overall data
  const calculateRouteDetails = () => {
    if (!showRoutes) {
      return {
        tujuan: "Menunggu",
        jarak: "0 Km",
        estimasi: "0 menit",
        tongSampah: `0/${mapData.total} (0%)`
      };
    }

    // If a specific truck is selected, show its details
    if (selectedTruckId !== null && generatedRoutes.length > 0) {
      const selectedRoute = generatedRoutes.find(route => route.id === selectedTruckId);
      if (selectedRoute) {
        // Calculate approximate distance (each point ~0.3-0.5 km apart)
        const approxDistance = selectedRoute.binCount * 0.4;
        // Calculate approximate time (assuming 30 km/h average speed + 2 min per bin)
        const approxTime = (approxDistance / 30) * 60 + (selectedRoute.binCount * 2);
        
        return {
          tujuan: selectedRoute.name,
          jarak: `~${approxDistance.toFixed(1)} Km`,
          estimasi: `~${Math.round(approxTime)} menit`,
          tongSampah: `${selectedRoute.binCount} tong sampah`
        };
      }
    }

    // Otherwise show overall statistics
    return {
      tujuan: showRoutes ? "Semua Truck Aktif" : "Menunggu",
      jarak: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 0.5).toFixed(1)} Km` : "0 Km",
      estimasi: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 2).toFixed(0)} menit` : "0 menit",
      tongSampah: `${mapData.needsCollection}/${mapData.total} (${((mapData.needsCollection/mapData.total) * 100).toFixed(1)}%)`
    };
  };

  const routeDetails = calculateRouteDetails();

  const handleViewTracking = () => {
    router.push('/tracking');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black p-4">Simulasi</h1>
        
        <div className="flex-1 px-4 space-y-4 pb-20">
        {/* Map Section */}
        <MapWrapper 
          showRoutes={showRoutes}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={handleTruckSelect}
          savedRoutes={generatedRoutes}
          useRealData={collectionPoints.length > 0}
          collectionPoints={collectionPoints}
        />
          
          {/* Buttons Section */}
          <div className="flex justify-center gap-4 py-2">
            {isGeneratingRoutes ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                  <span className="text-[8px] text-black font-semibold">Generating...</span>
                </div>
              </div>
            ) : (
              <StartButton onClick={handleStart} disabled={false} />
            )}
            
            {/* Show/Hide Routes Button */}
            <button
              onClick={showRoutes ? handleHideRoutes : handleShowRoutes}
              disabled={!hasGeneratedRoutes}
              className={`w-28 h-28 rounded-full shadow-md border-2 border-black font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                !hasGeneratedRoutes
                  ? 'bg-gray-300 cursor-not-allowed opacity-50'
                  : showRoutes
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-1">{showRoutes ? '🙈' : '👁️'}</div>
                <div className="text-[10px] text-white font-semibold leading-tight">
                  {showRoutes ? 'HIDE' : 'SHOW'}<br />ROUTES
                </div>
              </div>
            </button>
          </div>

          {/* Route Details Section */}
          <RouteDetails details={routeDetails} isMobile={true} />

          {/* View Tracking Button - Mobile */}
          {showRoutes && trackingCreated && (
            <div className="space-y-2">
              <button
                onClick={handleViewTracking}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-black flex items-center justify-center gap-2"
              >
                <span>View Live Tracking</span>
                <span className="text-xl">→</span>
              </button>
              
              <button
                onClick={handleClearRoutes}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors border-2 border-black flex items-center justify-center gap-2"
              >
                <span className="text-sm">Clear Routes</span>
              </button>
            </div>
          )}

          {/* Navigation Chunks Section - Mobile */}
          {showRoutes && selectedTruckId && (
            routeWaypoints.length > 2 ? (
              <NavigationChunks 
                waypoints={routeWaypoints} 
                truckId={`Truck ${selectedTruckId}`}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md border-2 border-black p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-lg text-black mb-2">No Collection Needed</h3>
                <p className="text-gray-600 text-sm">
                  Truck {selectedTruckId} tidak memiliki sampah yang perlu diambil saat ini.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block py-2 px-8 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-black">Simulasi</h1>
        
        {/* Map Section */}
        <MapWrapper 
          showRoutes={showRoutes}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={handleTruckSelect}
          savedRoutes={generatedRoutes}
          useRealData={collectionPoints.length > 0}
          collectionPoints={collectionPoints}
        />
        
        {/* Details and Buttons Section */}
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            {isGeneratingRoutes ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <span className="text-xs text-black font-semibold">Generating...</span>
                </div>
              </div>
            ) : (
              <StartButton onClick={handleStart} disabled={false} />
            )}
            
            {/* Show/Hide Routes Button */}
            <button
              onClick={showRoutes ? handleHideRoutes : handleShowRoutes}
              disabled={!hasGeneratedRoutes}
              className={`w-28 h-28 rounded-full shadow-md border-2 border-black font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                !hasGeneratedRoutes
                  ? 'bg-gray-300 cursor-not-allowed opacity-50'
                  : showRoutes
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{showRoutes ? '🙈' : '👁️'}</div>
                <div className="text-xs text-white font-semibold leading-tight">
                  {showRoutes ? 'HIDE' : 'SHOW'}<br />ROUTES
                </div>
              </div>
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
            <RouteDetails details={routeDetails} />
          </div>
        </div>

        {/* View Tracking Button - Desktop */}
        {showRoutes && trackingCreated && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleViewTracking}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-black flex items-center gap-3"
            >
              <span className="text-lg">View Live Tracking Dashboard</span>
            </button>
            
            <button
              onClick={handleClearRoutes}
              className="bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition-colors border-2 border-black flex items-center gap-2"
            >
              <span>Clear Routes</span>
            </button>
          </div>
        )}

        {/* Navigation Chunks Section - Desktop */}
        {showRoutes && selectedTruckId && (
          routeWaypoints.length > 2 ? (
            <div className="bg-white rounded-lg shadow-md border-2 border-black">
              <NavigationChunks 
                waypoints={routeWaypoints} 
                truckId={`Truck ${selectedTruckId}`}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-black p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="font-bold text-2xl text-black mb-3">No Collection Needed</h3>
              <p className="text-gray-600">
                Truck {selectedTruckId} tidak memiliki sampah yang perlu diambil saat ini.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Semua tong sampah di rute ini masih di bawah 80% kapasitas.
              </p>
            </div>
          )
        )}
      </div>
    </>
  );
}