"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import QRCode from "react-qr-code";
import { GAMES } from "@/games/registry";
import { Copy, Monitor, Users, Gamepad2 } from "lucide-react";

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

		return () => {
			socket.off("connect");
			socket.off("room_created");
			socket.off("player_joined");
			socket.off("player_left");
			socket.disconnect();
		};
	}, []);

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

	const handleStartGame = (gameId: string) => {
		const minRequired = GAMES[gameId].minPlayers;

		if (players.length < minRequired) {
			alert(`Bu oyunu başlatmak için en az ${minRequired} oyuncu lazım!`);
			return;
		}
		setActiveGameId(gameId);
		socket.emit("start_game", { roomId, gameId });
	};

	const handleStopGame = () => {
		setActiveGameId(null);
		socket.emit("stop_game", { roomId });
	};

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
					<GameComponent socket={socket} players={players} />
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
						{Object.values(GAMES).map((game) => (
							<div
								key={game.id}
								onClick={() => handleStartGame(game.id)}
								className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-1 overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer active:scale-95"
							>
								<div className="bg-slate-800 rounded-xl p-6 h-full flex flex-col relative z-10">
									<div className="h-32 mb-4 bg-linear-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
										{game.id === "pong" ? "🏓" : "💪"}
									</div>
									<h3 className="text-2xl font-bold text-white mb-2">
										{game.name}
									</h3>
									<p className="text-slate-400 text-sm leading-relaxed">
										{game.description}
									</p>

									<div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
										<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
											2 Players
										</span>
										<span className="text-blue-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
											Başlat &rarr;
										</span>
									</div>
								</div>
								<div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"></div>
							</div>
						))}
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
