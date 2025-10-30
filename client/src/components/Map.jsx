"use client";
import dynamic from 'next/dynamic';

const ClientMap = dynamic(() => import('./ClientMap'), {
  ssr: false,
});

export default function Map(props) {
  return <ClientMap {...props} />;
}

// Custom icons
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const truckIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #000;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function MapComponent({ onRandomize, showRoutes = false, onDataChange }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const [collectionPoints, setCollectionPoints] = useState(() => generateCollectionPoints());
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Update parent component with current data
  useEffect(() => {
    if (onDataChange) {
      const needsCollection = collectionPoints.filter(point => point.fillLevel >= 80).length;
      onDataChange({
        total: collectionPoints.length,
        needsCollection,
        points: collectionPoints
      });
    }
  }, [collectionPoints, onDataChange]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !mapRef.current) {
      // Initialize the map
      const map = L.map('map', {
        center: [-7.797068, 110.370529], // Yogyakarta coordinates
        zoom: 13,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapRef.current = map;

      // Force a resize after map is initialized
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  // Update markers when collection points change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add collection points
    collectionPoints.forEach(point => {
      // Determine marker color based on fill level and type
      let color;
      if (point.fillLevel >= 80) {
        color = '#ef4444'; // Red for bins that need collection
      } else {
        color = point.type === 'Organik' ? '#22c55e' : '#3b82f6';
      }

      const marker = L.marker([point.lat, point.lng], {
        icon: createIcon(color)
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="text-black">
            <b>ID: ${point.id}</b><br>
            Type: ${point.type}<br>
            Fill Level: ${point.fillLevel}%<br>
            Status: ${point.fillLevel >= 80 ? 'Needs Collection' : 'OK'}
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Add source points (truck locations)
    SOURCE_POINTS.forEach(point => {
      const marker = L.marker([point.lat, point.lng], { icon: truckIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>${point.name}</b>`);
      markersRef.current.push(marker);
    });
  }, [collectionPoints]);

  // Update routes when showRoutes or selectedTruck changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];

    if (showRoutes) {
      const routes = generateMockRoutes(SOURCE_POINTS, collectionPoints);
      
      // Filter routes based on selected truck
      const routesToShow = selectedTruck 
        ? routes.filter(route => route.id.toString() === selectedTruck)
        : routes;

      routesToShow.forEach(route => {
        if (route.points.length > 1) { // Only show routes with collection points
          const polyline = L.polyline(route.points, {
            color: route.color,
            weight: 3,
            opacity: 0.8
          })
            .addTo(mapRef.current)
            .bindPopup(`
              <div class="text-black">
                <b>${route.name}</b><br>
                Bins to collect: ${route.binCount}
              </div>
            `);
          routesRef.current.push(polyline);
        }
      });
    }
  }, [showRoutes, collectionPoints, selectedTruck]);

  // Handle randomize functionality
  useEffect(() => {
    if (onRandomize) {
      onRandomize(() => {
        setCollectionPoints(prevPoints => 
          prevPoints.map(point => ({
            ...point,
            fillLevel: Math.floor(Math.random() * 100),
            needsCollection: Math.random() >= 0.2 // 20% chance of needing collection
          }))
        );
        setSelectedTruck(null); // Reset truck selection
      });
    }
  }, [onRandomize]); // Remove collectionPoints from dependencies

  return (
    <div className="bg-white p-6 rounded-[18px] shadow-md border-3 border-black">
      <h2 className="text-xl text-black font-bold mb-4">Peta Rute</h2>
      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        {showRoutes && (
          <TruckSelector
            trucks={SOURCE_POINTS}
            selectedTruck={selectedTruck}
            onSelect={setSelectedTruck}
          />
        )}
        <div id="map" className="w-full h-full rounded-lg" />
      </div>
    </div>
  );
}
