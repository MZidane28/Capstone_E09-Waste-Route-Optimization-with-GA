"use client";
import { useState } from 'react';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import NavigationChunks from "@/components/NavigationChunks";
import { generateMockRoutes, SOURCE_POINTS } from "@/lib/mapUtils";

export default function Home() {
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [mapData, setMapData] = useState({
    total: 200,
    needsCollection: 0,
    points: []
  });

  // Calculate route waypoints when routes are shown
  const routeWaypoints = (() => {
    if (!showRoutes || mapData.points.length === 0) return [];
    
    const routes = generateMockRoutes(SOURCE_POINTS, mapData.points);
    let selectedRoute;
    
    if (selectedTruckId) {
      selectedRoute = routes.find(route => route.id.toString() === selectedTruckId);
      console.log('Selected truck:', selectedTruckId, 'Found route:', selectedRoute); // Debug log
    } else {
      selectedRoute = routes[0];
    }
    
    if (!selectedRoute) {
      console.log('No route found for truck:', selectedTruckId); // Debug log
      return [];
    }
    
    return selectedRoute.points.map(([lat, lng]) => ({ lat, lng }));
  })();
  
  const handleStart = () => {
    setShowRoutes(true);
  };

  const routeDetails = {
    tujuan: "3 Truck",
    jarak: "127.5 Km",
    estimasi: "4.2 Jam",
    tongSampah: `${mapData.needsCollection}/${mapData.total}`
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black p-4">Beranda</h1>
        
        <div className="flex-1 px-4 space-y-4 pb-20">
          {/* Map Section */}
          <MapWrapper 
            showRoutes={showRoutes}
            onDataChange={setMapData}
            selectedTruckId={selectedTruckId}
            onTruckSelect={setSelectedTruckId}
          />
          
          {/* Button Section */}
          <div className="flex justify-center">
            <StartButton onClick={handleStart} />
          </div>

          {/* Route Details Section */}
          <RouteDetails details={routeDetails} isMobile={true} />

          {/* Navigation Section */}
          {showRoutes && routeWaypoints.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border-2 border-black">
              <NavigationChunks 
                waypoints={routeWaypoints} 
                truckId={selectedTruckId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block py-2 px-8 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-black">Beranda</h1>
        
        {/* Map Section */}
        <MapWrapper 
          showRoutes={showRoutes}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={setSelectedTruckId}
        />
        
        {/* Navigation and Start Button Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <StartButton onClick={handleStart} />
            <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
              <RouteDetails details={routeDetails} />
            </div>
          </div>

          {/* Navigation Section */}
          {showRoutes && routeWaypoints.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border-2 border-black">
              <NavigationChunks 
                waypoints={routeWaypoints} 
                truckId={selectedTruckId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

