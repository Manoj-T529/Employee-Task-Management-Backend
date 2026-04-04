const prisma = require("../config/prisma");

exports.createTaskWithAssignees = async (data, assignees, userId) => {
  // Using $transaction ensures the task AND the event are saved simultaneously. 
  // If the queue fails later, a background worker can safely retry reading from `outbox_events`.
  return prisma.$transaction(async (tx) => {
    const task = await tx.tasks.create({
      data: {
        ...data,
        task_assignees: assignees?.length ? {
          create: assignees.map(uId => ({ id: require("uuid").v4(), user_id: uId, assigned_by: userId }))
        } : undefined
      },
      include: { task_assignees: true }
    });

    if (assignees?.length) {
      await tx.outbox_events.create({
        data: {
          id: require("uuid").v4(),
          topic: "TASK_ASSIGNED",
          payload: { taskId: task.id, users: assignees }
        }
      });
    }

    return task;
  });
};
exports.getTaskById = (id) => prisma.tasks.findFirst({ where: { id } });
exports.clearTaskAssignees = (taskId) => prisma.task_assignees.deleteMany({ where: { task_id: taskId } });
exports.assignUsersTransaction = async (taskId, records, users) => {
  return prisma.$transaction(async (tx) => {
    await tx.task_assignees.deleteMany({ where: { task_id: taskId } });
    if (records.length) {
      await tx.task_assignees.createMany({ data: records });
      // Dual write to Outbox
      await tx.outbox_events.create({
        data: {
          id: require("uuid").v4(),
          topic: "TASK_ASSIGNED_UPDATED",
          payload: { taskId, users }
        }
      });
    }
    return true;
  });
};

//exports.assignUsers = (data) => prisma.task_assignees.createMany({ data });
exports.getTasksByProject = (projectId) => prisma.tasks.findMany({
  where: { project_id: projectId, deleted_at: null },
  include: { 
    task_assignees: true,
    status: true,      // ✅ ADD THIS
    priority: true     // (optional but recommended)
  }
});

// repositories/task.repository.js
exports.assignUsersTransaction = async (taskId, records) => {
  return prisma.$transaction([
    prisma.task_assignees.deleteMany({ where: { task_id: taskId } }),
    prisma.task_assignees.createMany({ data: records })
  ]);
};
exports.updateTaskStatus = (taskId, statusId) => prisma.tasks.update({
  where: { id: taskId },
  data: { status_id: Number(statusId) }
});
exports.updateTaskDetails = (id, data) => prisma.tasks.update({ where: { id }, data });

exports.deleteTask = (id) => prisma.tasks.update({ where: { id }, data: { deleted_at: new Date() } });
																				
// exports.getCalendarTasks = (start, end) => prisma.tasks.findMany({
//   where: { due_date: { gte: new Date(start), lte: new Date(end) } }
// });

// repositories/task.repository.js

// repositories/task.repository.js

exports.getCalendarTasks = (start, end) => {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T23:59:59.999Z`);

  return prisma.tasks.findMany({
    where: { 
      deleted_at: null,
      
      // 👇 THE MAGIC FIX: Ignore tasks if their parent workspace was deleted!
      project: {
        deleted_at: null 
      },

      OR: [
        {
          start_date: { lte: endDate },
          due_date: { gte: startDate }
        },
        {
          start_date: null,
          due_date: { gte: startDate, lte: endDate }
        },
        {
          due_date: null,
          start_date: { gte: startDate, lte: endDate }
        }
      ]
    },
    include: {
      task_assignees: true,
      status: true,
      priority: true
    }
  });
};

exports.addComment = (data) => {
  return prisma.task_comments.create({ data });
};

exports.getComments = (taskId) => {
  return prisma.task_comments.findMany({
    where: { task_id: taskId },
    orderBy: { created_at: "asc" } // Oldest top, newest bottom
  });
};

// --- AUDIT LOGS ---
exports.logTaskActivity = (taskId, action, oldValue, newValue, userId) => {
  return prisma.audit_logs.create({
    data: {
      id: require("uuid").v4(),
      entity_type: "TASK",
      entity_id: taskId,
      action: action,
      old_value: oldValue || {},
      new_value: newValue || {},
      performed_by: userId
    }
  });
};

exports.getTaskActivity = (taskId) => {
  return prisma.audit_logs.findMany({
    where: { entity_type: "TASK", entity_id: taskId },
    orderBy: { performed_at: "desc" }
  });
};

// Add to task.repository.js
exports.logTaskTimeTransaction = async (timeLogData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create the time log
    const timeLog = await tx.time_logs.create({
      data: timeLogData
    });

    // 2. Increment the task's total logged_hours automatically
    const updatedTask = await tx.tasks.update({
      where: { id: timeLogData.task_id },
      data: {
        logged_hours: {
          increment: timeLogData.hours
        }
      }
    });

    return { timeLog, updatedTask };
  });
};

exports.getTaskTimeLogs = (taskId) => {
  return prisma.time_logs.findMany({
    where: { task_id: taskId },
    include: { user: { select: { first_name: true, last_name: true, username: true } } },
    orderBy: { logged_date: 'desc' }
  });
};



