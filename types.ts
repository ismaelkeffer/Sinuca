export interface Vector2 {
  x: number;
  y: number;
}

export type BallType = 'solid' | 'stripe' | 'eight' | 'cue';

export interface Ball {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  type: BallType;
  color: string;
  potted: boolean;
  number: number;
  spin: Vector2; // Angular velocity for realistic spin effects
  impactPoint?: Vector2; // Point where cue hits the ball (relative to center)
}

export type Player = 'player1' | 'player2';

export interface GameState {
  currentPlayer: Player;
  player1Group: 'solid' | 'stripe' | null;
  player2Group: 'solid' | 'stripe' | null;
  gameStatus: 'aiming' | 'moving' | 'gameover';
  winner: Player | null;
  balls: Ball[];
  cueBall: Ball; // Helper reference, points to the ball in the array with type 'cue'
}

export interface Pocket {
  position: Vector2;
  radius: number;
}

export interface CollisionEvent {
  type: 'ball-ball' | 'ball-wall' | 'ball-pocket';
  intensity: number; // 0-1 scale for volume
  position: Vector2;
  timestamp: number;
}
