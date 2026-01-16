import { useMemo, useRef, useState } from "react";
import { Entity } from "@/lib/engine/Entity";
import { Physics } from "@/lib/engine/Physics";
import { Renderer } from "@/lib/engine/Renderer";
import { useJoyEngine } from "@/hooks/useJoyEngine";
import { EngineConfig, Vector2 } from "@/lib/engine/types";
import { Player } from "@/types";
import { LevelBuilder } from "@/lib/engine/LevelBuilder";
import { ParticleSystem } from "@/lib/engine/ParticleSystem";
import { audioManager } from "@/lib/audio/AudioManager";

const CONFIG: EngineConfig = {
	mode: "platformer",
	gravity: { x: 0, y: 0.05 },
	friction: 0.88,
	worldWidth: 800,
	worldHeight: 600,
	disablePlayerCollision: true,
};

const COMMON_LEGEND = {
	"1": { type: "SOLID", label: "wall", color: "#334155" },
	"[": {
		type: "SOLID",
		label: "slope_left",
		color: "#334155",
		shape: "triangle_left",
	},
	"]": {
		type: "SOLID",
		label: "slope_right",
		color: "#334155",
		shape: "triangle_right",
	},
	L: { type: "SOLID", label: "lava", color: "#ef4444", height: 36, offsetY: 4 },
	S: {
		type: "SOLID",
		label: "water",
		color: "#3b82f6",
		height: 36,
		offsetY: 4,
	},

	A: { type: "SOLID", label: "acid", color: "#90ff0a", height: 36, offsetY: 4 },
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

const LEVELS = [
	{
		map: [
			"11111111111111111111",
			"10000000000000000001",
			"10000000000000000001",
			"111111[LL][SS]110001",
			"10000000000000000001",
			"10000000000000000001",
			"1000111111[AA]111111",
			"10000000000000000001",
			"10000000000000000001",
			"11111111111111111001",
			"10000000000000000001",
			"10000000000000000001",
			"10000000000000000001",
			"10F0W000000000000001",
			"11111111[AA]11111111",
		],
		setup: () => {
			const elv = new Entity(
				"elv1",
				"SOLID",
				"elevator",
				680,
				360,
				80,
				20,
				"#a855f7"
			);
			elv.stats = {
				...elv.stats,
				originY: 360,
				targetY: 555,
				speed: 3,
				type: "vertical",
			};

			const btn1 = new Entity(
				"btn1",
				"TRIGGER",
				"button",
				293,
				356,
				40,
				10,
				"#eab308"
			);
			btn1.stats = {
				...btn1.stats,
				originalY: 350,
				pressedY: 356,
				linkedElevatorId: "elv1",
			};

			const btn2 = new Entity(
				"btn1",
				"TRIGGER",
				"button",
				500,
				552,
				40,
				10,
				"#eab308"
			);
			btn2.stats = {
				...btn2.stats,
				originalY: 550,
				pressedY: 555,
				linkedElevatorId: "elv1",
			};

			return { buttons: [btn1, btn2], elevators: [elv] };
		},
	},
	{
		map: [
			"11111111111111111111",
			"10000000000000000001",
			"10000000000000000001",
			"111111[LL][SS]110001",
			"10000000000000000001",
			"10000000000000000001",
			"1000111111[AA]111111",
			"10000000000000000001",
			"10000000000000000001",
			"11111111111111111001",
			"10000000000000000001",
			"10000000000000000001",
			"10000000000000000001",
			"10F0W000000000000001",
			"11111111[AA]11111111",
		],
		setup: () => {
			const elv = new Entity(
				"elv1",
				"SOLID",
				"elevator",
				680,
				360,
				80,
				20,
				"#a855f7"
			);
			elv.stats = {
				...elv.stats,
				originY: 360,
				targetY: 555,
				speed: 3,
				type: "vertical",
			};

			const btn1 = new Entity(
				"btn1",
				"TRIGGER",
				"button",
				293,
				356,
				40,
				10,
				"#eab308"
			);
			btn1.stats = {
				...btn1.stats,
				originalY: 350,
				pressedY: 356,
				linkedElevatorId: "elv1",
			};

			const btn2 = new Entity(
				"btn1",
				"TRIGGER",
				"button",
				500,
				552,
				40,
				10,
				"#eab308"
			);
			btn2.stats = {
				...btn2.stats,
				originalY: 550,
				pressedY: 555,
				linkedElevatorId: "elv1",
			};

			return { buttons: [btn1, btn2], elevators: [elv] };
		},
	},
];

const loadLevel = (levelIndex: number) => {
	const data = LEVELS[levelIndex];
	if (!data) return null;

	// @ts-ignore
	const staticMap = LevelBuilder.parse(data.map, COMMON_LEGEND, 40);
	const mechanics = data.setup();

	console.log("static map : ", staticMap);

	return { ...staticMap, mechanics, levelIndex };
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
	const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

	const game = useRef({
		walls: [] as Entity[],
		hazards: [] as Entity[],
		doors: [] as Entity[],
		boxes: [] as Entity[],
		mechanics: { buttons: [] as Entity[], elevators: [] as Entity[] },
		players: new Map<string, Entity>(),
		finishedPlayers: new Set<string>(),
		status: "PLAYING" as "PLAYING" | "GAME_OVER" | "WON" | "FINISHED_ALL",
	});

	const timeRef = useRef(0);

	const startLevel = (idx: number) => {
		const levelData = loadLevel(idx);
		if (!levelData) {
			game.current.status = "FINISHED_ALL";
			setGameStateDisplay("ALL LEVELS COMPLETED!");
			audioManager.play("win");
			return;
		}

		console.log("hazards: ", levelData.hazards);

		const g = game.current;
		g.walls = levelData.walls;
		g.hazards = levelData.hazards;
		g.doors = levelData.doors;
		g.boxes = levelData.boxes;
		g.mechanics = levelData.mechanics;
		g.players.clear();
		g.finishedPlayers.clear();
		g.status = "PLAYING";
		setGameStateDisplay(`LEVEL ${idx + 1}`);
		setTimeout(() => {
			if (g.status === "PLAYING") setGameStateDisplay(null);
		}, 2000);
	};

	useMemo(() => {
		startLevel(0);
	}, []);

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
					/*if (data.val !== 0)
						particles.current.emitSmoke(
							p.facingRight ? p.pos.x : p.pos.x + 30,
							p.pos.y + 30
						);*/
				} else if (data.type === "JUMP" && p.isGrounded) {
					if (p.vel.y === 0) {
						particles.current.emitSparks(p.pos.x, p.pos.y, p.color);
						audioManager.play("jump", 0.3);
					}
					p.vel.y = -p.stats.jumpForce;
					if (p.moveInput.x !== 0) {
						p.vel.x += p.moveInput.x * 4;
					}
				}
			} else {
				if (data.type === "NAV" && data.action === "ENTER") {
					if (game.current.status === "WON") {
						audioManager.play("select_game");
						const nextLvl = currentLevelIdx + 1;
						setCurrentLevelIdx(nextLvl);
						startLevel(nextLvl);
					} else if (game.current.status === "GAME_OVER") {
						audioManager.play("select_game");
						startLevel(currentLevelIdx);
					} else if (game.current.status === "FINISHED_ALL") {
						onExit();
					}
				}
			}
		});
	}, [socket, currentLevelIdx]);

	const canvasRef = useJoyEngine(800, 600, CONFIG, (ctx) => {
		const state = game.current;

		timeRef.current += 0.02;

		Renderer.clear(ctx, 800, 600);

		players.forEach((p, index) => {
			if (!state.players.has(p.id)) {
				const isFire = index === 0;

				const fireSpawn: Vector2 = {
					x: 55,
					y: 60,
				};
				const waterSpawn: Vector2 = {
					x: 90,
					y: 60,
				};

				const newP = new Entity(
					p.id,
					"PLAYER",
					p.name,
					isFire ? fireSpawn.x : waterSpawn.x,
					isFire ? fireSpawn.y : waterSpawn.y,
					30,
					30,
					isFire ? "#ef4444" : "#3b82f6"
				);
				newP.setStats({ speed: 2, acceleration: 1, jumpForce: 4 });
				state.players.set(p.id, newP);
			}
		});

		state.walls.forEach((w) => Renderer.draw(ctx, w));

		state.mechanics.buttons.forEach((b) => {
			const originalY = b.stats.originalY ?? b.pos.y;
			ctx.fillStyle = "#713f12";
			ctx.fillRect(b.pos.x - 5, originalY + 5, b.size.x + 10, 5);
			ctx.fillStyle = b.color;
			ctx.fillRect(b.pos.x, b.pos.y, b.size.x, b.size.y);
		});

		state.mechanics.elevators.forEach((e) => {
			ctx.fillStyle = e.color;
			ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
			ctx.fillStyle = "rgba(0,0,0,0.2)";
			ctx.fillRect(e.pos.x, e.pos.y + e.size.y - 5, e.size.x, 5);
			if (e.stats.type === "vertical") {
				ctx.strokeStyle = "rgba(255,255,255,0.2)";
				ctx.beginPath();
				ctx.moveTo(e.pos.x + 10, 0);
				ctx.lineTo(e.pos.x + 10, e.pos.y);
				ctx.moveTo(e.pos.x + e.size.x - 10, 0);
				ctx.lineTo(e.pos.x + e.size.x - 10, e.pos.y);
				ctx.stroke();
			}
		});

		state.doors.forEach((d) => {
			ctx.fillStyle = d.color;
			ctx.fillRect(d.pos.x, d.pos.y, d.size.x, d.size.y);
			if (d.stats.speed != 1) {
				ctx.fillStyle = "#000";
				ctx.fillRect(d.pos.x + 5, d.pos.y + 5, d.size.x - 10, d.size.y - 5);
			}
		});

		state.hazards.forEach((h) => Renderer.draw(ctx, h, timeRef.current));

		state.boxes.forEach((b) => Renderer.draw(ctx, b));

		state.players.forEach((p) => Renderer.draw(ctx, p));

		particles.current.update();
		particles.current.draw(ctx);

		if (state.status === "PLAYING") {
			const playerList = Array.from(state.players.values());
			const allDynamicEntities = [...playerList, ...state.boxes];
			const staticObstacles = [
				...state.walls,
				...state.hazards,
				...state.mechanics.elevators,
			];

			const buttons = state.mechanics.buttons;
			const elevators = state.mechanics.elevators;

			buttons.forEach((btn) => {
				let isPressed = false;
				const triggers = [...playerList, ...state.boxes];
				for (const t of triggers) {
					if (Physics.checkOverlap(t, btn, 2)) {
						isPressed = true;
						break;
					}
				}
				const originalY = btn.stats.originalY ?? btn.pos.y;
				const pressedY = btn.stats.pressedY ?? btn.pos.y;
				if (isPressed) {
					btn.pos.y = pressedY;
					btn.color = "#a16207";
				} else {
					btn.pos.y = originalY;
					btn.color = "#eab308";
				}
				btn.stats.isActive = isPressed;
			});

			elevators.forEach((elv) => {
				const type = elv.stats.type;
				const speed = elv.stats.speed;
				const isActive = buttons.some(
					(b) => b.stats.linkedElevatorId === elv.id && b.stats.isActive
				);

				if (type === "vertical") {
					const targetY = elv.stats.targetY ?? elv.pos.y;
					const originY = elv.stats.originY ?? elv.pos.y;

					let desiredY = isActive ? targetY : originY;

					if (elv.pos.y < desiredY) {
						elv.vel.y = Math.min(speed, desiredY - elv.pos.y);
					} else if (elv.pos.y > desiredY) {
						elv.vel.y = Math.max(-speed, desiredY - elv.pos.y);
					} else {
						elv.vel.y = 0;
					}
				}

				elv.pos.x += elv.vel.x;
				elv.pos.y += elv.vel.y;

				if (elv.vel.x !== 0 || elv.vel.y !== 0) {
					const riders = [...playerList, ...state.boxes];
					riders.forEach((rider) => {
						if (Physics.isRiding(rider, elv)) {
							rider.pos.x += elv.vel.x;
							rider.pos.y += elv.vel.y;
							rider.isGrounded = true;
						}
					});
				}
			});

			Physics.update(allDynamicEntities, staticObstacles, CONFIG);

			state.hazards.forEach((obj) => {
				if (Math.random() < 0.05) {
					particles.current.emitSplash(
						obj.pos.x + Math.random() * obj.size.x,
						obj.pos.y,
						obj.color,
						1
					);
				}
			});

			playerList.forEach((player) => {
				const isFire = player.color === "#ef4444";
				state.hazards.forEach((obj) => {
					if (Physics.checkTopSurface(player, obj)) {
						if (obj.label === "lava" && !isFire) killGame(player);
						if (obj.label === "water" && isFire) killGame(player);
						if (obj.label === "acid") killGame(player);
					}
					const isMoving =
						Math.abs(player.vel.x) > 0.1 || Math.abs(player.vel.y) > 0.1;
					if (isMoving && Math.random() < 0.1) {
						particles.current.emitSplash(
							player.pos.x + 15,
							player.pos.y + 30,
							obj.color,
							2
						);
					}
				});
				state.doors.forEach((door) => {
					if (Physics.checkOverlap(player, door, -10)) {
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
	});

	const killGame = (player: Entity) => {
		audioManager.play("fail");
		game.current.status = "GAME_OVER";
		setGameStateDisplay(player.label + " DIED!");
	};

	const finishGame = () => {
		audioManager.play("win");
		game.current.status = "WON";
		if (currentLevelIdx >= LEVELS.length - 1) {
			setGameStateDisplay("ALL LEVELS COMPLETED!");
			game.current.status = "FINISHED_ALL";
		} else {
			setGameStateDisplay("LEVEL COMPLETED!");
		}
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
				<div
					className={`absolute inset-0 flex items-center justify-center flex-col z-50 animate-in zoom-in
                    ${
											game.current.status === "PLAYING"
												? "bg-black/0 pointer-events-none"
												: "bg-black/80"
										}
                `}
				>
					<h2
						className={`text-6xl font-black mb-8 drop-shadow-lg
                        ${
													game.current.status === "WON" ||
													game.current.status === "FINISHED_ALL"
														? "text-green-500"
														: game.current.status === "GAME_OVER"
														? "text-red-500"
														: "text-white"
												}
                    `}
					>
						{gameStateDisplay}
					</h2>

					{game.current.status !== "PLAYING" && (
						<div className="flex flex-col items-center gap-2">
							<button
								onClick={() => {
									if (game.current.status === "WON") {
										const next = currentLevelIdx + 1;
										setCurrentLevelIdx(next);
										startLevel(next);
									} else if (game.current.status === "GAME_OVER") {
										startLevel(currentLevelIdx);
									} else {
										onExit();
									}
								}}
								className="bg-white text-black px-8 py-4 rounded-xl font-bold text-2xl hover:scale-110 transition-transform"
							>
								{game.current.status === "WON"
									? "Next Level"
									: game.current.status === "FINISHED_ALL"
									? "Exit Lobby"
									: "Try Again"}
							</button>
							<p className="text-white/50 text-sm mt-4 font-mono">
								Press [ENTER] to continue
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
