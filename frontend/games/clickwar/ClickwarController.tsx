import { Check, LogOut } from "lucide-react";
import { Socket } from "socket.io-client";

interface ClickControllerProps {
	socket: Socket;
	isAdmin: boolean;
}

export default function ClickController({
	socket,
	isAdmin,
}: ClickControllerProps) {
	const sendNav = (action: string) => {
		socket.emit("input", { type: "NAV", action });

		if (navigator.vibrate) navigator.vibrate(50);
	};

	const handleClick = () => {
		if (navigator.vibrate) navigator.vibrate(30);
		socket.emit("input", { action: "PULL", value: 1 });
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

			<div className="h-screen w-full flex flex-col items-center justify-center bg-orange-600 p-8">
				<button
					className="w-64 h-64 rounded-full bg-red-500 border-b-8 border-red-800 shadow-2xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center"
					onPointerDown={handleClick}
				>
					<span className="text-4xl font-black text-white select-none">
						PULL!
					</span>
				</button>
				<p className="mt-8 text-white font-bold text-center opacity-80 animate-pulse">
					Click fast to win!
				</p>
			</div>
		</div>
	);
}
