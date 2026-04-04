const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const prisma = require("../config/prisma"); // Required to fetch real user emails

// 1. Configure the Brevo SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // "smtp-relay.brevo.com"
  port: process.env.SMTP_PORT, // 587
  secure: false, // MUST be false for port 587 (uses STARTTLS)
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  }
});

const worker = new Worker("notifications", async (job) => {
  const { eventType, data } = job.data;

  if (eventType === "TASK_ASSIGNED") {
    try {
      // 1. Fetch the actual users from your database dynamically
      const usersToEmail = await prisma.users.findMany({
        where: { 
          id: { in: data.users } 
        },
        select: { email: true, first_name: true } 
      });

      // 2. Loop through every assigned user and send them an email
      for (const user of usersToEmail) {
        
        // Safety check: Skip if they don't have an email
        if (!user.email) continue; 

        // 3. Send the email via Brevo
        const info = await transporter.sendMail({
          
          // ⚠️ IMPORTANT: This MUST be an email address you verified in Brevo!
          from: '"TaskFlow Admin" <manojts529@gmail.com>', 
          
          to: user.email, // The real employee's email from the database
          subject: `New Task Assignment in TaskFlow`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f4f6fb; border-radius: 8px;">
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h2 style="color: #6366f1; margin-top: 0;">TaskFlow Notification</h2>
                <p style="color: #333; font-size: 16px;">Hello <strong>${user.first_name || 'Teammate'}</strong>,</p>
                <p style="color: #555; font-size: 15px;">You have been assigned to a new task (<strong>#${data.taskId.substring(0,8)}</strong>).</p>
                <p style="color: #555; font-size: 15px;">Please log into your TaskFlow dashboard to view the details, add story points, and update its status.</p>
                <br/>
                <p style="color: #888; font-size: 14px;">Best regards,<br/><strong>The TaskFlow System</strong></p>
              </div>
            </div>
          `
        });

        // Logs the actual message ID from Brevo to prove it was accepted by their servers
        logger.info(`✅ Email successfully sent to ${user.email}. MessageId: ${info.messageId}`);
      }

    } catch (error) {
      // If Brevo rejects it (e.g. bad password, unverified sender), it will print the EXACT error here!
      logger.error(`❌ Failed to send email via Brevo: ${error.message}`);
      throw error; // Throws error so BullMQ knows the job failed and can retry it later
    }
  }
  else if (eventType === "COMMENT_MENTION") {
  try {
    const usersToEmail = await prisma.users.findMany({
      where: { id: { in: data.users } },
      select: { email: true, first_name: true }
    });

    for (const user of usersToEmail) {
      if (!user.email) continue;

      const info = await transporter.sendMail({
        from: '"TaskFlow Admin" <manojts529@gmail.com>',
        to: user.email,
        subject: `You were mentioned in a task!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f4f6fb;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #6366f1;">Hello ${user.first_name || 'Teammate'},</h3>
              <p>You were mentioned in a comment on Task <strong>#${data.taskId.substring(0,8)}</strong>.</p>
              <blockquote style="border-left: 4px solid #6366f1; padding-left: 15px; color: #555; font-style: italic; background: #f9f9f9; padding: 10px;">
                "${data.commentText}"
              </blockquote>
              <p>Log in to TaskFlow to reply.</p>
            </div>
          </div>
        `
      });
      logger.info(`✅ Mention Email sent to ${user.email}. MessageId: ${info.messageId}`);
    }
  } catch (error) {
    logger.error(`❌ Failed to send mention email: ${error.message}`);
    throw error;
  }
}

}, { connection: { url: process.env.REDIS_URL } });

worker.on("completed", (job) => logger.info(`[BULLMQ] Job ${job.id} completed successfully`));
worker.on("failed", (job, err) => logger.error(`[BULLMQ] Job ${job.id} failed: ${err.message}`));