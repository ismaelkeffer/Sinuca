import React, { useRef, useEffect, useState } from 'react';
import { Ball, Vector2 } from '../types';
import { TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS, POCKETS, POCKET_RADIUS, MAX_POWER } from '../constants';
import * as Vec from '../utils/vector';

interface PoolTableProps {
  balls: Ball[];
  cueBall: Ball;
  isAiming: boolean;
  onShoot: (impulse: Vector2) => void;
}

const PoolTable: React.FC<PoolTableProps> = ({ balls, cueBall, isAiming, onShoot }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas padding to show cue stick outside table
  const CANVAS_PADDING = 150; // Extra space around table for cue stick
  const CANVAS_WIDTH = TABLE_WIDTH + CANVAS_PADDING * 2;
  const CANVAS_HEIGHT = TABLE_HEIGHT + CANVAS_PADDING * 2;

  // State for interaction
  const [dragStart, setDragStart] = useState<Vector2 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null);
  const [cursorPos, setCursorPos] = useState<Vector2 | null>(null);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear entire canvas including padding
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Translate context to center the table with padding
    ctx.save();
    ctx.translate(CANVAS_PADDING, CANVAS_PADDING);

    // Draw Table Felt with subtle texture
    const feltGradient = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    feltGradient.addColorStop(0, '#1a7a3e');
    feltGradient.addColorStop(0.5, '#166534');
    feltGradient.addColorStop(1, '#145028');
    ctx.fillStyle = feltGradient;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Add subtle felt texture pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < TABLE_WIDTH; i += 4) {
      for (let j = 0; j < TABLE_HEIGHT; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // Draw table markings (head spot, center spot, foot spot)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    // Head spot (where cue ball starts)
    ctx.beginPath();
    ctx.arc(TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Foot spot (where rack is placed)
    ctx.beginPath();
    ctx.arc(TABLE_WIDTH * 0.75, TABLE_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw Bumpers with wood texture
    const bumperWidth = 15;
    const woodGradient = ctx.createLinearGradient(0, 0, bumperWidth, 0);
    woodGradient.addColorStop(0, '#5D4037');
    woodGradient.addColorStop(0.5, '#4E342E');
    woodGradient.addColorStop(1, '#3E2723');

    ctx.fillStyle = woodGradient;
    // Top bumper
    ctx.fillRect(0, 0, TABLE_WIDTH, bumperWidth);
    // Bottom bumper
    ctx.fillRect(0, TABLE_HEIGHT - bumperWidth, TABLE_WIDTH, bumperWidth);
    // Left bumper
    ctx.fillRect(0, 0, bumperWidth, TABLE_HEIGHT);
    // Right bumper
    ctx.fillRect(TABLE_WIDTH - bumperWidth, 0, bumperWidth, TABLE_HEIGHT);

    // Draw Pockets with depth effect
    POCKETS.forEach(p => {
      // Outer shadow
      const pocketGradient = ctx.createRadialGradient(p.x, p.y, POCKET_RADIUS * 0.3, p.x, p.y, POCKET_RADIUS);
      pocketGradient.addColorStop(0, '#000000');
      pocketGradient.addColorStop(0.7, '#1a1a1a');
      pocketGradient.addColorStop(1, '#333333');
      ctx.fillStyle = pocketGradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Inner darkness
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Balls with realistic 3D rendering
    balls.forEach(ball => {
      if (ball.potted) return;

      // Dynamic shadow based on light position
      const lightX = TABLE_WIDTH / 2;
      const lightY = -200; // Light above table
      const shadowOffsetX = (ball.position.x - lightX) * 0.015;
      const shadowOffsetY = (ball.position.y - lightY) * 0.008;

      const shadowGradient = ctx.createRadialGradient(
        ball.position.x + shadowOffsetX,
        ball.position.y + shadowOffsetY,
        0,
        ball.position.x + shadowOffsetX,
        ball.position.y + shadowOffsetY,
        ball.radius * 1.2
      );
      shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.arc(ball.position.x + shadowOffsetX, ball.position.y + shadowOffsetY, ball.radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 3D Ball with radial gradient
      const highlightX = ball.position.x - ball.radius * 0.3;
      const highlightY = ball.position.y - ball.radius * 0.3;

      // For stripe balls, draw white base first
      if (ball.type === 'stripe') {
        const whiteGradient = ctx.createRadialGradient(
          highlightX, highlightY, ball.radius * 0.1,
          ball.position.x, ball.position.y, ball.radius
        );
        whiteGradient.addColorStop(0, '#ffffff');
        whiteGradient.addColorStop(0.7, '#f0f0f0');
        whiteGradient.addColorStop(1, '#d0d0d0');

        ctx.fillStyle = whiteGradient;
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Colored stripe band
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
        ctx.clip();

        const stripeGradient = ctx.createRadialGradient(
          highlightX, highlightY, ball.radius * 0.1,
          ball.position.x, ball.position.y, ball.radius
        );
        stripeGradient.addColorStop(0, ball.color);
        stripeGradient.addColorStop(0.7, ball.color);
        stripeGradient.addColorStop(1, '#000000');

        ctx.fillStyle = stripeGradient;
        ctx.fillRect(
          ball.position.x - ball.radius,
          ball.position.y - ball.radius * 0.55,
          ball.radius * 2,
          ball.radius * 1.1
        );
        ctx.restore();
      } else {
        // Solid or cue ball with 3D gradient
        const ballGradient = ctx.createRadialGradient(
          highlightX, highlightY, ball.radius * 0.1,
          ball.position.x, ball.position.y, ball.radius
        );

        if (ball.type === 'cue') {
          ballGradient.addColorStop(0, '#ffffff');
          ballGradient.addColorStop(0.4, '#f5f5f5');
          ballGradient.addColorStop(0.8, '#e0e0e0');
          ballGradient.addColorStop(1, '#c0c0c0');
        } else if (ball.type === 'eight') {
          ballGradient.addColorStop(0, '#333333');
          ballGradient.addColorStop(0.6, '#000000');
          ballGradient.addColorStop(1, '#000000');
        } else {
          // Lighten the color for highlight
          ballGradient.addColorStop(0, ball.color + 'dd');
          ballGradient.addColorStop(0.6, ball.color);
          ballGradient.addColorStop(1, '#000000');
        }

        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Specular highlight (shiny spot)
      const specularGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, ball.radius * 0.4
      );
      specularGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      specularGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      specularGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = specularGradient;
      ctx.beginPath();
      ctx.arc(highlightX, highlightY, ball.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Number circle for numbered balls
      if (ball.type !== 'cue') {
        // White circle background with subtle shadow
        const numberCircleGradient = ctx.createRadialGradient(
          ball.position.x, ball.position.y, 0,
          ball.position.x, ball.position.y, ball.radius * 0.5
        );
        numberCircleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        numberCircleGradient.addColorStop(1, 'rgba(240, 240, 240, 0.9)');

        ctx.fillStyle = numberCircleGradient;
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Subtle border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Number with shadow
        const fontSize = Math.floor(ball.radius * 0.8);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillText(ball.number.toString(), ball.position.x + 0.5, ball.position.y + 1.5);

        // Actual text
        ctx.fillStyle = '#000000';
        ctx.fillText(ball.number.toString(), ball.position.x, ball.position.y + 1);
      }
    });

    // --- Cue Stick & Aim Guide Logic ---
    if (isAiming && !cueBall.potted) {
      let angle = 0;
      let power = 0;
      let showStick = false;

      // Case 1: Dragging (Powering up)
      if (dragStart && dragCurrent) {
        const dragVector = Vec.sub(dragStart, dragCurrent);
        const mag = Vec.mag(dragVector);
        // Slingshot mechanic: Drag backwards to shoot forwards.
        angle = Math.atan2(dragVector.y, dragVector.x);
        power = Math.min(mag * 0.1, MAX_POWER);
        showStick = true;
      }
      // Case 2: Hovering (Aiming without power)
      else if (cursorPos) {
        const aimVector = Vec.sub(cueBall.position, cursorPos);
        angle = Math.atan2(aimVector.y, aimVector.x);
        power = 0;
        showStick = true;
      }

      if (showStick) {
        const stickLength = 220;
        const stickDistance = 20 + (power * 5);

        const tipPos = {
          x: cueBall.position.x - Math.cos(angle) * stickDistance,
          y: cueBall.position.y - Math.sin(angle) * stickDistance
        };

        const handlePos = {
          x: cueBall.position.x - Math.cos(angle) * (stickDistance + stickLength),
          y: cueBall.position.y - Math.sin(angle) * (stickDistance + stickLength)
        };


        // Guide Line with fade effect
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        const guideGradient = ctx.createLinearGradient(
          cueBall.position.x, cueBall.position.y,
          cueBall.position.x + Math.cos(angle) * 300, cueBall.position.y + Math.sin(angle) * 300
        );
        guideGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        guideGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = guideGradient;
        ctx.moveTo(cueBall.position.x, cueBall.position.y);
        ctx.lineTo(cueBall.position.x + Math.cos(angle) * 300, cueBall.position.y + Math.sin(angle) * 300);
        ctx.stroke();
        ctx.setLineDash([]);

        // Stick Body with gradient
        const stickGradient = ctx.createLinearGradient(handlePos.x, handlePos.y, tipPos.x, tipPos.y);
        stickGradient.addColorStop(0, '#A1887F');
        stickGradient.addColorStop(0.5, '#8D6E63');
        stickGradient.addColorStop(1, '#6D4C41');

        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.strokeStyle = stickGradient;
        ctx.moveTo(handlePos.x, handlePos.y);
        ctx.lineTo(tipPos.x, tipPos.y);
        ctx.stroke();

        // Stick Tip (white chalk)
        const tipStart = {
          x: cueBall.position.x - Math.cos(angle) * (stickDistance + 10),
          y: cueBall.position.y - Math.sin(angle) * (stickDistance + 10)
        };
        ctx.beginPath();
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#F5F5F5';
        ctx.moveTo(tipStart.x, tipStart.y);
        ctx.lineTo(tipPos.x, tipPos.y);
        ctx.stroke();

        // Blue chalk mark on tip
        ctx.beginPath();
        ctx.fillStyle = 'rgba(33, 150, 243, 0.4)';
        ctx.arc(tipPos.x, tipPos.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Power Meter (vertical bar on right side)
        if (power > 0) {
          const meterX = TABLE_WIDTH - 40;
          const meterY = TABLE_HEIGHT / 2 - 100;
          const meterHeight = 200;
          const meterWidth = 20;

          // Meter background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

          // Power fill
          const powerPercent = power / MAX_POWER;
          const fillHeight = meterHeight * powerPercent;

          const powerGradient = ctx.createLinearGradient(meterX, meterY + meterHeight, meterX, meterY + meterHeight - fillHeight);
          if (powerPercent < 0.3) {
            powerGradient.addColorStop(0, '#4CAF50');
            powerGradient.addColorStop(1, '#8BC34A');
          } else if (powerPercent < 0.7) {
            powerGradient.addColorStop(0, '#FFC107');
            powerGradient.addColorStop(1, '#FFD54F');
          } else {
            powerGradient.addColorStop(0, '#F44336');
            powerGradient.addColorStop(1, '#FF5722');
          }

          ctx.fillStyle = powerGradient;
          ctx.fillRect(meterX, meterY + meterHeight - fillHeight, meterWidth, fillHeight);

          // Meter border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

          // Power label
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('POTÊNCIA', meterX + meterWidth / 2, meterY - 10);
        }
      }
    }

    // Restore context after all drawing
    ctx.restore();

  }, [balls, cueBall, isAiming, dragStart, dragCurrent, cursorPos, CANVAS_PADDING, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): Vector2 | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ('touches' in e) {
      const touches = (e as React.TouchEvent).touches;
      if (touches && touches.length > 0) {
        clientX = touches[0].clientX;
        clientY = touches[0].clientY;
      } else {
        return null;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Adjust for canvas padding
    return {
      x: (clientX - rect.left) * scaleX - CANVAS_PADDING,
      y: (clientY - rect.top) * scaleY - CANVAS_PADDING
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming || cueBall.potted) return;

    const pos = getCanvasPos(e);
    if (!pos) return;

    if (Vec.dist(pos, cueBall.position) < BALL_RADIUS * 4) {
      setDragStart(pos);
      setDragCurrent(pos);
    }
    setCursorPos(pos);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    setCursorPos(pos);
    if (dragStart) {
      setDragCurrent(pos);
    }
  };

  const handleEnd = () => {
    if (dragStart && dragCurrent) {
      const dragVector = Vec.sub(dragStart, dragCurrent);
      const mag = Vec.mag(dragVector);
      if (mag > 5) {
        const power = Math.min(mag * 0.25, MAX_POWER); // Increased from 0.15 to 0.25 for faster shots
        const angle = Math.atan2(dragVector.y, dragVector.x);
        onShoot({
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power
        });
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleLeave = () => {
    setDragStart(null);
    setCursorPos(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full rounded-lg shadow-2xl overflow-hidden border-4 md:border-8 border-yellow-900 bg-gray-900 mx-auto"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-crosshair bg-gray-900 w-full h-auto block touch-none"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleLeave}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      {isAiming && !dragStart && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white/50 text-xs md:text-sm pointer-events-none select-none whitespace-nowrap">
          Arraste para atirar
        </div>
      )}
    </div>
  );
};

export default PoolTable;