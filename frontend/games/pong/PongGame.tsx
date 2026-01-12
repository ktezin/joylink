import { useMemo, useRef, useEffect, useState } from "react";
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
	friction: 0.82,
	worldWidth: 800,
	worldHeight: 600,
};

const WIN_SCORE = 5;

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

	const [gameStateDisplay, setGameStateDisplay] = useState<string | null>(null);

	const gameState = useRef({
		mode: "PLAYING" as "PLAYING" | "GOAL_SCORED" | "GAME_OVER",
		countdownVal: 3,
		goalText: "",
		winnerName: "",
	});

	const game = useRef({
		paddles: new Map<string, Entity>(),
		ball: new Entity("ball", "BOX", "ball", 400, 300, 20, 20, "#ffffff"),
		walls: [
			new Entity("top_wall", "SOLID", "wall", 0, -50, 800, 50, "#334155"),
			new Entity("bot_wall", "SOLID", "wall", 0, 600, 800, 50, "#334155"),
		],
		score: { p1: 0, p2: 0 },
		collisionCooldowns: new Map<string, number>(),
	});

	useEffect(() => {
		audioManager.playMusic("bgm", 0.15);
		return () => audioManager.stopMusic();
	}, []);

	const resetBall = () => {
		const g = game.current;
		g.ball.pos = { x: 400, y: 300 };
		const dirX = Math.random() > 0.5 ? 1 : -1;
		const dirY = (Math.random() - 0.5) * 1.5;
		g.ball.vel = { x: 2 * dirX, y: 2 * dirY };

		g.paddles.forEach((p) => {
			p.pos.y = 250;
			p.vel.y = 0;
		});
	};

	useMemo(() => {
		resetBall();
	}, []);

	const startGoalSequence = (scorerName: string) => {
		gameState.current.mode = "GOAL_SCORED";
		gameState.current.goalText = scorerName + " SCORED!";
		gameState.current.countdownVal = 3;

		const interval = setInterval(() => {
			gameState.current.countdownVal--;

			if (gameState.current.countdownVal <= 0) {
				clearInterval(interval);
				if (gameState.current.mode !== "GAME_OVER") {
					resetBall();
					gameState.current.mode = "PLAYING";
					audioManager.play("select", 0.5);
				}
			}
		}, 1000);
	};

	useEffect(() => {
		const handleInput = (data: any) => {
			const state = game.current;
			const mode = gameState.current.mode;

			if (data.type === "NAV" && data.action === "EXIT") {
				audioManager.play("fail");
				onExit();
			}

			if (mode === "GAME_OVER") {
				if (data.type === "NAV" && data.action === "ENTER") {
					audioManager.play("select_game");
					handleRestart();
					return;
				}
				return;
			}
			if (mode !== "PLAYING") return;

			const p = state.paddles.get(data.playerId);
			if (!p) return;

			if (data.type === "MOVE") {
				p.moveInput.y = data.val;
			}
		};

		socket.on("input", handleInput);
		return () => {
			socket.off("input", handleInput);
		};
	}, [socket, onExit]);

	const canvasRef = useJoyEngine(800, 600, PONG_CONFIG, (ctx) => {
		const state = game.current;
		const mode = gameState.current.mode;

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
				paddle.setStats({ speed: 5, acceleration: 0.8 });
				state.paddles.set(p.id, paddle);
			}
		});

		const paddleList = Array.from(state.paddles.values());

		if (mode === "PLAYING") {
			Physics.update(paddleList, state.walls, PONG_CONFIG);
			Physics.update(
				[state.ball],
				[...state.walls, ...paddleList],
				PONG_CONFIG
			);

			const minSpeed = 2;
			if (Math.abs(state.ball.vel.x) < minSpeed) {
				state.ball.vel.x = state.ball.vel.x > 0 ? minSpeed : -minSpeed;
			}
		} else if (mode === "GOAL_SCORED") {
			const slowFactor = 0.05;
			state.ball.pos.x += state.ball.vel.x * slowFactor;
			state.ball.pos.y += state.ball.vel.y * slowFactor;
			paddleList.forEach((p) => {
				p.pos.y += p.vel.y * slowFactor;
			});
		}

		if (
			mode === "PLAYING" &&
			(state.ball.pos.y <= 0 || state.ball.pos.y >= 600 - state.ball.size.y)
		) {
			audioManager.play("hit", 0.4);
			particles.current.emitSparks(
				state.ball.pos.x,
				state.ball.pos.y,
				"#64748b"
			);
		}

		const now = Date.now();
		paddleList.forEach((paddle) => {
			if (Physics.checkOverlap(state.ball, paddle, -5)) {
				const lastHitTime = state.collisionCooldowns.get(paddle.id) || 0;
				if (now - lastHitTime > 200) {
					audioManager.play("hit", 0.8);
					particles.current.emitSparks(
						state.ball.pos.x,
						state.ball.pos.y,
						paddle.color
					);
					state.collisionCooldowns.set(paddle.id, now);

					const speedMultiplier = 1.05;
					const maxSpeed = 16;
					let newVelX = state.ball.vel.x * speedMultiplier;
					let newVelY = state.ball.vel.y * speedMultiplier;

					if (Math.abs(newVelX) > maxSpeed)
						newVelX = newVelX > 0 ? maxSpeed : -maxSpeed;
					if (Math.abs(newVelY) > maxSpeed)
						newVelY = newVelY > 0 ? maxSpeed : -maxSpeed;

					state.ball.vel.x = newVelX;
					state.ball.vel.y = newVelY;
					state.ball.vel.y += paddle.vel.y * 0.4;
				}
			}
		});

		if (mode === "PLAYING") {
			if (state.ball.pos.x <= 0) {
				handleGoal(1);
			} else if (state.ball.pos.x >= 800 - state.ball.size.x) {
				handleGoal(0);
			}
		}

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

		if (mode === "GOAL_SCORED") {
			const gradient = ctx.createRadialGradient(400, 300, 100, 400, 300, 600);
			gradient.addColorStop(0, "rgba(0,0,0,0)");
			gradient.addColorStop(1, "rgba(0,0,0,0.8)");
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, 800, 600);

			ctx.textAlign = "center";
			if (Math.floor(Date.now() / 200) % 2 === 0) ctx.fillStyle = "#fbbf24";
			else ctx.fillStyle = "#fff";
			ctx.font = "bold 100px sans-serif";
			ctx.fillText("GOAL!", 400, 250);

			ctx.font = "bold 40px sans-serif";
			ctx.fillStyle = "#fff";
			ctx.fillText(gameState.current.goalText, 400, 320);

			ctx.font = "bold 30px monospace";
			ctx.fillStyle = "#94a3b8";
			ctx.fillText(`Starting in: ${gameState.current.countdownVal}`, 400, 450);
		}
	});

	const handleGoal = (winnerIdx: number) => {
		const state = game.current;
		audioManager.play("score", 1.0);

		const color = winnerIdx === 0 ? "#3b82f6" : "#ef4444";
		const xPos = winnerIdx === 0 ? 700 : 100;

		particles.current.emitConfetti(xPos, 300, [color, "#ffffff"]);

		if (winnerIdx === 0) state.score.p1++;
		else state.score.p2++;

		if (state.score.p1 >= WIN_SCORE || state.score.p2 >= WIN_SCORE) {
			gameState.current.mode = "GAME_OVER";
			const wName = players[winnerIdx].name;
			audioManager.play("win");
			setGameStateDisplay(`${wName} WON!`);
		} else {
			startGoalSequence(players[winnerIdx].name);
		}
	};

	const handleRestart = () => {
		const state = game.current;
		state.score = { p1: 0, p2: 0 };
		gameState.current.mode = "PLAYING";
		setGameStateDisplay(null);
		resetBall();
		audioManager.play("select");
	};

	return (
		<div className="relative w-full h-full">
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				className="w-full h-full object-contain bg-slate-900 rounded-xl shadow-2xl border-4 border-slate-700"
			/>

			{gameStateDisplay && (
				<div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col animate-in zoom-in z-50 rounded-xl">
					<h2
						className={`text-6xl font-black mb-8 text-yellow-400 drop-shadow-lg text-center`}
					>
						{gameStateDisplay}
					</h2>

					<div className="flex gap-4">
						<button
							onClick={handleRestart}
							className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-green-500 transition-colors border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
						>
							Play Again
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
