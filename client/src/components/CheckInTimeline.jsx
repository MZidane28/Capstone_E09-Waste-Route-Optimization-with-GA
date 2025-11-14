export default function CheckInTimeline({ truck }) {
  const checkIns = truck.checkIns || [];
  const route = truck.route || [];

  return (
    <div className="space-y-4">
      {/* Route Overview */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">📋 Rute yang Ditugaskan</h3>
        <div className="flex flex-wrap gap-2">
          {route.map((bin, index) => {
            const isCheckedIn = checkIns.some(c => c.binId === bin.id && c.status === 'completed');
            return (
              <span
                key={bin.id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCheckedIn
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {isCheckedIn ? '✓' : index + 1}. {bin.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">🕐 Timeline Check-in</h3>
        
        {checkIns.length > 0 ? (
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            <div className="space-y-4">
              {checkIns.map((checkIn, index) => (
                <div key={index} className="relative pl-12">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    checkIn.status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {checkIn.status === 'completed' ? '✓' : '○'}
                  </div>
                  
                  {/* Check-in Info */}
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{checkIn.binName}</h4>
                        <p className="text-xs text-gray-500">Bin ID: {checkIn.binId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        checkIn.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {checkIn.status === 'completed' ? 'Selesai' : 'Sedang Proses'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Waktu Check-in</p>
                        <p className="font-medium text-gray-800">
                          {new Date(checkIn.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Tanggal</p>
                        <p className="font-medium text-gray-800">
                          {new Date(checkIn.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {checkIn.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Catatan:</p>
                        <p className="text-sm text-gray-700">{checkIn.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Belum ada check-in untuk truk ini</p>
            <p className="text-sm mt-1">Timeline akan muncul setelah supir melakukan check-in</p>
          </div>
        )}
      </div>
    </div>
  );
}
