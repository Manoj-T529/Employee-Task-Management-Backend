const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { JWT_SECRET } = require("../config/env");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized - No Token Provided", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return next(new AppError("Unauthorized - Invalid Token", 401));
  }
};




// const jwt = require("jsonwebtoken");

// module.exports = (req, res, next) => {

//     if (req.path.startsWith("/api/auth")) {
//     return next(); 
//   }

//   const token = req.headers.authorization?.split(" ")[1];

//   console.log("Token at auth middleware "+token);

//   if (!token) return res.status(401).json({ message: "Unauthorized" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };