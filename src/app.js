const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const routes = require("./routes");
const globalErrorHandler = require("./middleware/error.middleware");
const AppError = require("./utils/AppError");
const httpContext = require('express-http-context');
const { v4: uuid } = require("uuid");

const app = express();


app.use(httpContext.middleware);
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || uuid();
  httpContext.set('reqId', reqId);
  res.setHeader('x-request-id', reqId); // Send back to client
  next();
});



// 1. Define options in a variable
const corsOptions = {
  origin: [
    'https://taskforge.space',
    'https://www.taskforge.space',
    'https://astounding-belekoy-ffcfef.netlify.app', 
    'http://localhost:4200' 
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Accept', 'Origin', 'X-Requested-With'], 
  credentials: true,
  optionsSuccessStatus: 204 // Explicitly set this so we know when Express handles it
};

// 2. Apply it globally
app.use(cors(corsOptions));


app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" })); 


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Mount router
app.use("/api/v1", routes);

app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;


