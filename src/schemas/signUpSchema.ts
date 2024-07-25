import { z } from "zod";

export const usernameValidation = z.string().min(3, {message: "username must be atleast 3 characters long."}).max(24, {message: "username must be atmost 24 characters long"}).regex(/^[a-za-z0-9_]+$/, {message: "username must not contain special characters except (_)"})

export const signUpSchema = z.object({
        username: usernameValidation,
        email: z.string().email({message: "invalid email address"}),
        password: z.string().min(8, { message: 'password must be at least 8 characters long' }).max(50, { message: 'password must be at most 50 characters long' })
    }
);
