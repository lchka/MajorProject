import {z} from "zod";

export const conditionSchema = z.object ({

name: z
.string()
.trim()

})