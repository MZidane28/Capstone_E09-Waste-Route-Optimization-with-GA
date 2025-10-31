"use client";

const CHUNK_SIZE = 9; // Maksimum waypoint per chunk untuk Google Maps

export default function NavigationChunks({ waypoints, truckId }) {
  // Helper function untuk memecah waypoints menjadi chunks
  const createChunks = (waypoints) => {
    if (!waypoints || waypoints.length === 0) return [];
    
    const chunks = [];
    let currentIndex = 0;

    while (currentIndex < waypoints.length - 1) { // -1 karena titik terakhir adalah depot
      // Ambil chunk dengan size maksimum CHUNK_SIZE
      const chunk = waypoints.slice(
        currentIndex,
        Math.min(currentIndex + CHUNK_SIZE, waypoints.length)
      );

      chunks.push(chunk);
      
      // Update currentIndex, tapi mundur 1 agar titik terakhir menjadi titik awal chunk berikutnya
      currentIndex = currentIndex + CHUNK_SIZE - 1;
    }

    return chunks;
  };

  // Helper function untuk membuat URL Google Maps
  const createGoogleMapsUrl = (waypoints) => {
    const waypointsString = waypoints
      .map(point => `${point.lat},${point.lng}`)
      .join('/');
    
    return `https://www.google.com/maps/dir/${waypointsString}`;
  };

  // Handler untuk membuka Google Maps di tab baru
  const handleOpenNavigation = (chunk) => {
    const url = createGoogleMapsUrl(chunk);
    window.open(url, '_blank');
  };

  // Buat chunks dari waypoints
  const chunks = createChunks(waypoints);

  if (!waypoints || waypoints.length === 0) {
    return null;
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-bold text-lg mb-3 text-black">
        Navigasi Rute {truckId && `- ${truckId}`}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chunks.map((chunk, index) => {
          const startPoint = index * (CHUNK_SIZE - 1) + 1;
          const endPoint = Math.min(
            startPoint + chunk.length - 2,
            waypoints.length - 2
          );

          return (
            <button
              key={index}
              onClick={() => handleOpenNavigation(chunk)}
              className="bg-white border-2 border-black rounded-lg px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="block font-semibold text-black">
                Rute {index + 1}
              </span>
              <span className="text-sm text-black">
                Titik {startPoint} - {endPoint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}