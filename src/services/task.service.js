const taskRepo = require("../repositories/task.repository");
const { getCache, setCache, delCache } = require("../config/redis");
const AppError = require("../utils/AppError");
const { v4: uuid } = require("uuid");
const eventBus = require("../events/eventBus");
const notificationQueue = require("../queues/notification.queue"); // Import Queue
const { broadcastBoardUpdate } = require("../config/socket");

exports.createTask = async (data, user) => {
  await delCache(`board:${data.project_id}`);
  
  const taskData = {
    id: uuid(),
    project_id: data.project_id,
    title: data.title,
    description: data.description || null,
    reporter_id: user.id,
    status_id: data.status_id || 1,
    priority_id: data.priority_id || 1,
    story_points: data.story_points || null,
    start_date: data.start_date ? new Date(data.start_date) : null,
    due_date: data.due_date ? new Date(data.due_date) : null
  };

  const task = await taskRepo.createTaskWithAssignees(taskData, data.assignees, user.id);

  // Trigger Queue if assignees exist
  if (data.assignees && data.assignees.length > 0) {
    await notificationQueue.add("taskNotification", {
      eventType: "TASK_ASSIGNED",
      data: { taskId: task.id, users: data.assignees }
    });
  }

  return task;
};

exports.assignUsers = async (taskId, users, userId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);
  
  await delCache(`board:${task.project_id}`);
  const records = users.map(u => ({ id: uuid(), task_id: taskId, user_id: u, assigned_by: userId }));
  
  const result = await taskRepo.assignUsers(records);
  eventBus.emit("taskAssigned", { taskId, users });
  return result;
};
exports.updateStatus = async (taskId, statusId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  await delCache(`board:${task.project_id}`);
  const updatedTask = await taskRepo.updateTaskStatus(taskId, statusId);

  // REAL-TIME BROADCAST: Tell all users in this project that a task moved!
  broadcastBoardUpdate(task.project_id, "TASK_MOVED", updatedTask);

  return updatedTask;
};

// exports.updateStatus = async (taskId, statusId) => {
//   const task = await taskRepo.getTaskById(taskId);
//   if (!task) throw new AppError("Task not found", 404);

//   await delCache(`board:${task.project_id}`);
//   return taskRepo.updateTaskStatus(taskId, statusId);
// };

exports.rescheduleTask = async (taskId, startDate, dueDate) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  await delCache(`board:${task.project_id}`);
  return taskRepo.updateTaskDetails(taskId, {
    start_date: startDate ? new Date(startDate) : null,
    due_date: dueDate ? new Date(dueDate) : null
  });
};

exports.deleteTask = async (taskId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  await delCache(`board:${task.project_id}`);
  return taskRepo.deleteTask(taskId);
};

exports.getBoard = async (projectId) => {
  const cacheKey = `board:${projectId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const tasks = await taskRepo.getTasksByProject(projectId);
  const board = {
    TODO: tasks.filter(t => t.status_id === 1),
    IN_PROGRESS: tasks.filter(t => t.status_id === 2),
    DONE: tasks.filter(t => t.status_id === 3)
  };

  await setCache(cacheKey, board, 30);
  return board;
};

exports.getCalendar = async (start, end) => {
  if (!start || !end) throw new AppError("Start and End dates required", 400);
  return taskRepo.getCalendarTasks(start, end);
};


// const redis = require("../config/redis")
// const taskRepo = require("../repositories/task.repository")
// const { v4:uuid } = require("uuid")
// const eventBus = require("../events/eventBus")

// exports.createTask = async (data,user)=>{
//     await redis.del(`board:${task.project_id}`)
//  return taskRepo.createTask({
//   id:uuid(),
//   project_id:data.project_id,
//   title:data.title,
//   description:data.description,
//   reporter_id:user.id,
//   status_id:data.status_id,
//   priority_id:data.priority_id,
//   start_date:data.start_date,
//   due_date:data.due_date
//  })

// }

// exports.assignUsers = async(taskId,users,userId)=>{
//     await redis.del(`board:${task.project_id}`)
//  const records = users.map(u=>({
//   id:uuid(),
//   task_id:taskId,
//   user_id:u,
//   assigned_by:userId
//  }))

//  eventBus.emit("taskAssigned",{
//  taskId,
//  users
// })

//  return taskRepo.assignUsers(records)
// }

// exports.updateStatus = async (taskId,statusId)=>{
//  await redis.del(`board:${task.project_id}`)
//  return taskRepo.updateTaskStatus(taskId,statusId)
// }

// exports.getBoard = async(projectId)=>{

//  const [todo,inprogress,done] = await Promise.all([

//   taskRepo.getTasksByStatus(projectId,1),
//   taskRepo.getTasksByStatus(projectId,2),
//   taskRepo.getTasksByStatus(projectId,3)

//  ])

//  return {
//   TODO:todo,
//   IN_PROGRESS:inprogress,
//   DONE:done
//  }

// }

// exports.getBoard = async (projectId)=>{

//  const cacheKey = `board:${projectId}`

//  const cached = await redis.get(cacheKey)

//  if(cached){
//   return JSON.parse(cached)
//  }

//  const tasks = await taskRepo.getTasksByProject(projectId)

//  const board = {
//   TODO:tasks.filter(t=>t.status_id===1),
//   IN_PROGRESS:tasks.filter(t=>t.status_id===2),
//   DONE:tasks.filter(t=>t.status_id===3)
//  }

//  await redis.set(cacheKey,JSON.stringify(board),{
//   EX:30
//  })

//  return board
// }
// exports.getCalendar = (start,end)=>{
//  return taskRepo.getCalendarTasks(start,end)
// }

// exports.addComment = (taskId,text,userId)=>{
//  return taskRepo.addComment({
//   id:uuid(),
//   task_id:taskId,
//   user_id:userId,
//   comment_text:text
//  })
// }

// exports.getTasks = (projectId,page=1,limit=20)=>{

//  return taskRepo.getTasksPaginated(projectId,page,limit)

// }

// exports.logTaskActivity = async (taskId, action, oldValue, newValue, userId) => {

//   return prisma.audit_logs.create({
//     data: {
//       id: uuid(),
//       entity_type: "TASK",
//       entity_id: taskId,
//       action,
//       old_value: oldValue,
//       new_value: newValue,
//       performed_by: userId
//     }
//   });

// };