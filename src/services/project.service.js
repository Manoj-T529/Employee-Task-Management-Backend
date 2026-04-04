const projectRepo = require("../repositories/project.repository");
const { v4: uuid } = require("uuid");
const AppError = require("../utils/AppError");
const { delCache } = require("../config/redis");

exports.createProject = async (data, user) => {
  return projectRepo.createProject({
    id: uuid(),
    name: data.name,
    description: data.description || null,
    start_date: data.start_date ? new Date(data.start_date) : null,
    end_date: data.end_date ? new Date(data.end_date) : null,
    status: data.status || "ACTIVE",
    created_by: user.id
  });
};

//exports.getAllProjects = async () => projectRepo.findAll();

exports.getAllProjects = async (limit = 10, cursor = null) => {
  limit = Number(limit) || 10;
  if (limit > 100) limit = 100; // Hard cap limit to prevent DOS attacks

  const { data, total } = await projectRepo.findAllPaginated(limit, cursor);
  
  const nextCursor = data.length > 0 ? data[data.length - 1].id : null;
  return { data, total, nextCursor };
};

exports.updateProject = async (id, data) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError("Project not found", 404);

  await delCache(`board:${id}`);
  return projectRepo.updateProject(id, data);
};

exports.deleteProject = async (id) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new AppError("Project not found", 404);

  await delCache(`board:${id}`);
  return projectRepo.deleteProject(id);
};



