const prisma = require("../config/prisma");

exports.createTaskWithAssignees = (data, assignees, userId) => {
  return prisma.tasks.create({
    data: {
      ...data,
      task_assignees: assignees?.length ? {
        create: assignees.map(uId => ({
          id: require("uuid").v4(),
          user_id: uId,
          assigned_by: userId
        }))
      } : undefined
    },
    include: { task_assignees: true }
  });
};
exports.getTaskById = (id) => prisma.tasks.findUnique({ where: { id } });
exports.assignUsers = (data) => prisma.task_assignees.createMany({ data });
exports.getTasksByProject = (projectId) => prisma.tasks.findMany({
  where: { project_id: projectId, deleted_at: null },
  include: { task_assignees: true }
});
exports.updateTaskStatus = (taskId, statusId) => prisma.tasks.update({
  where: { id: taskId },
  data: { status_id: statusId }
});
exports.updateTaskDetails = (id, data) => prisma.tasks.update({ where: { id }, data });

exports.deleteTask = (id) => prisma.tasks.update({ where: { id }, data: { deleted_at: new Date() } });
																				
exports.getCalendarTasks = (start, end) => prisma.tasks.findMany({
  where: { due_date: { gte: new Date(start), lte: new Date(end) } }
});

// const prisma = require("../config/prisma")

// exports.createTask = (data)=>{
//  return prisma.tasks.create({data})
// }

// exports.assignUsers = (data)=>{
//  return prisma.task_assignees.createMany({data})
// }

// exports.getTasksByProject = (projectId)=>{
//  return prisma.tasks.findMany({
//   where:{project_id:projectId},
//   include:{
//    task_assignees:true
//   }
//  })
// }

// exports.updateTaskStatus = (taskId,statusId)=>{
//  return prisma.tasks.update({
//   where:{id:taskId},
//   data:{status_id:statusId}
//  })
// }

// exports.updateStatus = async (taskId, statusId, userId) => {

//  const task = await prisma.tasks.findUnique({ where: { id: taskId } });

//  const updated = await prisma.tasks.update({
//   where: { id: taskId },
//   data: { status_id: statusId }
//  });

//  await prisma.audit_logs.create({
//   data:{
//    id:uuid(),
//    entity_type:"TASK",
//    entity_id:taskId,
//    action:"STATUS_CHANGED",
//    old_value:{status:task.status_id},
//    new_value:{status:statusId},
//    performed_by:userId
//   }
//  })

//  return updated;
// };

// exports.getCalendarTasks = (start,end)=>{
//  return prisma.tasks.findMany({
//   where:{
//    due_date:{
//     gte:start,
//     lte:end
//    }
//   }
//  })
// }

// exports.addComment = (data)=>{
//  return prisma.task_comments.create({data})
// }

// exports.getTasksPaginated = (projectId,page,limit)=>{

//  const skip = (page-1)*limit

//  return prisma.tasks.findMany({
//   where:{project_id:projectId},
//   skip,
//   take:limit,
//   orderBy:{
//    created_at:"desc"
//   }
//  })

// }

// exports.filterTasks = (projectId,status,priority)=>{

//  return prisma.tasks.findMany({
//   where:{
//    project_id:projectId,
//    status_id:status,
//    priority_id:priority
//   }
//  })

// }

// exports.getTasksByStatus = (projectId,statusId)=>{

//  return prisma.tasks.findMany({
//   where:{
//    project_id:projectId,
//    status_id:statusId
//   },
//   orderBy:{
//    updated_at:"desc"
//   },
//   take:100
//  })

// }