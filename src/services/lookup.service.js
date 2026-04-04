// services/lookup.service.js
const prisma = require("../config/prisma");
const { getCache, setCache } = require("../config/redis");

exports.getLookupsByType = async (type) => {
  const cacheKey = `lookups:${type}`;
  let lookups = await getCache(cacheKey);
  
  if (!lookups) {
    lookups = await prisma.lookups.findMany({ 
      where: { type }, 
      orderBy: { display_order: 'asc' } 
    });
    await setCache(cacheKey, lookups, 86400); // Cache for 24 hours
  }
  return lookups;
};