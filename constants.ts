export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 400;
export const BALL_RADIUS = 10;
export const POCKET_RADIUS = 18;
export const CUSHION_WIDTH = 20;

// Physics Constants
export const FRICTION = 0.985; // Legacy - kept for compatibility
export const ROLLING_FRICTION = 0.990; // Friction when ball is rolling (reduced for faster play)
export const SLIDING_FRICTION = 0.965; // Friction when ball is sliding (reduced for faster play)
export const SPIN_DECAY = 0.98; // How fast spin decreases
export const AIR_RESISTANCE = 0.9995; // Subtle air resistance
export const WALL_BOUNCE = 0.8; // Energy retained after hitting a wall
export const RESTITUTION = 0.95; // Bounciness in collisions
export const SPIN_TRANSFER = 0.3; // How much spin transfers in collisions
export const MIN_VELOCITY = 0.05;
export const MIN_SPIN = 0.02; // Minimum spin before stopping
export const MAX_POWER = 25; // Increased from 15 for more powerful shots

// Visual Constants
export const LIGHT_POSITION = { x: 400, y: -200, z: 500 };
export const SHADOW_OFFSET = { x: 3, y: 3 };
export const SHADOW_BLUR = 5;
export const MOTION_BLUR_THRESHOLD = 5; // Speed threshold for motion blur
export const TRAIL_LENGTH = 8; // Number of trail positions to keep

export const BALL_COLORS = {
  cue: '#ffffff',
  eight: '#000000',
  solid: [
    '#FACC15', // 1 - Yellow
    '#1D4ED8', // 2 - Blue
    '#DC2626', // 3 - Red
    '#7E22CE', // 4 - Purple
    '#EA580C', // 5 - Orange
    '#166534', // 6 - Green
    '#991B1B', // 7 - Maroon
  ],
  stripe: [
    '#FACC15', // 9
    '#1D4ED8', // 10
    '#DC2626', // 11
    '#7E22CE', // 12
    '#EA580C', // 13
    '#166534', // 14
    '#991B1B', // 15
  ]
};

// Simplified pocket positions relative to table dimensions
export const POCKETS = [
  { x: 0, y: 0 },
  { x: TABLE_WIDTH / 2, y: 0 },
  { x: TABLE_WIDTH, y: 0 },
  { x: 0, y: TABLE_HEIGHT },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
  { x: TABLE_WIDTH, y: TABLE_HEIGHT },
];
