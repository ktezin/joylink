import { useMemo, useRef, useState } from "react";
import { Entity } from "@/lib/engine/Entity";
import { Physics } from "@/lib/engine/Physics";
import { Renderer } from "@/lib/engine/Renderer";
import { useJoyEngine } from "@/hooks/useJoyEngine";
import { EngineConfig } from "@/lib/engine/types";
import { Player } from "@/types";

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
}: {
	socket: any;
	players: Player[];
}) {
	const game = useRef({
		paddles: new Map<string, Entity>(),
		ball: new Entity("ball", "BALL", "ball", 400, 300, 20, 20, "#ffffff"),
		walls: [
			new Entity("top_wall", "SOLID", "wall", 0, -50, 800, 50, "#334155"),
			new Entity("bot_wall", "SOLID", "wall", 0, 600, 800, 50, "#334155"),
		],
		score: { p1: 0, p2: 0 },
		status: "PLAYING" as "PLAYING" | "WAITING",
	});

	const resetBall = () => {
		const g = game.current;
		g.ball.pos = { x: 400, y: 300 };
		const dirX = Math.random() > 0.5 ? 1 : -1;
		const dirY = Math.random() > 0.5 ? 1 : -1;
		g.ball.vel = { x: 2 * dirX, y: 1.2 * dirY };
	};

	useMemo(() => {
		resetBall();
		game.current.ball.stats.speed = 10;
	}, []);

	useMemo(() => {
		socket.on("input", (data: any) => {
			const p = game.current.paddles.get(data.playerId);
			if (!p) return;

			if (data.type === "MOVE") {
				p.moveInput.y = data.val;
			}
		});
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

				paddle.setStats({
					speed: 6,
					acceleration: 2,
				});

				state.paddles.set(p.id, paddle);
			}
		});

		const paddleList = Array.from(state.paddles.values());

		Physics.update(paddleList, state.walls, PONG_CONFIG);

		const BALL_CONFIG = { ...PONG_CONFIG, friction: 1 };
		Physics.update([state.ball], [...state.walls, ...paddleList], BALL_CONFIG);

		if (state.ball.pos.x < 0) {
			state.score.p2++;
			resetBall();
		} else if (state.ball.pos.x > 800) {
			state.score.p1++;
			resetBall();
		}

		// AI
		if (players.length < 2) {
		}

		ctx.setLineDash([10, 15]);
		ctx.beginPath();
		ctx.moveTo(400, 0);
		ctx.lineTo(400, 600);
		ctx.strokeStyle = "#475569";
		ctx.lineWidth = 4;
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.font = "80px monospace";
		ctx.fillStyle = "#64748b";
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
