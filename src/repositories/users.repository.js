const prisma = require("../config/prisma");

exports.create = (data) => {

  return prisma.users.create({
    data
  });

};


exports.findAll = () => {

  return prisma.users.findMany();

};


exports.findByRole = (role) => {

  return prisma.users.findMany({
    where: { role }
  });

};