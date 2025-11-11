import dotenv from "dotenv";
import connectDB from "./configs/database.js";
import Bin from "./models/Bin.js"
import Solution from "./models/Solution.js";

async function testDB() {
    try {
        console.log('testing db connection and models\n');
        
        //test 1 connect to db
        console.log('\n testing mongodb connection...');
        dotenv.config();
        await connectDB();
        console.log(' connected!\n')

        //test 2 create a bin
        console.log('testing bin model...');
        await Bin.deleteOne({ name: 'TEST_BIN' });

        const testBin = new Bin({
            name: 'TEST_BIN',
            location: {
                lat: -7.7956,
                lon: 110.3695
            },
            capacity: 90,
            fill_rate: 10,
            current_fill_ga: 0,
            current_fill_nn:0
        });

        await testBin.save();
        console.log(' bin created: ', testBin.name);

        // test bin methods
        console.log('\n testing bin methods..');
        testBin.updateFill('ga');
        console.log(' update fill - GA fill: ', testBin.current_fill_ga);

        testBin.updateFill('nn');
        console.log(' update fill - NN fill: ', testBin.current_fill_nn);

        const fillPercent = testBin.getFillPercentage('ga');
        console.log('getFillPercentage():', fillPercent + '%');

        testBin.emptyBin('ga');
        console.log('emptyBin() - GA fill:', testBin.current_fill_ga);

        await testBin.save();

        // test query bin
        console.log('\n testing bin queries...');
        const foundBin = await Bin.findOne({name: 'TEST_BIN'});
        console.log(' found bin: ', foundBin.name);
        console.log(' Fill levels - GA: ', foundBin.current_fill_ga, ' NN:', foundBin.current_fill_nn);

        // create a solution
        const testSolution = new Solution({
            simulation_day: 99,
            method: 'ga',
            total_distance: 5.5,
            total_emissions: 148,
            avg_utilization: 0.8,
            avg_unused_capacity: 10,
            bins_collected: 1,
            number_of_trucks: 1,
            execution_time: 100,
            routes: [
                {
                truck_no: 1,
                distance: 5.5,
                load: 50,
                utilization: 0.8,
                unused_capacity: 10,
                emissions: 148,
                route: ['TEST_BIN'] 
                }
            ]
        });

        await testSolution.save();
        console.log(' solution created for day:', testSolution.simulation_day);

        // query solution
        const foundSolution = await Solution.findOne({ simulation_day: 99, method: 'ga' });
        console.log(' found solution:', foundSolution.simulation_day, '-', foundSolution.method);
        console.log(' distance:', foundSolution.total_distance, 'km');

        // Clean up
        console.log('\n Cleaning up test data...');
        await Bin.deleteOne({ name: 'TEST_BIN' });
        await Solution.deleteOne({ simulation_day: 99, method: 'ga' });
        console.log('  ✅ Cleanup complete');

        console.log('\n✅ All database tests passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testDB();