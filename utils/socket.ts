/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

class SocketManager {
    private socket: Socket | null = null;
    private roomCode: string | null = null;
    private playerNumber: number | null = null;

    getServerUrl() {
        if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
        if (import.meta.env.PROD) return window.location.origin;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        return `${protocol}//${window.location.hostname}:3001`;
    }

    connect() {
        const serverUrl = this.getServerUrl();
        console.log('Connecting to Socket Server at:', serverUrl);

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        this.socket.on('connect', () => {
            console.log('Connected to game server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
        });

        return this.socket;
    }

    createRoom(onRoomCreated: (data: { roomCode: string; playerNumber: number }) => void) {
        if (!this.socket) return;

        this.socket.emit('create-room');
        this.socket.once('room-created', (data) => {
            this.roomCode = data.roomCode;
            this.playerNumber = data.playerNumber;
            onRoomCreated(data);
        });
    }

    joinRoom(
        roomCode: string,
        onJoined: (data: { roomCode: string; playerNumber: number }) => void,
        onError: (error: { message: string }) => void
    ) {
        if (!this.socket) return;

        this.socket.emit('join-room', roomCode);

        this.socket.once('room-joined', (data) => {
            this.roomCode = data.roomCode;
            this.playerNumber = data.playerNumber;
            onJoined(data);
        });

        this.socket.once('error', onError);
    }

    onGameStart(callback: (data: { player1: string; player2: string; currentTurn: number }) => void) {
        if (!this.socket) return;
        this.socket.on('game-start', callback);
    }

    onConnect(callback: () => void) {
        if (!this.socket) return;
        this.socket.on('connect', callback);
    }

    onDisconnect(callback: () => void) {
        if (!this.socket) return;
        this.socket.on('disconnect', callback);
    }

    onConnectError(callback: (err: any) => void) {
        if (!this.socket) return;
        this.socket.on('connect_error', callback);
    }

    onPlayerJoined(callback: (data: { playerNumber: number }) => void) {
        if (!this.socket) return;
        this.socket.on('player-joined', callback);
    }

    onPlayerLeft(callback: () => void) {
        if (!this.socket) return;
        this.socket.on('player-left', callback);
    }

    onOpponentShoot(callback: (data: { impulse: any; ballsState: any }) => void) {
        if (!this.socket) return;
        this.socket.on('opponent-shoot', callback);
    }

    onGameStateUpdate(callback: (data: { gameState: any; currentTurn: number }) => void) {
        if (!this.socket) return;
        this.socket.on('game-state-update', callback);
    }

    sendShoot(impulse: any, ballsState: any) {
        if (!this.socket || !this.roomCode) return;

        this.socket.emit('shoot', {
            roomCode: this.roomCode,
            impulse,
            ballsState
        });
    }

    sendTurnEnd(gameState: any) {
        if (!this.socket || !this.roomCode) return;

        this.socket.emit('turn-end', {
            roomCode: this.roomCode,
            gameState
        });
    }

    leaveRoom() {
        if (!this.socket || !this.roomCode) return;

        this.socket.emit('leave-room', this.roomCode);
        this.roomCode = null;
        this.playerNumber = null;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getRoomCode() {
        return this.roomCode;
    }

    getPlayerNumber() {
        return this.playerNumber;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

// Export singleton instance
export const socketManager = new SocketManager();
