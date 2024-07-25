import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import LoadingScreen from '../LoadingScreen/page';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Canvas from '../canvas/page';
import Timer from '../timer/page';
import User from '@/models/User';
import { Types } from 'mongoose';

const MAX_MESSAGES = 500;

interface Message {
    username?: string;
    message: string;
    type: string;
}
interface Player {
    user: User;
    score?: number;
}


export default function Play({ setIsPlaying }) {

    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState<string>("");
    const [hydrated, setHydrated] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);


    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [userId, setUserId] = useState("");
    const [players, setPlayers] = useState<Player[]>([]);


    const [gameStatus, setGameStatus] = useState("");
    const [wordChoice, setWordChoice] = useState([]);
    const [selectedWord, setSelectedWord] = useState("");
    const [subject, setSubject] = useState<Types.ObjectId>();
    const [isSubject, setIsSubject] = useState(false);
    const [timer, setTimer] = useState(0);
    const [turnScore, setTurnScore] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get('/api/users/getuserid');
                setUserId(res.data.userId);
            } catch (error) {
                console.error('Error fetching user ID:', error);
            }
        }

        fetchData();
    }, []);


    useEffect(() => {
        setHydrated(true);

        if(userId){
        // Connect to Socket.IO server
        const newSocket = io('http://localhost:3000'); // Replace with your server URL
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setSocketId(newSocket.id || "");
            newSocket.emit('joinRoom', { userId });
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            setSocketId("");
            setIsPlaying(false);
        });

        newSocket.on('getMessage', ({message, username}: {message: string, username: string}) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, { username, message, type: 'default' }];
                if (newMessages.length > MAX_MESSAGES) {
                    newMessages.shift();
                }
                return newMessages;
            });
        });
        newSocket.on('joinMessage', (message: string) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, {  message, type: 'join' }];
                if (newMessages.length > MAX_MESSAGES) {
                    newMessages.shift();
                }
                return newMessages;
            });
        });
        newSocket.on('leaveMessage', (message: string) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, { message, type: 'leave' }];
                if (newMessages.length > MAX_MESSAGES) {
                    newMessages.shift();
                }
                return newMessages;
            });
        });
        newSocket.on('drawMessage', (message: string) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, { message, type: 'drawing' }];
                if (newMessages.length > MAX_MESSAGES) {
                    newMessages.shift();
                }
                return newMessages;
            });

            console.log('drawMessage triggered', message);
            setGameStatus('Round');
        });
        newSocket.on('getAnswer', (message: string) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, { message, type: 'answer' }];
                if (newMessages.length > MAX_MESSAGES) {
                    newMessages.shift();
                }
                return newMessages;
            });

            // implement logic to block the user from chatting
        });
                

        // can be used to get updated user scores too
        newSocket.on('playerList', (users) => {
            setPlayers(users.map((user) => ({user, score: 0})));
        });


        newSocket.on('getWords', (choice) => {
            setWordChoice(choice);
            setGameStatus('Choice');
            setIsSubject(true);
            console.log('got the word choices', choice);
        });

        newSocket.on('timerUpdate', (time) => {
            setTimer(time);
        });

        newSocket.on('wordToDraw', (word) => {
            setSelectedWord(word);
            console.log('wordToDraw triggered');
        });

        newSocket.on('turnScores', (data) => {
            setGameStatus('Score');
            setTurnScore(data);
            setIsSubject(false);
        });


        return () => {
            newSocket.disconnect();
        };
        }
    }, [userId]);

    


    const handleSendMessage = () => {
        if (inputMessage.trim() !== "" && socket) {
            console.log(inputMessage, socket.id);
            socket.emit('sendMessage', { message: inputMessage, timestamp: Date.now() });
            setInputMessage("");
        }
    };
    const handleDisconnect = () => {
        if(socket) {
            setIsPlaying(false);
        }
    }
    const handleWordSelect = (index: number) => {
        let wordList: string[] = wordChoice[index];
        console.log('choice', index, wordList[wordList.length-1]);
        if(socket){
            socket.emit('wordSelected', wordChoice[index]);
        }
    }

    if (!hydrated) {
        return <LoadingScreen />;
    }

    return (
        <div className={'play'}>
            <p>Play page</p>
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <h1>Socket ID: {socketId || 'N/A'}</h1>

            <div className={'play_disconnect'}>
                <button onClick={handleDisconnect}>Leave</button>
            </div>
            <div className={'play_main'}>
                <div className={'play_main_header'}>
                    <span>{Math.round(timer)/1000}</span>
                    <div className={'play_word'}>
                        <p>{selectedWord}</p>
                    </div>
                </div>
                <div className={'play-main-bottom'}>
                    <div className={'play_left'}>
                        <ul>
                            {players.map((player, index) => (
                                <li key={index} className={'play_players'}>
                                    {player.user.username}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={'play_middle'}>
                        {gameStatus === 'Choice' ? (
                            <div className={'play_middle_choice'}>
                                {wordChoice.map((wordList: string[], index) => (
                                    <button key={index} onClick={() => handleWordSelect(index)}>{wordList[wordList.length-1]}</button>
                                    ))
                                }
                            </div>
                            ) : gameStatus === 'Score' ? (
                            <div>Showing the turn scores:<br/>
                                {turnScore && turnScore.map((data, index) => (
                                    <p key={index}>{data.score}</p>
                                ))}
                            </div>
                            ) : (
                            <Canvas isSubject={isSubject} socket={socket}/>
                        )}
                    </div>
                    <div className={'play_right'}>
                        <div className="play_chat">
                            <div className="play_chat_display">
                                <ul>
                                    {messages.map((msg, index) => (
                                        <li key={index} className={msg.type === 'join' ? 'play_join_msg' : (msg.type === 'leave' ? 'play_leave_msg' : (msg.type === 'drawing' ? 'play_draw_msg' : ''))}>
                                            {msg.username ? <strong>{msg.username}: </strong> : null}{msg.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* implement logic to block the subject user from chatting */}
                            <div className="play_chat_input">
                                <input
                                    id='play_input'
                                    type='text'
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                />
                                <button className="play_chat_btn" onClick={handleSendMessage}>Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
    
}

