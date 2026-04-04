const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const { generateAccessToken, generateRefreshToken, verifyToken } = require("../utils/jwt");
const { setCache, getCache, delCache } = require("../config/redis");
const logger = require("../utils/logger");

exports.register = async (data) => {
  const existing = await userRepo.getUserByEmail(data.email);
  if (existing) throw new AppError("Email already registered", 400);

  const hash = await bcrypt.hash(data.password, 10);
  return userRepo.createUser({
    id: uuid(),
    email: data.email,
    username: data.username,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    password_hash: hash,
    role: data.role || "EMPLOYEE",
    status: "ACTIVE"
  });
};

exports.login = async (email, password) => {
  const user = await userRepo.getUserByEmail(email);

  if (!user || user.status !== "ACTIVE") {
    // Generic error to prevent email enumeration attacks
    throw new AppError("Invalid credentials or deactivated user", 401); 
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError("Invalid credentials or deactivated user", 401);

  // FAANG Standard: Access tokens are short-lived (e.g., 15 mins)
  const accessToken = generateAccessToken(user); 
  const refreshToken = generateRefreshToken(user);

  await setCache(`rt:${user.id}`, refreshToken, 604800); // 7 Days
  
  // Clear any existing blacklists for this user upon fresh login
  await delCache(`blacklist:${user.id}`); 

  return { accessToken, refreshToken, user: { id: user.id, role: user.role } };
};

exports.refreshToken = async (token) => {
  if (!token) throw new AppError("Refresh token required", 401);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const storedToken = await getCache(`rt:${decoded.id}`);
  if (storedToken !== token) throw new AppError("Token revoked or invalid", 401);

  const user = await userRepo.getUserById(decoded.id);
  if (!user || user.deleted_at) throw new AppError("User not found", 404);

  const newAccessToken = generateAccessToken(user);
  return { accessToken: newAccessToken };
};

exports.logout = async (userId) => {
  // 1. Delete Refresh token to prevent new access tokens
  await delCache(`rt:${userId}`); 
  
  // 2. Blacklist the user immediately to invalidate current access tokens
  // Note: Your JWT verification middleware should check this key!
  await setCache(`blacklist:${userId}`, "true", 3600); // 1 hour (matching access token expiry)
  
  logger.info("User logged out securely", { userId });
};
