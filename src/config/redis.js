const redis = require("redis");
const logger = require("../utils/logger");
const { USE_REDIS, REDIS_URL } = require("./env");

let client = null;

if (USE_REDIS) {
  client = redis.createClient({ url: REDIS_URL });
  client.on("error", (err) => logger.error("❌ Redis Error:", err));
  client.on("connect", () => logger.info("✅ Redis connected"));
  client.connect().catch(console.error);
}

getCache = async (key) => {
  if (!client || !client.isReady) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis Get Error: ${err.message}`);
    return null;
  }
};

setCache = async (key, value, expiry = 30) => {
  if (!client || !client.isReady) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: expiry });
  } catch (err) {
    logger.error(`Redis Set Error: ${err.message}`);
  }
};

delCache = async (key) => {
  if (!client || !client.isReady) return;
  try {
    await client.del(key);
  } catch (err) {
    logger.error(`Redis Del Error: ${err.message}`);
  }
};

// At the bottom of config/redis.js
module.exports = {
  getCache,
  setCache,
  delCache,
  redisClient: client 
};


// const redis = require("redis");

// let client = null;

// if (process.env.USE_REDIS === "true") {

//   client = redis.createClient({
//     url: process.env.REDIS_URL
//   });

//   client.connect()
//     .then(() => console.log("✅ Redis connected"))
//     .catch(err => console.log("❌ Redis error", err));

// }

// module.exports = client;