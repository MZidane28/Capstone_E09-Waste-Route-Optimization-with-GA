import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./configs/database.js";
import binRouter from "./routes/binRoutes.js";
import solutionRouter from "./routes/solutionRoutes.js";
import optimizeRouter from "./routes/optimizeRoutes.js";

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
app.use('/api/v1/optimize', optimizeRouter);

app.get("/", (req, res) => {
  res.send('Welcome to Waste Collection Management API');
  res.send("API Capstone E09");
});

//ROUTES
// app.use("/user", userRouter);
//---------------------MQTT----------------
// Koneksi ke broker MQTT (pakai broker.emqx.io)
const brokerUrl = "mqtt://broker.emqx.io:1883";
const client = mqtt.connect(brokerUrl);

// Topic yang dipakai STM32
const topicPot = "Kel_5/pot";

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
client.on("message", (topic, message) => {
  if (topic === topicPot) {
    const data = message.toString();
    console.log(`📥 Data received [${topic}]: ${data}`);

    // Misal parsing data "ADC,Voltage"
    const [adc, voltage] = data.split(",");
    console.log(`   -> ADC = ${adc}, Voltage = ${voltage} V`);
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
