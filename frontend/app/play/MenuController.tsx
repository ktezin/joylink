import { socket } from "@/lib/socket";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check } from "lucide-react";

export const MenuController = () => {
	const sendNav = (action: string) => {
		socket.emit("input", { type: "NAV", action });

		if (navigator.vibrate) navigator.vibrate(50);
	};

	return (
		<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 select-none">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-yellow-400 mb-2">
					Menü Kontrolü
				</h2>
				<p className="text-slate-400 text-sm">Host ekranındaki oyunu seç.</p>
			</div>

			<div className="relative w-64 h-64 bg-slate-800 rounded-full shadow-2xl border-4 border-slate-700 flex items-center justify-center mb-12">
				<button
					onPointerDown={() => sendNav("UP")}
					className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-20 bg-slate-700 hover:bg-slate-600 rounded-t-xl active:bg-blue-600 transition-colors flex items-start justify-center pt-2"
				>
					<ArrowUp className="text-slate-300" />
				</button>

				<button
					onPointerDown={() => sendNav("DOWN")}
					className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-20 bg-slate-700 hover:bg-slate-600 rounded-b-xl active:bg-blue-600 transition-colors flex items-end justify-center pb-2"
				>
					<ArrowDown className="text-slate-300" />
				</button>

				<button
					onPointerDown={() => sendNav("LEFT")}
					className="absolute left-2 top-1/2 -translate-y-1/2 w-20 h-16 bg-slate-700 hover:bg-slate-600 rounded-l-xl active:bg-blue-600 transition-colors flex items-center justify-start pl-2"
				>
					<ArrowLeft className="text-slate-300" />
				</button>

				<button
					onPointerDown={() => sendNav("RIGHT")}
					className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-16 bg-slate-700 hover:bg-slate-600 rounded-r-xl active:bg-blue-600 transition-colors flex items-center justify-end pr-2"
				>
					<ArrowRight className="text-slate-300" />
				</button>

				<div className="w-20 h-20 bg-slate-800 rounded-full z-10"></div>
			</div>

			<button
				onClick={() => sendNav("ENTER")}
				className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white font-bold py-6 rounded-2xl text-xl shadow-lg shadow-green-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
			>
				<Check size={32} />
				SEÇ / BAŞLAT
			</button>
		</div>
	);
};
