const prisma = require("../config/prisma");

exports.logActivity = (entityType, entityId, action, oldValue, newValue, userId) => {
  return prisma.audit_logs.create({
    data: {
      id: require("uuid").v4(),
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      old_value: oldValue || {},
      new_value: newValue || {},
      performed_by: userId
    }
  });
};

exports.getGlobalLogs = () => {
  // Fetch latest 50 global activities
  return prisma.audit_logs.findMany({
    orderBy: { performed_at: "desc" },
    take: 50
  });
};