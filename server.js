import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Room management
const rooms = new Map();

// Generate random 6-digit room code
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create room
    socket.on('create-room', () => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            players: [socket.id],
            host: socket.id,
            gameState: null,
            currentPlayer: 0
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.emit('room-created', { roomCode, playerNumber: 1 });
        console.log(`Room created: ${roomCode}`);
    });

    // Join room
    socket.on('join-room', (roomCode) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.players.length >= 2) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        room.players.push(socket.id);
        socket.join(roomCode);

        // Notify both players
        socket.emit('room-joined', { roomCode, playerNumber: 2 });
        io.to(room.host).emit('player-joined', { playerNumber: 2 });

        // Start game
        io.to(roomCode).emit('game-start', {
            player1: room.host,
            player2: socket.id,
            currentTurn: 1
        });

        console.log(`Player joined room: ${roomCode}`);
    });

    // Handle shot
    socket.on('shoot', (data) => {
        const { roomCode, impulse, ballsState } = data;
        const room = rooms.get(roomCode);

        if (!room) return;

        // Broadcast to other player
        socket.to(roomCode).emit('opponent-shoot', {
            impulse,
            ballsState
        });
    });

    // Handle turn end
    socket.on('turn-end', (data) => {
        const { roomCode, gameState } = data;
        const room = rooms.get(roomCode);

        if (!room) return;

        // Toggle current player
        room.currentPlayer = room.currentPlayer === 0 ? 1 : 0;
        room.gameState = gameState;

        // Broadcast to both players
        io.to(roomCode).emit('game-state-update', {
            gameState,
            currentTurn: room.currentPlayer + 1
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        // Find and clean up room
        for (const [code, room] of rooms.entries()) {
            if (room.players.includes(socket.id)) {
                // Notify other player
                socket.to(code).emit('player-left');
                rooms.delete(code);
                console.log(`Room ${code} closed`);
                break;
            }
        }
    });

    // Leave room
    socket.on('leave-room', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            socket.to(roomCode).emit('player-left');
            socket.leave(roomCode);
            rooms.delete(roomCode);
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🎱 Pool Game Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections on all network interfaces`);
});
