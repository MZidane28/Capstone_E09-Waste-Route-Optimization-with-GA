import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./configs/database.js";
import binRouter from "./routes/binRoutes.js";
import solutionRouter from "./routes/solutionRoutes.js";

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/bins',binRouter);
app.use('/api/v1/solutions',solutionRouter);

app.get("/", (req, res) => {
  res.send('Welcome to Waste Collection Management API');
});

app.listen(PORT, () => {
  console.log(
    `Server backend Capstone E09 running on port http://localhost:${PORT}`
  );
});
