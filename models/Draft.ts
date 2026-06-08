import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  id: string;
  name: string;
  role: string;
  image: string;
  isForeign: boolean;
}

export interface IDraft extends Document {
  userId: mongoose.Types.ObjectId;
  teamName: string;
  franchise: string;
  year: number;
  players: IPlayer[];
  score: number;
  analysis: string;
  createdAt: Date;
}

const PlayerSchema = new Schema({
  id: String,
  name: String,
  role: String,
  image: String,
  isForeign: Boolean,
});

const DraftSchema: Schema<IDraft> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  franchise: String,
  year: Number,
  players: [PlayerSchema],
  score: Number,
  analysis: String,
}, { timestamps: true });

const Draft: Model<IDraft> = mongoose.models.Draft || mongoose.model<IDraft>('Draft', DraftSchema);

export default Draft;
