const prisma = require("../config/prisma");

exports.createProject = (data) => prisma.projects.create({ data });
																					  
exports.findById = (id) => prisma.projects.findFirst({ where: { id, deleted_at: null } });
																					  
																		  

exports.findAllPaginated = async (limit, cursor) => {
  const where = {};
  
  const queryArgs = {
    take: limit,
    orderBy: { created_at: "desc" },
    where
  };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1; // Skip the cursor itself
  }

  const [data, total] = await Promise.all([
    prisma.projects.findMany(queryArgs),
    prisma.projects.count({ where })
  ]);
  
  return { data, total };
};

exports.updateProject = (id, data) => prisma.projects.update({ where: { id }, data });
// SOFT DELETE
// repositories/project.repository.js

exports.deleteProject = async (id) => {
  const timestamp = new Date();

  // Use a transaction to ensure both the project and its tasks are soft-deleted together!
  return prisma.$transaction([
    
    // 1. Soft delete the Project
    prisma.projects.update({ 
      where: { id }, 
      data: { 
        status: "INACTIVE", 
        deleted_at: timestamp 
      } 
    }),

    // 2. Soft delete ALL Tasks inside this project (Manual Cascade)
    prisma.tasks.updateMany({
      where: { 
        project_id: id,
        deleted_at: null // Only update tasks that aren't already deleted
      },
      data: { 
        deleted_at: timestamp 
      }
    })

  ]);
};
// const prisma = require("../config/prisma")

// exports.createProject = (data)=>{
//  return prisma.projects.create({data})
// }

// exports.getProjects = ()=>{
//  return prisma.projects.findMany()
// }