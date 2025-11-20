"use client";

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

import SummaryCard from "@/components/SummaryCard";
import SimulationOverview from "@/components/OverviewCard";
import EmissionTrendChart from "@/components/charts/LineChart";
import DistanceChart from "@/components/charts/BarChart";

import { Leaf, Navigation, TrendingUp } from 'lucide-react';

export default function Analitik() {
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchData(){
      setLoading(true);
      setError(null);
      try {
        const [compareRes, summaryRes] = await Promise.all([
          fetch(`${API_ENDPOINTS.solutions.compare}?days=${days}`),
          fetch(API_ENDPOINTS.solutions.summary)
        ]);

        if (!compareRes.ok || !summaryRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const compareResult = await compareRes.json();
        const summaryResult = await summaryRes.json();

        if (compareResult.success && summaryResult.success) {
          setData(compareResult.data);
          setOverview(summaryResult.data);
        } else {
          throw new Error('API returned success: false');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [days]);

  if (loading){
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        <span className="ml-4 text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data){
    return(
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  const { ga, nn, improvements } = data;

  function prepareWeeklyData(gaDaily, nnDaily, totalDays){
    if (!gaDaily?.length || !nnDaily?.length) {
      return [];
    }

    const maxGaDay = Math.max(...gaDaily.map(d => d.simulation_day));
    const maxNnDay = Math.max(...nnDaily.map(d => d.simulation_day));
    const lastDay = Math.min(maxGaDay, maxNnDay);
    const firstDay = Math.max(1, lastDay - totalDays + 1);

    const gaFiltered = gaDaily.filter(d => d.simulation_day >= firstDay && d.simulation_day <= lastDay);
    const nnFiltered = nnDaily.filter(d => d.simulation_day >= firstDay && d.simulation_day <= lastDay);

    const weeklyData = [];
    const weeksCount = Math.ceil(totalDays / 7);

    for (let week = 1; week <= weeksCount; week++) {
      const startDay = firstDay + (week - 1) * 7;
      const endDay = Math.min(firstDay + week * 7 - 1, lastDay);
    
      const gaWeekData = gaFiltered
        .filter(d => d.simulation_day >= startDay && d.simulation_day <= endDay)
        .reduce((sum, d) => ({
          distance: sum.distance + (d.total_distance || 0),
          emissions: sum.emissions + (d.total_emissions || 0)
        }), { distance: 0, emissions: 0 });
    
      const nnWeekData = nnFiltered
        .filter(d => d.simulation_day >= startDay && d.simulation_day <= endDay)
        .reduce((sum, d) => ({
          distance: sum.distance + (d.total_distance || 0),
          emissions: sum.emissions + (d.total_emissions || 0)
        }), { distance: 0, emissions: 0 });
    
      weeklyData.push({
        week: `Week ${week}`,
        unoptimized: parseFloat(nnWeekData.distance.toFixed(2)),
        optimized: parseFloat(gaWeekData.distance.toFixed(2)),
        nnEmissions: parseFloat(nnWeekData.emissions.toFixed(2)),
        gaEmissions: parseFloat(gaWeekData.emissions.toFixed(2))
      });
    }

    return weeklyData;
  }

  const weeklyData = prepareWeeklyData(ga.daily_data, nn.daily_data, days);

  const emissionReduced = improvements?.emissions_improvement_percentage 
    ? Math.abs(improvements.emissions_improvement_percentage).toFixed(1)
    : '0.0';

  const distanceSaved = improvements?.distance_saved_km
    ? Math.abs(improvements.distance_saved_km).toFixed(1)
    : '0';

  const utilizationGA = (ga?.summary?.total_distance && nn?.summary?.total_distance)
    ? ((ga.summary.total_distance / nn.summary.total_distance) * 100).toFixed(0)
    : '0';

  const periodTrips = (ga?.summary?.total_trucks || 0)

  return (
    <div className="py-2 px-8 space-y-4 justify-between">
      {/* Title */}
      <h1 className="text-3xl font-bold text-black">Analitik</h1>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Section - Metrics Cards */}
        <div className="lg:col-span-2 space-y-3 order-2 lg:order-1">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* CO2 Reduced Card */}
            <SummaryCard
              value={`${emissionReduced}%`}
              label="Emission Reduced"
              icon={<Leaf size={24} />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            
            {/* Less Travel Card */}
            <SummaryCard
              value={`${distanceSaved} km`}
              label="Distance Saved"
              icon={<Navigation size={24} />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            
            {/* Utilization Card */}
            <SummaryCard
              value={`${distanceSaved} %`}
              label="Truck Utilization"
              icon={<TrendingUp size={24} />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>
          
          {/* Line Chart - Emission Trend */}
          <div>
            <EmissionTrendChart data={weeklyData} />
          </div>
        </div>
        
        {/* Right Section - Efficiency Gauge */}
        <div className="lg:col-span-1 order-1 lg:order-2">
            <SimulationOverview 
              currentDay={overview.current_simulation_day}
              totalBins={150}
              totalTrips={periodTrips}
              selectedDays={days}
              onDaysChange={setDays}
            />
        </div>
      </div>
      
      {/* Bottom Chart Section */}
      <div className="grid grid-cols-1 gap-3">
        
        {/* Bar Chart - Distance per Week */}
        <div>
          <DistanceChart data={weeklyData} />
        </div>
      </div>
    </div>
  );
}
