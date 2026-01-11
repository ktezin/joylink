import { Particle } from "./types";

export class ParticleSystem {
	private particles: Particle[] = [];

	emit(
		x: number,
		y: number,
		color: string,
		count: number = 10,
		speed: number = 5
	) {
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const velocity = Math.random() * speed;

			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * velocity,
				vy: Math.sin(angle) * velocity,
				life: 30 + Math.random() * 20,
				maxLife: 50,
				color: color,
				size: 3 + Math.random() * 5,
				shape: Math.random() > 0.5 ? "square" : "circle",
			});
		}
	}

	update() {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];

			p.x += p.vx;
			p.y += p.vy;
			p.life--;
			p.size *= 0.95;

			if (p.life <= 0 || p.size < 0.5) {
				this.particles.splice(i, 1);
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.particles.forEach((p) => {
			ctx.save();
			ctx.globalAlpha = p.life / p.maxLife;
			ctx.fillStyle = p.color;

			if (p.shape === "circle") {
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();
			} else {
				ctx.fillRect(p.x, p.y, p.size, p.size);
			}

			ctx.restore();
		});
	}
}
