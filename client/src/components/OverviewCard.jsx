"use client"

export default function SimulationOverview({
    currentDay = 30, 
    totalBins = 150, 
    totalTrips = 150,
    selectedDays = 30,
    onDaysChange
}){
    return(
    <div className="w-full h-full p-4 bg-white rounded-[18px] border-2 border-black flex flex-col justify-between">
        <div className="justify-between">
            <h2 className="text-2xl text-black font-bold mb-2.5">Simulation Overview</h2>

            <div className="space-y-1 pt-4 border-t border-gray-200">
                <div>
                    <p className="text-md text-gray-600 mb-1">Current Simulation Day</p>
                    <p className="text-2xl text-black font-bold">Day {currentDay}</p>
                </div>

                <div>
                    <p className="text-md text-gray-600 mb-1">Total Bins</p>
                    <p className="text-2xl text-black font-bold">{totalBins}</p>
                </div>

                <div>
                    <p className="text-md text-gray-600 mb-1">Total Trips</p>
                    <p className="text-2xl text-black font-bold">{totalTrips}</p>
                </div>
            </div>
        </div>

        <div className="py-4 border-t border-gray-300">
            <p className="text-md text-gray-600 mb-2">Viewing</p>
            <p className="text-2xl text-black font-bold mb-4">Last {selectedDays} Days</p>

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
)
}