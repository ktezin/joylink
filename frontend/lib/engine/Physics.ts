import { EngineConfig } from "./types";
import { Entity } from "./Entity";

export class Physics {
	static update(entities: Entity[], obstacles: Entity[], config: EngineConfig) {
		entities.forEach((entity) => {
			this.applyInput(entity, config);
			this.applyMovement(entity, config);

			const allObstacles = [
				...obstacles,
				...entities.filter((e) => e.id !== entity.id),
			];
			this.checkCollisions(entity, allObstacles);
			this.checkWorldBounds(entity, config);
		});
	}

	static checkOverlap(a: Entity, b: Entity, padding: number = 0): boolean {
		return (
			a.pos.x < b.pos.x + b.size.x - padding &&
			a.pos.x + a.size.x > b.pos.x + padding &&
			a.pos.y < b.pos.y + b.size.y - padding &&
			a.pos.y + a.size.y > b.pos.y + padding
		);
	}

	private static applyInput(entity: Entity, config: EngineConfig) {
		if (entity.type !== "PLAYER") return;

		if (config.mode === "platformer") {
			if (entity.moveInput.x !== 0) {
				entity.vel.x += entity.moveInput.x * entity.stats.acceleration;
			}

			if (entity.moveInput.x > 0) entity.facingRight = true;
			if (entity.moveInput.x < 0) entity.facingRight = false;
		} else if (config.mode === "topdown") {
			if (entity.moveInput.x !== 0)
				entity.vel.x += entity.moveInput.x * entity.stats.acceleration;
			if (entity.moveInput.y !== 0)
				entity.vel.y += entity.moveInput.y * entity.stats.acceleration;
		}

		const maxSpeed = entity.stats.speed;

		if (entity.vel.x > maxSpeed) entity.vel.x = maxSpeed;
		if (entity.vel.x < -maxSpeed) entity.vel.x = -maxSpeed;

		if (config.mode === "topdown") {
			if (entity.vel.y > maxSpeed) entity.vel.y = maxSpeed;
			if (entity.vel.y < -maxSpeed) entity.vel.y = -maxSpeed;
		}

		if (entity.axisLock === "x") entity.vel.x = 0;
		if (entity.axisLock === "y") entity.vel.y = 0;
	}

	private static applyMovement(entity: Entity, config: EngineConfig) {
		if (config.mode === "platformer") entity.vel.y += config.gravity.y;

		entity.pos.x += entity.vel.x;
		entity.pos.y += entity.vel.y;

		if (entity.type === "BOX") {
			entity.vel.x *= 0.8;
		} else {
			entity.vel.x *= config.friction;
			if (config.mode === "topdown") entity.vel.y *= config.friction;
		}
		entity.isGrounded = false;
	}

	private static checkCollisions(entity: Entity, obstacles: Entity[]) {
		for (const obs of obstacles) {
			if (obs.type === "TRIGGER") continue;
			if (entity.id === obs.id) continue;

			if (entity.type === "PLAYER" && obs.type === "BOX") {
				const collision = this.getCollision(entity, obs);
				if (collision && collision.axis === "x") {
					obs.vel.x = entity.vel.x;
					continue;
				}
			}
			const collision = this.getCollision(entity, obs);
			if (collision) this.resolveCollision(entity, collision);
		}
	}

	private static getCollision(entity: Entity, obs: Entity) {
		const entCenterX = entity.pos.x + entity.size.x / 2;
		const entCenterY = entity.pos.y + entity.size.y / 2;
		const obsCenterX = obs.pos.x + obs.size.x / 2;
		const obsCenterY = obs.pos.y + obs.size.y / 2;
		const dx = entCenterX - obsCenterX;
		const dy = entCenterY - obsCenterY;
		const minDistX = (entity.size.x + obs.size.x) / 2;
		const minDistY = (entity.size.y + obs.size.y) / 2;

		if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
			const overlapX = minDistX - Math.abs(dx);
			const overlapY = minDistY - Math.abs(dy);
			return overlapX >= overlapY
				? { axis: "y", overlap: overlapY, dir: dy }
				: { axis: "x", overlap: overlapX, dir: dx };
		}
		return null;
	}

	private static resolveCollision(entity: Entity, col: any) {
		if (col.axis === "y") {
			if (col.dir > 0) {
				entity.pos.y += col.overlap;
				if (entity.type === "BALL") entity.vel.y *= -1;
				else entity.vel.y = 0;
			} else {
				entity.pos.y -= col.overlap;
				if (entity.type === "BALL") entity.vel.y *= -1;
				else {
					entity.vel.y = 0;
					entity.isGrounded = true;
				}
			}
		} else {
			if (col.dir > 0) {
				entity.pos.x += col.overlap;
				if (entity.type === "BALL") entity.vel.x *= -1.05;
				else entity.vel.x = 0;
			} else {
				entity.pos.x -= col.overlap;
				if (entity.type === "BALL") entity.vel.x *= -1.05;
				else entity.vel.x = 0;
			}
		}
	}

	private static checkWorldBounds(entity: Entity, config: EngineConfig) {
		if (entity.type !== "BALL") {
			if (entity.pos.x < 0) {
				entity.pos.x = 0;
				entity.vel.x = 0;
			}
			if (entity.pos.x + entity.size.x > config.worldWidth) {
				entity.pos.x = config.worldWidth - entity.size.x;
				entity.vel.x = 0;
			}
		}
		if (entity.pos.y < 0) {
			entity.pos.y = 0;
			if (entity.type === "BALL") entity.vel.y *= -1;
			else entity.vel.y = 0;
		}
		if (entity.pos.y + entity.size.y > config.worldHeight) {
			entity.pos.y = config.worldHeight - entity.size.y;
			if (entity.type === "BALL") entity.vel.y *= -1;
			else {
				entity.vel.y = 0;
				entity.isGrounded = true;
			}
		}
	}
}
