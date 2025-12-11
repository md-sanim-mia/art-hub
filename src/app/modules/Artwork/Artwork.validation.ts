import { z } from "zod";

export const ArtworkSchema = z.object({
    body: z.object({
        name: z.string(),
        email: z.string().email(),
    }),
});
