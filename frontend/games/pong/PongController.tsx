import { Socket } from "socket.io-client";
import { ChevronUp, ChevronDown } from "lucide-react";

interface PongControllerProps {
	socket: Socket;
}

export default function PongController({ socket }: PongControllerProps) {
	const sendInput = (dir: number) => {
		socket.emit("input", { type: "MOVE", val: dir });
	}

	return (
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
	);
}
