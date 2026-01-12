import { useMemo, useRef, useState } from "react";
import { Entity } from "@/lib/engine/Entity";
import { Physics } from "@/lib/engine/Physics";
import { Renderer } from "@/lib/engine/Renderer";
import { useJoyEngine } from "@/hooks/useJoyEngine";
import { EngineConfig } from "@/lib/engine/types";
import { Player } from "@/types";
import { LevelBuilder } from "@/lib/engine/LevelBuilder";
import { ParticleSystem } from "@/lib/engine/ParticleSystem";
import { audioManager } from "@/lib/audio/AudioManager";

const CONFIG: EngineConfig = {
	mode: "platformer",
	gravity: { x: 0, y: 0.2 },
	friction: 0.88,
	worldWidth: 800,
	worldHeight: 600,
};

const createLevel = () => {
	const legend = {
		"1": { type: "SOLID", label: "wall", color: "#334155" },
		L: { type: "SOLID", label: "lava", color: "#ef4444" },
		S: { type: "SOLID", label: "water", color: "#3b82f6" },
		F: {
			type: "TRIGGER",
			label: "door_red",
			color: "#7f1d1d",
			height: 60,
			offsetY: -20,
		},
		W: {
			type: "TRIGGER",
			label: "door_blue",
			color: "#1e3a8a",
			height: 60,
			offsetY: -20,
		},
		B: { type: "BOX", label: "box", color: "#d97706" },
	};

	const mapSchema = [
		"11111111111111111111",
		"10000000000000000001",
		"1000F0000000000W0001",
		"11111110000001111111",
		"10000000000000000001",
		"10000000B00000000001",
		"10000011111110000001",
		"10000000000000000001",
		"11110000000000001111",
		"10000000000000000001",
		"10000000000000000001",
		"11111111111100000001",
		"10000000000000000001",
		"10000000000000000001",
		"111LL111111111SSS111",
	];

	// @ts-ignore
	return LevelBuilder.parse(mapSchema, legend, 40);
};

export default function FireWaterGame({
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

	const game = useRef({
		...createLevel(),
		players: new Map<string, Entity>(),
		finishedPlayers: new Set<string>(),
		status: "PLAYING" as "PLAYING" | "GAME_OVER" | "WON",
	});

	useMemo(() => {
		socket.on("input", (data: any) => {
			const p = game.current.players.get(data.playerId);
			if (!p) return;

			if (data.type === "NAV" && data.action === "EXIT") {
				audioManager.play("fail");
				onExit();
			}

			if (game.current.status === "PLAYING") {
				if (data.type === "MOVE") {
					p.moveInput.x = data.val;

					particles.current.emitSmoke(
						p.facingRight ? p.pos.x : p.pos.x + 30,
						p.pos.y + 30
					);
				} else if (data.type === "JUMP" && p.isGrounded) {
					if (p.vel.y === 0) {
						particles.current.emitSparks(p.pos.x, p.pos.y, p.color);
						audioManager.play("jump", 0.3);
					}

					p.vel.y = -p.stats.jumpForce;
				}
			} else {
				if (data.type === "NAV" && data.action === "ENTER") {
					audioManager.play("select_game");
					handleRestart();
					return;
				}
			}
		});
	}, [socket]);

	const canvasRef = useJoyEngine(800, 600, CONFIG, (ctx) => {
		const state = game.current;
		Renderer.clear(ctx, 800, 600);

		players.forEach((p, index) => {
			if (!state.players.has(p.id)) {
				const isFire = index === 0;
				const color = isFire ? "#ef4444" : "#3b82f6";
				const startX = isFire ? 80 : 720;
				const startY = 450;
				const newP = new Entity(
					p.id,
					"PLAYER",
					p.name,
					startX,
					startY,
					30,
					30,
					color
				);
				state.players.set(p.id, newP);
			}
		});

		if (state.status === "PLAYING") {
			const playerList = Array.from(state.players.values());

			const allDynamicEntities = [...playerList, ...state.boxes];
			const staticObstacles = [...state.walls, ...state.hazards];

			Physics.update(allDynamicEntities, staticObstacles, CONFIG);

			playerList.forEach((player) => {
				const isFire = player.color === "#ef4444";

				const allObjects = [...state.hazards, ...state.walls];

				allObjects.forEach((obj) => {
					if (Physics.checkOverlap(player, obj, -2)) {
						if (obj.label === "lava" && !isFire) killGame(player);
						if (obj.label === "water" && isFire) killGame(player);
						if (obj.label === "slime") killGame(player);
					}
				});

				state.doors.forEach((door) => {
					if (Physics.checkOverlap(player, door, 10)) {
						if (
							(door.label === "door_red" && isFire) ||
							(door.label === "door_blue" && !isFire)
						) {
							if (!state.finishedPlayers.has(player.id)) {
								state.finishedPlayers.add(player.id);
								door.setStats({ speed: 1 });
								audioManager.play("score");

								particles.current.emitConfetti(player.pos.x, player.pos.y);
							}
						}
					} else {
						if (
							state.finishedPlayers.has(player.id) &&
							((door.label === "door_red" && isFire) ||
								(door.label === "door_blue" && !isFire))
						) {
							state.finishedPlayers.delete(player.id);
							door.setStats({ speed: 0 });
						}
					}
				});
			});

			if (
				state.players.size > 0 &&
				state.finishedPlayers.size === state.players.size
			) {
				finishGame();
			}
		}

		particles.current.update();
		particles.current.draw(ctx);

		state.doors.forEach((d) => {
			ctx.fillStyle = d.color;
			ctx.fillRect(d.pos.x, d.pos.y, d.size.x, d.size.y);

			// We set door's speed to 1 when player is in the door
			if (d.stats.speed != 1) {
				ctx.fillStyle = "#000";
				ctx.fillRect(d.pos.x + 5, d.pos.y + 5, d.size.x - 10, d.size.y - 5);
			}
		});
		state.hazards.forEach((h) => Renderer.draw(ctx, h));
		state.walls.forEach((w) => Renderer.draw(ctx, w));
		state.boxes.forEach((b) => Renderer.draw(ctx, b));
		state.players.forEach((p) => Renderer.draw(ctx, p));
	});

	const killGame = (player: Entity) => {
		audioManager.play("fail");
		game.current.status = "GAME_OVER";
		setGameStateDisplay(player.label + " YANDI! 💀");
	};

	const finishGame = () => {
		audioManager.play("finish");
		game.current.status = "WON";
		setGameStateDisplay("BÖLÜM GEÇİLDİ! 🎉");
	};

	const handleRestart = () => {
		const newLevel = createLevel();
		game.current.walls = newLevel.walls;
		game.current.hazards = newLevel.hazards;
		game.current.doors = newLevel.doors;
		game.current.boxes = newLevel.boxes;
		game.current.players.clear();
		game.current.finishedPlayers.clear();
		game.current.status = "PLAYING";
		setGameStateDisplay(null);
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
				<div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col animate-in zoom-in z-50">
					<h2
						className={`text-6xl font-black mb-8 ${
							game.current.status === "WON" ? "text-green-500" : "text-red-500"
						}`}
					>
						{gameStateDisplay}
					</h2>
					<button
						onClick={handleRestart}
						className="bg-white text-black px-8 py-4 rounded-xl font-bold text-2xl hover:scale-110 transition-transform"
					>
						Tekrar Dene
					</button>
				</div>
			)}
		</div>
	);
}
