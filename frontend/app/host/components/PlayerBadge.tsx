import { User, Gamepad2 } from "lucide-react";

interface PlayerBadgeProps {
	player?: { id: string; name: string };
	index: number;
}

export default function PlayerBadge({ player, index }: PlayerBadgeProps) {
	const isConnected = !!player;
	const colors =
		index === 0
			? "border-blue-500 text-blue-400"
			: "border-red-500 text-red-400";
	const bgColors = index === 0 ? "bg-blue-500/10" : "bg-red-500/10";

	return (
		<div
			className={`
        relative flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-500
        ${
					isConnected
						? `${colors} ${bgColors} scale-105 shadow-[0_0_15px_currentColor]`
						: "border-slate-800 bg-slate-900/50 opacity-50 border-dashed"
				}
      `}
		>
			<div
				className={`
        w-10 h-10 rounded-full flex items-center justify-center
        ${isConnected ? "bg-current text-black" : "bg-slate-800 text-slate-600"}
      `}
			>
				{isConnected ? <Gamepad2 size={20} /> : <User size={20} />}
			</div>

			<div className="flex flex-col">
				<span className="text-[10px] font-bold uppercase tracking-widest opacity-70 p-1">
					Player {index + 1}
				</span>
				<span className="font-bold text-lg leading-none truncate max-w-30 p-1">
					{player ? player.name : "Waiting..."}
				</span>
			</div>

			{isConnected && (
				<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
			)}
		</div>
	);
}
