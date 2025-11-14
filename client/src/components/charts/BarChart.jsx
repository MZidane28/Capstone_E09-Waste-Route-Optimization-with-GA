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
  // Mock data - 4 weeks in a month
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  
  const data = {
    datasets: [
      {
        label: 'Unoptimized',
        data: [520, 485, 510, 495],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Optimized',
        data: [380, 355, 365, 360],
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
    ],
    labels,
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
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} km`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Distance (km)',
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
        <h3 className="text-lg text-black font-bold">Total Distance per Week</h3>
        <button className="p-2 hover:bg-gray-100 rounded">⋮</button>
      </div>
      <div style={{ height: '220px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
