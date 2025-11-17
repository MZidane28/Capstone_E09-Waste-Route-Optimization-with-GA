require('./server/.env');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI).then(() => {
  const Bin = mongoose.model('Bin', new mongoose.Schema({
    bin_id: String,
    name: String,
    capacity: Number,
    current_fill_ga: Number
  }));
  
  return Bin.find({
    $expr: {
      $gte: [
        { $multiply: [{ $divide: ['$current_fill_ga', '$capacity'] }, 100] },
        80
      ]
    }
  });
}).then(bins => {
  console.log('\n🔍 Bins needing collection (≥80%):', bins.length);
  bins.forEach(b => {
    const percent = Math.round((b.current_fill_ga / b.capacity) * 100);
    console.log(`  - ${b.bin_id}: ${b.name} = ${percent}%`);
  });
  
  if (bins.length === 0) {
    console.log('\n⚠️  No bins need collection yet!');
    console.log('💡 This is why GA service is not being called.');
  }
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
