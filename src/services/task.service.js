const taskRepo = require("../repositories/task.repository");
const { getCache, setCache, delCache } = require("../config/redis");
const AppError = require("../utils/AppError");
const { v4: uuid } = require("uuid");
const eventBus = require("../events/eventBus");
const notificationQueue = require("../queues/notification.queue"); // Import Queue
const { broadcastBoardUpdate } = require("../config/socket");
const auditRepo = require("../repositories/audit.repository");
const lookupService = require("./lookup.service");
const logger = require("../utils/logger");
const userRepo = require("../repositories/user.repository");


exports.createTask = async (data, user) => {
  await delCache(`board:${data.project_id}`);
  
  const taskData = {
    id: uuid(),
    project_id: data.project_id,
    title: data.title,
    description: data.description || null,
    reporter_id: user.id,
    status_id: data.status_id ? Number(data.status_id) : 1, 
    priority_id: data.priority_id ? Number(data.priority_id) : 1, // Medium default
    story_points: data.story_points ? Number(data.story_points) : null,
    start_date: data.start_date ? new Date(data.start_date) : null,
    due_date: data.due_date ? new Date(data.due_date) : null
  };

  // 👇 FIX: Safely extract assignees no matter which name the frontend used
  const selectedAssignees = data.assignees || data.task_assignees || [];

  // Pass the safe array to the repository
  const task = await taskRepo.createTaskWithAssignees(taskData, selectedAssignees, user.id);

  // Trigger Queue if assignees exist
  if (selectedAssignees.length > 0) {
    await notificationQueue.add("taskNotification", {
      eventType: "TASK_ASSIGNED",
      data: { taskId: task.id, users: selectedAssignees }
    });
  }

  await taskRepo.logTaskActivity(task.id, "TASK_CREATED", null, { title: task.title }, user.id);

  return task;
};


exports.updateStatus = async (taskId, statusId,userId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  await delCache(`board:${task.project_id}`);
  const updatedTask = await taskRepo.updateTaskStatus(taskId, statusId);

  await auditRepo.logActivity("TASK", taskId, "STATUS_UPDATED", { status: task.status_id }, { status: statusId }, userId); // REAL-TIME BROADCAST: Tell all users in this project that a task moved!
  broadcastBoardUpdate(task.project_id, "TASK_MOVED", updatedTask);

  return updatedTask;
};

exports.assignUsers = async (taskId, users, userId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);
  
  await delCache(`board:${task.project_id}`);
  
  const records = (users || []).map(u => ({ 
    id: uuid(), task_id: taskId, user_id: u, assigned_by: userId 
  }));
  
  // Use the safe transaction wrapper to prevent Race Conditions & Dual-Write issues
  await taskRepo.assignUsersTransaction(taskId, records, users);
  
  eventBus.emit("taskAssigned", { taskId, users });
  return { message: "Assignees updated successfully" };
};

// exports.assignUsers = async (taskId, users, userId) => {
//   const task = await taskRepo.getTaskById(taskId);
//   if (!task) throw new AppError("Task not found", 404);
  
//   await delCache(`board:${task.project_id}`);
  
//   // 1. DELETE existing assignees to avoid duplicates/ghost users
//   await taskRepo.clearTaskAssignees(taskId);
  
//   // 2. INSERT the newly selected assignees (if any)
//   let result = null;
//   if (users && users.length > 0) {
//     const records = users.map(u => ({ 
//       id: uuid(), 
//       task_id: taskId, 
//       user_id: u, 
//       assigned_by: userId 
//     }));
    
//     result = await taskRepo.assignUsers(records);
//     eventBus.emit("taskAssigned", { taskId, users });
//   }
  
//   return result || { message: "All assignees removed" };
// };

// exports.assignUsers = async (taskId, users, userId) => {
//   const task = await taskRepo.getTaskById(taskId);
//   if (!task) throw new AppError("Task not found", 404);
  
//   await delCache(`board:${task.project_id}`);
  
//   const records = (users || []).map(u => ({ 
//     id: uuid(), task_id: taskId, user_id: u, assigned_by: userId 
//   }));
  
//   // Use the safe transaction wrapper to prevent Race Conditions (#4)
//   await taskRepo.assignUsersTransaction(taskId, records, users);
  
//   eventBus.emit("taskAssigned", { taskId, users });
//   return { message: "Assignees updated successfully" };
// };


exports.updateTaskDetails = async (taskId, data,userId) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  
  // Clear board cache since task details changed
  await delCache(`board:${task.project_id}`);

  const updatedTask = taskRepo.updateTaskDetails(taskId, {
    title: data.title,
    description: data.description,
    priority_id: Number(data.priority_id),
    story_points: Number(data.story_points)
  });
  await taskRepo.logTaskActivity(taskId, "DETAILS_UPDATED", null, null, userId);
  return updatedTask;
};


exports.addComment = async (taskId, userId, text) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  // 1. Save the comment to the database
  const commentId = uuid();
  const comment = await taskRepo.addComment({
    id: commentId,
    task_id: taskId,
    user_id: userId,
    comment_text: text
  });

  // 2. Extract @mentions using Regex (e.g., matches "@john_doe")
  const mentionRegex = /@(\w+)/g;
  const mentions = [...text.matchAll(mentionRegex)].map(m => m[1]);

  if (mentions.length > 0) {
    // 3. Remove duplicates & query database for mentioned users
    const uniqueUsernames = [...new Set(mentions)];
    const mentionedUsers = await userRepo.getUsersByUsernames(uniqueUsernames);

    if (mentionedUsers.length > 0) {
      // 4. Send background job to notify users
      const userIdsToNotify = mentionedUsers.map(u => u.id);
      
      await notificationQueue.add("taskNotification", {
        eventType: "COMMENT_MENTION",
        data: { 
          taskId, 
          commentText: text, 
          users: userIdsToNotify // Required to match your worker's logic
        }
      });
    }
  }

  return comment;
};

exports.getComments = async (taskId) => {
  return taskRepo.getComments(taskId);
};


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
  logger.info("Get Board Service", { cacheKey });
  const cached = await getCache(cacheKey);

  // Helper to fetch and cache fresh data
  const fetchAndCacheBoard = async () => {
    const tasks = await taskRepo.getTasksByProject(projectId);
    const statusLookups = await lookupService.getLookupsByType("TASK_STATUS");

    const board = {};
    statusLookups.forEach(status => { board[status.code] = []; });
    tasks.forEach(t => {
      const statusCode = t.status?.code || "UNKNOWN";
      if (!board[statusCode]) board[statusCode] = [];
      board[statusCode].push(t);
    });

    // Store data + a "staleAt" timestamp (e.g., 30 seconds from now)
    const cacheData = { 
      data: board, 
      staleAt: Date.now() + 30 * 1000 
    };
    
    // Cache TTL is much longer (e.g., 1 hour) to ensure we always have stale data to serve
    await setCache(cacheKey, cacheData, 3600); 
    return board;
  };

  // If completely missing, we must fetch synchronously
  if (!cached) {
    return fetchAndCacheBoard();
  }

  // STALE-WHILE-REVALIDATE LOGIC
  // If the cache is stale, trigger a background refresh but DON'T wait for it
  if (Date.now() > cached.staleAt) {
    logger.info("Cache stale, triggering async refresh", { projectId });
    fetchAndCacheBoard().catch(err => logger.error("Background cache refresh failed", err));
  }

  // Return the data instantly (either fresh or slightly stale)
  return cached.data;
};
exports.getCalendar = async (start, end) => {
  if (!start || !end) throw new AppError("Start and End dates required", 400);
  return taskRepo.getCalendarTasks(start, end);
};

exports.getTaskActivity = async (taskId) => {
  return taskRepo.getTaskActivity(taskId);
};

exports.getTaskById = async (taskId) => {
  if (!taskId) {
    throw new Error("Task ID is required");
  }

  const task = await taskRepo.getTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
};

exports.logTime = async (taskId, userId, data) => {
  const task = await taskRepo.getTaskById(taskId);
  if (!task) throw new AppError("Task not found", 404);

  const timeLogData = {
    id: uuid(),
    task_id: taskId,
    user_id: userId,
    hours: Number(data.hours),
    description: data.description || null,
    logged_date: data.logged_date ? new Date(data.logged_date) : new Date()
  };

  const result = await taskRepo.logTaskTimeTransaction(timeLogData);
  
  // Log the activity
  await taskRepo.logTaskActivity(
    taskId, 
    "TIME_LOGGED", 
    { total: task.logged_hours }, 
    { total: result.updatedTask.logged_hours, added: data.hours }, 
    userId
  );

  return result.timeLog;
};

exports.getTimeLogs = async (taskId) => {
  return taskRepo.getTaskTimeLogs(taskId);
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