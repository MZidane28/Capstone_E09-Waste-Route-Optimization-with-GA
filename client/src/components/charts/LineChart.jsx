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
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + ' kg CO2';
          }
        }
      }
    },
    scales: {
      y: {
        min: 80,
        max: 250,
        ticks: {
          stepSize: 50,
          callback: function(value) {
            return value;
          }
        },
        grid: {
          color: '#e5e7eb'
        },
        title: {
          display: true,
          text: 'Metric Values',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Data untuk 1 bulan (weekly: Week 1, 2, 3, 4)
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Unoptimized',
        data: [192, 185, 195, 203], // Emisi tanpa optimasi (lebih tinggi)
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'Optimized',
        data: [132, 115, 112, 128], // Emisi dengan optimasi (lebih rendah)
        borderColor: '#22c55e',
        backgroundColor: '#22c55e',
        tension: 0.3,
        borderWidth: 2
      },
    ],
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg border-2 border-black">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg text-black font-bold">Emissions Trend - Optimized vs Unoptimized</h3>
        <select className="px-3 py-1.5 text-sm text-black border-2 border-black rounded-md bg-white">
          <option>November 2025</option>
          <option>October 2025</option>
          <option>September 2025</option>
        </select>
      </div>
      <div className="h-[300px]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
