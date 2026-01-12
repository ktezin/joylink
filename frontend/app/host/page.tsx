"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { GAMES } from "@/games/registry";
import { AudioWaveform, Smartphone, Gamepad2 } from "lucide-react";
import { audioManager } from "@/lib/audio/AudioManager";
import PlayerBadge from "./components/PlayerBadge";
import GameCard from "./components/GameCard";
import DynamicBackground from "./components/DynamicBackground";
import QRCode from "react-qr-code";

const scrollbarHideStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export interface Player {
	id: string;
	name: string;
}

export default function HostPage() {
	const [roomId, setRoomId] = useState<string>("");
	const [players, setPlayers] = useState<Player[]>([]);
	const [status, setStatus] = useState<string>("Connecting...");
	const [activeGameId, setActiveGameId] = useState<string | null>(null);
	const [gameInterrupted, setGameInterrupted] = useState<string>("");

	const gamesList = Object.values(GAMES);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const gameInterruptedRef = useRef<string | null>(null);
	const activeGameIdRef = useRef<string | null>(null);
	const selectedIndexRef = useRef(0);
	const playersRef = useRef<Player[]>([]);
	const roomIdRef = useRef("");
	const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		gameInterruptedRef.current = gameInterrupted;
	}, [gameInterrupted]);
	useEffect(() => {
		activeGameIdRef.current = activeGameId;
	}, [activeGameId]);
	useEffect(() => {
		selectedIndexRef.current = selectedIndex;
	}, [selectedIndex]);
	useEffect(() => {
		playersRef.current = players;
	}, [players]);
	useEffect(() => {
		roomIdRef.current = roomId;
	}, [roomId]);

	useEffect(() => {
		const selectedCard = cardsRef.current[selectedIndex];
		if (selectedCard) {
			selectedCard.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [selectedIndex]);

	useEffect(() => {
		socket.connect();

		socket.on("connect", () => {
			setStatus("Creating room...");
			socket.emit("create_room");
		});

		socket.on("room_created", (id: string) => {
			setRoomId(id);
			setStatus("Ready");
		});

		socket.on("player_joined", (data: { id: string; name: string }) => {
			setPlayers((prev) => [...prev, { id: data.id, name: data.name }]);
			audioManager.play("player_join", 0.5);
		});

		socket.on("player_left", (data: { playerId: string }) => {
			setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
		});

		socket.on("input", (data: any) => {
			if (activeGameIdRef.current) return;

			if (data.type === "NAV") {
				const current = selectedIndexRef.current;
				const total = gamesList.length;

				if (["RIGHT", "LEFT"].includes(data.action))
					audioManager.play("hit", 0.2);

				if (data.action === "RIGHT") {
					setSelectedIndex((current + 1) % total);
				} else if (data.action === "LEFT") {
					setSelectedIndex((current - 1 + total) % total);
				} else if (data.action === "ENTER") {
					if (gameInterruptedRef.current) {
						setGameInterrupted("");
						return;
					}

					const selectedGame = gamesList[current];
					const currentPlayers = playersRef.current;
					const minRequired = selectedGame.minPlayers;

					if (currentPlayers.length < minRequired) {
						audioManager.play("fail", 0.5);
						setGameInterrupted("Not enough players!");
						return;
					}

					audioManager.play("select_game", 0.6);
					startGame(selectedGame.id);
				}
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const startGame = (gameId: string) => {
		setActiveGameId(gameId);
		socket.emit("start_game", {
			roomId: roomIdRef.current,
			gameId: gameId,
		});
	};

	const stopGame = () => {
		setActiveGameId(null);
		socket.emit("stop_game", { roomId: roomIdRef.current });
	};

	useEffect(() => {
		if (activeGameId && GAMES[activeGameId]) {
			const minRequired = GAMES[activeGameId].minPlayers;
			if (players.length < minRequired) {
				setGameInterrupted("PLAYER DISCONNECTED!");
			} else {
				setGameInterrupted("");
			}
		}
	}, [players, activeGameId]);

	if (activeGameId && GAMES[activeGameId]) {
		const GameComponent = GAMES[activeGameId].HostComponent;

		return (
			<div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
				{gameInterrupted && (
					<div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex flex-col items-center justify-center text-center animate-in fade-in">
						<h2 className="text-4xl font-bold text-red-500 mb-4">
							{gameInterrupted}
						</h2>
						<button
							onClick={stopGame}
							className="bg-white text-black px-6 py-3 rounded-xl font-bold"
						>
							Return to Lobby
						</button>
					</div>
				)}

				<button
					onClick={stopGame}
					className="absolute top-4 right-4 z-40 bg-red-600/50 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur opacity-0 hover:opacity-100 transition-opacity"
				>
					End Game
				</button>

				<div className="relative w-full h-full flex items-center justify-center">
					<GameComponent socket={socket} players={players} onExit={stopGame} />
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen bg-[#09090b] text-white overflow-hidden relative selection:bg-purple-500/30 font-sans flex flex-col">
			<style>{scrollbarHideStyles}</style>

			<DynamicBackground gameId={gamesList[selectedIndex].id} />

			<header className="relative z-10 flex shrink-0 justify-between items-center p-8 md:px-16 lg:px-24 xl:px-32 w-full max-w-440 mx-auto">
				<div className="flex items-center gap-4">
					<div className="bg-linear-to-br from-purple-600 to-blue-600 p-3 rounded-2xl shadow-lg shadow-purple-900/50">
						<AudioWaveform size={32} className="text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-black tracking-tighter bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
							JoyLink
						</h1>
						<p className="text-slate-500 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
							<span
								className={`w-2 h-2 rounded-full ${
									status === "Ready"
										? "bg-green-500"
										: "bg-yellow-500 animate-pulse"
								}`}
							></span>
							{status}
						</p>
					</div>
				</div>

				<div className="flex gap-4">
					<PlayerBadge player={players[0]} index={0} />
					<PlayerBadge player={players[1]} index={1} />
				</div>
			</header>

			<main className="relative z-10 flex-1 flex flex-col min-h-0 w-full">
				<div className="w-full max-w-440 mx-auto px-8 md:px-16 lg:px-24 xl:px-32 grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-4">
					<div className="md:col-span-8 animate-in fade-in slide-in-from-left-10 duration-700">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-12 h-1 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
							<span className="text-purple-400 font-bold tracking-[0.2em] text-sm uppercase text-shadow">
								Category: Party Games
							</span>
						</div>

						<h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl mb-4 leading-none">
							Choose <br /> Your Game
						</h2>

						<p className="text-slate-300 text-xl font-medium max-w-2xl leading-relaxed drop-shadow-lg border-l-4 border-slate-700 pl-6">
							Challenge your friends! Test your reflexes or strategize. Select a
							game from the list below to start.
						</p>
					</div>

					<div className="md:col-span-4 flex flex-col items-end justify-end">
						<div className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-300 group">
							<div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

							<div className="relative flex items-center gap-6">
								<div className="bg-white p-3 rounded-2xl shadow-inner">
									{roomId ? (
										<QRCode
											value={`${
												process.env.NEXT_FRONTEND_URL ||
												"http://192.168.1.108:3001"
											}/play?code=${roomId}`}
											size={120}
											bgColor="#ffffff"
											fgColor="#000000"
										/>
									) : (
										<div className="w-30 h-30 bg-slate-200 animate-pulse rounded-xl" />
									)}
								</div>

								<div className="flex flex-col gap-1 min-w-35">
									<div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
										<Smartphone size={16} />
										Scan to Join
									</div>
									<div className="text-5xl font-mono font-black text-white tracking-tighter">
										{roomId || "..."}
									</div>
									<div className="text-slate-400 text-xs mt-2">
										Open camera & scan
									</div>
								</div>
							</div>
						</div>

						<div className="mt-6 flex gap-6 text-right">
							<div className="flex items-center gap-3 text-slate-400">
								<span className="text-xs font-bold tracking-widest uppercase">
									Navigate
								</span>
								<div className="flex gap-1">
									<kbd className="bg-slate-800/80 border border-slate-700 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-200">
										◀
									</kbd>
									<kbd className="bg-slate-800/80 border border-slate-700 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-200">
										▶
									</kbd>
								</div>
							</div>
							<div className="flex items-center gap-3 text-slate-400">
								<span className="text-xs font-bold tracking-widest uppercase">
									Start
								</span>
								<kbd className="bg-green-600/20 border border-green-600/50 text-green-400 px-3 py-1.5 rounded-lg text-xs font-black">
									ENTER
								</kbd>
							</div>
						</div>
					</div>
				</div>

				<div className="w-full relative mt-auto mb-8">
					<div
						className="
                        w-full 
                        overflow-x-auto 
                        no-scrollbar 
                        px-8 md:px-16 lg:px-24 xl:px-32
                        py-8
                        flex 
                        items-center
                        scroll-smooth
                    "
					>
						<div className="flex items-center gap-6 md:gap-10 perspective-1000 mx-auto w-full max-w-440">
							{gamesList.map((game, index) => (
								<div
									key={game.id}
									ref={(el) => {
										cardsRef.current[index] = el;
									}}
									onClick={() => {
										setSelectedIndex(index);
										if (index === selectedIndex) {
											if (players.length < game.minPlayers) {
												audioManager.play("fail", 0.5);
												setGameInterrupted("Not enough players!");
												return;
											}
											startGame(game.id);
										}
									}}
									className="cursor-pointer outline-none transition-transform duration-300 shrink-0"
								>
									<GameCard game={game} isSelected={index === selectedIndex} />
								</div>
							))}

							<div className="h-100 w-70 shrink-0 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500 gap-4 hover:border-slate-500 transition-colors">
								<Gamepad2 size={48} className="opacity-50" />
								<span className="text-xs font-bold tracking-widest uppercase opacity-70">
									Coming Soon
								</span>
							</div>
						</div>
					</div>

					<div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-linear-to-r from-[#09090b] via-[#09090b]/90 to-transparent pointer-events-none z-20" />
					<div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-linear-to-l from-[#09090b] via-[#09090b]/90 to-transparent pointer-events-none z-20" />
				</div>
			</main>
		</div>
	);
}
