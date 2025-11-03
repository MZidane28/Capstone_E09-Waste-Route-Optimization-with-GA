"use client";
import { useState, useEffect } from 'react';
import MapWrapper from "@/components/MapWrapper";
import RouteDetails from "@/components/RouteDetails";
import StartButton from "@/components/StartButton";
import NavigationChunks from "@/components/NavigationChunks";
import { generateMockRoutes, SOURCE_POINTS } from "@/lib/mapUtils";
import { getAllBins, optimizeRoutes } from '@/lib/api';

export default function Home() {
  const [showRoutes, setShowRoutes] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [mapData, setMapData] = useState({
    total: 0,
    needsCollection: 0,
    points: []
  });
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch bins from backend on mount
  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllBins();
      const binsData = response.data;
      setBins(binsData);
      
      // Transform bins to map format
      const mapPoints = binsData.map((bin, index) => ({
        id: `bin-${index + 1}`,
        lat: bin.location.lat,
        lng: bin.location.lon,
        name: bin.name,
        type: bin.is_real ? "Real" : "Simulasi",
        fillLevel: Math.round((bin.demand / bin.capacity) * 100),
        capacity: bin.capacity,
        demand: bin.demand,
        needsCollection: (bin.demand / bin.capacity) >= 0.8,
        _id: bin._id
      }));

      setMapData({
        total: binsData.length,
        needsCollection: mapPoints.filter(p => p.needsCollection).length,
        points: mapPoints
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch bins');
      console.error('Error fetching bins:', err);
    } finally {
      setLoading(false);
    }
  };

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
  
  const handleStart = async () => {
    setOptimizing(true);
    setError(null);
    
    try {
      // Filter bins that need collection
      const binsNeedingCollection = bins.filter(bin => 
        (bin.demand / bin.capacity) >= 0.8
      );

      if (binsNeedingCollection.length === 0) {
        alert('Tidak ada tong sampah yang perlu dikosongkan (>80% penuh)');
        setOptimizing(false);
        return;
      }

      console.log(`🚀 Optimizing route for ${binsNeedingCollection.length} bins...`);

      // Call optimize API
      // Note: Backend akan forward ke GA service nanti
      // Untuk sekarang, backend akan return mock data
      const response = await optimizeRoutes(binsNeedingCollection);
      
      console.log('✅ Optimization result:', response.data);

      // Show routes on map (using mock routes for now)
      setShowRoutes(true);
      
      // TODO: When GA service is ready, use response.data.trucks to display real routes
      
    } catch (err) {
      console.error('❌ Error optimizing:', err);
      setError(err.message || 'Failed to optimize routes');
      
      // Fallback: show routes anyway with mock data
      console.log('⚠️ Using mock routes as fallback');
      setShowRoutes(true);
    } finally {
      setOptimizing(false);
    }
  };

  const routeDetails = {
    tujuan: showRoutes ? "3 Truck" : "Belum dimulai",
    jarak: showRoutes ? "127.5 Km" : "-",
    estimasi: showRoutes ? "4.2 Jam" : "-",
    tongSampah: `${mapData.needsCollection}/${mapData.total}`
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black p-4">Beranda</h1>
        
        <div className="flex-1 px-4 space-y-4 pb-20">
          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
              <p className="text-blue-600 text-sm">📡 Loading data from backend...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">❌ {error}</p>
              <button 
                onClick={fetchBins}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Retry
              </button>
            </div>
          )}
          {/* Map Section */}
          <MapWrapper 
            showRoutes={showRoutes}
            onDataChange={setMapData}
            selectedTruckId={selectedTruckId}
            onTruckSelect={setSelectedTruckId}
            collectionPoints={mapData.points}
            useRealData={true}
          />
          
          {/* Button Section */}
          <div className="flex justify-center">
            {optimizing ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                  <span className="text-xs text-black">Optimizing...</span>
                </div>
              </div>
            ) : (
              <StartButton onClick={handleStart} disabled={loading || bins.length === 0} />
            )}
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

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-600">📡 Loading data from backend...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-600">❌ {error}</p>
            <button 
              onClick={fetchBins}
              className="mt-2 text-sm text-blue-600 underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Map Section */}
        <MapWrapper 
          showRoutes={showRoutes}
          onDataChange={setMapData}
          selectedTruckId={selectedTruckId}
          onTruckSelect={setSelectedTruckId}
          collectionPoints={mapData.points}
          useRealData={true}
        />
        
        {/* Navigation and Start Button Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {optimizing ? (
              <div className="bg-white border-2 border-black font-bold w-28 h-28 rounded-full shadow-md flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <span className="text-xs text-black">Optimizing...</span>
                </div>
              </div>
            ) : (
              <StartButton onClick={handleStart} disabled={loading || bins.length === 0} />
            )}
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

