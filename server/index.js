import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send('Welcome to Waste Collection Management API');
});

app.listen(PORT, () => {
  console.log(
    `Server backend Capstone E09 running on port http://localhost:${PORT}`
  );
});
