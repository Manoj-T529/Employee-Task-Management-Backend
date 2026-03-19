const service = require("../services/users.service");
const catchAsync = require("../utils/catchAsync");

exports.create = catchAsync(async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json({ status: "success", data: user });
});
exports.getAll = catchAsync(async (req, res) => {
  const users = await service.getUsers();
  res.status(200).json({ status: "success", data: users });
});
exports.getEmployees = catchAsync(async (req, res) => {
  const users = await service.getEmployees();
  res.status(200).json({ status: "success", data: users });
});
exports.updateUser = catchAsync(async (req, res) => {
  const user = await service.updateUser(req.params.id, req.body);
  res.status(200).json({ status: "success", data: user });
});
exports.deleteUser = catchAsync(async (req, res) => {
  await service.deleteUser(req.params.id);
  res.status(204).json({ status: "success", data: null });
});


// const service = require("../services/users.service");

// exports.create = async (req, res, next) => {

//   try {

//     const user =
//       await service.createUser(req.body);

//     res.json(user);

//   } catch (err) {

//     next(err);

//   }

// };


// exports.getAll = async (req, res, next) => {

//   try {

//     const users =
//       await service.getUsers();

//     res.json(users);

//   } catch (err) {

//     next(err);

//   }

// };


// exports.getEmployees = async (req, res, next) => {

//   try {

//     const users =
//       await service.getEmployees();

//     res.json(users);

//   } catch (err) {

//     next(err);

//   }

// };