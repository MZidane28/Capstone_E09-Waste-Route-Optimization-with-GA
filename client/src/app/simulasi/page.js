"use client";
import { useState } from 'react';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import RandomButton from "@/components/RandomButton";

export default function Simulasi() {
  const [showRoutes, setShowRoutes] = useState(false);
  const [randomizeFn, setRandomizeFn] = useState(null);
  const [mapData, setMapData] = useState({
    total: 200,
    needsCollection: 0,
    points: []
  });
  
  const handleStart = () => {
    setShowRoutes(true);
  };

  const handleRandom = () => {
    setShowRoutes(false); // Hide routes first
    if (randomizeFn) {
      randomizeFn();
    }
  };

  const routeDetails = {
    tujuan: showRoutes ? "Aktif" : "Menunggu",
    jarak: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 0.5).toFixed(1)} Km` : "0 Km",
    estimasi: mapData.needsCollection > 0 ? `~${(mapData.needsCollection * 2).toFixed(0)} menit` : "0 menit",
    tongSampah: `${mapData.needsCollection}/${mapData.total} (${((mapData.needsCollection/mapData.total) * 100).toFixed(1)}%)`
  };

  return (
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Simulasi</h1>
      
      {/* Map Section */}
      <MapWrapper 
        showRoutes={showRoutes}
        onRandomize={setRandomizeFn}
        onDataChange={setMapData}
      />
      
      {/* Details and Buttons Section */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex gap-4">
          <StartButton onClick={handleStart} />
          <RandomButton onClick={handleRandom} />
        </div>
        <div className="bg-white rounded-lg shadow-md border-2 border-black flex-1">
          <RouteDetails details={routeDetails} />
        </div>
      </div>
    </div>
  );
}