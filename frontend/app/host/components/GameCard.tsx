import React, { useState } from "react";
import { Users, Trophy, Activity, Zap, Skull } from "lucide-react";
import { GameConfig } from "@/types";

interface GameCardProps {
	game: GameConfig;
	isSelected: boolean;
}

const GameCard = ({ game, isSelected }: GameCardProps) => {
	const [imgError, setImgError] = useState(false);

	const getFallbackAssets = (id: string) => {
		switch (id) {
			case "pong":
				return {
					icon: <Activity size={64} />,
					color: "from-blue-600 to-cyan-500",
				};
			case "headball":
				return {
					icon: <Trophy size={64} />,
					color: "from-green-600 to-emerald-500",
				};
			case "firewater":
				return { icon: <Zap size={64} />, color: "from-orange-600 to-red-500" };
			default:
				return {
					icon: <Skull size={64} />,
					color: "from-purple-600 to-pink-500",
				};
		}
	};

	const fallback = getFallbackAssets(game.id);

	return (
		<div
			className={`
        relative h-100 w-70 rounded-3xl overflow-hidden isolate
        transition-all duration-300 ease-out will-change-transform
        ${
					isSelected
						? "scale-110 ring-4 ring-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5)] z-20 opacity-100 translate-y-0"
						: "scale-90 opacity-50 grayscale brightness-75 hover:opacity-80 z-0 translate-y-4"
				}
      `}
		>
			<div className="absolute inset-0 z-0 bg-slate-900">
				{!imgError ? (
					<img
						src={`/games/${game.id}/cover.png`}
						alt={game.name}
						className="w-full h-full object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<div
						className={`w-full h-full bg-linear-to-br ${fallback.color} flex items-center justify-center`}
					>
						<div className="text-white/30 transform -rotate-12 scale-150">
							{fallback.icon}
						</div>
					</div>
				)}
			</div>

			<div
				className={`absolute inset-0 z-10 transition-opacity duration-300 ${
					isSelected ? "bg-black/20" : "bg-black/60"
				}`}
			/>
			<div className="absolute inset-0 z-10 bg-linear-to-t from-black via-black/40 to-transparent" />

			<div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end h-full z-20">
				<div
					className={`transition-all duration-300 transform origin-bottom ${
						isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
					}`}
				>
					<div className="mb-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white inline-flex items-center gap-1 border border-white/20">
						<Users size={12} /> Min: {game.minPlayers} PLAYER
						{game.minPlayers > 1 && "S"}
					</div>
				</div>

				<h3
					className={`font-black text-white leading-none mb-3 tracking-tight drop-shadow-xl transition-all duration-300 ${
						isSelected ? "text-4xl" : "text-2xl"
					}`}
				>
					{game.name}
				</h3>

				<div
					className={`transition-all duration-300 ${
						isSelected ? "opacity-100 max-h-50" : "opacity-0 max-h-0"
					}`}
				>
					<p className="text-slate-200 text-sm line-clamp-3 mb-4 font-medium leading-relaxed drop-shadow-md">
						{game.description}
					</p>

					<div className="flex items-center gap-2">
						<div className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg animate-pulse flex items-center gap-2">
							START{" "}
							<span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">
								ENTER
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default React.memo(GameCard, (prev, next) => {
	return prev.game.id === next.game.id && prev.isSelected === next.isSelected;
});
