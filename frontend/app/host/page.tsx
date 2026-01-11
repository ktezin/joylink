"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import QRCode from "react-qr-code";
import { GAMES } from "@/games/registry";
import { Monitor, Gamepad2, Users } from "lucide-react";
import { audioManager } from "@/lib/audio/AudioManager";

export interface Player {
	id: string;
	name: string;
}

export default function HostPage() {
	const [roomId, setRoomId] = useState<string>("");

	const [players, setPlayers] = useState<Player[]>([]);

	const [status, setStatus] = useState("Sunucuya bağlanıyor...");

	const [activeGameId, setActiveGameId] = useState<string | null>(null);

	const [gameInterrupted, setGameInterrupted] = useState(false);

	const gamesList = Object.values(GAMES);

	const [selectedIndex, setSelectedIndex] = useState(0);

	const activeGameIdRef = useRef<string | null>(null);
	const selectedIndexRef = useRef(0);
	const playersRef = useRef<Player[]>([]);
	const roomIdRef = useRef("");

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
		socket.connect();

		socket.on("connect", () => {
			setStatus("Oda kuruluyor...");

			socket.emit("create_room");
		});

		socket.on("room_created", (id: string) => {
			setRoomId(id);

			setStatus("Oyuncular bekleniyor...");
		});

		socket.on("player_joined", (data: { id: string; name: string }) => {
			setPlayers((prev) => [...prev, { id: data.id, name: data.name }]);
		});

		socket.on("player_left", (data: { playerId: string }) => {
			setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
		});

		socket.on("input", (data: any) => {
			if (activeGameIdRef.current) return;

			if (data.type === "NAV") {
				const current = selectedIndexRef.current;

				const total = gamesList.length;

				if (["RIGHT", "LEFT", "UP", "DOWN"].includes(data.action)) {
					audioManager.play("hit", 0.3);
				}

				if (data.action === "RIGHT") setSelectedIndex((current + 1) % total);
				else if (data.action === "LEFT")
					setSelectedIndex((current - 1 + total) % total);
				else if (data.action === "DOWN") {
					const next = current + 2;

					setSelectedIndex(next < total ? next : current);
				} else if (data.action === "UP") {
					const prev = current - 2;

					setSelectedIndex(prev >= 0 ? prev : current);
				} else if (data.action === "ENTER") {
					const selectedGame = gamesList[current];

					const currentPlayers = playersRef.current;

					const currentRoomId = roomIdRef.current;

					const minRequired = selectedGame.minPlayers;

					if (currentPlayers.length < minRequired) {
						console.log("Yetersiz oyuncu");

						return;
					}

					audioManager.play("select_game", 0.6);

					setActiveGameId(selectedGame.id);

					socket.emit("start_game", {
						roomId: currentRoomId,
						gameId: selectedGame.id,
					});
				}
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const handleStartGameClick = (gameId: string) => {
		const game = GAMES[gameId];

		const minRequired = game.minPlayers;

		if (players.length < minRequired) {
			alert(`Bu oyun için en az ${minRequired} kişi lazım!`);

			return;
		}

		setActiveGameId(gameId);

		socket.emit("start_game", { roomId, gameId });
	};

	const handleStopGame = () => {
		setActiveGameId(null);

		socket.emit("stop_game", { roomId });
	};

	useEffect(() => {
		if (activeGameId && GAMES[activeGameId]) {
			const minRequired = GAMES[activeGameId].minPlayers;

			if (players.length < minRequired) {
				setGameInterrupted(true);
			} else {
				setGameInterrupted(false);
			}
		}
	}, [players, activeGameId]);

	if (activeGameId && GAMES[activeGameId]) {
		const GameComponent = GAMES[activeGameId].HostComponent;

		return (
			<div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
				{gameInterrupted && (
					<div className="absolute inset-0 z-60 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
						<div className="bg-red-600/20 p-6 rounded-full mb-6 border-4 border-red-500 animate-pulse">
							<Users size={64} className="text-red-500" />
						</div>

						<h2 className="text-5xl font-black text-white mb-4">
							OYUNCU AYRILDI!
						</h2>

						<p className="text-xl text-slate-300 mb-8 max-w-md">
							Oyunculardan biri bağlantıyı kesti. Oyun iptal edildi.
						</p>

						<button
							onClick={handleStopGame}
							className="bg-red-600 hover:bg-red-500 text-white text-xl font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/50"
						>
							Lobiye Dön
						</button>
					</div>
				)}

				<button
					onClick={handleStopGame}
					className="absolute top-6 right-6 z-50 bg-red-600/90 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold backdrop-blur-sm transition-all shadow-lg hover:scale-105"
				>
					Lobiye Dön
				</button>

				<div className="relative w-full h-full max-w-full max-h-screen aspect-4/3 flex items-center justify-center shadow-2xl">
					<GameComponent socket={socket} players={players} onExit={handleStopGame}/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8 mb-8">
				<div>
					<h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
						JoyLink
					</h1>

					<p className="text-slate-400 mt-2 flex items-center gap-2">
						<Monitor size={16} /> Host Ekranı
					</p>
				</div>

				<div className="flex gap-4">
					<div
						className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
							players[0]
								? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
								: "border-slate-800 bg-slate-900 border-dashed opacity-50"
						}`}
					>
						<div
							className={`w-3 h-3 rounded-full ${
								players[0] ? "bg-blue-400 animate-pulse" : "bg-slate-600"
							}`}
						></div>

						<span className="font-bold">
							{players[0] ? players[0].name : "Bekleniyor..."}
						</span>
					</div>

					<div
						className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
							players[1]
								? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
								: "border-slate-800 bg-slate-900 border-dashed opacity-50"
						}`}
					>
						<div
							className={`w-3 h-3 rounded-full ${
								players[1] ? "bg-red-400 animate-pulse" : "bg-slate-600"
							}`}
						></div>

						<span className="font-bold">
							{players[1] ? players[1].name : "Bekleniyor..."}
						</span>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
				<div className="lg:col-span-8">
					<h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-200">
						<Gamepad2 className="text-purple-400" /> Oyun Kütüphanesi
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{gamesList.map((game, index) => {
							const isSelected = index === selectedIndex;

							return (
								<div
									key={game.id}
									onClick={() => {
										setSelectedIndex(index);

										handleStartGameClick(game.id);
									}}
									className={`
                                        relative rounded-2xl p-1 overflow-hidden transition-all duration-300 cursor-pointer
                                        ${
																					isSelected
																						? "scale-105 shadow-[0_0_40px_rgba(59,130,246,0.4)] ring-4 ring-blue-500 z-10"
																						: "opacity-60 hover:opacity-100 scale-95 border border-slate-800"
																				}

                                    `}
								>
									<div
										className={`bg-slate-800 rounded-xl p-6 h-full flex flex-col relative z-10 ${
											isSelected ? "bg-slate-700" : ""
										}`}
									>
										<div className="h-32 mb-4 bg-linear-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-6xl">
											{game.id === "pong" ? "🏓" : "💪"}
										</div>

										<h3
											className={`text-2xl font-bold mb-2 ${
												isSelected ? "text-blue-400" : "text-white"
											}`}
										>
											{game.name}
										</h3>

										<p className="text-slate-400 text-sm">{game.description}</p>

										{isSelected && (
											<div className="mt-4 pt-4 border-t border-slate-600 flex justify-between items-center animate-pulse">
												<span className="text-blue-300 font-bold text-sm">
													BAŞLATMAK İÇİN
												</span>

												<div className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold shadow-lg">
													ENTER
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="lg:col-span-4 space-y-6">
					<div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center transform rotate-1 hover:rotate-0 transition-transform duration-500">
						<div className="bg-slate-900 p-4 rounded-xl mb-4">
							{roomId && (
								<QRCode
									value={`${
										process.env.NEXT_FRONTEND_URL || "http://192.168.1.108:3001"
									}/play?code=${roomId}`}
									size={180}
									bgColor="#0f172a"
									fgColor="#ffffff"
								/>
							)}
						</div>

						<p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">
							Oda Kodu
						</p>

						<div className="text-5xl font-mono font-black text-slate-900 tracking-tighter mb-4">
							{roomId || "...."}
						</div>

						<p className="text-sm text-slate-500 px-4">
							Telefonunun kamerasını aç ve QR kodu okutarak oyuna katıl.
						</p>
					</div>

					<div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
						<h3 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
							<Users size={18} /> Nasıl Çalışır?
						</h3>

						<ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
							<li>Telefonunuzdan QR kodu okutun.</li>

							<li>Sıraya girin (Maks 2 kişi).</li>

							<li>Host ekranından oyunu seçin.</li>

							<li>Telefonunuz kontrolcüye dönüşsün!</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}
