import { Socket } from "socket.io-client";
import { ChevronUp, ChevronDown, LogOut, Check } from "lucide-react";

interface PongControllerProps {
	socket: Socket;
	isAdmin: boolean;
}

export default function PongController({
	socket,
	isAdmin,
}: PongControllerProps) {
	const sendNav = (action: string) => {
		socket.emit("input", { type: "NAV", action });

		if (navigator.vibrate) navigator.vibrate(50);
	};

	const sendInput = (dir: number) => {
		socket.emit("input", { type: "MOVE", val: dir });
	};

	return (
		<div className="h-screen w-full bg-slate-900 flex flex-col p-4 gap-4 select-none touch-none">
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

			<div className="h-screen w-full flex flex-col bg-slate-900 select-none touch-none">
				<button
					className="flex-1 bg-blue-600 active:bg-blue-500 flex items-center justify-center border-b-4 border-slate-900 transition-colors"
					onPointerDown={() => sendInput(-1)}
					onPointerUp={() => sendInput(0)}
					onPointerLeave={() => sendInput(0)}
				>
					<ChevronUp size={96} color="white" />
				</button>

				<button
					className="flex-1 bg-red-600 active:bg-red-500 flex items-center justify-center transition-colors"
					onPointerDown={() => sendInput(1)}
					onPointerUp={() => sendInput(0)}
					onPointerLeave={() => sendInput(0)}
				>
					<ChevronDown size={96} color="white" />
				</button>

				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-full pointer-events-none text-sm font-bold">
					PLAYER
				</div>
			</div>
		</div>
	);
}
