"use client";
import { useState } from 'react';

export default function NavigationChunks({ waypoints, truckId }) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const chunkSize = 5; // Show 5 waypoints at a time
  
  if (!waypoints || waypoints.length === 0) {
    return null; // Don't show anything if no waypoints
  }

  // If only 2 waypoints (depot start and depot end), no bins to collect
  // Don't show navigation
  if (waypoints.length <= 2) {
    return null;
  }

  const totalChunks = Math.ceil(waypoints.length / chunkSize);
  const currentWaypoints = waypoints.slice(
    currentChunk * chunkSize,
    (currentChunk + 1) * chunkSize
  );

  const handlePrevious = () => {
    setCurrentChunk(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentChunk(prev => Math.min(totalChunks - 1, prev + 1));
  };

  // Generate Google Maps URL for full route navigation
  const getFullRouteUrl = () => {
    if (waypoints.length < 2) return null;
    
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const originLat = origin.lat || origin.coordinates?.[0];
    const originLng = origin.lng || origin.coordinates?.[1];
    const destLat = destination.lat || destination.coordinates?.[0];
    const destLng = destination.lng || destination.coordinates?.[1];
    
    // Intermediate waypoints (exclude first and last)
    const waypointsList = waypoints
      .slice(1, -1)
      .map(wp => {
        const lat = wp.lat || wp.coordinates?.[0];
        const lng = wp.lng || wp.coordinates?.[1];
        return `${lat},${lng}`;
      })
      .join('|');
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
    
    if (waypointsList) {
      url += `&waypoints=${waypointsList}`;
    }
    
    url += '&travelmode=driving';
    
    return url;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black">
          Navigation - {truckId}
        </h3>
        <span className="text-sm text-gray-600">
          Showing {currentChunk * chunkSize + 1}-{Math.min((currentChunk + 1) * chunkSize, waypoints.length)} of {waypoints.length}
        </span>
      </div>

      {/* Navigate Full Route Button */}
      <div className="mb-4">
        <a
          href={getFullRouteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block text-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md border-2 border-black"
        >
          <div className="flex items-center justify-center gap-2">
            <span>Navigate Full Route in Google Maps</span>
            <span className="text-xl">→</span>
          </div>
          <div className="text-xs mt-1 opacity-90">
            {waypoints.length} waypoints • Optimized route
          </div>
        </a>
      </div>

      {/* Waypoints List */}
      <div className="space-y-3 mb-4">
        {currentWaypoints.map((waypoint, index) => {
          const absoluteIndex = currentChunk * chunkSize + index;
          const isDepot = absoluteIndex === 0 || absoluteIndex === waypoints.length - 1;
          const lat = waypoint.lat || waypoint.coordinates?.[0];
          const lng = waypoint.lng || waypoint.coordinates?.[1];
          
          return (
            <div
              key={absoluteIndex}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Step Number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                isDepot ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {absoluteIndex + 1}
              </div>

              {/* Waypoint Info */}
              <div className="flex-1">
                <div className="font-semibold text-black">
                  {isDepot 
                    ? (absoluteIndex === 0 ? 'Start: Depot' : 'Finish: Depot')
                    : `Bin ${absoluteIndex}`
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {lat?.toFixed(6)}, {lng?.toFixed(6)}
                </div>
              </div>

              {/* Navigate to Next Waypoint Button */}
              {lat && lng && absoluteIndex < waypoints.length - 1 && (
                <a
                  href={(() => {
                    const nextWaypoint = waypoints[absoluteIndex + 1];
                    const nextLat = nextWaypoint.lat || nextWaypoint.coordinates?.[0];
                    const nextLng = nextWaypoint.lng || nextWaypoint.coordinates?.[1];
                    return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${nextLat},${nextLng}&travelmode=driving`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                </a>
              )}
              
              {/* Last waypoint - already at depot */}
              {absoluteIndex === waypoints.length - 1 && (
                <div className="flex-shrink-0 px-3 py-2 bg-gray-400 text-white text-sm rounded-lg flex items-center gap-1">
                  <span>Done</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalChunks > 1 && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentChunk === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChunk === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentChunk + 1} of {totalChunks}
          </span>

          <button
            onClick={handleNext}
            disabled={currentChunk === totalChunks - 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentChunk === totalChunks - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
