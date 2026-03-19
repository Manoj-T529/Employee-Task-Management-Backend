const eventBus = require("./eventBus")
const prisma = require("../config/prisma")
const { v4:uuid } = require("uuid")

eventBus.on("audit",async(data)=>{

 await prisma.audit_logs.create({
  data:{
   id:uuid(),
   entity_type:data.entity_type,
   entity_id:data.entity_id,
   action:data.action,
   performed_by:data.userId
  }
 })

})