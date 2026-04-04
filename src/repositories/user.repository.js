const prisma = require("../config/prisma");

exports.createUser = (data) => prisma.users.create({ data });
																																								  
exports.getUserByEmail = (email) => prisma.users.findFirst({ where: { email, deleted_at: null } });
																		  
exports.getUserById = (id) => prisma.users.findFirst({ where: { id, deleted_at: null } });
exports.findAll = () => prisma.users.findMany({ select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, status: true } });
exports.findByRole = (role) => prisma.users.findMany({ where: { role }, select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, status: true } });
exports.updateUser = (id, data) => prisma.users.update({ where: { id }, data, select: { id: true, email: true, username: true, role: true, status: true } });

exports.findAllPaginated = async (limit, cursor, role) => {
  const where = { deleted_at: null, ...(role && { role }) };
  const queryArgs = { take: limit, where, select: { id: true, email: true, username: true, role: true } };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1;
  }

  const [data, total] = await Promise.all([
    prisma.users.findMany(queryArgs),
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
      status: "INACTIVE",
      deleted_at: new Date(),
      email: `${email}_deleted_${timestamp}`,
      username: `${username}_deleted_${timestamp}`
    }
  });
};

exports.getUsersByUsernames = (usernames) => {
  return prisma.users.findMany({
    where: { 
      username: { in: usernames }, 
      deleted_at: null 
    },
    select: { id: true, email: true, first_name: true, username: true }
  });
};

