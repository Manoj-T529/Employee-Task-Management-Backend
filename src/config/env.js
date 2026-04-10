require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  USE_REDIS: process.env.USE_REDIS === "true",
};
