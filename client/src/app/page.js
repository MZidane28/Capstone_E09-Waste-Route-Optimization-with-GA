"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';
import { API_ENDPOINTS } from '@/lib/config';
import { DEPOT } from '@/lib/mapUtils'; // Import DEPOT constant
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import NavigationChunks from "@/components/NavigationChunks";
import TruckSelector from "@/components/TruckSelector";

export default function Home() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [showRoutes, setShowRoutes] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState({
    total: 0,
    needsCollection: 0,
    points: []
  });
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(1); // Default to Truck 1
  const [generatedRoutes, setGeneratedRoutes] = useState([]); // Store routes from MapComponent
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false); // Loading state for route generation
  const [trackingCreated, setTrackingCreated] = useState(false); // Track if assignments created

  // Fetch bins from database
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
        
        // Transform database bins to map format
        // Database schema: { bin_id, name, location: { lat, lon }, current_fill_ga, capacity, fill_rate, is_real }
        const points = bins.map(bin => {
          // Use current_fill_ga directly (no fallback to fill_rate)
          const currentFill = bin.current_fill_ga ?? 0;
          const capacity = bin.capacity || 100;
          const fillPercentage = Math.round((currentFill / capacity) * 100);
          
          return {
            id: bin.bin_id,
            lat: bin.location.lat,
            lng: bin.location.lon,
            fillLevel: fillPercentage,
            name: bin.name,
            isReal: bin.is_real || false // Mark real bins
          };
        });
        
        setCollectionPoints(points);
        
        const needsCollection = points.filter(point => point.fillLevel >= 80).length;
        const realBinCount = points.filter(point => point.isReal).length;
        setMapData({
          total: points.length,
          needsCollection,
          points
        });
        
        console.log(`Loaded ${points.length} bins from database (${realBinCount} real sensor bin${realBinCount !== 1 ? 's' : ''})`);
        console.log(`Bins needing collection: ${needsCollection}`);
        console.log(`Collection points array:`, points);
        setLoading(false);
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
          console.warn('Backend server offline. Please start server to view bins.');
        } else {
          console.error('Error loading bins:', error.message);
        }
        // Show empty map if server not available
        setLoading(false);
      }
    };

    fetchBins();
  }, []);

  // Load saved routes from localStorage on mount
  useEffect(() => {
    const savedRoutes = localStorage.getItem('beranda_routes');
    // Don't auto-restore showRoutes - let user click Show button
    // const savedShowRoutes = localStorage.getItem('beranda_showRoutes');
    const savedMapData = localStorage.getItem('beranda_mapData');
    const savedSelectedTruck = localStorage.getItem('beranda_selectedTruck');
    
    if (savedRoutes) {
      try {
        const routes = JSON.parse(savedRoutes);
        setGeneratedRoutes(routes);
        console.log('✅ Restored saved routes:', routes.length, 'trucks');
        console.log('   Click "Show" button to display routes on map');
      } catch (e) {
        console.error('Error parsing saved routes:', e);
        // Clear corrupted data
        localStorage.removeItem('beranda_routes');
      }
    }
    
    // Don't auto-show routes on refresh - prevents map initialization errors
    // User should click "Show" button to view routes
    
    if (savedMapData) {
      try {
        const mapDataParsed = JSON.parse(savedMapData);
        setMapData(mapDataParsed);
      } catch (e) {
        console.error('Error parsing saved map data:', e);
        localStorage.removeItem('beranda_mapData');
      }
    }
    
    if (savedSelectedTruck) {
      setSelectedTruckId(parseInt(savedSelectedTruck));
    }
  }, []);

  // Save routes to localStorage whenever they change
  useEffect(() => {
    if (generatedRoutes.length > 0) {
      localStorage.setItem('beranda_routes', JSON.stringify(generatedRoutes));
      console.log('Routes saved to localStorage');
    }
  }, [generatedRoutes]);

  // Save showRoutes state
  useEffect(() => {
    localStorage.setItem('beranda_showRoutes', showRoutes.toString());
  }, [showRoutes]);

  // Save mapData
  useEffect(() => {
    if (mapData.needsCollection > 0) {
      localStorage.setItem('beranda_mapData', JSON.stringify(mapData));
    }
  }, [mapData]);

  // Save selected truck
  useEffect(() => {
    if (selectedTruckId !== null && selectedTruckId !== undefined) {
      localStorage.setItem('beranda_selectedTruck', selectedTruckId.toString());
    }
  }, [selectedTruckId]);

  // Update waypoints when truck selection or routes change
  useEffect(() => {
    console.log('Waypoints effect triggered:', { showRoutes, selectedTruckId, routesCount: generatedRoutes.length });
    
    if (showRoutes && generatedRoutes.length > 0) {
      if (selectedTruckId !== null) {
        // Find the specific truck's route
        console.log('Looking for truck ID:', selectedTruckId);
        const selectedRoute = generatedRoutes.find(route => route.id === selectedTruckId);
        console.log('Found route:', selectedRoute ? `${selectedRoute.name} with ${selectedRoute.points.length} points` : 'NOT FOUND');
        
        if (selectedRoute && selectedRoute.points.length > 0) {
          // Convert points and bins to waypoints with full bin info
          const waypoints = selectedRoute.points.map((point, index) => {
            // First and last are depot
            if (index === 0 || index === selectedRoute.points.length - 1) {
              return {
                lat: point[0],
                lng: point[1],
                isDepot: true,
                name: index === 0 ? 'Start: Depot' : 'Finish: Depot'
              };
            }
            
            // Middle points are bins - get bin info
            const binIndex = index - 1; // Adjust for depot at start
            const binInfo = selectedRoute.bins && selectedRoute.bins[binIndex];
            
            return {
              lat: point[0],
              lng: point[1],
              isDepot: false,
              binId: binInfo?.id || `Bin ${index}`,
              name: binInfo?.name || `Bin ${index}`,
              fillLevel: binInfo?.fillLevel
            };
          });
          
          console.log('Setting waypoints with bin IDs:', waypoints);
          setRouteWaypoints(waypoints);
        } else {
          console.log('No waypoints - route not found or empty');
          setRouteWaypoints([]);
        }
      } else {
        console.log('No truck selected (null) - clearing waypoints');
        setRouteWaypoints([]);
      }
    } else {
      console.log('Routes not shown or no generated routes - clearing waypoints');
      setRouteWaypoints([]);
    }
  }, [showRoutes, selectedTruckId, generatedRoutes]);
  
  // createTruckAssignments function defined before useEffect
  const createTruckAssignments = async () => {
    try {
      // Create assignment for each truck
      const promises = generatedRoutes.map(async (route) => {
        // Use route.bins if available (contains full bin data with fillLevel)
        let binData;
        
        if (route.bins && route.bins.length > 0) {
          // New format: use full bin data
          binData = route.bins.map((bin, idx) => ({
            id: bin.id,
            name: `Bin ${idx + 1}`,
            latitude: bin.lat,
            longitude: bin.lng,
            fillLevel: bin.fillLevel
          }));
        } else {
          // Old format: use points (excluding depot start/end)
          const binPoints = route.points.slice(1, -1);
          binData = binPoints.map((point, idx) => ({
            id: `BIN${route.id}_${idx + 1}`,
            name: `Bin ${idx + 1}`,
            latitude: point[0],
            longitude: point[1],
            fillLevel: 0 // Default to 0% if no data available
          }));
        }
        
        console.log(`📦 Creating assignment for ${route.name}:`);
        console.log(`   Total bins to collect: ${binData.length}`);
        
        const truckData = {
          truckId: `TRUCK${route.id.toString().padStart(3, '0')}`,
          name: route.name,
          driverName: `Driver ${route.id}`,
          driverPhone: `081234567${route.id}`,
          route: binData
        };

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(API_ENDPOINTS.tracking.trucks, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok && response.status !== 200) {
            throw new Error('Failed to create truck assignment');
          }

          const result = await response.json();
          console.log(`${route.name}: ${result.totalBins} bins assigned`);
          
          return response.status === 201 ? 'created' : 'updated';
        } catch (fetchError) {
          if (fetchError.name === 'AbortError' || fetchError.message === 'Failed to fetch') {
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
        addNotification(`Truck assignments: ${message}!`, 'success');
      } else if (errors === 0) {
        setTrackingCreated(true);
      }
    } catch (error) {
      console.error('Error creating truck assignments:', error);
      addNotification('Backend server not available. Tracking features may be limited.', 'warning');
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
  
  const handleStart = async () => {
    console.log('🚀 Start button clicked - Running simulation...');
    
    setIsGeneratingRoutes(true);
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
        
        // Re-fetch bins to update UI with current fill levels
        const binsResponse = await fetch(API_ENDPOINTS.bins);
        if (binsResponse.ok) {
          const bins = await binsResponse.json();
          const points = bins.map(bin => ({
            id: bin.bin_id,
            lat: bin.location.lat,
            lng: bin.location.lon,
            fillLevel: Math.round((bin.current_fill_ga / bin.capacity) * 100),
            name: bin.name,
            isReal: bin.is_real || false
          }));
          setCollectionPoints(points);
          
          // Update mapData with current needs collection count
          const needsCollection = points.filter(point => point.fillLevel >= 80).length;
          setMapData(prev => ({
            ...prev,
            needsCollection,
            points
          }));
        }
        return;
      }
      
      // Validate binDetails
      const safeBinDetails = binDetails || {};
      
      // Helper function to get route color - expanded palette for many trucks
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
      
      // Transform backend routes to frontend format
      const transformedRoutes = solution.routes.map((route, index) => {
        // Use DEPOT constant from mapUtils for consistency
        const DEPOT_COORDS = [DEPOT.lat, DEPOT.lng];
        
        // Build points array: ensure depot -> bins -> depot structure
        let routePath = route.route || [];
        
        // VALIDATION: Ensure route starts and ends with depot
        const startsWithDepot = routePath[0] === 'depot';
        const endsWithDepot = routePath[routePath.length - 1] === 'depot';
        
        console.log(`🔍 Route ${route.truck_no} validation:`, {
          originalRoute: routePath,
          startsWithDepot,
          endsWithDepot,
          routeLength: routePath.length
        });
        
        // FIX: If route doesn't start/end with depot, add it
        if (!startsWithDepot) {
          console.warn(`⚠️ Route ${route.truck_no} doesn't start with depot - adding it`);
          routePath = ['depot', ...routePath];
        }
        if (!endsWithDepot) {
          console.warn(`⚠️ Route ${route.truck_no} doesn't end with depot - adding it`);
          routePath = [...routePath, 'depot'];
        }
        
        console.log(`✅ Fixed route ${route.truck_no}:`, routePath);
        
        // Build points array with coordinates
        const points = routePath.map(binId => {
          if (binId === 'depot') {
            return DEPOT_COORDS;
          }
          const binDetail = safeBinDetails[binId];
          if (binDetail) {
            return [binDetail.lat, binDetail.lng];
          }
          console.warn(`⚠️ Bin detail not found for: ${binId}`);
          return null;
        }).filter(p => p !== null);
        
        // FINAL VALIDATION: Ensure points array physically has depot coordinates
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const isFirstDepot = firstPoint && firstPoint[0] === DEPOT_COORDS[0] && firstPoint[1] === DEPOT_COORDS[1];
        const isLastDepot = lastPoint && lastPoint[0] === DEPOT_COORDS[0] && lastPoint[1] === DEPOT_COORDS[1];
        
        if (!isFirstDepot && points.length > 0) {
          console.warn(`⚠️ Points array doesn't start with depot coordinates - prepending`);
          points.unshift(DEPOT_COORDS);
        }
        if (!isLastDepot && points.length > 0) {
          console.warn(`⚠️ Points array doesn't end with depot coordinates - appending`);
          points.push(DEPOT_COORDS);
        }
        
        console.log(`📍 Route ${route.truck_no} points:`, {
          totalPoints: points.length,
          firstPoint: points[0],
          lastPoint: points[points.length - 1],
          depotCoords: DEPOT_COORDS,
          startsAtDepot: points[0] && points[0][0] === DEPOT_COORDS[0] && points[0][1] === DEPOT_COORDS[1],
          endsAtDepot: points[points.length - 1] && points[points.length - 1][0] === DEPOT_COORDS[0] && points[points.length - 1][1] === DEPOT_COORDS[1]
        });
        
        // Get bin objects for this route (excluding depot)
        const bins = routePath
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
      // Don't auto-show routes - let user click Show button
      // setShowRoutes(true);
      setSelectedTruckId(1); // Auto-select first truck
      
      addNotification(`✅ Routes generated! ${transformedRoutes.length} trucks assigned. Click "Show" to view routes.`, 'success');
      
      // Re-fetch bins to update fill levels in UI
      const binsResponse = await fetch(API_ENDPOINTS.bins);
      if (binsResponse.ok) {
        const bins = await binsResponse.json();
        const points = bins.map(bin => ({
          id: bin.bin_id,
          lat: bin.location.lat,
          lng: bin.location.lon,
          fillLevel: Math.round((bin.current_fill_ga / bin.capacity) * 100),
          name: bin.name,
          isReal: bin.is_real || false
        }));
        setCollectionPoints(points);
        
        // Update mapData with current needs collection count
        const needsCollection = points.filter(point => point.fillLevel >= 80).length;
        setMapData(prev => ({
          ...prev,
          needsCollection,
          points
        }));
      }
      
    } catch (error) {
      console.error('❌ Error running simulation:', error);
      addNotification('Failed to run simulation. Please check backend server.', 'error');
    } finally {
      setIsGeneratingRoutes(false);
    }
  };

  const handleTruckSelect = (truckId) => {
    console.log('Truck selected:', truckId, 'Type:', typeof truckId);
    console.log('Available routes:', generatedRoutes.map(r => ({ id: r.id, name: r.name })));
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
    localStorage.removeItem('beranda_routes');
    localStorage.removeItem('beranda_showRoutes');
    localStorage.removeItem('beranda_mapData');
    localStorage.removeItem('beranda_selectedTruck');
    
    addNotification('Routes and tracking data cleared successfully', 'success');
  };

  const handleToggleRoutes = () => {
    if (generatedRoutes.length === 0) {
      addNotification('⚠️ No routes generated yet. Click "Start" first!', 'warning');
      return;
    }
    setShowRoutes(!showRoutes);
  };

  const handleViewTracking = () => {
    router.push('/tracking');
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
        return {
          tujuan: selectedRoute.name,
          jarak: selectedRoute.totalDistance ? `${selectedRoute.totalDistance.toFixed(1)} Km` : `~${(selectedRoute.binCount * 0.4).toFixed(1)} Km`,
          estimasi: selectedRoute.totalTime ? `${Math.round(selectedRoute.totalTime)} menit` : `~${Math.round((selectedRoute.binCount * 0.4 / 30) * 60 + (selectedRoute.binCount * 2))} menit`,
          tongSampah: `${selectedRoute.binCount} tong sampah`
        };
      }
    }

    // Otherwise show overall statistics (all trucks)
    if (showRoutes && generatedRoutes.length > 0) {
      const totalDistance = generatedRoutes.reduce((sum, route) => 
        sum + (route.totalDistance || route.binCount * 0.4), 0);
      const totalTime = generatedRoutes.reduce((sum, route) => 
        sum + (route.totalTime || (route.binCount * 0.4 / 30) * 60 + (route.binCount * 2)), 0);
      const totalBins = generatedRoutes.reduce((sum, route) => sum + route.binCount, 0);
      
      return {
        tujuan: `${generatedRoutes.length} Trucks Aktif`,
        jarak: `${totalDistance.toFixed(1)} Km Total`,
        estimasi: `${Math.round(totalTime)} menit Total`,
        tongSampah: `${totalBins} tong sampah (${generatedRoutes.length} rute)`
      };
    }
    
    return {
      tujuan: showRoutes ? "Semua Truck Aktif" : "Menunggu",
      jarak: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 0.5).toFixed(1)} Km` : "0 Km",
      estimasi: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 2).toFixed(0)} menit` : "0 menit",
      tongSampah: `${mapData.needsCollection}/${mapData.total} (${((mapData.needsCollection/mapData.total) * 100).toFixed(1)}%)`
    };
  };

  const routeDetails = calculateRouteDetails();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bins data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black p-4">Beranda</h1>
        
        <div className="flex-1 px-4 space-y-4 pb-20">
          {/* Map Section */}
          {collectionPoints.length > 0 ? (
            <MapWrapper 
              showRoutes={showRoutes}
              useRealData={true}
              collectionPoints={collectionPoints}
              onDataChange={setMapData}
              selectedTruckId={selectedTruckId}
              onTruckSelect={handleTruckSelect}
              savedRoutes={generatedRoutes}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-black p-8 text-center">
              <p className="text-gray-500">No bins data available. Please ensure server is running.</p>
            </div>
          )}
          
          {/* Button Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-3">
              {isGeneratingRoutes ? (
                <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                    <span className="text-[8px] text-black font-semibold">Generating...</span>
                  </div>
                </div>
              ) : (
                <StartButton onClick={handleStart} />
              )}
              
              {/* Show/Hide Routes Button - Only show if routes are generated */}
              {generatedRoutes.length > 0 && !isGeneratingRoutes && (
                <button
                  onClick={handleToggleRoutes}
                  className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <div className="text-center">
                    <img 
                      src={showRoutes ? '/hide.svg' : '/show.svg'} 
                      alt={showRoutes ? 'Hide' : 'Show'}
                      className="w-12 h-12 mb-1 mx-auto"
                    />
                    <span className="text-xs text-black font-bold">{showRoutes ? 'Hide' : 'Show'}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Route Details Section */}
          <RouteDetails details={routeDetails} isMobile={true} />

          {/* Truck Selector - Mobile */}
          {showRoutes && generatedRoutes.length > 0 && (
            <TruckSelector
              trucks={generatedRoutes}
              selectedTruck={selectedTruckId}
              onSelect={handleTruckSelect}
            />
          )}

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
        <h1 className="text-3xl font-bold text-black">Beranda</h1>
        
        {/* Map Section */}
        {collectionPoints.length > 0 ? (
          <MapWrapper 
            showRoutes={showRoutes}
            useRealData={true}
            collectionPoints={collectionPoints}
            onDataChange={setMapData}
            selectedTruckId={selectedTruckId}
            onTruckSelect={handleTruckSelect}
            savedRoutes={generatedRoutes}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md border-2 border-black p-12 text-center">
            <p className="text-gray-500 text-lg">No bins data available. Please ensure server is running.</p>
          </div>
        )}
        
        {/* Details and Start Button Section */}
        <div className="flex items-center gap-4">
          {isGeneratingRoutes ? (
            <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <span className="text-xs text-black font-semibold">Generating...</span>
              </div>
            </div>
          ) : (
            <StartButton onClick={handleStart} />
          )}
          
          {/* Show/Hide Routes Button - Desktop */}
          {generatedRoutes.length > 0 && !isGeneratingRoutes && (
            <button
              onClick={handleToggleRoutes}
              className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center flex-shrink-0"
            >
              <div className="text-center">
                <img 
                  src={showRoutes ? '/hide.svg' : '/show.svg'} 
                  alt={showRoutes ? 'Hide' : 'Show'}
                  className="w-14 h-14 mb-1 mx-auto"
                />
                <span className="text-sm text-black font-bold">{showRoutes ? 'Hide' : 'Show'}</span>
              </div>
            </button>
          )}
          
          <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
            <RouteDetails details={routeDetails} />
          </div>
        </div>

        {/* Truck Selector - Desktop */}
        {showRoutes && generatedRoutes.length > 0 && (
          <TruckSelector
            trucks={generatedRoutes}
            selectedTruck={selectedTruckId}
            onSelect={handleTruckSelect}
          />
        )}

        {/* View Tracking Button - Desktop */}
        {showRoutes && trackingCreated && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleViewTracking}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-black flex items-center gap-3"
            >
              <span className="text-lg">View Live Tracking Dashboard</span>
              <span className="text-2xl">→</span>
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

