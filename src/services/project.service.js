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

exports.getAllProjects = async (page = 1, limit = 10) => {

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const take = limit;

  return await projectRepo.findAllPaginated(skip, take);

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



// const prisma = require("../config/prisma");
// const { v4: uuid } = require("uuid");
// const projectRepo = require("../repositories/project.repository")

// exports.createProject = async (data, user) => {
//    return projectRepo.createProject({
//    id: uuid(),

//     name: data.name,

//     description: data.description,

//     start_date: new Date(data.start_date),

//     end_date: new Date(data.end_date),

//     status: data.status || "ACTIVE",

//     created_by: user.id
//  })
// };


// exports.getBoard = async (projectId) => {

//   const tasks = await prisma.tasks.findMany({
//     where: { project_id: projectId },
//     include: {
//       project: true
//     }
//   });

//   const board = {
//     TODO: [],
//     IN_PROGRESS: [],
//     DONE: []
//   };

//   tasks.forEach(task => {

//     if (task.status_id === 1)
//       board.TODO.push(task);

//     if (task.status_id === 2)
//       board.IN_PROGRESS.push(task);

//     if (task.status_id === 3)
//       board.DONE.push(task);

//   });

//   return board;
// };