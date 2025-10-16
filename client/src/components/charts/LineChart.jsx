"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LineChart() {
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

  const labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Legenda',
        data: [20, 25, 30, 35, 32, 38],
        borderColor: '#22c55e',
        backgroundColor: '#22c55e',
        tension: 0.4
      },
      {
        label: 'Legenda',
        data: [25, 18, 28, 25, 28, 10],
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4
      },
    ],
  };

  return (
    <div className="w-full p-4 bg-white rounded-[18px] border-2 border-black">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-black font-bold">Lorem Ipsum</h3>
        <select className="px-4 py-2 text-black border rounded-md">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      <div className="h-[200px]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
