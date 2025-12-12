import React, { useState } from 'react';

interface MultiplayerMenuProps {
    onLocalPlay: () => void;
    onCreateRoom: () => void;
    onJoinRoom: (code: string) => void;
    roomCode: string | null;
    playerNumber: number | null;
    waitingForPlayer: boolean;
    connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
    onLocalPlay,
    onCreateRoom,
    onJoinRoom,
    roomCode,
    playerNumber,
    waitingForPlayer,
    connectionStatus
}) => {
    const [joinCode, setJoinCode] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.length === 6) {
            onJoinRoom(joinCode);
        }
    };

    // If in a room, show room info
    if (roomCode) {
        return (
            <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border-2 border-blue-500 shadow-2xl">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎱</div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            {waitingForPlayer ? 'Waiting for Opponent...' : 'Game Ready!'}
                        </h2>

                        <div className="bg-gray-900 rounded-lg p-6 mb-6">
                            <p className="text-gray-400 text-sm mb-2">Room Code</p>
                            <div className="text-5xl font-black text-yellow-400 tracking-widest mb-4">
                                {roomCode}
                            </div>
                            <p className="text-gray-500 text-xs">Share this code with your friend</p>
                        </div>

                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <span className="text-sm text-gray-400">
                                {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                            </span>
                        </div>

                        <div className="text-sm text-gray-400 mb-4">
                            You are <span className="text-blue-400 font-bold">Player {playerNumber}</span>
                        </div>

                        {waitingForPlayer && (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Main menu
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-7xl mb-4">🎱</div>
                    <h1 className="text-5xl font-black text-white mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                        8-Ball Pool
                    </h1>
                    <p className="text-gray-400">Choose your game mode</p>
                </div>

                <div className="space-y-4">
                    {/* Local Play */}
                    <button
                        onClick={onLocalPlay}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                    >
                        <div className="text-2xl mb-1">👥</div>
                        <div className="text-xl">Local Multiplayer</div>
                        <div className="text-xs text-blue-200 mt-1">Play on the same device</div>
                    </button>

                    {/* Create Room */}
                    <button
                        onClick={onCreateRoom}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                    >
                        <div className="text-2xl mb-1">🌐</div>
                        <div className="text-xl">Create Online Room</div>
                        <div className="text-xs text-green-200 mt-1">Get a code to share</div>
                    </button>

                    {/* Join Room */}
                    {!showJoinInput ? (
                        <button
                            onClick={() => setShowJoinInput(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                        >
                            <div className="text-2xl mb-1">🔗</div>
                            <div className="text-xl">Join Online Room</div>
                            <div className="text-xs text-purple-200 mt-1">Enter a room code</div>
                        </button>
                    ) : (
                        <form onSubmit={handleJoinSubmit} className="bg-gray-800 rounded-xl p-6 border-2 border-purple-500">
                            <label className="block text-white font-bold mb-3">Enter Room Code</label>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full bg-gray-900 text-white text-center text-3xl font-black tracking-widest px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowJoinInput(false);
                                        setJoinCode('');
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={joinCode.length !== 6}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
                                >
                                    Join
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span>
                            {connectionStatus === 'connected' ? 'Server Connected' :
                                connectionStatus === 'connecting' ? 'Connecting...' :
                                    'Server Offline'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiplayerMenu;
