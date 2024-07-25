
import { Server, Socket } from 'socket.io';
import { parse } from 'url';
import next from 'next';
import mongoose, { Types } from 'mongoose';
import UserModel from './models/User';
import RoomModel from './models/Room';
import { createServer } from 'http';
import 'dotenv/config';
import axios from 'axios';
import ScoreModel from './models/Score';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI!;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', err => console.log('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from MongoDB'));


interface scores {
    userId: Types.ObjectId,
    score: number,
    round: number,
}

interface roomData {
    startTime: number,
    timerId: NodeJS.Timeout | null,
    currRound: number,
    word: string[],
    processedUsers: string[],
    guessedUsers: {userId: Types.ObjectId, timestamp: number}[], // timestamp refers to the timer time in miliseconds
    userCnt: number,
    userScore: scores[][], // stores the scores per turn
    isPlaying: boolean,
}

const roomMap: Map<string, roomData> = new Map();



async function processPlayers({ roomId, io, socket }: { roomId: string, io: Server, socket: Socket }) {
    console.log('inside processPlayers');
  const room = await RoomModel.findById(roomId); // Fetch updated room data
  if(!room){
      return;
  }
  else if (room.players.length < 3) {
    roomMap.get(room._id!.toString())!.processedUsers = []; // Reset processed users list if room not found or player count is less than 3
    clearInterval(roomMap.get(room._id!.toString())!.timerId); // Clear timer if set
    roomMap.get(room._id!.toString())!.timerId = null;
    roomMap.get(room._id!.toString())!.isPlaying = false;
    return;
  }

  if(!roomMap.get(room._id!.toString())!.isPlaying){
      roomMap.get(room._id!.toString())!.isPlaying = true;
  }
  else return;

  console.log('getting unprocessed players');
  const playerIds = room.players.filter(id => !roomMap.get(room._id!.toString())!.processedUsers.includes(id.toString())); // Get unprocessed players
  console.log(playerIds);

  if (playerIds.length === 0) {
    console.log('Round has ended! All players processed.');
    clearInterval(roomMap.get(room._id!.toString())!.timerId); // Clear timer if set
    roomMap.get(room._id!.toString())!.timerId = null;
    roomMap.get(room._id!.toString())!.currRound++;
    roomMap.get(room._id!.toString())!.processedUsers = [];
    if(roomMap.get(room._id!.toString())!.currRound === 3){
        // update UserModel with the user scores
        const userTotals: {[userId: string]: number} = {};
        for(const turn of roomMap.get(room._id!.toString())!.userScore){
            for(const ele of turn){
                userTotals[ele.userId.toString()] = (userTotals[ele.userId.toString()] || 0) + ele.score;
            }
        }

        const leaderboard: {[userId: string]: number} = {};
        for(const player of room.players){
            if(userTotals[player.toString()]){
                leaderboard[player.toString()] = userTotals[player.toString()];
            }
        }

        io.to(room._id!.toString()).emit('getLeaderboard', leaderboard);


        const uploadIds: string[] = [];
        for(const turn of roomMap.get(room._id!.toString())!.userScore){
            for(const ele of turn){
                const eleUserId = ele.userId.toString();
                if(ele.round === 0 && leaderboard[eleUserId]){
                    uploadIds.push(eleUserId);
                }
            }
        }

        // more fields update logic is to be implemented
        await ScoreModel.updateMany(
            { userId: { $in: uploadIds }},
            {
                $inc: { matchesStarted: 1, matchesPlayed: 1},
                $set: { lastScore: { $arrayElemAt: [leaderboard, "$userId"] } },
            }                             
        ).then(async () => {
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('Game has ended!!!');

        })
    }
    else {
        io.to(room._id!.toString()).emit('roundEnd', {message: `Round ${roomMap.get(room._id!.toString())!.currRound} has ended!`});
        roomMap.get(room._id!.toString())!.isPlaying = false;
        processPlayers({roomId, io, socket});
    }
    return;
  }

  console.log('getting subject user data');
  const userId = playerIds[playerIds.length-1]; // reverse order
  console.log(userId);


  // NEED TO CHANGE THE LOGIC BELOW
  // socket refers to the user that calls this function.
  

  const user = await UserModel.findById(userId);
  if (user) {
      console.log('inside if to process subject user');
      const res = await axios.post('http://localhost:3000/api/game/get-words', { roomId: room._id });
      socket.emit('getWords', res.data.choice);
      console.log('Choice sent to user');

    let remainingTime = 15000; // 15sec
    // Create a Promise that will resolve when a word is selected or the timer ends
    const selectWord = new Promise<string[]>((resolve) => {
        // Define the listener function separately so it can be detached later
        const wordSelectedListener = (data: string[]) => {
            console.log('inside wordSelectedListener');
            clearInterval(roomMap.get(room._id!.toString())!.timerId!);
            roomMap.get(room._id!.toString())!.timerId = null;
            socket.off('wordSelected', wordSelectedListener);
            resolve(data); // Resolve the promise with the selected word
        };

        socket.on('wordSelected', wordSelectedListener);

        roomMap.get(room._id!.toString())!.timerId = setInterval(() => {
            remainingTime -= 1000;
            const timeLeft = Math.max(0, remainingTime);

            io.to(room._id!.toString()).emit('timerUpdate', timeLeft);

            if (timeLeft === 0) {
                clearInterval(roomMap.get(room._id!.toString())!.timerId!);
                roomMap.get(room._id!.toString())!.timerId = null;
                socket.off('wordSelected', wordSelectedListener);
                resolve(res.data.choice[1]);
            }
        }, 1000);
    });

    console.log('outside if and after getting the word');
    // Wait for the promise to resolve to get the selected word
    const selectedWord = await selectWord;
    roomMap.get(room._id!.toString())!.word = selectedWord; // Update the word with the selected or default word
    socket.emit('wordToDraw', selectedWord[selectedWord.length-1]);
    console.log('Selected word:', selectedWord);



    io.to(room._id!.toString()).emit('drawMessage', `${user.username} has started drawing!`);
    //remainingTime = room.roundDuration;
    remainingTime = 40000;
    console.log('just before the promise', remainingTime);
    let turn = new Promise<void>((resolve) => {
        const turnOverListener = () => {
            console.log('inside the turnOverListener');
            roomMap.get(room._id!.toString())!.word = [];
            clearInterval(roomMap.get(room._id!.toString())!.timerId!);
            roomMap.get(room._id!.toString())!.timerId = null;
            socket.off('turnOver', turnOverListener);
            resolve();
        };

        socket.on('turnOver', turnOverListener);
        console.log('before the timer');

        roomMap.get(room._id!.toString())!.timerId = setInterval(() => {
            remainingTime -= 1000;
            const timeLeft = Math.max(0, remainingTime);

            io.to(room._id!.toString()).emit('timerUpdate', timeLeft);
            if(timeLeft/1000 <= 30){
                io.to(room._id!.toString()).except(socket.id).emit('wordToDraw', roomMap.get(room._id!.toString())!.word[2]);
            } else if(timeLeft/1000 <= 50){
                io.to(room._id!.toString()).except(socket.id).emit('wordToDraw', roomMap.get(room._id!.toString())!.word[1]);
            } else {
                io.to(room._id!.toString()).except(socket.id).emit('wordToDraw', roomMap.get(room._id!.toString())!.word[0]);
            }

            if (timeLeft === 0) {
                roomMap.get(room._id!.toString())!.word = [];
                clearInterval(roomMap.get(room._id!.toString())!.timerId!);
                roomMap.get(room._id!.toString())!.timerId = null;
                socket.off('turnOver', turnOverListener);
                resolve();
            }
        }, 1000);
    });

    await turn;
    console.log('after the promise');
    // Calculating the scores
    let base = -200;
    let total = 0;
    let turnScore: scores[] = [];
    for(const user of roomMap.get(room._id!.toString())!.guessedUsers){
        // const timeTaken = room.roundDuration - user.timestamp;

        const score = user.timestamp/1000000000 + base;
        base += 50;
        total += score;

        turnScore.push({userId: user.userId, score, round: roomMap.get(room._id!.toString())!.currRound});
    }
    turnScore.push({userId, score: (total/(roomMap.get(room._id!.toString())!.guessedUsers.length)), round: roomMap.get(room._id!.toString())!.currRound}); // drawer score
    
    io.to(room._id!.toString()).emit('turnScores', turnScore); // client side will handle the users that didn't guess
    console.log('turn score:', turnScore);
    roomMap.get(room._id!.toString())!.guessedUsers = [];

    roomMap.get(room._id!.toString())!.userScore.push(turnScore);

    roomMap.get(room._id!.toString())!.processedUsers.push(userId.toString());
    console.log(roomMap.get(room._id!.toString())!.processedUsers);

    await new Promise(resolve => setTimeout(resolve, 3000));
    roomMap.get(room._id!.toString())!.isPlaying = false;
    processPlayers({roomId, io, socket});
  } else {
    console.error(`Failed to find user with ID: ${userId}`);
  }
}










app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  
  console.log("up and running");

  const io = new Server(server, {});

  io.on('connection', (socket: Socket) => {
    console.log('a user connected', socket.id);

    try {
      socket.on('joinRoom', async ({ userId }: { userId: string }) => {
        try {
          const _userId = new Types.ObjectId(userId);
          const user = await UserModel.findOne({ _id: _userId });
          if (!user) {
            throw new Error("user doesn't exist");
          }

          let room = await RoomModel.findOne({
            $expr: { $lt: [{ $size: "$players" }, "$maxPlayers"] }
          });

          if (!room) {
            room = new RoomModel({});
            await room.save();
            
            // initialize a new room instance in roomData map
            roomMap.set(room._id!.toString(), {
                startTime: 0,
                timerId: null,
                currRound: 0,
                word: [],
                processedUsers: [],
                guessedUsers: [],
                userCnt: 0,
                userScore: [],
                isPlaying: false,
            });
          }


          socket.join(room._id!.toString());
          io.to(room._id!.toString()).emit("joinMessage", `${user.username} joined the room`); 
          RoomModel.findByIdAndUpdate(room._id!, { $push: { players: _userId } }, { new: true })
          .then(async updatedRoom => {
              if (!updatedRoom) {
                  throw new Error('Room not found');
              }
              console.log(`User ${_userId} added to room ${room._id!}`);

              roomMap.get(room._id!.toString())!.userCnt++;

              const playerIds = updatedRoom?.players;
              const users = await UserModel.find({ _id: { $in: playerIds } }, 'username').exec();
              // Emit playerList event to all clients in the room
              io.to(room._id!.toString()).emit('playerList', users);


              // Game :
              console.log('just before calling the processPlayers function');

              await processPlayers({roomId: room._id!.toString(), io, socket});
              console.log('game has ended!');
          })
          .catch(err => {
              console.error('Error adding user to room:', err);
          });

          socket.on("sendMessage", async ({ message, timestamp }:{ message: string, timestamp: number }) => {
              const word = roomMap.get(room._id!.toString())!.word;
              if(word.length > 0 && word[word.length-1].toLowerCase() === message.trim().toLowerCase()){
                  io.to(room._id!.toString()).emit("getAnswer", `${user.username} has guessed the word!`);
                  roomMap.get(room._id!.toString())!.guessedUsers.push({userId: _userId, timestamp: Date.now()});

                  const roomTemp = await RoomModel.findById(room._id!);
                  if(roomTemp!.players.length-1 === roomMap.get(room._id!.toString())!.guessedUsers.length){
                      io.to(room._id!.toString()).emit('turnOver');
                      console.log('emit turnOver as all have guessed');
                  }
              } else {
                  io.to(room._id!.toString()).emit("getMessage", {message: message, username: user.username});
              }
          });


          socket.on('drawingSend', (data) => {
              // Broadcast the drawing data to all other clients
              console.log('just got data (server)');
              io.to(room._id!.toString()).emit('drawingGet', data);
              console.log('after the data send (server)');
          });
            

          socket.on('disconnect', async () => {
              console.log('user disconnected');
              const updatedRoom = await RoomModel.findByIdAndUpdate(
                  room._id,
                  { $pull: { players: _userId } },
                  { new: true }
              );

              if(roomMap.get(room._id!.toString())!.userCnt-- < 0) roomMap.get(room._id!.toString())!.userCnt = 0;

              const playerIds = updatedRoom?.players;
              const users = await UserModel.find({ _id: { $in: playerIds } }, 'username').exec();
              // Emit playerList event to all clients in the room
              io.to(room._id!.toString()).emit('playerList', users);

              io.to(room._id!.toString()).emit('leaveMessage', `${user.username} left the room`);

              if(playerIds && playerIds.length <= 2){
                  console.log('Game has ended');
                  clearInterval(roomMap.get(room._id!.toString())!.timerId);
                  io.to(room._id!.toString()).emit('endGame', 'Game has ended');
              }
          });

        } catch (error: any) {
          console.log('joinRoom error:', error.message);
        }
      });

    } catch (error: any) {
      console.log('connection error:', error.message);
    }


  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

