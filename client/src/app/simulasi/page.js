"use client";
import { useState, useEffect } from 'react';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import RandomButton from "@/components/RandomButton";
import NavigationChunks from "@/components/NavigationChunks";
import { mockRouteData } from "@/lib/mockRoutes";

export default function Simulasi() {
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
  
  const handleStart = () => {
    setIsGeneratingRoutes(true);
    // Simulate route generation delay
    setTimeout(() => {
      setShowRoutes(true);
      setIsGeneratingRoutes(false);
    }, 800); // 800ms delay for visual feedback
  };

  const handleRandom = () => {
    setIsRandomizing(true);
    setShowRoutes(false); // Hide routes first
    setSelectedTruckId(1); // Reset to Truck 1 (not "All Trucks")
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