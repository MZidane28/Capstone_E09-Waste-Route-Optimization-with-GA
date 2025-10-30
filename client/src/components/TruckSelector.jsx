"use client";

export default function TruckSelector({ trucks, selectedTruck, onSelect }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md border-2 border-black p-2">
      <select
        value={selectedTruck || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-black text-black"
      >
        <option value="">All Trucks</option>
        {trucks.map(truck => (
          <option key={truck.id} value={truck.id}>
            {truck.name}
          </option>
        ))}
      </select>
    </div>
  );
}