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

export default function CircleChart() {
  const data = {
    labels: ['Legend', 'Legend'],
    datasets: [
      {
        data: [32455, 67545],
        backgroundColor: [
          '#3b82f6',
          '#22c55e',
        ],
        borderColor: [
          '#3b82f6',
          '#22c55e',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="w-full p-4 bg-white rounded-[18px] border-2 border-black">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-black font-bold">Lorem Ipsum</h3>
        <button className="p-2">⋮</button>
      </div>
      <div className="relative h-[200px]">
        <Doughnut data={data} options={options} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-2xl text-black font-bold">32,455</div>
          <div className="text-sm text-gray-500">User</div>
        </div>
      </div>
    </div>
  );
}
