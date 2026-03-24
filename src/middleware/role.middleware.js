const AppError = require("../utils/AppError");

module.exports = (...roles) => {

  

  return (req, res, next) => {

    console.log("Data at middleware",req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden - Insufficient permissions", 403));
    }
    next();
  };
};


// module.exports = (roles = []) => {
//  return (req,res,next)=>{

//     console.log("Data at Role Middleware "+req.user.role);

//   if(!roles.includes(req.user.role)){
//     return res.status(403).json({message:"Forbidden"});
//   }

//   next()
//  }
// }