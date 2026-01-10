import { Socket } from "socket.io-client";

export default function ClickController({ socket }: { socket: Socket }) {
	const handleClick = () => {
		if (navigator.vibrate) navigator.vibrate(30);
		socket.emit("input", { action: "PULL", value: 1 });
	};

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center bg-orange-600 p-8">
			<button
				className="w-64 h-64 rounded-full bg-red-500 border-b-8 border-red-800 shadow-2xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center"
				onPointerDown={handleClick}
			>
				<span className="text-4xl font-black text-white select-none">ÇEK!</span>
			</button>
			<p className="mt-8 text-white font-bold text-center opacity-80 animate-pulse">
				Kazanmak için seri tıkla!
			</p>
		</div>
	);
}
