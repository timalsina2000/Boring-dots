"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Viewport and sizing
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Keep ball inside viewport on resize
      if (ball.x - ball.radius < 0) ball.x = ball.radius;
      if (ball.x + ball.radius > width) ball.x = width - ball.radius;
      if (ball.y - ball.radius < 0) ball.y = ball.radius;
      if (ball.y + ball.radius > height) ball.y = height - ball.radius;
    };

    // Ball state
    const ball = {
      x: 0,
      y: 0,
      radius: 5,
      vx: 0,
      vy: 0,
      squishX: 1,
      squishY: 1,
      glow: 0,
      speedBoost: 1,
    };

    // Initialize ball position and velocity
    const initBall = () => {
      ball.x = width / 2;
      ball.y = height / 2;
      // Start in a random direction with speed 2
      const angle = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(angle) * 2;
      ball.vy = Math.sin(angle) * 2;
    };

    // Setup canvas dimension
    resize();
    initBall();

    window.addEventListener("resize", resize);

    // Mouse interaction state
    const mouse = {
      x: null as number | null,
      y: null as number | null,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleCanvasClick = () => {
      // Trigger a temporary speed boost
      ball.speedBoost = 3.5;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleCanvasClick);

    // Touch support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchstart", handleCanvasClick); // Click boost on tap

    // Drift / Speed controls
    let baseSpeed = 2.0;
    let targetBaseSpeed = 2.0;
    let driftTimer = 0;
    let driftInterval = 180 + Math.random() * 120; // change target speed and direction every 3-5 seconds

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      // 1. Apply drift & speed updates
      driftTimer++;
      if (driftTimer >= driftInterval) {
        driftTimer = 0;
        driftInterval = 180 + Math.random() * 120;
        // Randomly pick a new relaxing base speed between 1.5 and 2.5
        targetBaseSpeed = 1.5 + Math.random() * 1.0;

        // Apply a subtle change to direction
        const angleChange = (Math.random() - 0.5) * 0.4; // up to ~11 degrees
        const currentAngle = Math.atan2(ball.vy, ball.vx);
        const newAngle = currentAngle + angleChange;
        ball.vx = Math.cos(newAngle) * Math.hypot(ball.vx, ball.vy);
        ball.vy = Math.sin(newAngle) * Math.hypot(ball.vx, ball.vy);
      }

      // Smoothly interpolate current baseSpeed towards targetBaseSpeed
      baseSpeed += (targetBaseSpeed - baseSpeed) * 0.01;

      // Decay speed boost back to 1.0
      ball.speedBoost += (1.0 - ball.speedBoost) * 0.04;

      // 2. Cursor repulsion
      if (mouse.x !== null && mouse.y !== null) {
        const dx = ball.x - mouse.x;
        const dy = ball.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const repulsionRadius = 150;

        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          // Calculate angle away from cursor
          const angle = Math.atan2(dy, dx);
          // Apply repulsion force to velocity direction
          ball.vx += Math.cos(angle) * force * 0.15;
          ball.vy += Math.sin(angle) * force * 0.15;
        }
      }

      // Normalize speed to baseSpeed * speedBoost
      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      const desiredSpeed = baseSpeed * ball.speedBoost;
      if (currentSpeed > 0) {
        ball.vx = (ball.vx / currentSpeed) * desiredSpeed;
        ball.vy = (ball.vy / currentSpeed) * desiredSpeed;
      }

      // 3. Update Position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 4. Handle boundary collisions with squish/stretch
      let hit = false;
      const bounceForce = 0.55; // factor of squish

      // Left & Right boundaries
      if (ball.x - ball.radius <= 0) {
        ball.vx = Math.abs(ball.vx);
        ball.x = ball.radius;
        ball.squishX = 1 - bounceForce;
        ball.squishY = 1 + bounceForce;
        hit = true;
      } else if (ball.x + ball.radius >= width) {
        ball.vx = -Math.abs(ball.vx);
        ball.x = width - ball.radius;
        ball.squishX = 1 - bounceForce;
        ball.squishY = 1 + bounceForce;
        hit = true;
      }

      // Top & Bottom boundaries
      if (ball.y - ball.radius <= 0) {
        ball.vy = Math.abs(ball.vy);
        ball.y = ball.radius;
        ball.squishX = 1 + bounceForce;
        ball.squishY = 1 - bounceForce;
        hit = true;
      } else if (ball.y + ball.radius >= height) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = height - ball.radius;
        ball.squishX = 1 + bounceForce;
        ball.squishY = 1 - bounceForce;
        hit = true;
      }

      if (hit) {
        ball.glow = 1.0;
      }

      // Decay squish & glow back to baseline
      ball.squishX += (1.0 - ball.squishX) * 0.08;
      ball.squishY += (1.0 - ball.squishY) * 0.08;
      ball.glow += (0.0 - ball.glow) * 0.08;

      // 5. Render
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.scale(ball.squishX, ball.squishY);

      // Create glowing gradient/shadow
      const glowIntensity = 0.4 + ball.glow * 0.6;
      ctx.shadowColor = `rgba(255, 255, 255, ${glowIntensity})`;
      ctx.shadowBlur = 12 + ball.glow * 20;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchstart", handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      <div className="absolute top-6 right-6 text-white font-mono text-xs md:text-sm pointer-events-none select-none z-10 opacity-70 tracking-wider">
        you are here from {formatTime(seconds)}
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
