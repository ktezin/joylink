import { useEffect, useRef } from "react";
import { EngineConfig } from "../lib/engine/types";

export const useJoyEngine = (
	width: number,
	height: number,
	config: EngineConfig,
	updateLogic: (ctx: CanvasRenderingContext2D) => void
) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationId: number;

		const loop = () => {
			updateLogic(ctx);
			animationId = requestAnimationFrame(loop);
		};

		loop();
		
		return () => cancelAnimationFrame(animationId);
	}, [width, height, config, updateLogic]);

	return canvasRef;
};
