"use client";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import EfficiencyGauge from "@/components/charts/EfficiencyGauge";

export default function Analitik() {
  return (
    <div className="py-2 px-8 space-y-4 h-screen overflow-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold text-black">Analitik</h1>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Section - Metrics Cards */}
        <div className="lg:col-span-2 space-y-3">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* CO2 Reduced Card */}
            <div className="p-4 bg-white rounded-[18px] border-2 border-black">
              <div className="text-2xl font-bold text-black">25.3%</div>
              <div className="text-xs text-gray-600 mt-1">CO2 Reduced</div>
            </div>
            
            {/* Less Travel Card */}
            <div className="p-4 bg-white rounded-[18px] border-2 border-black">
              <div className="text-2xl font-bold text-black">240 km</div>
              <div className="text-xs text-gray-600 mt-1">Less Travel</div>
            </div>
            
            {/* Utilization Card */}
            <div className="p-4 bg-white rounded-[18px] border-2 border-black">
              <div className="text-2xl font-bold text-black">87% vs 65%</div>
              <div className="text-xs text-gray-600 mt-1">Utilization</div>
            </div>
          </div>
          
          {/* Line Chart - Emission Trend */}
          <div>
            <LineChart />
          </div>
        </div>
        
        {/* Right Section - Efficiency Gauge */}
        <div className="lg:col-span-1">
          <EfficiencyGauge />
        </div>
      </div>
      
      {/* Bottom Chart Section */}
      <div className="grid grid-cols-1 gap-3">
        
        {/* Bar Chart - Distance per Week */}
        <div>
          <BarChart />
        </div>
      </div>
    </div>
  );
}
