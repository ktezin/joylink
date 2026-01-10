"use client";
import React, { useEffect, useMemo, useState } from "react";
import { EventEmitter } from "events";
import { Player } from "@/types";
import { useSearchParams } from "next/navigation";
import { GAMES } from "@/games/registry";

const MOCK_PLAYERS: Player[] = [
	{ id: "p1_debug", name: "DEBUG_FIRE", color: "#ef4444" },
	{ id: "p2_debug", name: "DEBUG_WATER", color: "#3b82f6" },
];

export default function DebugPage() {
	const searchParams = useSearchParams();
	const gameId = searchParams.get("game") || "";

	const GameComponent = GAMES[gameId].HostComponent;

	const mockSocket = useMemo(() => new EventEmitter(), []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") emitInput("p1_debug", "MOVE", 1);
			if (e.key === "ArrowLeft") emitInput("p1_debug", "MOVE", -1);
			if (e.key === "ArrowUp") emitInput("p1_debug", "JUMP");

			if (e.key === "d") emitInput("p2_debug", "MOVE", 1);
			if (e.key === "a") emitInput("p2_debug", "MOVE", -1);
			if (e.key === "w") emitInput("p2_debug", "JUMP");
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === "ArrowLeft")
				emitInput("p1_debug", "MOVE", 0);

			if (e.key === "d" || e.key === "a") emitInput("p2_debug", "MOVE", 0);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [mockSocket]);

	const emitInput = (playerId: string, type: string, val?: number) => {
		mockSocket.emit("input", {
			playerId,
			type,
			val,
		});
	};

	const handleMouseClick = (e: React.MouseEvent) => {
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		const scaleX = 800 / rect.width;
		const scaleY = 600 / rect.height;

		const x = Math.floor((e.clientX - rect.left) * scaleX);
		const y = Math.floor((e.clientY - rect.top) * scaleY);

		console.log(`📍 Koordinat: x: ${x}, y: ${y}`);
		navigator.clipboard.writeText(`x: ${x}, y: ${y}`);

		//alert(`Koordinat Kopyalandı: ${x}, ${y}`);
	};

	return (
		<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
			<div className="mb-4 text-center">
				<h1 className="text-3xl font-bold text-yellow-400">
					LEVEL TASARIM MODU
				</h1>
				<p className="text-slate-400 text-sm mt-2">
					<span className="text-red-400 font-bold">P1 (Ateş):</span> Yön Tuşları
					|<span className="text-blue-400 font-bold ml-2">P2 (Su):</span> WASD
				</p>
				<p className="text-xs text-slate-500 mt-1">
					Platform koordinatı almak için ekrana tıkla.
				</p>
			</div>

			<div
				className="border-4 border-yellow-500/50 rounded-xl shadow-2xl relative"
				onClick={handleMouseClick}
			>
				<GameComponent socket={mockSocket as any} players={MOCK_PLAYERS} />
			</div>
		</div>
	);
}
