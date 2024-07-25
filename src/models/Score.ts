import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Score extends Document {
  userId: Types.ObjectId;
  maxScore: number;
  avgScore: number;
  lastScore: number;
  matchesPlayed: number;
  matchesStarted: number;
}

const ScoreSchema = new Schema<Score>({
  userId: { type: Schema.Types.ObjectId, ref:'User', required: true },
  maxScore: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
  lastScore: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
  matchesStarted: { type: Number, default: 0 }
});

const ScoreModel = (mongoose.models.Score as mongoose.Model<Score>) || mongoose.model<Score>("Score", ScoreSchema);
export default ScoreModel;
