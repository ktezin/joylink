import { useMemo, useRef, useState, useEffect } from "react";
import { Entity } from "@/lib/engine/Entity";
import { Physics } from "@/lib/engine/Physics";
import { Renderer } from "@/lib/engine/Renderer";
import { useJoyEngine } from "@/hooks/useJoyEngine";
import { EngineConfig } from "@/lib/engine/types";
import { Player } from "@/types";
import { ParticleSystem } from "@/lib/engine/ParticleSystem";
import { audioManager } from "@/lib/audio/AudioManager";

const HEADBALL_CONFIG: EngineConfig = {
	mode: "platformer",
	gravity: { x: 0, y: 0.25 },
	friction: 0.94,
	worldWidth: 800,
	worldHeight: 600,
};

const WIN_SCORE = 5;
const FLOOR_Y = 520;

export default function HeadBallGame({
	socket,
	players,
	onExit,
}: {
	socket: any;
	players: Player[];
	onExit: () => void;
}) {
	const particles = useRef(new ParticleSystem());
	const lastUpdateTime = useRef(Date.now());

	const gameState = useRef({
		mode: "COUNTDOWN" as "COUNTDOWN" | "PLAYING" | "GOAL_SCORED" | "GAME_OVER",
		countdownVal: 3,
		goalText: "",
		winnerName: "",
	});

	const game = useRef({
		players: new Map<string, Entity>(),
		jumpBuffers: new Map<string, number>(),
		ball: new Entity("ball", "BALL", "ball", 400, 200, 44, 44, "#ffffff"),
		walls: [
			new Entity("floor", "SOLID", "wall", 0, FLOOR_Y, 800, 80, "#22c55e"),
			new Entity("net", "SOLID", "wall", 0, -200, 800, 200, "transparent"),
			new Entity("l_wall", "SOLID", "wall", -100, 0, 100, 800, "#334155"),
			new Entity("r_wall", "SOLID", "wall", 800, 0, 100, 800, "#334155"),
		],
		goals: [
			new Entity("post_l", "SOLID", "post", -10, 300, 40, 20, "#cbd5e1"),
			new Entity("post_r", "SOLID", "post", 770, 300, 40, 20, "#cbd5e1"),
			new Entity("goal_l", "TRIGGER", "goal", -50, 320, 50, 220, "transparent"),
			new Entity("goal_r", "TRIGGER", "goal", 800, 320, 50, 220, "transparent"),
		],
		score: { p1: 0, p2: 0 },
		lastTouch: null as string | null,
	});

	useEffect(() => {
		audioManager.playMusic("bgm", 0.15);
		startInitialCountdown();
		return () => audioManager.stopMusic();
	}, []);

	const startInitialCountdown = () => {
		gameState.current.mode = "COUNTDOWN";
		gameState.current.countdownVal = 3;
		resetBall();

		const interval = setInterval(() => {
			gameState.current.countdownVal--;
			if (gameState.current.countdownVal > 0) {
				audioManager.play("blip", 0.5);
			} else {
				audioManager.play("select", 0.8);
				gameState.current.mode = "PLAYING";
				clearInterval(interval);
			}
		}, 1000);
	};

	const startGoalSequence = (winnerName: string) => {
		gameState.current.mode = "GOAL_SCORED";
		gameState.current.goalText = winnerName + " SCORED!";
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

	const resetBall = () => {
		const g = game.current;
		g.ball.pos = { x: 400, y: 250 };
		g.ball.vel = { x: (Math.random() - 0.5) * 2, y: -2 };
		g.lastTouch = null;

		const playersArr = Array.from(g.players.values());
		const p1 = playersArr[0];
		const p2 = playersArr[1];
		if (p1) {
			p1.pos.x = 150;
			p1.vel = { x: 0, y: 0 };
		}
		if (p2) {
			p2.pos.x = 600;
			p2.vel = { x: 0, y: 0 };
		}
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
				if (data.type === "NAV" && data.action === "ENTER") handleRestart();
				return;
			}

			if (mode !== "PLAYING") return;

			const p = state.players.get(data.playerId);
			if (!p) return;

			if (data.type === "MOVE") {
				p.moveInput.x = data.val;
				if (data.val !== 0) p.facingRight = data.val > 0;
			} else if (data.type === "JUMP") {
				state.jumpBuffers.set(data.playerId, 10);
			} else if (data.type === "SHOOT") {
				handleShoot(p, state.ball);
			}
		};

		socket.on("input", handleInput);

		return () => socket.off("input", handleInput);
	}, [socket, onExit]);

	const handleShoot = (player: Entity, ball: Entity) => {
		const dx =
			ball.pos.x + ball.size.x / 2 - (player.pos.x + player.size.x / 2);
		const dy =
			ball.pos.y + ball.size.y / 2 - (player.pos.y + player.size.y / 2);
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist < 90) {
			audioManager.play("hit", 0.8);
			const dirX = player.facingRight ? 1 : -1;

			ball.vel.x = 6 * dirX;
			ball.vel.y = -8;

			ball.pos.x += dirX * 10;
			ball.pos.y -= 5;
			game.current.lastTouch = player.id;
			particles.current.emitSparks(ball.pos.x, ball.pos.y, "#fbbf24");
		} else {
			audioManager.play("blip", 0.2);
		}
	};

	const canvasRef = useJoyEngine(800, 600, HEADBALL_CONFIG, (ctx) => {
		const state = game.current;
		const mode = gameState.current.mode;

		Renderer.clear(ctx, 800, 600);

		players.forEach((p) => {
			if (!state.players.has(p.id)) {
				const isLeft = state.players.size === 0;
				const newP = new Entity(
					p.id,
					"PLAYER",
					p.name,
					isLeft ? 150 : 600,
					FLOOR_Y - 75,
					50,
					75,
					isLeft ? "#3b82f6" : "#ef4444"
				);
				newP.setStats({
					speed: 3,
					acceleration: 0.4,
					jumpForce: 10,
				});
				state.players.set(p.id, newP);
			}

			const playerEntity = state.players.get(p.id);
			if (playerEntity && mode === "PLAYING") {
				let buffer = state.jumpBuffers.get(p.id) || 0;
				if (buffer > 0) {
					if (playerEntity.isGrounded) {
						playerEntity.vel.y = -playerEntity.stats.jumpForce;
						audioManager.play("jump", 0.3);
						particles.current.emitSmoke(
							playerEntity.pos.x + 25,
							playerEntity.pos.y + 75
						);
						state.jumpBuffers.set(p.id, 0);
					} else {
						state.jumpBuffers.set(p.id, buffer - 1);
					}
				}
			}
		});

		const playerList = Array.from(state.players.values());

		if (mode === "PLAYING") {
			const dynamicObjects = [...playerList, state.ball];
			const staticObjects = [...state.walls, ...state.goals];

			Physics.update(dynamicObjects, staticObjects, HEADBALL_CONFIG);
		} else if (mode === "GOAL_SCORED") {
			const slowFactor = 0.05;
			state.ball.pos.x += state.ball.vel.x * slowFactor;
			state.ball.pos.y += state.ball.vel.y * slowFactor;

			playerList.forEach((p) => {
				p.pos.x += p.vel.x * slowFactor;
				p.pos.y += p.vel.y * slowFactor;
			});
		}

		if (mode === "PLAYING") {
			if (playerList.length >= 2) {
				const ball = state.ball;
				if (
					Physics.checkOverlap(ball, playerList[0], 10) &&
					Physics.checkOverlap(ball, playerList[1], 10)
				) {
					ball.vel.y = -5;
					ball.pos.y -= 5;
					ball.vel.x = (Math.random() - 0.5) * 10;
				}
			}
			playerList.forEach((p) => {
				if (p.pos.y < 300) {
					if (p.pos.x < 50) p.vel.x += 1;
					if (p.pos.x > 750) p.vel.x -= 1;
				}
			});
		}

		const ball = state.ball;
		if (ball.pos.y > FLOOR_Y - ball.size.y) {
			ball.pos.y = FLOOR_Y - ball.size.y;
			ball.vel.y *= -0.6;
			if (Math.abs(ball.vel.y) < 1) ball.vel.y = 0;
			ball.vel.x *= 0.96;
		}

		if (mode === "PLAYING" && ball.pos.y > 320) {
			if (ball.pos.x < 10) handleGoal(1);
			else if (ball.pos.x > 750) handleGoal(0);
		}

		// Render
		drawBackground(ctx);

		particles.current.update();
		particles.current.draw(ctx);

		state.goals.forEach((g) => {
			if (g.type === "SOLID") {
				ctx.fillStyle = "#cbd5e1";
				ctx.fillRect(g.pos.x, g.pos.y, g.size.x, g.size.y);
			}
		});

		state.players.forEach((p) => drawPlayer(ctx, p));

		drawBall(ctx, ball);
		drawScoreboard(ctx, state.score.p1, state.score.p2);

		// UI
		if (mode === "COUNTDOWN") {
			ctx.fillStyle = "rgba(0,0,0,0.6)";
			ctx.fillRect(0, 0, 800, 600);
			ctx.textAlign = "center";
			ctx.fillStyle = "#fbbf24";
			ctx.font = "bold 150px sans-serif";
			ctx.fillText(gameState.current.countdownVal.toString(), 400, 350);
			ctx.font = "30px sans-serif";
			ctx.fillStyle = "#fff";
			ctx.fillText("GET READY!", 400, 420);
		}

		if (mode === "GOAL_SCORED") {
			const gradient = ctx.createRadialGradient(400, 300, 200, 400, 300, 600);
			gradient.addColorStop(0, "rgba(0,0,0,0)");
			gradient.addColorStop(1, "rgba(0,0,0,0.7)");
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, 800, 600);

			ctx.textAlign = "center";

			ctx.fillStyle = "#fbbf24";
			ctx.font = "bold 90px sans-serif";
			ctx.fillText("GOAL!", 400, 250);

			ctx.font = "bold 40px sans-serif";
			ctx.fillStyle = "#fff";
			ctx.fillText(gameState.current.goalText, 400, 310);

			ctx.font = "bold 30px monospace";
			ctx.fillStyle = "#94a3b8";
			ctx.fillText(`Starting in: ${gameState.current.countdownVal}`, 400, 450);
		}

		if (mode === "GAME_OVER") {
			drawGameOver(ctx, gameState.current.winnerName);
		}
	});

	const handleGoal = (winnerIdx: number) => {
		const state = game.current;
		audioManager.play("score", 1.0);

		particles.current.emitConfetti(winnerIdx === 0 ? 600 : 200, 300);

		if (winnerIdx === 0) state.score.p1++;
		else state.score.p2++;

		if (state.score.p1 >= WIN_SCORE || state.score.p2 >= WIN_SCORE) {
			gameState.current.mode = "GAME_OVER";
			gameState.current.winnerName = players[winnerIdx].name;
			audioManager.play("win");
		} else {
			startGoalSequence(players[winnerIdx].name);
		}
	};

	const handleRestart = () => {
		const state = game.current;
		state.score = { p1: 0, p2: 0 };
		gameState.current.winnerName = "";
		startInitialCountdown();
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
		</div>
	);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = "#1e293b";
	ctx.fillRect(0, 0, 800, 600);
	ctx.fillStyle = "#15803d";
	ctx.fillRect(0, FLOOR_Y, 800, 80);
	ctx.strokeStyle = "rgba(255,255,255,0.2)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(400, 100);
	ctx.lineTo(400, 520);
	ctx.stroke();
	ctx.fillStyle = "rgba(255,255,255,0.1)";
	ctx.fillRect(0, 300, 40, 220);
	ctx.fillRect(760, 300, 40, 220);
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Entity) {
	const cx = p.pos.x + 25;
	const cy = p.pos.y + 35;
	const dir = p.facingRight ? 1 : -1;
	ctx.fillStyle = "#0f172a";
	const w = p.moveInput.x !== 0 ? Math.sin(Date.now() / 200) * 8 : 0;
	ctx.beginPath();
	ctx.ellipse(cx - 10 + w, cy + 38, 8, 5, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(cx + 10 - w, cy + 38, 8, 5, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = p.color;
	ctx.beginPath();
	ctx.arc(cx, cy, 28, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "white";
	const ex = cx + 12 * dir;
	ctx.beginPath();
	ctx.arc(ex, cy - 5, 9, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(ex + 3 * dir, cy - 5, 4, 0, Math.PI * 2);
	ctx.fill();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Entity) {
	const bx = ball.pos.x + 22;
	const by = ball.pos.y + 22;
	ctx.save();
	ctx.translate(bx, by);
	ctx.rotate(ball.pos.x / 25);
	const g = ctx.createRadialGradient(-5, -5, 2, 0, 0, 22);
	g.addColorStop(0, "#fff");
	g.addColorStop(1, "#cbd5e1");
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(0, 0, 22, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#334155";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(22, 0);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(0, 0, 22, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}

function drawScoreboard(ctx: CanvasRenderingContext2D, p1: number, p2: number) {
	ctx.font = "bold 80px sans-serif";
	ctx.textAlign = "center";
	ctx.fillStyle = "rgba(255,255,255,0.8)";
	ctx.fillText(p1.toString(), 200, 80);
	ctx.fillText(p2.toString(), 600, 80);
}

function drawGameOver(ctx: CanvasRenderingContext2D, w: string) {
	ctx.fillStyle = "rgba(0,0,0,0.85)";
	ctx.fillRect(0, 0, 800, 600);
	ctx.textAlign = "center";
	ctx.fillStyle = "#fbbf24";
	ctx.font = "bold 56px sans-serif";
	ctx.fillText("KAZANAN", 400, 250);
	ctx.fillStyle = "#fff";
	ctx.fillText(w, 400, 320);
	ctx.font = "20px monospace";
	ctx.fillStyle = "#94a3b8";
	ctx.fillText("LEAVE [EXIT] - AGAIN [ENTER]", 400, 400);
}
