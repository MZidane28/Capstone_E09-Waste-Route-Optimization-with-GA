import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./configs/database.js";
import mqttService from "./services/mqttService.js";
import binRouter from "./routes/binRoutes.js";
import solutionRouter from "./routes/solutionRoutes.js";
import simulationRouter from "./routes/simulationRoutes.js";
import trackingRouter from "./routes/trackingRoutes.js";
import optimizeRouter from "./routes/optimizeRoutes.js";

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
  res.send('Welcome to Waste Collection Management API Capstone E09');
});

mqttService.connect();

process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  mqttService.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(
    `Server backend Capstone E09 running on port http://localhost:${PORT}`
  );
});
