const taskService = require("../services/task.service");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user);
  res.status(201).json({ status: "success", data: task });
});
exports.assignUsers = catchAsync(async (req, res) => {
  const result = await taskService.assignUsers(req.params.taskId, req.body.users, req.user.id);
  res.status(200).json({ status: "success", data: result });
});
exports.updateStatus = catchAsync(async (req, res) => {

  console.log("Data at Update Tasks ",req.params.taskId, req.body.status_id);
  
  const task = await taskService.updateStatus(req.params.taskId, req.body.status_id);
  res.status(200).json({ status: "success", data: task });
});
exports.rescheduleTask = catchAsync(async (req, res) => {
  const task = await taskService.rescheduleTask(req.params.taskId, req.body.start_date, req.body.due_date);
  res.status(200).json({ status: "success", data: task });
});
exports.deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId);
  res.status(204).json({ status: "success", data: null });
});
exports.getBoard = catchAsync(async (req, res) => {
  const board = await taskService.getBoard(req.params.projectId);
  res.status(200).json({ status: "success", data: board });
});
exports.calendar = catchAsync(async (req, res) => {
  const tasks = await taskService.getCalendar(req.query.start, req.query.end);
  res.status(200).json({ status: "success", data: tasks });
});


// task.controller.js
exports.updateTaskDetails = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskDetails(req.params.taskId, req.body);
  res.status(200).json({ status: "success", data: task });
});

exports.addComment = catchAsync(async (req, res) => {
  const comment = await taskService.addComment(req.params.taskId, req.user.id, req.body.text);
  res.status(201).json({ status: "success", data: comment });
});

exports.getComments = catchAsync(async (req, res) => {

  console.log("Data at getcomments ", req.params.taskId);

  const comments = await taskService.getComments(req.params.taskId);
  res.status(200).json({ status: "success", data: comments });
});

// const taskService = require("../services/task.service")

// exports.createTask = async(req,res,next)=>{
//  try{

//   const task = await taskService.createTask(req.body,req.user)

//   res.json(task)

//  }catch(err){
//   next(err)
//  }
// }

// exports.assignUsers = async(req,res,next)=>{
//  try{

//   const result = await taskService.assignUsers(
//    req.params.taskId,
//    req.body.users,
//    req.user.id
//   )

//   res.json(result)

//  }catch(err){
//   next(err)
//  }
// }

// exports.updateStatus = async(req,res,next)=>{
//  try{

//   const task = await taskService.updateStatus(
//    req.params.taskId,
//    req.body.status_id
//   )

//   res.json(task)

//  }catch(err){
//   next(err)
//  }
// }

// exports.getBoard = async(req,res,next)=>{
//  try{

//   const board = await taskService.getBoard(req.params.projectId)

//   res.json(board)

//  }catch(err){
//   next(err)
//  }
// }

// exports.calendar = async(req,res,next)=>{
//  try{

//   const tasks = await taskService.getCalendar(
//    req.query.start,
//    req.query.end
//   )

//   res.json(tasks)

//  }catch(err){
//   next(err)
//  }
// }

// exports.getTasks = async(req,res,next)=>{

//  const page = Number(req.query.page) || 1
//  const limit = Number(req.query.limit) || 20

//  const tasks = await taskService.getTasks(
//   req.params.projectId,
//   page,
//   limit
//  )

//  res.json(tasks)

// }

// exports.getActivity = async (req,res,next)=>{

//  const logs = await prisma.audit_logs.findMany({
//   where:{
//    entity_type:"TASK",
//    entity_id:req.params.taskId
//   },
//   orderBy:{
//    performed_at:"desc"
//   }
//  })

//  res.json(logs)

// }