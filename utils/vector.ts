import { Vector2 } from '../types';

export const add = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const sub = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const mult = (v: Vector2, n: number): Vector2 => ({ x: v.x * n, y: v.y * n });
export const div = (v: Vector2, n: number): Vector2 => ({ x: v.x / n, y: v.y / n });
export const mag = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const normalize = (v: Vector2): Vector2 => {
  const m = mag(v);
  return m === 0 ? { x: 0, y: 0 } : div(v, m);
};
export const dot = (v1: Vector2, v2: Vector2): number => v1.x * v2.x + v1.y * v2.y;
export const dist = (v1: Vector2, v2: Vector2): number => mag(sub(v1, v2));

export const rotate = (v: Vector2, angle: number): Vector2 => {
  return {
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.x * Math.sin(angle) + v.y * Math.cos(angle)
  };
};
