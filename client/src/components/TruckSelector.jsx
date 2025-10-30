"use client";

export default function TruckSelector({ trucks, selectedTruck, onSelect }) {
  return (
    <select
      value={selectedTruck || ""}
      onChange={(e) => onSelect(e.target.value || null)}
      className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black bg-white"
    >
      <option value="">All Trucks</option>
      {trucks.map(truck => (
        <option key={truck.id} value={truck.id}>
          {truck.name}
        </option>
      ))}
    </select>
  );
}