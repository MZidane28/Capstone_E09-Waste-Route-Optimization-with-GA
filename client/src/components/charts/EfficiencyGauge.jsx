"use client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function EfficiencyGauge() {
  // Mock data - efficiency score 87%
  const efficiencyScore = 87;
  
  const data = {
    datasets: [
      {
        data: [efficiencyScore, 100 - efficiencyScore],
        backgroundColor: [
          '#22c55e', // green for score
          '#f3f4f6', // light gray for remaining
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <div className="w-full h-full p-4 bg-white rounded-[18px] border-2 border-black flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-base text-black font-bold">Efficiency Score</h3>
        <button className="p-2 hover:bg-gray-100 rounded">⋮</button>
      </div>
      
      {/* Gauge Container */}
      <div className="flex-1 relative flex items-center justify-center py-4">
        <div className="w-full max-w-[180px] aspect-square relative flex items-center justify-center">
          <div className="w-full h-full">
            <Doughnut data={data} options={options} />
          </div>
          
          {/* Score text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '30px' }}>
            <div className="text-3xl font-bold text-black leading-none">{efficiencyScore}%</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">Overall Efficiency</div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500 font-medium">
          Based on CO2, Distance & Utilization
        </div>
        
        {/* Mini indicators */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <div className="text-xs text-gray-400">CO2</div>
            <div className="text-sm font-bold text-green-600">-25%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Distance</div>
            <div className="text-sm font-bold text-green-600">-240km</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Usage</div>
            <div className="text-sm font-bold text-green-600">87%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
