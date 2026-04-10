const { z } = require('zod');

exports.createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(1000).optional().nullable(),
  project_id: z.string().uuid("Invalid project ID format"),
  priority_id: z.number().int().min(1).max(3),
  status_id: z.number().int().min(1).max(3).optional(),
  story_points: z.number().int().nonnegative().optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  assignees: z.array(z.string().uuid()).optional()
}).refine((data) => {
  if (data.start_date && data.due_date) {
    return new Date(data.due_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "Due date cannot be earlier than start date",
  path: ["due_date"]
});


