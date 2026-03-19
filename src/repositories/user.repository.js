const prisma = require("../config/prisma");

exports.createUser = (data) => prisma.users.create({ data });
																																								  
exports.getUserByEmail = (email) => prisma.users.findFirst({ where: { email, deleted_at: null } });
																		  
exports.getUserById = (id) => prisma.users.findFirst({ where: { id, deleted_at: null } });
exports.findAll = () => prisma.users.findMany({ select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, status: true } });
exports.findByRole = (role) => prisma.users.findMany({ where: { role }, select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, status: true } });
exports.updateUser = (id, data) => prisma.users.update({ where: { id }, data, select: { id: true, email: true, username: true, role: true, status: true } });

exports.findAllPaginated = async (skip, take, role) => {
  const where = { deleted_at: null, ...(role && { role }) };
  const [data, total] = await Promise.all([
    prisma.users.findMany({ where, skip, take, select: { id: true, email: true, username: true, role: true } }),
    prisma.users.count({ where })
  ]);
  return { data, total };
};

// SOFT DELETE with Unique Constraint Bypass
exports.deleteUser = async (id, email, username) => {
  const timestamp = Date.now();
  return prisma.users.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      email: `${email}_deleted_${timestamp}`,
      username: `${username}_deleted_${timestamp}`
    }
  });
};
// const prisma = require("../config/prisma")

// exports.createUser = (data)=>{
//  return prisma.users.create({data})
// }

// exports.getUserByEmail = (email)=>{
//  return prisma.users.findUnique({
//   where:{email}
//  })
// }

// exports.getUserById = (id)=>{
//  return prisma.users.findUnique({
//   where:{id}
//  })
// }