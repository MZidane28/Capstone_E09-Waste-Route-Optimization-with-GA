"use client";
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

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

      // Cleanup on unmount
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  return (
    <div className="bg-white p-6 rounded-[18px] shadow-md border-3 border-black" ref={containerRef}>
      <h2 className="text-xl text-black font-bold mb-4">Peta Rute</h2>
      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        <div id="map" className="w-full h-full rounded-lg" />
      </div>
    </div>
  );
}
