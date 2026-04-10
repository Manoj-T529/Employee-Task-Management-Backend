const taskService = require("../services/task.service");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

exports.createTask = catchAsync(async (req, res) => {
  logger.info("Task creation initiated", { userId: req.user.id, payload: req.body });
  const task = await taskService.createTask(req.body, req.user);
  res.status(201).json({ status: "success", data: task });
});


exports.assignUsers = catchAsync(async (req, res) => {
  const result = await taskService.assignUsers(req.params.taskId, req.body.users, req.user.id);
  res.status(200).json({ status: "success", data: result });
});
exports.updateStatus = catchAsync(async (req, res) => {
  logger.info("Task status update", { taskId: req.params.taskId, statusId: req.body.status_id, userId: req.user.id });
  const task = await taskService.updateStatus(req.params.taskId, req.body.status_id, req.user.id);
  res.status(200).json({ status: "success", data: task });
});
exports.rescheduleTask = catchAsync(async (req, res) => {
  logger.info("Reschedule Task", { taskId: req.params.taskId, start_date: req.body.start_date, due_date: req.body.due_date });

  const task = await taskService.rescheduleTask(req.params.taskId, req.body.start_date, req.body.due_date);
  res.status(200).json({ status: "success", data: task });
});
exports.deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId);
  res.status(200).json({ status: "success", data: null });
});
exports.getBoard = catchAsync(async (req, res) => {
  logger.info("Get Board", { projectId: req.params.projectId });
  const board = await taskService.getBoard(req.params.projectId);
  res.status(200).json({ status: "success", data: board });
});
exports.calendar = catchAsync(async (req, res) => {

  logger.info("Get Calendar", { start_date: req.query.start,due_date:req.query.end });
  const tasks = await taskService.getCalendar(req.query.start, req.query.end);
  logger.info("Get Calendar Data", { tasks:tasks });
  res.status(200).json({ status: "success", data: tasks });
});

exports.updateTaskDetails = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const taskData = req.body;
    const userId = req.user.id; 

    // ✅ FAANG Standard: Structured Logging replacing console.log
    logger.info("Updating task details", { taskId, userId });

    const updatedTask = await taskService.updateTaskDetails(taskId, taskData, userId);
    
    // Added standard JSON envelope to match your other controllers
    res.status(200).json({ status: "success", data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.addComment = catchAsync(async (req, res) => {
  const comment = await taskService.addComment(req.params.taskId, req.user.id, req.body.text);
  res.status(201).json({ status: "success", data: comment });
});

exports.getComments = catchAsync(async (req, res) => {
  
  // ✅ FAANG Standard: Structured Logging replacing console.log
  logger.info("Fetching comments", { taskId: req.params.taskId, userId: req.user.id });

  const comments = await taskService.getComments(req.params.taskId);
  res.status(200).json({ status: "success", data: comments });
});

exports.getActivity = catchAsync(async (req, res) => {
  const logs = await taskService.getTaskActivity(req.params.taskId);
  res.status(200).json({ status: "success", data: logs });
});

exports.getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);

  res.status(200).json({
    status: "success",
    data: task
  });
});

// Add to task.controller.js
exports.logTaskTime = catchAsync(async (req, res) => {
  if (!req.body.hours || req.body.hours <= 0) {
    throw new AppError("Please provide valid hours to log", 400);
  }
  
  const timeLog = await taskService.logTime(req.params.taskId, req.user.id, req.body);
  res.status(201).json({ status: "success", data: timeLog });
});

exports.getTaskTimeLogs = catchAsync(async (req, res) => {
  const logs = await taskService.getTimeLogs(req.params.taskId);
  res.status(200).json({ status: "success", data: logs });
});

