const authService = require("../services/auth.service");
const { generateToken } = require("../utils/jwt");
const catchAsync = require("../utils/catchAsync");

exports.register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ status: "success", data: user });
});

exports.login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.status(200).json({ status: "success", data: result });
});

exports.refreshToken = catchAsync(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.status(200).json({ status: "success", data: result });
});

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  res.status(200).json({ status: "success", message: "Logged out successfully" });
});


// const authService = require("../services/auth.service")
// const { generateToken } = require("../utils/jwt")

// exports.register = async(req,res,next)=>{
//  try{

//   const user = await authService.register(req.body)

//   res.json(user)

//  }catch(err){
//   next(err)
//  }
// }

// exports.login = async(req,res,next)=>{
//  try{

//     console.log("Data at Login "+req.body.email, req.body.password);

//   const user = await authService.login(req.body.email,req.body.password)

//   const token = generateToken(user)

//   res.json({token})

//  }catch(err){
//   next(err)
//  }
// }