import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./configs/database.js";
import binRouter from "./routes/binRoutes.js";
import solutionRouter from "./routes/solutionRoutes.js";
import simulationRouter from "./routes/simulationRoutes.js";
import trackingRouter from "./routes/trackingRoutes.js";
import optimizeRouter from "./routes/optimizeRoutes.js";
import Bin from "./models/Bin.js";

import mqtt from "mqtt";
dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/bins',binRouter);
app.use('/api/v1/solutions',solutionRouter);
app.use('/api/v1/simulation', simulationRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/v1/optimize', optimizeRouter);

app.get("/", (req, res) => {
  res.send('Welcome to Waste Collection Management API');
  res.send("API Capstone E09");
});

//ROUTES
// app.use("/user", userRouter);
//---------------------MQTT----------------
// Koneksi ke broker MQTT (pakai broker.emqx.io)
const brokerUrl = "mqtt://test.mosquitto.org:1883";
const client = mqtt.connect(brokerUrl);

// Topic yang dipakai STM32
const topicPot = "capstone_E09/hcsr04";

// Saat terkoneksi ke broker
client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe(topicPot, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to topic: ${topicPot}`);
    } else {
      console.error("Subscribe error:", err);
    }
  });
});

// Saat ada pesan masuk dari STM32
client.on("message", async (topic, message) => {
  if (topic === topicPot) {
    const data = message.toString();
    console.log(`📥 Data received [${topic}]: ${data}`);

    try {
      // Parse data "ADC,Voltage" or "distance_cm"
      const parts = data.split(",");
      let fillPercentage;

      if (parts.length === 2) {
        // Format: "ADC,Voltage"
        const [adc, voltage] = parts;
        console.log(`   -> ADC = ${adc}, Voltage = ${voltage} V`);
        
        // Convert voltage to fill percentage
        // Assuming: 0V = 0% (empty), 3.3V = 100% (full)
        const voltageNum = parseFloat(voltage);
        fillPercentage = Math.min(100, Math.max(0, (voltageNum / 3.3) * 100));
      } else {
        // Format: "distance_cm" (HC-SR04 sensor)
        const distanceCm = parseFloat(data);
        console.log(`   -> Distance = ${distanceCm} cm`);
        
        // Convert distance to fill percentage
        // Assuming: bin height = 50cm, distance 5cm = full (100%), distance 50cm = empty (0%)
        const BIN_HEIGHT = 50; // cm
        const MIN_DISTANCE = 5; // cm (sensor to full level)
        fillPercentage = Math.min(100, Math.max(0, ((BIN_HEIGHT - distanceCm) / (BIN_HEIGHT - MIN_DISTANCE)) * 100));
      }

      console.log(`   -> Calculated fill percentage: ${fillPercentage.toFixed(1)}%`);

      // Find the real bin and update its fill level
      const realBin = await Bin.findOne({ is_real: true });
      
      if (realBin) {
        // Calculate actual fill based on percentage and capacity
        const actualFill = (fillPercentage / 100) * realBin.capacity;
        
        // Update both GA and NN fill levels for real bin
        realBin.current_fill_ga = actualFill;
        realBin.current_fill_nn = actualFill;
        await realBin.save();
        
        console.log(`✅ Updated real bin ${realBin.name} (${realBin.bin_id}): ${actualFill.toFixed(1)}/${realBin.capacity} (${fillPercentage.toFixed(1)}%)`);
      } else {
        console.warn('⚠️  No real bin found in database. Please create a bin with is_real: true');
      }
    } catch (error) {
      console.error('❌ Error processing MQTT data:', error.message);
    }
  }
});
// ------------------END MQTT--------------

// ? Error handler\
// ? will be called automatically when the url doesn't exist or it's wrong
app.use((req, res, next) => {
  const error = new Error("Not found!");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `Server backend Capstone E09 running on port http://localhost:${PORT}`
  );
});
