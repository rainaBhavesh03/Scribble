import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Word extends Document{
    word: string;
}
export const WordSchema: Schema<Word> = new Schema({
    word: {type: String, required: true},
});


const WordModel = (mongoose.models.Word as mongoose.Model<Word>) || mongoose.model<Word>("Word", WordSchema);
export default WordModel;

