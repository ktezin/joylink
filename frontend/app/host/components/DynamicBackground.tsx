export default function DynamicBackground({ gameId }: { gameId: string }) {
	return (
		<div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#09090b]">
			<div
				key={gameId}
				className="absolute inset-0 animate-in fade-in duration-700"
			>
				<img
					src={`/games/${gameId}/cover.png`}
					alt="background"
					className="w-full h-full object-cover opacity-60 blur-md scale-110"
					onError={(e) => {
						e.currentTarget.style.display = "none";
					}}
				/>

				<div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/80" />

				<div className="absolute inset-0 bg-linear-to-r from-[#09090b] via-transparent to-[#09090b] opacity-80" />
			</div>
		</div>
	);
}
