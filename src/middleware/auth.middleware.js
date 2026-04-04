const { verifyToken } = require("../utils/jwt");
const { getCache } = require("../config/redis");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  
  // 1. Extract Token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authorized, no token provided", 401);
  }

  try {
    // 2. Verify token signature and expiry
    const decoded = verifyToken(token);

    // 3. FAANG Standard: Check Redis Blacklist for immediate revocation
    const isBlacklisted = await getCache(`blacklist:${decoded.id}`);
    if (isBlacklisted) {
      logger.warn("Attempt to use blacklisted token", { userId: decoded.id });
      throw new AppError("Session expired or revoked. Please log in again.", 401);
    }

    // 4. Attach user payload to request
    req.user = decoded;
    next();
    
  } catch (err) {
    throw new AppError(err.message || "Invalid or expired token", 401);
  }
});

