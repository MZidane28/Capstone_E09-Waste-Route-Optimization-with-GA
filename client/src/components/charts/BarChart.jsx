"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 50,
        ticks: {
          stepSize: 10
        }
      }
    }
  };

  const labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Legend',
        data: [28, 22, 38, 23, 28, 22],
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Legend',
        data: [24, 18, 32, 19, 24, 18],
        backgroundColor: '#22c55e',
      },
    ],
  };

  return (
    <div className="w-full p-4 bg-white rounded-[18px] border-2 border-black">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-black font-bold">Lorem Ipsum</h3>
        <button className="p-2">⋮</button>
      </div>
      <div className="h-[150px]">
        <Bar options={options} data={data} />
      </div>
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div>
          <div className="text-gray-600">Label</div>
          <div className="text-4xl text-black font-bold">14,744</div>
          <div className="text-green-500">+13.6%</div>
        </div>
        <div>
          <div className="text-gray-600">Label</div>
          <div className="text-4xl text-black font-bold">14,744</div>
          <div className="text-green-500">+13.6%</div>
        </div>
      </div>
    </div>
  );
}
