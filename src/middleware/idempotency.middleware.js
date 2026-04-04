const { getCache, setCache } = require("../config/redis");
const logger = require("../utils/logger");

exports.idempotency = async (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  
  const key = req.headers['x-idempotency-key'];
  if (!key) return next();

  const cacheKey = `idempotency:${req.user?.id}:${key}`;
  const cachedResponse = await getCache(cacheKey);

  if (cachedResponse) {
    logger.info("Idempotency cache hit", { key, path: req.path });
    return res.status(200).json(cachedResponse);
  }

  // Intercept res.json to save the response to Redis before sending it
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Cache successful mutations for 24 hours
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setCache(cacheKey, body, 86400); 
    }
    return originalJson(body);
  };

  next();
};