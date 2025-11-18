import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bin from './models/Bin.js';

dotenv.config();

async function deleteExtraBins() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Connected to MongoDB');

        // Distance matrix only has BIN_001 to BIN_030
        // Delete BIN_031 and above
        const result = await Bin.deleteMany({
            bin_id: { $regex: /^BIN_0(3[1-9]|[4-9][0-9])$/ }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} bins (BIN_031 and above)`);

        // Show remaining bins
        const remainingBins = await Bin.find({}).sort({ bin_id: 1 });
        console.log(`\n📊 Remaining bins: ${remainingBins.length}`);
        console.log('   First:', remainingBins[0]?.bin_id);
        console.log('   Last:', remainingBins[remainingBins.length - 1]?.bin_id);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteExtraBins();
