import { Ball, Pocket, CollisionEvent } from '../types';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  ROLLING_FRICTION,
  SLIDING_FRICTION,
  SPIN_DECAY,
  AIR_RESISTANCE,
  MIN_VELOCITY,
  MIN_SPIN,
  WALL_BOUNCE,
  RESTITUTION,
  SPIN_TRANSFER
} from '../constants';
import * as Vec from './vector';

export const updatePhysics = (balls: Ball[], pockets: Pocket[]): { balls: Ball[], events: string[], collisions: CollisionEvent[] } => {
  const events: string[] = [];
  const collisions: CollisionEvent[] = [];

  // Create a deep copy for the simulation step to maintain purity
  const nextBalls = balls.map(b => ({
    ...b,
    position: { ...b.position },
    velocity: { ...b.velocity },
    spin: { ...b.spin }
  }));

  // 1. Integration: Move balls based on current velocity and spin
  nextBalls.forEach(ball => {
    if (ball.potted) return;

    // Apply Velocity
    ball.position = Vec.add(ball.position, ball.velocity);

    // Determine if ball is rolling or sliding
    const speed = Vec.mag(ball.velocity);
    const spinMag = Vec.mag(ball.spin);

    // Rolling occurs when spin matches velocity (simplified)
    const isRolling = spinMag > 0.1 && speed > 0.1;

    // Apply appropriate friction
    if (isRolling) {
      ball.velocity = Vec.mult(ball.velocity, ROLLING_FRICTION);
    } else {
      ball.velocity = Vec.mult(ball.velocity, SLIDING_FRICTION);
    }

    // Apply air resistance (very subtle)
    ball.velocity = Vec.mult(ball.velocity, AIR_RESISTANCE);

    // Apply spin decay
    ball.spin = Vec.mult(ball.spin, SPIN_DECAY);

    // Stop if very slow to prevent endless micro-movements
    if (Vec.mag(ball.velocity) < MIN_VELOCITY) {
      ball.velocity = { x: 0, y: 0 };
    }

    if (Vec.mag(ball.spin) < MIN_SPIN) {
      ball.spin = { x: 0, y: 0 };
    }

    // Apply spin effect to velocity (curve/swerve)
    // Spin creates a force perpendicular to velocity
    if (speed > 0.5 && spinMag > 0.1) {
      const perpendicular = { x: -ball.velocity.y, y: ball.velocity.x };
      const perpNorm = Vec.mag(perpendicular) > 0 ? Vec.div(perpendicular, Vec.mag(perpendicular)) : { x: 0, y: 0 };
      const spinEffect = Vec.mult(perpNorm, spinMag * 0.02);
      ball.velocity = Vec.add(ball.velocity, spinEffect);
    }
  });

  // 2. Constraint Resolution (Iterative solver for stability)
  const ITERATIONS = 8;
  for (let iter = 0; iter < ITERATIONS; iter++) {

    // A. Wall Collisions
    nextBalls.forEach(ball => {
      if (ball.potted) return;

      let wallHit = false;
      let wallIntensity = 0;

      // Left Wall
      if (ball.position.x - ball.radius < 0) {
        ball.position.x = ball.radius;
        const oldVelX = ball.velocity.x;
        ball.velocity.x = Math.abs(ball.velocity.x) * WALL_BOUNCE;
        // Spin reversal on wall hit
        ball.spin.x *= -0.8;
        wallHit = true;
        wallIntensity = Math.abs(oldVelX);
      }
      // Right Wall
      else if (ball.position.x + ball.radius > TABLE_WIDTH) {
        ball.position.x = TABLE_WIDTH - ball.radius;
        const oldVelX = ball.velocity.x;
        ball.velocity.x = -Math.abs(ball.velocity.x) * WALL_BOUNCE;
        ball.spin.x *= -0.8;
        wallHit = true;
        wallIntensity = Math.abs(oldVelX);
      }

      // Top Wall
      if (ball.position.y - ball.radius < 0) {
        ball.position.y = ball.radius;
        const oldVelY = ball.velocity.y;
        ball.velocity.y = Math.abs(ball.velocity.y) * WALL_BOUNCE;
        ball.spin.y *= -0.8;
        wallHit = true;
        wallIntensity = Math.max(wallIntensity, Math.abs(oldVelY));
      }
      // Bottom Wall
      else if (ball.position.y + ball.radius > TABLE_HEIGHT) {
        ball.position.y = TABLE_HEIGHT - ball.radius;
        const oldVelY = ball.velocity.y;
        ball.velocity.y = -Math.abs(ball.velocity.y) * WALL_BOUNCE;
        ball.spin.y *= -0.8;
        wallHit = true;
        wallIntensity = Math.max(wallIntensity, Math.abs(oldVelY));
      }

      if (wallHit && iter === 0) {
        collisions.push({
          type: 'ball-wall',
          intensity: Math.min(wallIntensity / 10, 1),
          position: { ...ball.position },
          timestamp: Date.now()
        });
      }
    });

    // B. Ball-Ball Collisions
    for (let i = 0; i < nextBalls.length; i++) {
      for (let j = i + 1; j < nextBalls.length; j++) {
        const b1 = nextBalls[i];
        const b2 = nextBalls[j];

        if (b1.potted || b2.potted) continue;

        const delta = Vec.sub(b1.position, b2.position);
        const dist = Vec.mag(delta);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist) {
          // 1. Resolve Position (Overlap)
          const overlap = minDist - dist;
          const n = dist === 0 ? { x: 1, y: 0 } : Vec.div(delta, dist);

          const push = Vec.mult(n, overlap * 0.5);

          b1.position = Vec.add(b1.position, push);
          b2.position = Vec.sub(b2.position, push);

          // 2. Resolve Velocity (Elastic Collision with Spin Transfer)
          const relVel = Vec.sub(b1.velocity, b2.velocity);
          const velAlongNormal = Vec.dot(relVel, n);

          if (velAlongNormal > 0) continue;

          // Impulse scalar with restitution
          const j = -(1 + RESTITUTION) * velAlongNormal / 2;
          const impulse = Vec.mult(n, j);

          b1.velocity = Vec.add(b1.velocity, impulse);
          b2.velocity = Vec.sub(b2.velocity, impulse);

          // 3. Spin Transfer (simplified)
          // Transfer some spin from one ball to another
          const spin1Transfer = Vec.mult(b1.spin, SPIN_TRANSFER);
          const spin2Transfer = Vec.mult(b2.spin, SPIN_TRANSFER);

          b1.spin = Vec.sub(b1.spin, spin1Transfer);
          b2.spin = Vec.add(b2.spin, spin1Transfer);

          b2.spin = Vec.sub(b2.spin, spin2Transfer);
          b1.spin = Vec.add(b1.spin, spin2Transfer);

          // Record collision event for sound (only first iteration)
          if (iter === 0) {
            const collisionIntensity = Math.min(Math.abs(velAlongNormal) / 10, 1);
            collisions.push({
              type: 'ball-ball',
              intensity: collisionIntensity,
              position: {
                x: (b1.position.x + b2.position.x) / 2,
                y: (b1.position.y + b2.position.y) / 2
              },
              timestamp: Date.now()
            });
          }
        }
      }
    }
  }

  // 3. Pocket Detection
  nextBalls.forEach(ball => {
    if (ball.potted) return;

    for (const pocket of pockets) {
      if (Vec.dist(ball.position, pocket.position) < pocket.radius) {
        ball.potted = true;
        ball.velocity = { x: 0, y: 0 };
        ball.spin = { x: 0, y: 0 };
        ball.position = { x: -1000, y: -1000 };
        events.push(`pot:${ball.type}:${ball.id}`);

        collisions.push({
          type: 'ball-pocket',
          intensity: 0.8,
          position: { ...pocket.position },
          timestamp: Date.now()
        });
        break;
      }
    }
  });

  return { balls: nextBalls, events, collisions };
};

export const isMoving = (balls: Ball[]): boolean => {
  return balls.some(b => !b.potted && (Math.abs(b.velocity.x) > 0 || Math.abs(b.velocity.y) > 0));
};