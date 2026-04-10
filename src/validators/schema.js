const { z } = require('zod');

// -- AUTH --
exports.authSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters")
  })
});

exports.registerSchema = z.object({
  body: z.object({
    first_name: z.string().min(2, "First name required").optional(),
    last_name: z.string().optional(),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional().default("EMPLOYEE")
  })
});

// -- PROJECTS --
exports.projectSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Project name must be at least 3 characters"),
    description: z.string().optional(),
    start_date: z.string().datetime().optional().nullable(),
    end_date: z.string().datetime().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional()
  })
});

// -- TASKS --
exports.createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(255),
    description: z.string().max(1000).optional().nullable(),
    project_id: z.string().uuid("Invalid project ID format"),
    priority_id: z.number().int().min(1).max(3),
    status_id: z.number().int().min(1).max(3).optional().default(1),
    story_points: z.number().int().nonnegative().optional().nullable(),
    start_date: z.string().datetime().optional().nullable(),
    due_date: z.string().datetime().optional().nullable(),
    assignees: z.array(z.string().uuid()).optional().default([])
  }).refine(data => {
    if (data.start_date && data.due_date) {
      return new Date(data.due_date) >= new Date(data.start_date);
    }
    return true;
  }, { message: "Due date cannot be earlier than start date", path: ["due_date"] })
});

exports.logTimeSchema = z.object({
  params: z.object({
    taskId: z.string().uuid("Invalid Task ID")
  }),
  body: z.object({
    hours: z.number().positive("Hours must be greater than 0"),
    description: z.string().max(255).optional(),
    logged_date: z.string().datetime().optional()
  })
});

exports.uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid ID format")
  })
});