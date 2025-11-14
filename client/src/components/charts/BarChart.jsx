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
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'Distance: ' + context.parsed.y + ' km';
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 500,
        ticks: {
          stepSize: 100,
          callback: function(value) {
            return value + ' km';
          }
        },
        grid: {
          color: '#e5e7eb'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Data untuk 4 minggu dalam 1 bulan
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Distance',
        data: [385, 420, 395, 410], // Total jarak per minggu dalam km
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4
      }
    ],
  };

  // Calculate totals
  const totalDistance = data.datasets[0].data.reduce((a, b) => a + b, 0);
  const avgPerWeek = (totalDistance / 4).toFixed(0);
  const improvement = -12.5; // Negative = pengurangan jarak (good)

  return (
    <div className="w-full p-6 bg-white rounded-lg border-2 border-black h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg text-black font-bold">Total Distance per Week</h3>
        <p className="text-xs text-gray-500 mt-1">November 2025</p>
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <Bar options={options} data={data} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t-2 border-gray-100">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Distance</div>
          <div className="text-2xl text-black font-bold">{totalDistance} km</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Avg per Week</div>
          <div className="text-2xl text-black font-bold">{avgPerWeek} km</div>
          <div className={`text-sm ${improvement < 0 ? 'text-green-500' : 'text-red-500'}`}>
            {improvement}% vs last month
          </div>
        </div>
      </div>
    </div>
  );
}
