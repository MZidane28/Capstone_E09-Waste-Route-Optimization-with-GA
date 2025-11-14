"use client";

export default function TruckSelector({ trucks, selectedTruck, onSelect }) {
  const handleChange = (e) => {
    const value = e.target.value;
    // Convert to number if not empty string, otherwise pass null
    const truckId = value === "" ? null : parseInt(value, 10);
    onSelect(truckId);
  };

  return (
    <select
      value={selectedTruck || ""}
      onChange={handleChange}
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