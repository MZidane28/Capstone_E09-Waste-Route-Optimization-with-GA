"use client"

export default function SimulationOverview({
    currentDay = 30, 
    totalBins = 150, 
    totalTrips = 150,
    selectedDays = 30,
    onDaysChange
}){
    return (
    <div className="bg-white rounded-[18px] border-2 border-black p-6 sticky top-6">
      <h2 className="text-2xl text-black font-bold mb-2.5">Simulation Overview</h2>
      
      <div className="border-t border-gray-200 space-y-6">
        {/* Current Simulation Day */}
        <div className="pt-4">
          <p className="text-sm text-gray-600 mb-1">Current Simulation Day</p>
          <p className="text-2xl text-black font-bold">Day {currentDay}</p>
        </div>

        {/* Total Bins */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Bins</p>
          <p className="text-2xl text-black font-bold">{totalBins}</p>
        </div>

        {/* Divider */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-lg font-semibold text-gray-700 mb-4">
            Last {selectedDays} Days
          </p>
        </div>

        {/* Total Trips */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Trips</p>
          <p className="text-2xl text-black font-bold">{totalTrips}</p>
        </div>

        {/* Viewing Period Selector */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Adjust View Period</p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onDaysChange(7)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDays === 7
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => onDaysChange(30)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDays === 30
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}