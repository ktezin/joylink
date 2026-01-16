import { Entity } from "./Entity";

export class Renderer {
	static draw(ctx: CanvasRenderingContext2D, entity: Entity, time: number = 0) {
		let activeSprite = entity.image;

		if (entity.vel.x !== 0 && entity.sprites["run"]) {
			activeSprite = entity.sprites["run"];
		} else if (!entity.isGrounded && entity.sprites["jump"]) {
			activeSprite = entity.sprites["jump"];
		} else if (entity.sprites["idle"]) {
			activeSprite = entity.sprites["idle"];
		}

		if (activeSprite && activeSprite.complete) {
			if (!entity.facingRight) {
				ctx.save();
				ctx.scale(-1, 1);
				ctx.drawImage(
					activeSprite,
					-entity.pos.x - entity.size.x,
					entity.pos.y,
					entity.size.x,
					entity.size.y
				);
				ctx.restore();
			} else {
				ctx.drawImage(
					activeSprite,
					entity.pos.x,
					entity.pos.y,
					entity.size.x,
					entity.size.y
				);
			}
		} else {
			if (
				["lava", "water", "acid"].some((type) => entity.label.includes(type))
			) {
				const wallColor = "#334155";
				const liquidColor = entity.color;
				const halfHeight = entity.size.y / 2;

				ctx.fillStyle = wallColor;
				ctx.fillRect(
					entity.pos.x,
					entity.pos.y + halfHeight,
					entity.size.x,
					halfHeight
				);

				ctx.fillStyle = liquidColor;
				ctx.beginPath();

				const startWaveY = Math.sin(entity.pos.x * 0.05 + time * 0.5) * 3;
				ctx.moveTo(entity.pos.x, entity.pos.y + halfHeight + startWaveY);
				ctx.moveTo(entity.pos.x, entity.pos.y + halfHeight);

				for (let i = 0; i <= entity.size.x; i += 4) {
					const globalX = entity.pos.x + i;
					const waveY = Math.sin(globalX * 0.05 + time * 0.5) * 3;

					ctx.lineTo(entity.pos.x + i, entity.pos.y + waveY);
				}

				ctx.lineTo(entity.pos.x + entity.size.x, entity.pos.y + halfHeight);
				ctx.lineTo(entity.pos.x, entity.pos.y + halfHeight);
				ctx.fill();

				ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
				ctx.lineWidth = 2;
				ctx.beginPath();
				for (let i = 0; i <= entity.size.x; i += 4) {
					const globalX = entity.pos.x + i;
					const waveY = Math.sin(globalX * 0.05 + time * 0.5) * 3;
					ctx.lineTo(entity.pos.x + i, entity.pos.y + waveY);
				}
				ctx.stroke();

				return;
			}

			ctx.fillStyle = entity.color;
			const shape = entity.stats.shape || "rectangle";
			if (shape === "triangle_left") {
				ctx.beginPath();
				ctx.moveTo(entity.pos.x, entity.pos.y);
				ctx.lineTo(entity.pos.x + entity.size.x, entity.pos.y + 4);
				ctx.lineTo(entity.pos.x + entity.size.x, entity.pos.y + entity.size.y);
				ctx.lineTo(entity.pos.x, entity.pos.y + entity.size.y);
				ctx.fill();
			} else if (shape === "triangle_right") {
				ctx.beginPath();
				ctx.moveTo(entity.pos.x, entity.pos.y + 4);
				ctx.lineTo(entity.pos.x + entity.size.x, entity.pos.y);
				ctx.lineTo(entity.pos.x + entity.size.x, entity.pos.y + entity.size.y);
				ctx.lineTo(entity.pos.x, entity.pos.y + entity.size.y);
				ctx.fill();
			} else {
				ctx.fillRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);
			}
		}
	}

	static clear(ctx: CanvasRenderingContext2D, width: number, height: number) {
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#0f172a";
		ctx.fillRect(0, 0, width, height);
	}
}
