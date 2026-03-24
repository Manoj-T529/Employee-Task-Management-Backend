const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const logger = require("../config/logger");

// IMPORT PRISMA so you can look up the user's real email!
const prisma = require("../config/prisma"); 

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  }
});

const worker = new Worker("notifications", async (job) => {
  const { eventType, data } = job.data;

  if (eventType === "TASK_ASSIGNED") {
    
    // 1. data.users is the array of user IDs from your task.service.js
    const assignedUserIds = data.users; 

    // 2. Fetch the actual users from your database dynamically
    const usersToEmail = await prisma.users.findMany({
      where: { 
        id: { in: assignedUserIds } 
      },
      select: { email: true, first_name: true } // Only grab what we need
    });

    // 3. Loop through every assigned user and send them an email
    for (const user of usersToEmail) {
      
      // Safety check: Skip if they don't have an email
      if (!user.email) continue; 

      await transporter.sendMail({
        from: '"TaskFlow Admin" <no-reply@taskflow.com>', 
        to: user.email, // <--- TOTALLY DYNAMIC NOW!
        subject: `New Task Assignment in TaskFlow`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h3>Hello ${user.first_name || 'Teammate'},</h3>
            <p>You have been assigned to a new task (<strong>#${data.taskId.substring(0,8)}</strong>).</p>
            <p>Please log into your TaskFlow dashboard to view the details and update its status.</p>
            <br/>
            <p>Best regards,<br/>The TaskFlow System</p>
          </div>
        `
      });

      logger.info(`✅ Email successfully sent to ${user.email} for Task ${data.taskId}`);
    }
  }

}, { connection: { url: process.env.REDIS_URL } });