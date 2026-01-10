"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { GAMES } from "@/games/registry";

function PlayContent() {
	const searchParams = useSearchParams();
	const initialCode = searchParams.get("code") || "";

	const [code, setCode] = useState(initialCode);
	const [name, setName] = useState("");
	const [activeGame, setActiveGame] = useState<string | null>(null);
	const [joined, setJoined] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		socket.connect();

		socket.on("joined_success", (roomId) => {
			setJoined(true);
			setError("");
		});

		socket.on("error", (msg) => {
			setError(msg);
		});

		socket.on("game_started", (data) => {
			console.log("SİNYAL ALINDI! Oyun ID:", data.gameId);
			setActiveGame(data.gameId);
		});

		socket.on("game_stopped", () => {
			setActiveGame(null);
		});

		socket.on("room_destroyed", () => {
			setJoined(false);
			setCode("");
			setError("Host bağlantıyı kesti. Oda kapatıldı.");
		});

		return () => {
			socket.off("game_started");
			socket.off("game_stopped");
			socket.off("room_destroyed");
		};
	}, []);

	const handleJoin = () => {
		if (!code) {
			setError("Oda kodu gerekli!");
			return;
		}
		if (!name) {
			setError("İsim girmelisin!");
			return;
		}

		socket.emit("join_room", {
			roomId: code.toUpperCase(),
			name: name.substring(0, 10).toUpperCase(),
		});
	};

	if (joined) {
		if (activeGame && GAMES[activeGame]) {
			const Controller = GAMES[activeGame].ControllerComponent;
			return <Controller socket={socket} />;
		}

		return (
			<div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
				<div className="w-16 h-16 bg-blue-600 rounded-full animate-pulse mb-6 flex items-center justify-center">
					<span className="text-3xl">🎮</span>
				</div>
				<h1 className="text-2xl font-bold mb-2 text-green-400">Bağlandı!</h1>
				<p className="text-slate-400">
					Host (Bilgisayar) üzerinden bir oyun seçmesini bekle.
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-blue-400">JoyLink</h1>
					<p className="text-slate-400">Odaya Katıl</p>
				</div>

				<div className="space-y-4">
					<div>
						<label className="text-xs text-slate-500 font-bold ml-1">
							ODA KODU
						</label>
						<input
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="ABCD"
							className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 uppercase"
							maxLength={4}
						/>
					</div>

					<div>
						<label className="text-xs text-slate-500 font-bold ml-1">
							LAKAP / İSİM
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value.toUpperCase())}
							placeholder="Örn: HızlıGonzales"
							className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
							maxLength={10}
						/>
					</div>

					{error && (
						<div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm text-center">
							{error}
						</div>
					)}

					<button
						onClick={handleJoin}
						className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-900/20"
					>
						OYUNA GİR
					</button>
				</div>
			</div>
		</div>
	);
}

export default function PlayPage() {
	return (
		<Suspense fallback={<div>Yükleniyor...</div>}>
			<PlayContent />
		</Suspense>
	);
}
