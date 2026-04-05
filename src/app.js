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



app.use(cors({
 origin: [
    'https://taskforge.space',
    'https://www.taskforge.space',
    'https://astounding-belekoy-ffcfef.netlify.app', 
    'http://localhost:4200' 
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Added some standard headers browsers often send during preflight just to be safe
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Accept', 'Origin', 'X-Requested-With'], 
  credentials: true
}));


app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" })); 



// app.use(cors({
//   origin: "https://astounding-belekoy-ffcfe.netlify.app"
// }));

// app.use(cors({
//   origin: "http://localhost:4200", // your frontend
//   methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
//   credentials: true
// }));

//app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Mount router
app.use("/api/v1", routes);

// Handle undefined Routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;


// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const morgan = require("morgan");


// const authMiddleware = require("./middleware/auth.middleware");
// const auditMiddleware = require("./middleware/audit.middleware");


// const authRoutes = require("./routes/auth.routes");
// const userRoutes = require("./routes/users.routes");
// const projectRoutes = require("./routes/project.routes");
// const taskRoutes = require("./routes/task.routes");



// const app = express();

// /* Security headers */
// app.use(helmet());

// /* Logging */
// app.use(morgan("combined"));

// /* Rate limiting */
// const limiter = rateLimit({
//  windowMs: 15 * 60 * 1000,
//  max: 200
// });

// app.use(limiter);

// app.use(cors());
// app.use(express.json());





// app.use("/api/auth", authRoutes);
// app.use("/api/users", authMiddleware, auditMiddleware, userRoutes);
// app.use("/api/projects",authMiddleware, auditMiddleware, projectRoutes);
// app.use("/api/tasks", authMiddleware, auditMiddleware, taskRoutes);


// module.exports = app;