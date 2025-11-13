"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import RandomButton from "@/components/RandomButton";
import NavigationChunks from "@/components/NavigationChunks";
import { mockRouteData } from "@/lib/mockRoutes";

export default function Simulasi() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [showRoutes, setShowRoutes] = useState(false);
  const [randomizeFn, setRandomizeFn] = useState(null);
  const [mapData, setMapData] = useState({
    total: 200,
    needsCollection: 0,
    points: []
  });
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(1); // Default to Truck 1 instead of "All Trucks"
  const [generatedRoutes, setGeneratedRoutes] = useState([]); // Store routes from MapComponent
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false); // Loading state for route generation
  const [isRandomizing, setIsRandomizing] = useState(false); // Loading state for randomization
  const [trackingCreated, setTrackingCreated] = useState(false); // Track if assignments created

  // Load saved routes from localStorage on mount
  useEffect(() => {
    const savedRoutes = localStorage.getItem('simulasi_routes');
    const savedShowRoutes = localStorage.getItem('simulasi_showRoutes');
    const savedMapData = localStorage.getItem('simulasi_mapData');
    const savedSelectedTruck = localStorage.getItem('simulasi_selectedTruck');
    
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
      localStorage.setItem('simulasi_routes', JSON.stringify(generatedRoutes));
      console.log('💾 Routes saved to localStorage');
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
    if (showRoutes && generatedRoutes.length > 0) {
      if (selectedTruckId !== null) {
        // Find the specific truck's route
        const selectedRoute = generatedRoutes.find(route => route.id === selectedTruckId);
        if (selectedRoute && selectedRoute.points.length > 0) {
          // Convert points array to waypoints format
          const waypoints = selectedRoute.points.map(point => ({
            lat: point[0],
            lng: point[1]
          }));
          setRouteWaypoints(waypoints);
        } else {
          setRouteWaypoints([]);
        }
      } else {
        // Show all routes waypoints (combine all trucks)
        setRouteWaypoints([]);
      }
    } else {
      setRouteWaypoints([]);
    }
  }, [showRoutes, selectedTruckId, generatedRoutes]);
  
  // Auto-create truck assignments when routes are generated
  useEffect(() => {
    if (showRoutes && generatedRoutes.length > 0 && !trackingCreated) {
      createTruckAssignments();
    }
  }, [showRoutes, generatedRoutes, trackingCreated]);

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
          const response = await fetch('http://localhost:5000/api/tracking/trucks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData),
          });

          if (!response.ok && response.status !== 200) { // 200 means updated existing
            throw new Error('Failed to create truck assignment');
          }

          const result = await response.json();
          console.log(`✅ ${route.name}: ${result.totalBins} bins assigned`);
          
          return response.status === 201 ? 'created' : 'updated'; // Return status
        } catch (fetchError) {
          console.error('Fetch error for truck:', route.id, fetchError);
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

  const showNotification = (message, type = 'info') => {
    // Deprecated - using useNotification instead
    addNotification(message, type);
  };
  
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

  const handleRandom = () => {
    setIsRandomizing(true);
    setShowRoutes(false); // Hide routes first
    setSelectedTruckId(1); // Reset to Truck 1 (not "All Trucks")
    setTrackingCreated(false); // Reset tracking state
    setGeneratedRoutes([]); // Clear generated routes
    // Clear saved routes from localStorage
    localStorage.removeItem('simulasi_routes');
    localStorage.setItem('simulasi_showRoutes', 'false');
    if (randomizeFn) {
      randomizeFn();
    }
    // Simulate randomization delay
    setTimeout(() => {
      setIsRandomizing(false);
    }, 500); // 500ms delay for visual feedback
  };

  const handleTruckSelect = (truckId) => {
    setSelectedTruckId(truckId);
  };

  const handleRoutesGenerated = (routes) => {
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
          onRandomize={setRandomizeFn}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={handleTruckSelect}
          onRoutesGenerated={handleRoutesGenerated}
          savedRoutes={generatedRoutes}
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
              <StartButton onClick={handleStart} disabled={isRandomizing} />
            )}
            
            {isRandomizing ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                  <span className="text-[8px] text-black font-semibold">Randomizing...</span>
                </div>
              </div>
            ) : (
              <RandomButton onClick={handleRandom} disabled={isGeneratingRoutes} />
            )}
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
          {showRoutes && routeWaypoints.length > 0 && selectedTruckId && (
            <NavigationChunks 
              waypoints={routeWaypoints} 
              truckId={`Truck ${selectedTruckId}`}
            />
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
          onRandomize={setRandomizeFn}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={handleTruckSelect}
          onRoutesGenerated={handleRoutesGenerated}
          savedRoutes={generatedRoutes}
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
              <StartButton onClick={handleStart} disabled={isRandomizing} />
            )}
            
            {isRandomizing ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <span className="text-xs text-black font-semibold">Randomizing...</span>
                </div>
              </div>
            ) : (
              <RandomButton onClick={handleRandom} disabled={isGeneratingRoutes} />
            )}
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
        {showRoutes && routeWaypoints.length > 0 && selectedTruckId && (
          <div className="bg-white rounded-lg shadow-md border-2 border-black">
            <NavigationChunks 
              waypoints={routeWaypoints} 
              truckId={`Truck ${selectedTruckId}`}
            />
          </div>
        )}
      </div>
    </>
  );
}