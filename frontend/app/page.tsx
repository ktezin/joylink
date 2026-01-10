"use client";
import { useEffect } from "react";
import { socket } from "@/lib/socket";
import Link from "next/link";

export default function Home() {
	useEffect(() => {
		socket.connect();

		socket.on("connect", () => {
			console.log("Bağlandı! Socket ID:", socket.id);
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-24 space-y-12">
			<h1 className="text-4xl font-bold">JoyLink</h1>
			<p>Play party games with your loved ones!</p>
			<div className="grid grid-cols-2 gap-6">
				<Link
					href="/host"
					className="p-12 border rounded-md shadow-xl bg-blue-700 hover:bg-blue-900 text-4xl"
				>
					Host
				</Link>
				<Link
					href="/play"
					className="p-12 border rounded-md shadow-xl bg-red-700 hover:bg-red-900 text-4xl"
				>
					Play
				</Link>
			</div>
		</div>
	);
}
