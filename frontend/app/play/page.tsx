"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { GAMES } from "@/games/registry";
import { MenuController } from "./MenuController";
import { AudioWaveform, Hourglass } from "lucide-react";

function PlayContent() {
	const searchParams = useSearchParams();
	const initialCode = searchParams.get("code") || "";

	const [code, setCode] = useState(initialCode);
	const [name, setName] = useState("");
	const [activeGame, setActiveGame] = useState<string | null>(null);
	const [joined, setJoined] = useState(false);
	const [error, setError] = useState("");
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		socket.connect();

		socket.on(
			"joined_success",
			(data: { roomId: string; isAdmin: boolean }) => {
				setJoined(true);
				setIsAdmin(data.isAdmin);
				setError("");
			}
		);

		socket.on("promoted_to_admin", () => {
			setIsAdmin(true);
		});

		socket.on("error", (msg) => {
			setError(msg);
		});

		socket.on("game_started", (data) => {
			console.log("Game started! Id:", data.gameId);
			setActiveGame(data.gameId);
		});

		socket.on("game_stopped", () => {
			setActiveGame(null);
		});

		socket.on("room_destroyed", () => {
			setJoined(false);
			setCode("");
			setIsAdmin(false);
			setError("Host disconnected. Room closed.");
		});

		return () => {
			socket.off("joined_success");
			socket.off("promoted_to_admin");
			socket.off("error");
			socket.off("game_started");
			socket.off("game_stopped");
			socket.off("room_destroyed");
		};
	}, []);

	const handleJoin = () => {
		if (!code) {
			setError("Room code is required!");
			return;
		}
		if (!name) {
			setError("Nickname is required!");
			return;
		}

		socket.emit("join_room", {
			roomId: code.toUpperCase(),
			name: name.substring(0, 10).toUpperCase(),
		});
	};

	const handleStartGameRequest = (gameId: string) => {
		socket.emit("request_start_game", {
			roomId: code.toUpperCase(),
			gameId: gameId,
		});
	};

	if (joined) {
		if (activeGame && GAMES[activeGame]) {
			const Controller = GAMES[activeGame].ControllerComponent;
			return <Controller socket={socket} isAdmin={isAdmin} />;
		}

		if (isAdmin) {
			return <MenuController />;
		}

		return (
			<div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
				<div className="w-16 h-16 bg-blue-600 rounded-full animate-pulse mb-6 flex items-center justify-center">
					<Hourglass size={36} />
				</div>
				<h1 className="text-2xl font-bold mb-2 text-green-400">Connected!</h1>
				<p className="text-slate-400">
					Waiting for the room admin to choose a game...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center space-y-2">
					<div className="flex items-center justify-center gap-4">
						<div className="bg-linear-to-br from-purple-600 to-blue-600 p-3 rounded-2xl shadow-lg shadow-purple-900/50">
							<AudioWaveform size={32} className="text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-black tracking-tighter bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
								JoyLink
							</h1>
						</div>
					</div>
					<p className="text-slate-400">Join to a game room</p>
				</div>

				<div className="space-y-4">
					<div>
						<label className="text-xs text-slate-500 font-bold ml-1">
							ROOM CODE
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
							NICKNAME
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value.toUpperCase())}
							placeholder="NICKNAME"
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
						JOIN
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
