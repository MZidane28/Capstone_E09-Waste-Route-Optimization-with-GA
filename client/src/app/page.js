"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';
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
        
        const response = await fetch('http://localhost:5000/api/v1/bins', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bins');
        }
        
        const bins = await response.json();
        
        // Transform database bins to map format
        // Database schema: { bin_id, name, location: { lat, lon }, current_fill_ga, capacity, fill_rate }
        const points = bins.map(bin => {
          // Try current_fill_ga first, fallback to fill_rate, then default to 0
          const currentFill = bin.current_fill_ga || bin.fill_rate || 0;
          const capacity = bin.capacity || 100;
          const fillPercentage = Math.round((currentFill / capacity) * 100);
          
          console.log(`🗑️ Bin ${bin.bin_id}: ${bin.name} - Fill: ${currentFill}/${capacity} = ${fillPercentage}%`);
          
          return {
            id: bin.bin_id,
            lat: bin.location.lat,
            lng: bin.location.lon,
            fillLevel: fillPercentage,
            name: bin.name
          };
        });
        
        setCollectionPoints(points);
        
        const needsCollection = points.filter(point => point.fillLevel >= 80).length;
        setMapData({
          total: points.length,
          needsCollection,
          points
        });
        
        console.log(`✅ Loaded ${points.length} bins from database`);
        console.log(`📊 Bins needing collection: ${needsCollection}`);
        console.log(`📍 Collection points array:`, points);
        setLoading(false);
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
          console.warn('⚠️ Backend server offline. Please start server to view bins.');
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
    const savedShowRoutes = localStorage.getItem('beranda_showRoutes');
    const savedMapData = localStorage.getItem('beranda_mapData');
    const savedSelectedTruck = localStorage.getItem('beranda_selectedTruck');
    
    if (savedRoutes) {
      try {
        const routes = JSON.parse(savedRoutes);
        setGeneratedRoutes(routes);
        console.log('📦 Loaded saved routes:', routes.length, 'trucks');
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
      localStorage.setItem('beranda_routes', JSON.stringify(generatedRoutes));
      console.log('💾 Routes saved to localStorage');
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
    console.log('🔄 Waypoints effect triggered:', { showRoutes, selectedTruckId, routesCount: generatedRoutes.length });
    
    if (showRoutes && generatedRoutes.length > 0) {
      if (selectedTruckId !== null) {
        // Find the specific truck's route
        console.log('🔍 Looking for truck ID:', selectedTruckId);
        const selectedRoute = generatedRoutes.find(route => route.id === selectedTruckId);
        console.log('🎯 Found route:', selectedRoute ? `${selectedRoute.name} with ${selectedRoute.points.length} points` : 'NOT FOUND');
        
        if (selectedRoute && selectedRoute.points.length > 0) {
          // Convert points array to waypoints format
          const waypoints = selectedRoute.points.map(point => ({
            lat: point[0],
            lng: point[1]
          }));
          console.log('✅ Setting waypoints:', waypoints.length);
          setRouteWaypoints(waypoints);
        } else {
          console.log('⚠️ No waypoints - route not found or empty');
          setRouteWaypoints([]);
        }
      } else {
        console.log('ℹ️ No truck selected (null) - clearing waypoints');
        setRouteWaypoints([]);
      }
    } else {
      console.log('ℹ️ Routes not shown or no generated routes - clearing waypoints');
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
            fillLevel: 85 // Default to 85% if no data available
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
          
          const response = await fetch('http://localhost:5000/api/tracking/trucks', {
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
          console.log(`✅ ${route.name}: ${result.totalBins} bins assigned`);
          
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
        addNotification(`✅ Truck assignments: ${message}!`, 'success');
      } else if (errors === 0) {
        setTrackingCreated(true);
      }
    } catch (error) {
      console.error('Error creating truck assignments:', error);
      addNotification('⚠️ Backend server not available. Tracking features may be limited.', 'warning');
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
  
  const handleStart = () => {
    console.log('🚀 Start button clicked');
    console.log('   Current generatedRoutes:', generatedRoutes.length);
    console.log('   Current showRoutes:', showRoutes);
    
    setIsGeneratingRoutes(true);
    setTrackingCreated(false); // Reset tracking state
    // Simulate route generation delay
    setTimeout(() => {
      console.log('✅ Setting showRoutes to true');
      setShowRoutes(true);
      setIsGeneratingRoutes(false);
    }, 800); // 800ms delay for visual feedback
  };

  const handleTruckSelect = (truckId) => {
    console.log('🚛 Truck selected:', truckId, 'Type:', typeof truckId);
    console.log('📋 Available routes:', generatedRoutes.map(r => ({ id: r.id, name: r.name })));
    setSelectedTruckId(truckId);
  };

  const handleRoutesGenerated = (routes) => {
    console.log('📦 Routes generated:', routes.length, 'routes');
    routes.forEach(route => {
      console.log(`  - Route ${route.id}: ${route.name}, ${route.binCount} bins, ${route.points.length} waypoints`);
    });
    setGeneratedRoutes(routes);
  };

  const handleClearRoutes = async () => {
    try {
      // Delete all truck assignments from backend
      const response = await fetch('http://localhost:5000/api/tracking/trucks', {
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
    
    addNotification('🗑️ Routes and tracking data cleared successfully', 'success');
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

    // Otherwise show overall statistics
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
              onRoutesGenerated={handleRoutesGenerated}
              savedRoutes={generatedRoutes}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-black p-8 text-center">
              <p className="text-gray-500">No bins data available. Please ensure server is running.</p>
            </div>
          )}
          
          {/* Button Section */}
          <div className="flex justify-center">
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
          </div>

          {/* Route Details Section */}
          <RouteDetails details={routeDetails} isMobile={true} />

          {/* Truck Selector - Mobile */}
          {showRoutes && generatedRoutes.length > 0 && (
            <TruckSelector
              trucks={generatedRoutes}
              selectedTruckId={selectedTruckId}
              onSelectTruck={handleTruckSelect}
            />
          )}

          {/* View Tracking Button - Mobile */}
          {showRoutes && trackingCreated && (
            <div className="space-y-2">
              <button
                onClick={handleViewTracking}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-black flex items-center justify-center gap-2"
              >
                <span className="text-xl">📍</span>
                <span>View Live Tracking</span>
                <span className="text-xl">→</span>
              </button>
              
              <button
                onClick={handleClearRoutes}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors border-2 border-black flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
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
            onRoutesGenerated={handleRoutesGenerated}
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
          <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
            <RouteDetails details={routeDetails} />
          </div>
        </div>

        {/* Truck Selector - Desktop */}
        {showRoutes && generatedRoutes.length > 0 && (
          <TruckSelector
            trucks={generatedRoutes}
            selectedTruckId={selectedTruckId}
            onSelectTruck={handleTruckSelect}
          />
        )}

        {/* View Tracking Button - Desktop */}
        {showRoutes && trackingCreated && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleViewTracking}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-black flex items-center gap-3"
            >
              <span className="text-2xl">📍</span>
              <span className="text-lg">View Live Tracking Dashboard</span>
              <span className="text-2xl">→</span>
            </button>
            
            <button
              onClick={handleClearRoutes}
              className="bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition-colors border-2 border-black flex items-center gap-2"
            >
              <span className="text-xl">🗑️</span>
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

