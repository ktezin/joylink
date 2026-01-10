import { Player } from "@/types";
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

function random(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export default function ClickGame({
	socket,
	players,
}: {
	socket: Socket;
	players: Player[];
}) {
	const [position, setPosition] = useState(50);
	const [winner, setWinner] = useState<string | null>(null);

	const isSinglePlayer = players.length === 1;

	useEffect(() => {
		if (isSinglePlayer && !winner) {
			const aiInterval = setInterval(() => {
				setPosition((prev) => {
					if (prev >= 100 || prev <= 0) return prev;

					const newPos = prev + 3;

					if (newPos >= 100) setWinner("AI (KIRMIZI) KAZANDI!");
					return Math.min(100, newPos);
				});
			}, random(100, 400));

			return () => clearInterval(aiInterval);
		}
	}, [isSinglePlayer, winner]);

	useEffect(() => {
		const handleInput = (data: { playerId: string }) => {
			if (winner) return;

			setPosition((prev) => {
				const isP1 = data.playerId === players[0].id;
				const change = isP1 ? -2 : 2;
				const newPos = prev + change;

				if (newPos <= 0) setWinner(players[0].name + " KAZANDI!");
				if (newPos >= 100) setWinner(players[1].name + " KAZANDI!");

				return Math.max(0, Math.min(100, newPos));
			});
		};

		socket.on("input", handleInput);
		return () => {
			socket.off("input", handleInput);
		};
	}, [players, winner, socket]);

	return (
		<div className="flex flex-col items-center justify-center h-full w-full bg-slate-800 text-white relative overflow-hidden">
			<div className="relative w-3/4 h-24 bg-slate-700 rounded-full border-4 border-slate-600 overflow-hidden">
				<div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/20 -translate-x-1/2"></div>

				<div
					className="absolute top-0 bottom-0 w-4 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] transition-all duration-75 ease-out"
					style={{ left: `${position}%`, transform: "translateX(-50%)" }}
				>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-600 rounded-full"></div>
				</div>

				<div
					className="absolute left-0 top-0 bottom-0 bg-blue-500/30 transition-all"
					style={{ width: `${100 - position}%` }}
				></div>
				<div
					className="absolute right-0 top-0 bottom-0 bg-red-500/30 transition-all"
					style={{ width: `${position}%` }}
				></div>
			</div>

			<div className="flex justify-between w-3/4 mt-8 font-bold text-2xl">
				<span className="text-blue-400">{players[0]?.name || "P1"} (Mavi)</span>
				<span className="text-red-400">
					{players[1] ? players[1].name : "CPU"} (Kırmızı)
				</span>
			</div>

			<div className="absolute top-4 left-4 bg-slate-800 px-3 py-1 rounded text-sm text-slate-400">
				Mod: {isSinglePlayer ? "1 vs AI" : "1 vs 1"}
			</div>

			{winner && (
				<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-in zoom-in">
					<h1 className="text-6xl font-black text-yellow-400 mb-4">{winner}</h1>
					<button
						onClick={() => {
							setPosition(50);
							setWinner(null);
						}}
						className="px-8 py-3 bg-white text-black font-bold rounded hover:scale-105 transition-transform"
					>
						Tekrar Oyna
					</button>
				</div>
			)}
		</div>
	);
}
