"use client";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import CircleChart from "@/components/charts/CircleChart";

export default function Analitik() {
  return (
    <div className="py-2 px-8 space-y-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Analitik</h1>
      
      {/* Grid Layout for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Full Width */}
        <div className="lg:col-span-2">
          <LineChart />
        </div>
        
        {/* Circle Chart */}
        <div>
          <CircleChart />
        </div>
        
        {/* Bar Chart */}
        <div>
          <BarChart />
        </div>
      </div>
    </div>
  );
}
