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
  // Mock data - weekly emission trend for one month (4 weeks)
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Unoptimized',
        data: [192, 188, 195, 198],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Optimized',
        data: [135, 128, 132, 130],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg CO2`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 80,
        max: 250,
        title: {
          display: true,
          text: 'Metric Values',
          font: {
            size: 12,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Week',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="w-full p-4 bg-white rounded-[18px] border-2 border-black">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg text-black font-bold">Emission Trend - Monthly</h3>
        <button className="p-2 hover:bg-gray-100 rounded">⋮</button>
      </div>
      <div style={{ height: '220px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
