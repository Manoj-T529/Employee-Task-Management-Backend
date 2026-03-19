const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const userRepo = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const { generateAccessToken, generateRefreshToken, verifyToken } = require("../utils/jwt");
const { setCache, getCache, delCache } = require("../config/redis");



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
  if (!user || user.deleted_at) throw new AppError("Invalid credentials", 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in Redis (7 days = 604800 seconds)
  await setCache(`rt:${user.id}`, refreshToken, 604800);

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
  await delCache(`rt:${userId}`); // Revoke refresh token
};



// const bcrypt = require("bcrypt");
// const { v4: uuid } = require("uuid");
// const userRepo = require("../repositories/user.repository");
// const AppError = require("../utils/AppError");

// exports.register = async (data) => {
//   const existing = await userRepo.getUserByEmail(data.email);
//   if (existing) throw new AppError("Email already registered", 400);

//   const hash = await bcrypt.hash(data.password, 10);
//   return userRepo.createUser({
//     id: uuid(),
//     email: data.email,
//     username: data.username,
//     first_name: data.first_name || null,
//     last_name: data.last_name || null,
//     password_hash: hash,
//     role: data.role || "EMPLOYEE",
//     status: "ACTIVE"
//   });
// };

// exports.login = async (email, password) => {
//   const user = await userRepo.getUserByEmail(email);
//   if (!user) throw new AppError("Invalid credentials", 401);

//   const valid = await bcrypt.compare(password, user.password_hash);
//   if (!valid) throw new AppError("Invalid credentials", 401);

//   return user;
// };


// const bcrypt = require("bcrypt")
// const { v4:uuid } = require("uuid")
// const userRepo = require("../repositories/user.repository")

// exports.register = async(data)=>{

//     const existing = await userRepo.getUserByEmail(data.email)

// if(existing){
//  throw new Error("Email already registered")
// }

//  const hash = await bcrypt.hash(data.password,10)

//  return userRepo.createUser({
//   id:uuid(),
//   email:data.email,
//   username:data.username,
//   password_hash:hash,
//   role:data.role || "EMPLOYEE",
//   status:"ACTIVE"
//  })

// }

// exports.login = async(email,password)=>{

//  const user = await userRepo.getUserByEmail(email)

//  if(!user) throw new Error("Invalid credentials")

//  const valid = await bcrypt.compare(password,user.password_hash)

//  if(!valid) throw new Error("Invalid credentials")

//  return user

// }