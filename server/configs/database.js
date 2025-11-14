import mongoose from "mongoose";

const connectDB  = async () => {
    try{
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 seconds (faster feedback)
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4
            // Add these for better diagnostics
            autoIndex: true,
            autoCreate: true
        };
        
        console.log("🔄 Attempting to connect to MongoDB...");
        console.log("📍 Connection URI:", process.env.DB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')); // Hide credentials
        
        await mongoose.connect(process.env.DB_URI, options);
        
        console.log("✅ Connected to MongoDB successfully!");
        console.log("📊 Database:", mongoose.connection.db.databaseName);
        console.log("🌐 Host:", mongoose.connection.host);
    }catch(error){
        console.error("❌ Failed to connect to MongoDB");
        console.error("Error Type:", error.name);
        console.error("Error Message:", error.message);
        
        // Provide helpful troubleshooting tips
        if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
            console.error("\n🔧 Troubleshooting Tips:");
            console.error("   1. Check if your IP address is whitelisted in MongoDB Atlas");
            console.error("   2. Go to: MongoDB Atlas → Network Access → Add IP Address");
            console.error("   3. Add your current IP or use 0.0.0.0/0 for testing");
            console.error("   4. Check firewall/antivirus settings");
        } else if (error.message.includes('authentication failed')) {
            console.error("\n🔧 Check your MongoDB credentials in .env file");
        }
        
        // Don't exit process in development, just log the error
        // process.exit(1);
    }
}

export default connectDB ;