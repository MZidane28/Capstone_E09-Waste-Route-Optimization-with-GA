const axios = require('axios');

// Test data similar to what backend sends
const testPayload = {
  bins: [
    { id: 'BIN_001', demand: 6.856 },
    { id: 'BIN_002', demand: 6.505 },
    { id: 'BIN_004', demand: 6.923 }
  ],
  distance_matrix: [
    [0, 5.2, 3.1, 4.5],      // depot to all bins
    [5.2, 0, 2.8, 1.9],      // BIN_001 to all
    [3.1, 2.8, 0, 3.4],      // BIN_002 to all
    [4.5, 1.9, 3.4, 0]       // BIN_004 to all
  ]
};

console.log('🧪 Testing GA Service with payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n📡 Calling: https://caps09-cvrp.azurewebsites.net/solve-ga');

axios.post('https://caps09-cvrp.azurewebsites.net/solve-ga', testPayload, {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('\n✅ SUCCESS! Response:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.log('\n❌ ERROR:');
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', error.response.data);
  } else {
    console.log('Message:', error.message);
  }
});
