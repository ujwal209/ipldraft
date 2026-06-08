import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILiveDraft extends Document {
  roomId: string;
  host: mongoose.Types.ObjectId;
  guest?: mongoose.Types.ObjectId;
  status: 'waiting' | 'active' | 'completed';
  draftOptions: {
    team: { name: string; code: string; color: string; logo: string };
    year: number;
    players: { id: string; name: string; image: string; role: string; isForeign: boolean }[];
  };
  hostRoster: any[];
  guestRoster: any[];
  currentTurn: 1 | 2;
  hostAnalysis?: { score: number; analysis: string };
  guestAnalysis?: { score: number; analysis: string };
  createdAt: Date;
  updatedAt: Date;
}

const LiveDraftSchema: Schema<ILiveDraft> = new Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  guest: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting',
  },
  draftOptions: {
    type: Schema.Types.Mixed,
  },
  hostRoster: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  guestRoster: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  currentTurn: {
    type: Number,
    enum: [1, 2],
    default: 1,
  },
  hostAnalysis: {
    score: Number,
    analysis: String,
  },
  guestAnalysis: {
    score: Number,
    analysis: String,
  },
}, { timestamps: true });

const LiveDraft: Model<ILiveDraft> = mongoose.models.LiveDraft || mongoose.model<ILiveDraft>('LiveDraft', LiveDraftSchema);

export default LiveDraft;
