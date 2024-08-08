import z from "zod";

export const CreateTaskSchema = z.object({
  options: z
    .array(
      z.object({
        imageUrl: z.string(),
      }),
    )
    .min(1, "At least one option is required"),
  title: z.string().optional(),
  signature: z.string(),
});

export type CreateTaskType = z.infer<typeof CreateTaskSchema>;

export const SubmitTaskSchema = z.object({
  taskId: z.string(),
  selection: z.string(),
});

export type SubmitTaskType = z.infer<typeof SubmitTaskSchema>;
