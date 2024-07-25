import mongoose, { Document, Schema, Types } from "mongoose";

export interface User extends Document{
    username: string;
    email: string;
    password: string;
    isVerified: boolean;
    isAdmin: boolean;
    verifyToken: string | null;
    verifyTokenExpiry: Date | null;
    forgotPasswordToken: string | null;
    forgotPasswordTokenExpiry: Date | null;
}
const UserSchema: Schema<User> = new Schema({
    username: {type: String, unique: true, trim: true, required: [true, "Username is required"]},
    email: {type: String, unique: true, match: [/.+\@.+\..+/, "Please enter a vaild email"], required: [true, "Email is required"]},
    password: {type: String, required: [true, "Password is required"]},
    isVerified: {type: Boolean, default: false},
    isAdmin: {type: Boolean, default: false},
    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date
});

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema);
export default UserModel;
