import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Room extends Document{
    players: Types.ObjectId[],
    currentDrawer: Types.ObjectId,
    currentWord: string,
    currentRound: number,
    maxRounds: number,
    roundDuration: number,
    //chatId: Types.ObjectId,
    hints: number,
    gameState: string,
    wordChoices: string[],
    maxPlayers: number,
    canStart: () => boolean,
    setCurrentDrawer: () => void,
}

const RoomSchema: Schema<Room> = new Schema ({
    //host: { type: Object, required: true },
    players: [{ type: Schema.Types.ObjectId, unique: true, ref: "User" }],
    currentDrawer: { type: Schema.Types.ObjectId, ref: "User"},
    currentWord: { type: String},
    currentRound: { type: Number, default: 1 },
    maxRounds: { type: Number, default: 3 },
    roundDuration: { type: Number, default: 80000 },
    //chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    hints: { type: Number, default: 2 },
    gameState: { type: String },
    wordChoices: [{ type: String }],
    maxPlayers: { type: Number, default: 8 },
    //settings: { type: Object, required: true },
    //isPrivate: { type: Boolean, required: true },
    //password: { type: String, required: false },
});

// Method to check if there are exactly 3 players
RoomSchema.methods.canStart = function (): boolean {
    return this.players.length === 3;
};

// Method to set currentDrawer as the ID of the most recent player joining
RoomSchema.methods.setCurrentDrawer = function (): void {
    if (this.players.length > 0) {
        this.currentDrawer = this.players[this.players.length - 1]; // Set currentDrawer to the ID of the most recent player
    }
};

// Middleware to enforce players list size by removing the newest player if it exceeds maxPlayers
RoomSchema.pre('save', function (next) {
    if (this.players.length > this.maxPlayers) {
        this.players.pop(); // Remove the newest player
    } else {
        this.setCurrentDrawer();
    }
    next();
});

// Custom validation to enforce maxPlayers
RoomSchema.path('players').validate(function (players: Types.ObjectId[]) {
    return players.length <= this.maxPlayers;
}, 'Players list exceeds the maximum allowed number of players.');



const RoomModel = (mongoose.models.Room as mongoose.Model<Room>) || mongoose.model<Room>("Room", RoomSchema);
export default RoomModel;
