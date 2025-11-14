"use client";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

export default function Analitik() {
  // Mock data - will be replaced with real API data later
  const metrics = {
    co2Reduced: 25.3,
    distanceSaved: 240,
    utilization: { current: 87, previous: 65 },
    avgEfficiency: 84.5
  };

  return (
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Analitik</h1>
      
      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CO2 Reduced Card */}
        <div className="bg-white rounded-lg border-2 border-black p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">CO2 Reduced</h3>
          <p className="text-3xl font-bold text-black">{metrics.co2Reduced}%</p>
        </div>

        {/* Less Travel Card */}
        <div className="bg-white rounded-lg border-2 border-black p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Less Travel</h3>
          <p className="text-3xl font-bold text-black">{metrics.distanceSaved} km</p>
        </div>

        {/* Utilization Card */}
        <div className="bg-white rounded-lg border-2 border-black p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Utilization</h3>
          <p className="text-3xl font-bold text-black">
            {metrics.utilization.current}% <span className="text-sm text-gray-500">vs {metrics.utilization.previous}%</span>
          </p>
        </div>

        {/* Average Route Efficiency Card */}
        <div className="bg-white rounded-lg border-2 border-black p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Route Efficiency</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.avgEfficiency}%</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Emissions Trend (Takes 2 columns) */}
        <div className="lg:col-span-2">
          <LineChart />
        </div>
        
        {/* Bar Chart - Distance per Week (Takes 1 column) */}
        <div className="lg:col-span-1">
          <BarChart />
        </div>
      </div>
    </div>
  );
}
