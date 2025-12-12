import React, { useState, useEffect, useRef } from 'react';
import PoolTable from './components/PoolTable';
import GameUI from './components/GameUI';
import MultiplayerMenu from './components/MultiplayerMenu';
import { Ball, GameState, Vector2, Pocket } from './types';
import { TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS, BALL_COLORS, POCKETS } from './constants';
import * as Physics from './utils/physics';
import { socketManager } from './utils/socket';

// Initial setup helper
const setupRack = (): Ball[] => {
  const balls: Ball[] = [];
  const startX = TABLE_WIDTH * 0.75;
  const startY = TABLE_HEIGHT / 2;
  const r = BALL_RADIUS;

  // Cue Ball
  balls.push({
    id: 0,
    position: { x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    radius: r,
    type: 'cue',
    color: BALL_COLORS.cue,
    potted: false,
    number: 0,
    spin: { x: 0, y: 0 }
  });

  // Rack positions (triangle)
  // Row 1 (1 ball)
  // Row 2 (2 balls)
  // ...
  // Order matters for 8 ball usually being in middle of row 3

  // A standard rack pattern for 8-ball (simplified distribution)
  // 1 is apex
  // 8 is center
  // Corners are different types

  let id = 1;
  const rows = 5;

  // Custom mapping for types to ensure mix
  const layout = [
    { row: 0, col: 0, type: 'solid', num: 1 },
    { row: 1, col: 0, type: 'solid', num: 2 }, { row: 1, col: 1, type: 'stripe', num: 9 },
    { row: 2, col: 0, type: 'solid', num: 3 }, { row: 2, col: 1, type: 'eight', num: 8 }, { row: 2, col: 2, type: 'stripe', num: 10 },
    { row: 3, col: 0, type: 'stripe', num: 11 }, { row: 3, col: 1, type: 'solid', num: 4 }, { row: 3, col: 2, type: 'solid', num: 5 }, { row: 3, col: 3, type: 'stripe', num: 12 },
    { row: 4, col: 0, type: 'stripe', num: 13 }, { row: 4, col: 1, type: 'solid', num: 6 }, { row: 4, col: 2, type: 'stripe', num: 14 }, { row: 4, col: 3, type: 'solid', num: 7 }, { row: 4, col: 4, type: 'stripe', num: 15 },
  ];

  layout.forEach(pos => {
    const x = startX + (pos.row * (r * 2 * 0.866)); // cos(30) packing
    const y = startY + ((pos.col - pos.row / 2) * (r * 2)); // center rows

    let color = '';
    if (pos.type === 'eight') color = BALL_COLORS.eight;
    else if (pos.type === 'solid') color = BALL_COLORS.solid[Math.floor(Math.random() * BALL_COLORS.solid.length)]; // Random color visual for now or map correctly
    else if (pos.type === 'stripe') color = BALL_COLORS.stripe[Math.floor(Math.random() * BALL_COLORS.stripe.length)];

    // Better color mapping based on number (standard pool colors)
    if (pos.num >= 1 && pos.num <= 7) color = BALL_COLORS.solid[pos.num - 1];
    if (pos.num >= 9 && pos.num <= 15) color = BALL_COLORS.stripe[pos.num - 9];

    balls.push({
      id: pos.num,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      radius: r,
      type: pos.type as any,
      color: color,
      potted: false,
      number: pos.num,
      spin: { x: 0, y: 0 }
    });
  });

  return balls;
};

const INITIAL_STATE: GameState = {
  currentPlayer: 'player1',
  player1Group: null,
  player2Group: null,
  gameStatus: 'aiming',
  winner: null,
  balls: setupRack(),
  cueBall: setupRack()[0], // Placeholder, will be updated
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  // Multiplayer state
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'online'>('menu');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isMyTurn, setIsMyTurn] = useState(true);

  // Use ref for balls to avoid closure staleness in animation loop without constant re-renders
  const ballsRef = useRef<Ball[]>(INITIAL_STATE.balls);
  const rafRef = useRef<number>();
  const pocketsRef = useRef<Pocket[]>(POCKETS.map(p => ({ position: p, radius: 20 })));


  // Initialize cue ball ref
  useEffect(() => {
    ballsRef.current = setupRack();
    setGameState(prev => ({ ...prev, balls: ballsRef.current, cueBall: ballsRef.current[0] }));

    // Initialize socket connection
    if (gameMode === 'online') {
      setConnectionStatus('connecting');
      socketManager.connect();
      setConnectionStatus('connected');

      // Setup socket listeners
      socketManager.onGameStart((data) => {
        setWaitingForPlayer(false);
        setIsMyTurn(playerNumber === 1);
      });

      socketManager.onPlayerJoined(() => {
        setWaitingForPlayer(false);
      });

      socketManager.onPlayerLeft(() => {
        alert('Opponent disconnected');
        setGameMode('menu');
        setRoomCode(null);
        setPlayerNumber(null);
      });

      socketManager.onOpponentShoot((data) => {
        // Apply opponent's shot
        const cueBall = ballsRef.current.find(b => b.type === 'cue');
        if (cueBall) {
          cueBall.velocity = data.impulse;
          setGameState(prev => ({ ...prev, gameStatus: 'moving' }));
        }
      });

      socketManager.onGameStateUpdate((data) => {
        setIsMyTurn(data.currentTurn === playerNumber);
      });
    }

    return () => {
      if (gameMode === 'online') {
        socketManager.disconnect();
      }
    };
  }, [gameMode, playerNumber]);

  const resetGame = () => {
    const newBalls = setupRack();
    ballsRef.current = newBalls;
    setGameState({
      ...INITIAL_STATE,
      balls: newBalls,
      cueBall: newBalls[0]
    });
  };

  const handleShoot = (impulse: Vector2) => {
    if (gameState.gameStatus !== 'aiming') return;

    // In online mode, only allow shooting if it's your turn
    if (gameMode === 'online' && !isMyTurn) return;

    const cueBall = ballsRef.current.find(b => b.type === 'cue');
    if (cueBall) {
      cueBall.velocity = impulse;
      setGameState(prev => ({ ...prev, gameStatus: 'moving' }));

      // Send shot to opponent in online mode
      if (gameMode === 'online') {
        socketManager.sendShoot(impulse, ballsRef.current);
      }
    }
  };

  // Multiplayer menu handlers
  const handleLocalPlay = () => {
    setGameMode('local');
    resetGame();
  };

  const handleCreateRoom = () => {
    setGameMode('online');
    setConnectionStatus('connecting');
    socketManager.connect();
    setConnectionStatus('connected');

    socketManager.createRoom((data) => {
      setRoomCode(data.roomCode);
      setPlayerNumber(data.playerNumber);
      setWaitingForPlayer(true);
    });
  };

  const handleJoinRoom = (code: string) => {
    setGameMode('online');
    setConnectionStatus('connecting');
    socketManager.connect();
    setConnectionStatus('connected');

    socketManager.joinRoom(
      code,
      (data) => {
        setRoomCode(data.roomCode);
        setPlayerNumber(data.playerNumber);
        setWaitingForPlayer(false);
      },
      (error) => {
        alert(error.message);
        setGameMode('menu');
        setConnectionStatus('disconnected');
      }
    );
  };

  // Game Loop
  useEffect(() => {
    const loop = () => {
      if (gameState.gameStatus === 'moving') {
        const { balls, events, collisions } = Physics.updatePhysics(ballsRef.current, pocketsRef.current);
        ballsRef.current = balls;

        // TODO: Play sounds based on collision events
        // collisions.forEach(collision => soundManager.playCollision(collision));

        // Check if movement stopped
        if (!Physics.isMoving(balls)) {
          // Logic to handle turn end
          handleTurnEnd(balls, events);
        } else {
          // Force update to render frame
          setGameState(prev => ({ ...prev, balls: [...balls] }));
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState.gameStatus]);

  const handleTurnEnd = (balls: Ball[], events: string[]) => {
    // Analyze turn results
    const pottedBalls = balls.filter(b => b.potted);
    // We need to know what happened THIS turn.
    // The physics engine returns 'events' like 'pot:solid:3'.

    let turnContinues = false;
    let foul = false;
    let nextPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
    let newWinner: GameState['winner'] = null;
    let newStatus: GameState['gameStatus'] = 'aiming';
    let p1Group = gameState.player1Group;
    let p2Group = gameState.player2Group;

    const pottedThisTurn = events.filter(e => e.startsWith('pot:')).map(e => {
      const parts = e.split(':');
      return { type: parts[1], id: parseInt(parts[2]) };
    });

    const cuePotted = pottedThisTurn.some(p => p.type === 'cue');
    const eightPotted = pottedThisTurn.some(p => p.type === 'eight');
    const anyObjectBallPotted = pottedThisTurn.some(p => p.type === 'solid' || p.type === 'stripe');

    // --- Rule Enforcement ---

    // 1. Cue Ball Potted (Foul)
    if (cuePotted) {
      foul = true;
      // Respawn cue ball
      const cueBall = balls.find(b => b.id === 0);
      if (cueBall) {
        cueBall.potted = false;
        cueBall.position = { x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 };
        cueBall.velocity = { x: 0, y: 0 };
      }
    }

    // 2. 8-Ball Potted
    if (eightPotted) {
      // Check if current player has cleared their group
      const currentGroup = gameState.currentPlayer === 'player1' ? p1Group : p2Group;

      // Count remaining balls of that group
      const remainingGroupBalls = balls.filter(b => !b.potted && b.type === currentGroup).length;

      if (cuePotted) {
        // Foul on 8-ball pot = Loss
        newWinner = nextPlayer as any; // Opponent wins
        newStatus = 'gameover';
      } else if (currentGroup === null) {
        // Potted 8-ball before assigning groups = Loss
        newWinner = nextPlayer as any;
        newStatus = 'gameover';
      } else if (remainingGroupBalls > 0) {
        // Potted 8-ball early = Loss
        newWinner = nextPlayer as any;
        newStatus = 'gameover';
      } else {
        // Clean pot of 8-ball = Win
        newWinner = gameState.currentPlayer;
        newStatus = 'gameover';
      }
    }

    // 3. Assign Groups if not assigned
    if (!newWinner && !p1Group && !p2Group && !foul && anyObjectBallPotted) {
      // First ball potted defines the group
      const firstPot = pottedThisTurn.find(p => p.type === 'solid' || p.type === 'stripe');
      if (firstPot) {
        if (gameState.currentPlayer === 'player1') {
          p1Group = firstPot.type as 'solid' | 'stripe';
          p2Group = p1Group === 'solid' ? 'stripe' : 'solid';
        } else {
          p2Group = firstPot.type as 'solid' | 'stripe';
          p1Group = p2Group === 'solid' ? 'stripe' : 'solid';
        }
      }
    }

    // 4. Determine next turn
    if (!newWinner) {
      if (foul) {
        turnContinues = false; // Foul passes turn
      } else {
        // If player potted their own group ball (or any ball if groups undefined), they continue
        const currentGroup = gameState.currentPlayer === 'player1' ? p1Group : p2Group;

        const pottedOwnGroup = pottedThisTurn.some(p => {
          if (!currentGroup) return p.type === 'solid' || p.type === 'stripe';
          return p.type === currentGroup;
        });

        if (pottedOwnGroup) {
          turnContinues = true;
        }
      }
    }

    // Update State
    setGameState(prev => ({
      ...prev,
      balls: [...balls],
      cueBall: balls.find(b => b.type === 'cue')!,
      gameStatus: newStatus,
      currentPlayer: (turnContinues ? prev.currentPlayer : nextPlayer) as any,
      player1Group: p1Group,
      player2Group: p2Group,
      winner: newWinner
    }));
  };

  return (
    <div className="w-screen h-screen bg-gray-900 font-sans select-none overflow-hidden">
      {/* Main Container - Centralized */}
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <GameUI gameState={gameState} onReset={resetGame} />



        {/* Game Area - Perfectly Centered */}
        <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full h-full max-w-[95vw] max-h-[70vh] lg:max-w-[1100px] lg:max-h-[600px] flex items-center justify-center">
            <PoolTable
              balls={gameState.balls}
              cueBall={gameState.cueBall}
              isAiming={gameState.gameStatus === 'aiming'}
              onShoot={handleShoot}
            />
            {gameState.gameStatus === 'gameover' && (
              <div className="absolute inset-0 bg-black/50 z-10 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    {gameState.winner === 'player1' ? '🏆 Jogador 1 Venceu!' : '🏆 Jogador 2 Venceu!'}
                  </h2>
                </div>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* Landscape orientation hint for mobile */}
      <div className="hidden portrait:block landscape:hidden fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-8 sm:hidden">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-white mb-2">Gire Seu Dispositivo</h2>
          <p className="text-gray-400">Este jogo funciona melhor no modo paisagem</p>
          <div className="mt-6 text-4xl animate-pulse">↻</div>
        </div>
      </div>

      {/* Multiplayer Menu */}
      {(gameMode === 'menu' || (gameMode === 'online' && roomCode)) && (
        <MultiplayerMenu
          onLocalPlay={handleLocalPlay}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          roomCode={roomCode}
          playerNumber={playerNumber}
          waitingForPlayer={waitingForPlayer}
          connectionStatus={connectionStatus}
        />
      )}
    </div>
  );
};

export default App;