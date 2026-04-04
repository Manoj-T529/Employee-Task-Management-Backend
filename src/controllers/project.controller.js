const projectService = require("../services/project.service");
const catchAsync = require("../utils/catchAsync");
const { getPagination, formatPaginatedResponse } = require("../utils/pagination");
const logger = require("../utils/logger");

exports.createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  res.status(201).json({ status: "success", data: project });
});
exports.getAllProjects = catchAsync(async (req, res) => {
  const { limit, cursor } = req.query;
  const { data, total, nextCursor } = await projectService.getAllProjects(limit, cursor);
  
  res.status(200).json({ 
    status: "success", 
    data, 
    meta: { total, nextCursor } 
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


