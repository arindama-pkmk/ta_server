import { z } from "zod";

export const classifyTransactionTextSchema = z.object({
    text: z.string().min(1, "Transaction description text is required for classification."),
});