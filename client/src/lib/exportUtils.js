export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCheckInReport(truck) {
  const reportData = truck.checkIns.map((checkIn, index) => ({
    'No': index + 1,
    'Truck Name': truck.name,
    'Truck ID': truck.truckId,
    'Driver': truck.driverName,
    'Bin ID': checkIn.binId,
    'Bin Name': checkIn.binName,
    'Check-in Time': new Date(checkIn.timestamp).toLocaleString('id-ID'),
    'Status': checkIn.status,
    'Notes': checkIn.notes || '-'
  }));

  const filename = `CheckIn_Report_${truck.truckId}_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(reportData, filename);
}

export function exportAllTrucksReport(trucks) {
  const reportData = [];
  
  trucks.forEach(truck => {
    truck.checkIns.forEach((checkIn, index) => {
      reportData.push({
        'Truck ID': truck.truckId,
        'Truck Name': truck.name,
        'Driver': truck.driverName,
        'Bin ID': checkIn.binId,
        'Bin Name': checkIn.binName,
        'Check-in Time': new Date(checkIn.timestamp).toLocaleString('id-ID'),
        'Status': checkIn.status,
        'Notes': checkIn.notes || '-'
      });
    });
  });

  const filename = `All_Trucks_Report_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(reportData, filename);
}

export function exportRouteSummary(truck) {
  const startTime = truck.startTime ? new Date(truck.startTime) : null;
  const endTime = truck.endTime ? new Date(truck.endTime) : null;
  const duration = startTime && endTime 
    ? Math.round((endTime - startTime) / 1000 / 60) // minutes
    : 'N/A';

  const summaryData = [{
    'Truck ID': truck.truckId,
    'Truck Name': truck.name,
    'Driver Name': truck.driverName,
    'Driver Phone': truck.driverPhone,
    'Status': truck.status,
    'Total Bins': truck.totalBins,
    'Checked In Bins': truck.checkedInBins,
    'Completion %': truck.totalBins > 0 ? Math.round((truck.checkedInBins / truck.totalBins) * 100) : 0,
    'Start Time': startTime ? startTime.toLocaleString('id-ID') : '-',
    'End Time': endTime ? endTime.toLocaleString('id-ID') : '-',
    'Duration (minutes)': duration,
    'Last Check-in': truck.lastCheckIn ? new Date(truck.lastCheckIn).toLocaleString('id-ID') : '-',
    'Current Bin': truck.currentBin || '-'
  }];

  const filename = `Route_Summary_${truck.truckId}_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(summaryData, filename);
}

export function calculateRouteAnalytics(truck) {
  if (!truck.checkIns || truck.checkIns.length === 0) {
    return {
      totalCheckIns: 0,
      averageTimePerBin: 0,
      totalDuration: 0,
      efficiency: 0
    };
  }

  const checkIns = truck.checkIns;
  const sortedCheckIns = [...checkIns].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Calculate time between check-ins
  const timeDifferences = [];
  for (let i = 1; i < sortedCheckIns.length; i++) {
    const diff = (new Date(sortedCheckIns[i].timestamp) - new Date(sortedCheckIns[i-1].timestamp)) / 1000 / 60; // minutes
    timeDifferences.push(diff);
  }

  const averageTimePerBin = timeDifferences.length > 0
    ? timeDifferences.reduce((a, b) => a + b, 0) / timeDifferences.length
    : 0;

  const totalDuration = truck.startTime && truck.endTime
    ? (new Date(truck.endTime) - new Date(truck.startTime)) / 1000 / 60
    : 0;

  const efficiency = truck.totalBins > 0
    ? (truck.checkedInBins / truck.totalBins) * 100
    : 0;

  return {
    totalCheckIns: checkIns.length,
    averageTimePerBin: Math.round(averageTimePerBin),
    totalDuration: Math.round(totalDuration),
    efficiency: Math.round(efficiency),
    fastestCheckIn: timeDifferences.length > 0 ? Math.round(Math.min(...timeDifferences)) : 0,
    slowestCheckIn: timeDifferences.length > 0 ? Math.round(Math.max(...timeDifferences)) : 0
  };
}
