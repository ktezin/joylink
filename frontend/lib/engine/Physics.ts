import { Entity } from "./Entity";
import { EngineConfig } from "./types";

export class Physics {
	static update(entities: Entity[], obstacles: Entity[], config: EngineConfig) {
		entities.forEach((entity) => {
			// isGrounded her frame resetlenir
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

		// Platformer Modu
		if (config.mode === "platformer") {
			if (entity.moveInput.x !== 0) {
				entity.vel.x += entity.moveInput.x * entity.stats.acceleration;
			}
			if (entity.moveInput.x > 0) entity.facingRight = true;
			if (entity.moveInput.x < 0) entity.facingRight = false;
		}
		// Topdown Modu (Pong vb.)
		else if (config.mode === "topdown") {
			if (entity.moveInput.x !== 0)
				entity.vel.x += entity.moveInput.x * entity.stats.acceleration;
			if (entity.moveInput.y !== 0)
				entity.vel.y += entity.moveInput.y * entity.stats.acceleration;
		}

		// Hız Limiti
		const maxSpeed = entity.stats.speed;
		if (entity.vel.x > maxSpeed) entity.vel.x = maxSpeed;
		if (entity.vel.x < -maxSpeed) entity.vel.x = -maxSpeed;

		if (config.mode === "topdown") {
			if (entity.vel.y > maxSpeed) entity.vel.y = maxSpeed;
			if (entity.vel.y < -maxSpeed) entity.vel.y = -maxSpeed;
		}

		// Eksen Kilitleri
		if (entity.axisLock === "x") entity.vel.x = 0;
		if (entity.axisLock === "y") entity.vel.y = 0;
	}

	private static applyMovement(entity: Entity, config: EngineConfig) {
		// Yerçekimi
		if (config.mode === "platformer" || entity.type === "BALL") {
			// Zıplama anında veya havadayken yerçekimi uygula
			if (!entity.isGrounded || entity.vel.y < 0) {
				entity.vel.y += config.gravity.y;
			}
		}

		entity.pos.x += entity.vel.x;
		entity.pos.y += entity.vel.y;

		// Sürtünme
		if (entity.label === "ball" || entity.type === "BALL") {
			// Toplarda sürtünme olmasın veya çok az olsun (Pong için kritik)
			// PongConfig'de friction 1 gelse bile buradaki mantık ezebiliyordu.
			// O yüzden toplara dokunmuyoruz, sürtünmeyi config'e bırakıyoruz.
			if (config.mode === "platformer") entity.vel.x *= 0.99; // Sadece platformer topunda hava sürtünmesi
		} else {
			entity.vel.x *= config.friction;
			if (config.mode === "topdown") entity.vel.y *= config.friction;
		}
	}

	private static checkCollisions(entity: Entity, obstacles: Entity[]) {
		for (const obs of obstacles) {
			if (obs.type === "TRIGGER") continue;
			if (entity.id === obs.id) continue;

			// 1. DAİRESEL ÇARPIŞMA (HeadBall)
			if (entity.type === "BALL" || obs.type === "BALL") {
				const ball = entity.type === "BALL" ? entity : obs;
				const box = entity.type === "BALL" ? obs : entity;
				this.resolveCircleVsAABB(ball, box);
			}
			// 2. KUTU ÇARPIŞMASI (Pong, Oyuncu vs Duvar)
			else {
				const collision = this.getAABBCollision(entity, obs);
				if (collision) this.resolveAABBCollision(entity, collision);
			}
		}
	}

	// --- KUTU FİZİĞİ (AABB) ---

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

	// DÜZELTME BURADA YAPILDI: Top kontrolü eklendi
	private static resolveAABBCollision(entity: Entity, col: any) {
		// Eğer çarpışan şey top ise (Pong'da BOX olarak tanımlı ama id'si ball veya label'ı ball)
		const isBall = entity.label === "ball" || entity.id.includes("ball");

		if (col.axis === "y") {
			// Yön düzeltme
			if (col.dir > 0) entity.pos.y += col.overlap;
			else entity.pos.y -= col.overlap;

			if (isBall) {
				// TOP İSE SEK (Bounce)
				entity.vel.y *= -1;
			} else {
				// KARAKTER İSE DUR (Stop)
				entity.vel.y = 0;
				if (col.dir < 0) entity.isGrounded = true;
			}
		} else {
			// Yön düzeltme
			if (col.dir > 0) entity.pos.x += col.overlap;
			else entity.pos.x -= col.overlap;

			if (isBall) {
				// TOP İSE SEK (Bounce)
				entity.vel.x *= -1;
			} else {
				// KARAKTER İSE DUR (Stop)
				entity.vel.x = 0;
			}
		}
	}

	// --- DAİRE FİZİĞİ (HeadBall) ---

	private static resolveCircleVsAABB(ball: Entity, box: Entity) {
		// ... (Bu kısım HeadBall için zaten düzgün çalışıyor, aynen kalabilir) ...
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

	// --- DÜNYA SINIRLARI ---

	private static checkWorldBounds(entity: Entity, config: EngineConfig) {
		const isBall = entity.type === "BALL" || entity.label === "ball";

		// Sol-Sağ
		if (entity.pos.x < 0) {
			entity.pos.x = 0;
			if (isBall) entity.vel.x *= -1; // Tam sekme
			else entity.vel.x = 0;
		}
		if (entity.pos.x + entity.size.x > config.worldWidth) {
			entity.pos.x = config.worldWidth - entity.size.x;
			if (isBall) entity.vel.x *= -1; // Tam sekme
			else entity.vel.x = 0;
		}

		// Tavan
		if (entity.pos.y < -500) entity.vel.y = 0;

		// Zemin
		if (entity.pos.y + entity.size.y > config.worldHeight) {
			entity.pos.y = config.worldHeight - entity.size.y;

			if (isBall) {
				// Platformer topuysa sönümle, Pong topuysa tam sek
				if (config.mode === "platformer") {
					entity.vel.y *= -0.6;
					if (Math.abs(entity.vel.y) < 2) entity.vel.y = 0;
					entity.vel.x *= 0.95;
				} else {
					entity.vel.y *= -1; // Pong için tam sekme
				}
			} else {
				entity.vel.y = 0;
				entity.isGrounded = true;
			}
		}
	}

	// Yardımcı
	static checkOverlap(a: Entity, b: Entity, padding: number = 0): boolean {
		return (
			a.pos.x < b.pos.x + b.size.x + padding &&
			a.pos.x + a.size.x > b.pos.x - padding &&
			a.pos.y < b.pos.y + b.size.y + padding &&
			a.pos.y + a.size.y > b.pos.y - padding
		);
	}
}
