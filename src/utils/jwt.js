const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

exports.generateAccessToken  = (user) => {
  return jwt.sign({ id: user.id,email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
};

exports.generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
};


exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// const jwt = require("jsonwebtoken");

// exports.generateToken = (user) => {
//   return jwt.sign(
//     { id: user.id, email: user.email,role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRE }
//   );
// };