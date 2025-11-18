"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for development
const MOCK_DATA = [
  { week: 'Week 1', unoptimized: 550, optimized: 380 },
  { week: 'Week 2', unoptimized: 520, optimized: 350 },
  { week: 'Week 3', unoptimized: 540, optimized: 360 },
  { week: 'Week 4', unoptimized: 510, optimized: 345 },
];

export default function DistanceChart({ 
  data, 
  title = "Total Distance per Week",
  useMockData = false 
}) {
  const chartData = useMockData || !data || data.length === 0 ? MOCK_DATA : data;

  return (
    <div className="bg-white rounded-[18px] border-2 border-black p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-black">{title}</h2>
        {(useMockData || !data || data.length === 0) && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Mock Data
          </span>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: 'Total Distance (km)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
            formatter={(value) => `${value.toFixed(2)} km`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar 
            dataKey="unoptimized" 
            fill="#3b82f6" 
            name="Unoptimized"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="optimized" 
            fill="#10b981" 
            name="Optimized"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}