import mongoose, { Schema, Document, Types } from 'mongoose';
import { MessageSchema, Message } from './Message';

export interface Chat extends Document {
    messages: Message[];
    clearOldMessages(currentRound: number, roundDuration: number): Promise<void>;
}

const ChatSchema: Schema<Chat> = new Schema({
    messages: { type: [MessageSchema], ref: "Message" }
});


// Method to clear messages older than the specified round
ChatSchema.methods.clearOldMessages = async function (roundDuration: number) {
    const cutoffTimestamp = new Date(Date.now() - (roundDuration * 2));

    // Filter out messages older than the cutoff
    this.messages = this.messages.filter((message: Message) => message.timestamp > cutoffTimestamp);

    await this.save();
};


const ChatModel = (mongoose.models.Chat as mongoose.Model<Chat>) || mongoose.model<Chat>("Chat", ChatSchema);
export default ChatModel;

// This is embedding of the messages into the Chat collection. This makes querying simpler and the operations atomic while reducing the join overhead.
