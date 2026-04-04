const auditRepo = require("../repositories/audit.repository");
const catchAsync = require("../utils/catchAsync");

exports.getGlobalActivity = catchAsync(async (req, res) => {
  const logs = await auditRepo.getGlobalLogs();
  res.status(200).json({ status: "success", data: logs });
});