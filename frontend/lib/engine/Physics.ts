import { Entity } from "./Entity";
import { EngineConfig } from "./types";

export class Physics {
	static update(entities: Entity[], obstacles: Entity[], config: EngineConfig) {
		entities.forEach((entity) => {
			entity.isGrounded = false;

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

	private static applyInput(entity: Entity, config: EngineConfig) {
		if (entity.type !== "PLAYER") return;

		if (config.mode === "platformer") {
			if (entity.moveInput.x !== 0) {
				entity.vel.x += entity.moveInput.x * entity.stats.acceleration;
			}
			if (entity.moveInput.x > 0) entity.facingRight = true;
			if (entity.moveInput.x < 0) entity.facingRight = false;
		}

		const maxSpeed = entity.stats.speed;
		if (entity.vel.x > maxSpeed) entity.vel.x = maxSpeed;
		if (entity.vel.x < -maxSpeed) entity.vel.x = -maxSpeed;

		if (entity.axisLock === "x") entity.vel.x = 0;
		if (entity.axisLock === "y") entity.vel.y = 0;
	}

	private static applyMovement(entity: Entity, config: EngineConfig) {
		if (config.mode === "platformer" || entity.type === "BALL") {
			entity.vel.y += config.gravity.y;
		}

		entity.pos.x += entity.vel.x;
		entity.pos.y += entity.vel.y;

		if (entity.type === "BALL") {
			entity.vel.x *= 0.99;
		} else {
			entity.vel.x *= config.friction;
		}
	}

	private static checkCollisions(entity: Entity, obstacles: Entity[]) {
		for (const obs of obstacles) {
			if (obs.type === "TRIGGER") continue;
			if (entity.id === obs.id) continue;

			// BALL VS BOX
			if (entity.type === "BALL" || obs.type === "BALL") {
				const ball = entity.type === "BALL" ? entity : obs;
				const box = entity.type === "BALL" ? obs : entity;
				this.resolveCircleVsAABB(ball, box);
			}
			// BOX VS BOX
			else {
				const collision = this.getAABBCollision(entity, obs);
				if (collision) this.resolveAABBCollision(entity, collision);
			}
		}
	}

	private static getAABBCollision(entity: Entity, obs: Entity) {
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

	private static resolveAABBCollision(entity: Entity, col: any) {
		if (col.axis === "y") {
			if (col.dir > 0) {
				entity.pos.y += col.overlap;
				entity.vel.y = 0;
			} else {
				entity.pos.y -= col.overlap;
				entity.vel.y = 0;
				entity.isGrounded = true;
			}
		} else {
			if (col.dir > 0) entity.pos.x += col.overlap;
			else entity.pos.x -= col.overlap;
			entity.vel.x = 0;
		}
	}

	private static resolveCircleVsAABB(ball: Entity, box: Entity) {
		const ballCx = ball.pos.x + ball.size.x / 2;
		const ballCy = ball.pos.y + ball.size.y / 2;
		const boxCx = box.pos.x + box.size.x / 2;
		const boxCy = box.pos.y + box.size.y / 2;

		const halfW = box.size.x / 2;
		const halfH = box.size.y / 2;
		const closestX = Math.max(boxCx - halfW, Math.min(ballCx, boxCx + halfW));
		const closestY = Math.max(boxCy - halfH, Math.min(ballCy, boxCy + halfH));

		const dx = ballCx - closestX;
		const dy = ballCy - closestY;
		const distSq = dx * dx + dy * dy;
		const radius = ball.size.x / 2;

		if (distSq >= radius * radius || distSq === 0) return;

		const distance = Math.sqrt(distSq);
		const overlap = radius - distance;
		const nx = dx / distance;
		const ny = dy / distance;

		ball.pos.x += nx * overlap;
		ball.pos.y += ny * overlap;

		const dotProduct = ball.vel.x * nx + ball.vel.y * ny;
		if (dotProduct > 0) return;

		let restitution = 0.8;
		if (box.type === "PLAYER") {
			restitution = 0.5;
			ball.vel.x += box.vel.x * 0.5;
			ball.vel.y += box.vel.y * 0.5;
		}

		const impulse = -(1 + restitution) * dotProduct;
		ball.vel.x += impulse * nx;
		ball.vel.y += impulse * ny;
	}

	private static checkWorldBounds(entity: Entity, config: EngineConfig) {
		if (entity.pos.x < 0) {
			entity.pos.x = 0;
			if (entity.type === "BALL") entity.vel.x *= -0.7;
			else entity.vel.x = 0;
		}
		if (entity.pos.x + entity.size.x > config.worldWidth) {
			entity.pos.x = config.worldWidth - entity.size.x;
			if (entity.type === "BALL") entity.vel.x *= -0.7;
			else entity.vel.x = 0;
		}
		if (entity.pos.y + entity.size.y > config.worldHeight) {
			entity.pos.y = config.worldHeight - entity.size.y;
			if (entity.type === "BALL") {
				entity.vel.y *= -0.6;
				if (Math.abs(entity.vel.y) < 2) entity.vel.y = 0;
				entity.vel.x *= 0.95;
			} else {
				entity.vel.y = 0;
				entity.isGrounded = true;
			}
		}
	}

	static checkOverlap(a: Entity, b: Entity, padding: number = 0): boolean {
		return (
			a.pos.x < b.pos.x + b.size.x + padding &&
			a.pos.x + a.size.x > b.pos.x - padding &&
			a.pos.y < b.pos.y + b.size.y + padding &&
			a.pos.y + a.size.y > b.pos.y - padding
		);
	}
}
