"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for development
const MOCK_DATA = [
  { week: 'Week 1', nnEmissions: 200, gaEmissions: 130 },
  { week: 'Week 2', nnEmissions: 190, gaEmissions: 125 },
  { week: 'Week 3', nnEmissions: 195, gaEmissions: 120 },
  { week: 'Week 4', nnEmissions: 198, gaEmissions: 122 },
];

export default function EmissionTrendChart({ 
  data, 
  title = "Emission Trend - Monthly",
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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: 'Metric Values', 
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
            formatter={(value) => `${value.toFixed(2)} kg CO₂`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Line 
            type="monotone" 
            dataKey="nnEmissions" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Unoptimized"
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="gaEmissions" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Optimized"
            dot={{ r: 4, fill: '#10b981' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
