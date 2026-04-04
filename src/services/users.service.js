const userRepo = require("../repositories/user.repository");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const AppError = require("../utils/AppError");
const { getPagination, formatPaginatedResponse } = require("../utils/pagination");
const { setCache, getCache, delCache } = require("../config/redis");

exports.createUser = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  return userRepo.createUser({
    id: uuid(),
    email: data.email,
    username: data.username,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    password_hash: hash,
    role: data.role || "EMPLOYEE",
    status: "ACTIVE"
  });
};


exports.getEmployees = () => userRepo.findByRole("EMPLOYEE");

exports.updateUser = async (id, data) => {
  const user = await userRepo.getUserById(id);
  if (!user) throw new AppError("User not found", 404);
  return userRepo.updateUser(id, {
    username: data.username,
    first_name: data.first_name,
    last_name: data.last_name,
    status: data.status,
    role: data.role
  });
};

exports.deleteUser = async (id) => {

  
  const user = await userRepo.getUserById(id);
  if (!user) throw new AppError("User not found", 404);
  
  // Revoke token and soft delete
  await delCache(`rt:${id}`);
  return userRepo.deleteUser(id, user.email, user.username);
};

exports.getUsers = async (limit = 10, cursor = null) => {
  limit = Number(limit) || 10;
  if (limit > 100) limit = 100;
  const { data, total } = await userRepo.findAllPaginated(limit, cursor);
  const nextCursor = data.length > 0 ? data[data.length - 1].id : null;
  return { data, total, nextCursor };
};

// const repo = require("../repositories/users.repository");
// const bcrypt = require("bcrypt");
// const { v4: uuid } = require("uuid");

// exports.createUser = async (data) => {

//   const hash =
//     await bcrypt.hash(data.password, 10);

//   return repo.create({

//     id: uuid(),

//     email: data.email,

//     username: data.username,

//     password_hash: hash,

//     role: data.role,

//     status: "ACTIVE"

//   });

// };


// exports.getUsers = () => {

//   return repo.findAll();

// };


// exports.getEmployees = () => {

//   return repo.findByRole("EMPLOYEE");

// };