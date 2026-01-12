import { Socket } from "socket.io-client";
import {
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Check,
	LogOut,
	Zap,
} from "lucide-react";

interface HeadBallControllerProps {
	socket: Socket;
	isAdmin: boolean;
}

export default function HeadBallController({
	socket,
	isAdmin,
}: HeadBallControllerProps) {
	const sendNav = (action: string) => {
		socket.emit("input", { type: "NAV", action });

		if (navigator.vibrate) navigator.vibrate(50);
	};

	const handleMove = (dir: number) => {
		socket.emit("input", { type: "MOVE", val: dir });
	};

	const handleJump = () => {
		if (navigator.vibrate) navigator.vibrate(20);
		socket.emit("input", { type: "JUMP" });
	};

	const handleShoot = () => {
		if (navigator.vibrate) navigator.vibrate(50);
		socket.emit("input", { type: "SHOOT" });
	};

	return (
		<div className="h-screen w-full bg-slate-900 flex flex-col p-4 space-y-4 select-none touch-none">
			{isAdmin && (
				<div className="flex gap-4">
					<button
						className="w-[95%] h-[95%] bg-red-600 rounded-xl active:bg-red-500 flex items-center justify-center border-b-4 border-red-900 active:border-b-0 active:translate-y-1 text-2xl font-bold"
						onPointerDown={() => sendNav("EXIT")}
					>
						<LogOut size={64} className="text-white" />
						EXIT
					</button>
					<button
						className="w-[95%] h-[95%] bg-blue-600 rounded-xl active:bg-blue-500 flex items-center justify-center border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 text-2xl font-bold"
						onPointerDown={() => sendNav("ENTER")}
					>
						<Check size={64} />
						ENTER
					</button>
				</div>
			)}

			<div className="flex gap-4 h-full">
				<div className="flex-1 flex gap-4">
					<button
						className="flex-1 bg-slate-700 rounded-xl active:bg-slate-600 flex items-center justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
						onPointerDown={() => handleMove(-1)}
						onPointerUp={() => handleMove(0)}
						onPointerLeave={() => handleMove(0)}
					>
						<ArrowLeft size={48} className="text-slate-300" />
					</button>

					<button
						className="flex-1 bg-slate-700 rounded-xl active:bg-slate-600 flex items-center justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
						onPointerDown={() => handleMove(1)}
						onPointerUp={() => handleMove(0)}
						onPointerLeave={() => handleMove(0)}
					>
						<ArrowRight size={48} className="text-slate-300" />
					</button>
				</div>

				<div className="flex-1 flex flex-col gap-4">
					<button
						className="flex-1 bg-orange-600 rounded-xl active:bg-orange-500 flex flex-col items-center justify-center border-b-4 border-orange-900 active:border-b-0 active:translate-y-1"
						onPointerDown={handleShoot}
					>
						<Zap size={48} className="text-white mb-1" />
						<span className="text-white font-bold text-xl">ŞUT</span>
					</button>

					<button
						className="flex-1 bg-green-600 rounded-xl active:bg-green-500 flex items-center justify-center border-b-4 border-green-900 active:border-b-0 active:translate-y-1"
						onPointerDown={handleJump}
					>
						<ArrowUp size={64} className="text-white" />
					</button>
				</div>
			</div>
		</div>
	);
}
