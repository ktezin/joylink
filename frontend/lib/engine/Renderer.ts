import { Entity } from "./Entity";

export class Renderer {
	static draw(ctx: CanvasRenderingContext2D, entity: Entity) {
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
			ctx.fillStyle = entity.color;
			ctx.fillRect(entity.pos.x, entity.pos.y, entity.size.x, entity.size.y);
		}
	}

	static clear(ctx: CanvasRenderingContext2D, width: number, height: number) {
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#0f172a";
		ctx.fillRect(0, 0, width, height);
	}
}
