import { z } from "zod";

export const applicationSchema = z.object({
  company_name: z.string().min(1),
  role_title: z.string().min(1),
  status: z.string().min(1),
});