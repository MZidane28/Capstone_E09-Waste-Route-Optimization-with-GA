"use client";
import { useState } from 'react';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";

export default function Home() {
  const [showRoutes, setShowRoutes] = useState(false);
  const [mapData, setMapData] = useState({
    total: 200,
    needsCollection: 0,
    points: []
  });
  
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
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Beranda</h1>
      
      {/* Map Section */}
      <MapWrapper 
        showRoutes={showRoutes}
        onDataChange={setMapData}
      />
      
      {/* Details and Start Button Section */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <StartButton onClick={handleStart} />
        <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
          <RouteDetails details={routeDetails} />
        </div>
      </div>
    </div>
  );
}

