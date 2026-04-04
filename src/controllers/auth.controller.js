const authService = require("../services/auth.service");
const { generateToken } = require("../utils/jwt");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

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
  logger.info("Logout requested", { userId: req.user.id });
  await authService.logout(req.user.id);
  res.status(200).json({ status: "success", message: "Logged out successfully" });
});
