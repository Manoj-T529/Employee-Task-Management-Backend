const prisma = require("../config/prisma");

exports.createProject = (data) => prisma.projects.create({ data });
																					  
exports.findById = (id) => prisma.projects.findFirst({ where: { id, deleted_at: null } });
																					  
																		  

exports.findAllPaginated = async (skip, take) => {
  const where = { deleted_at: null };
  const [data, total] = await Promise.all([
    prisma.projects.findMany({ where, skip, take, orderBy: { created_at: "desc" } }),
    prisma.projects.count({ where })
  ]);
  return { data, total };
};

exports.updateProject = (id, data) => prisma.projects.update({ where: { id }, data });
// SOFT DELETE
exports.deleteProject = (id) => prisma.projects.update({ where: { id }, data: { status: "INACTIVE",deleted_at: new Date() } });

// const prisma = require("../config/prisma")

// exports.createProject = (data)=>{
//  return prisma.projects.create({data})
// }

// exports.getProjects = ()=>{
//  return prisma.projects.findMany()
// }