const { PrismaClient } = require('@prisma/client');

const SOFT_DELETE_MODELS = ['users', 'tasks', 'projects'];

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (SOFT_DELETE_MODELS.includes(model) && ['findMany', 'findFirst', 'findUnique', 'count'].includes(operation)) {
          args = args || {};
          args.where = { deleted_at: null, ...args.where };
          
          if (operation === 'findUnique') {
            return prisma[model].findFirst(args);
          }
        }
        return query(args);
      }
    }
  }
});

module.exports = prisma;