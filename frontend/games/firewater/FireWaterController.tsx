import { Socket } from "socket.io-client";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

export default function FireWaterController({ socket }: { socket: Socket }) {
	const handleMove = (dir: number) => {
		socket.emit("input", { type: "MOVE", val: dir });
	};

	const handleJump = () => {
		if (navigator.vibrate) navigator.vibrate(20);
		socket.emit("input", { type: "JUMP" });
	};

	return (
		<div className="h-screen w-full bg-slate-900 flex flex-row p-4 gap-4 select-none touch-none">
			<div className="flex-1 flex gap-2">
				<button
					className="flex-1 bg-slate-700 rounded-xl active:bg-slate-600 flex items-center justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
					onPointerDown={() => handleMove(-1)}
					onPointerUp={() => handleMove(0)}
					onPointerLeave={() => handleMove(0)}
				>
					<ArrowLeft size={48} />
				</button>

				<button
					className="flex-1 bg-slate-700 rounded-xl active:bg-slate-600 flex items-center justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
					onPointerDown={() => handleMove(1)}
					onPointerUp={() => handleMove(0)}
					onPointerLeave={() => handleMove(0)}
				>
					<ArrowRight size={48} />
				</button>
			</div>

			<div className="flex-1">
				<button
					className="w-full h-full bg-green-600 rounded-xl active:bg-green-500 flex items-center justify-center border-b-4 border-green-900 active:border-b-0 active:translate-y-1"
					onPointerDown={handleJump}
				>
					<ArrowUp size={64} className="text-white" />
				</button>
			</div>
		</div>
	);
}
