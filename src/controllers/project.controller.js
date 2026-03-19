const projectService = require("../services/project.service");
const catchAsync = require("../utils/catchAsync");
const { getPagination, formatPaginatedResponse } = require("../utils/pagination");

exports.createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  res.status(201).json({ status: "success", data: project });
});
exports.getAllProjects = catchAsync(async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query.page, req.query.limit);
  const { data, total } = await projectService.getAllProjects(skip, take);
  
  res.status(200).json({ 
    status: "success", 
    ...formatPaginatedResponse(data, total, page, limit)
  });
});
exports.updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.status(200).json({ status: "success", data: project });
});
exports.deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.status(204).json({ status: "success", data: null });
});


// const projectService = require("../services/project.service");

// exports.createProject = async (req, res, next) => {
//   try {
//     const project = await projectService.createProject(req.body, req.user);
//     res.status(201).json(project);
//   } catch (err) {
//     next(err);
//   }
// };


// exports.getBoard = async (req, res, next) => {
//   try {
//     const board = await taskService.getBoard(req.params.projectId);
//     res.json(board);
//   } catch (err) {
//     next(err);
//   }
// };