import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Message extends Document{
    userId: Types.ObjectId;
    content: string;
    timestamp: Date;
    isCorrect: boolean;
}
export const MessageSchema: Schema<Message> = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    content: {type: String, required: true},
    timestamp: {type: Date, default: Date.now },
    isCorrect: {type: Boolean, default: false}
});


const MessageModel = (mongoose.models.Message as mongoose.Model<Message>) || mongoose.model<Message>("Message", MessageSchema);
export default MessageModel;
