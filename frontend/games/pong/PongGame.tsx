import { useMemo, useRef, useEffect } from "react";
import { Entity } from "@/lib/engine/Entity";
import { Physics } from "@/lib/engine/Physics";
import { Renderer } from "@/lib/engine/Renderer";
import { useJoyEngine } from "@/hooks/useJoyEngine";
import { EngineConfig } from "@/lib/engine/types";
import { Player } from "@/types";
import { ParticleSystem } from "@/lib/engine/ParticleSystem";
import { audioManager } from "@/lib/audio/AudioManager";

const PONG_CONFIG: EngineConfig = {
	mode: "topdown",
	gravity: { x: 0, y: 0 },
	friction: 0.85,
	worldWidth: 800,
	worldHeight: 600,
};

export default function PongGame({
	socket,
	players,
	onExit,
}: {
	socket: any;
	players: Player[];
	onExit: () => void;
}) {
	const particles = useRef(new ParticleSystem());

	useEffect(() => {
		audioManager.playMusic("bgm", 0.2);

		return () => audioManager.stopMusic();
	}, []);

	const game = useRef({
		paddles: new Map<string, Entity>(),
		ball: new Entity("ball", "BALL", "ball", 400, 300, 20, 20, "#ffffff"),
		walls: [
			new Entity("top_wall", "SOLID", "wall", 0, -50, 800, 50, "#334155"),
			new Entity("bot_wall", "SOLID", "wall", 0, 600, 800, 50, "#334155"),
		],
		score: { p1: 0, p2: 0 },
		status: "PLAYING" as "PLAYING" | "WAITING",
		collisionCooldowns: new Map<string, number>(),
	});

	const resetBall = () => {
		const g = game.current;
		g.ball.pos = { x: 400, y: 300 };

		const dirX = Math.random() > 0.5 ? 1 : -1;
		const dirY = Math.random() > 0.5 ? 1 : -1;

		g.ball.vel = { x: 2 * dirX, y: 1.2 * dirY };
		g.ball.stats.speed = 10;
	};

	useMemo(() => {
		resetBall();
	}, []);

	useEffect(() => {
		const handleInput = (data: any) => {
			const p = game.current.paddles.get(data.playerId);
			if (!p) return;

			if (data.type === "NAV" && data.action === "EXIT") {
				audioManager.play("fail");
				onExit();
			}

			if (data.type === "MOVE") {
				p.moveInput.y = data.val;
			}
		};

		socket.on("input", handleInput);
		return () => {
			socket.off("input", handleInput);
		};
	}, [socket]);

	const canvasRef = useJoyEngine(800, 600, PONG_CONFIG, (ctx) => {
		const state = game.current;
		Renderer.clear(ctx, 800, 600);

		players.forEach((p, index) => {
			if (!state.paddles.has(p.id)) {
				const isLeft = index === 0;
				const x = isLeft ? 30 : 750;
				const color = isLeft ? "#3b82f6" : "#ef4444";

				const paddle = new Entity(
					p.id,
					"PLAYER",
					"paddle",
					x,
					250,
					20,
					100,
					color
				);
				paddle.axisLock = "x";
				paddle.setStats({ speed: 8, acceleration: 2 });
				state.paddles.set(p.id, paddle);
			}
		});

		const paddleList = Array.from(state.paddles.values());

		Physics.update(paddleList, state.walls, PONG_CONFIG);

		const BALL_CONFIG = { ...PONG_CONFIG, friction: 1 };
		Physics.update([state.ball], [...state.walls, ...paddleList], BALL_CONFIG);

		// Wall hit effect
		if (state.ball.pos.y <= 0 || state.ball.pos.y >= 600 - state.ball.size.y) {
			audioManager.play("hit", 0.4);
			particles.current.emit(state.ball.pos.x, state.ball.pos.y, "#64748b", 8);
		}

		const now = Date.now();

		paddleList.forEach((paddle) => {
			if (Physics.checkOverlap(state.ball, paddle, -5)) {
				const lastHitTime = state.collisionCooldowns.get(paddle.id) || 0;

				if (now - lastHitTime > 200) {
					audioManager.play("hit", 0.8);

					particles.current.emit(
						state.ball.pos.x,
						state.ball.pos.y,
						paddle.color,
						12
					);

					state.collisionCooldowns.set(paddle.id, now);
				}
			}
		});

		if (state.ball.pos.x < -20) {
			state.score.p2++;
			audioManager.play("score", 1.0);
			particles.current.emit(10, state.ball.pos.y, "#ef4444", 40);
			resetBall();
		} else if (state.ball.pos.x > 820) {
			state.score.p1++;
			audioManager.play("score", 1.0);
			particles.current.emit(790, state.ball.pos.y, "#3b82f6", 40);
			resetBall();
		}

		// RENDER
		particles.current.update();
		particles.current.draw(ctx);

		ctx.setLineDash([10, 15]);
		ctx.beginPath();
		ctx.moveTo(400, 0);
		ctx.lineTo(400, 600);
		ctx.strokeStyle = "#475569";
		ctx.lineWidth = 4;
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.font = "bold 80px monospace";
		ctx.fillStyle = "#334155";
		ctx.textAlign = "center";
		ctx.fillText(state.score.p1.toString(), 200, 100);
		ctx.fillText(state.score.p2.toString(), 600, 100);

		state.walls.forEach((w) => Renderer.draw(ctx, w));
		paddleList.forEach((p) => Renderer.draw(ctx, p));
		Renderer.draw(ctx, state.ball);
	});

	return (
		<div className="relative w-full h-full">
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				className="w-full h-full object-contain bg-slate-900 rounded-xl shadow-2xl border-4 border-slate-700"
			/>
		</div>
	);
}
