const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./api/config/connectDB");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

//CONFIG ENV
dotenv.config();

//CONNECT TO DB
connectDB(); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// app.use(cors());

//IMPORT ROUTES
// const userRouter = require("./api/routes/userRoutes");

app.get("/", (req, res) => {
  res.send("API Capstone E09");
});

//ROUTES
// app.use("/user", userRouter);


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
// ? End error handling

//SERVER RUN
app.listen(port, () => {
  console.log(
    `Server backend Capstone E09 running on port http://localhost:${port}`
  );
});
