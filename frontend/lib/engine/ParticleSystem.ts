import { Particle, ParticleShape } from "./types";

export class ParticleSystem {
	private particles: Particle[] = [];

	emit(config: {
		x: number;
		y: number;
		count?: number;
		speed?: number;
		color?: string | string[];
		shape?: ParticleShape;
		gravity?: number;
		friction?: number;
		spread?: number;
		angleOffset?: number;
		life?: number;
		size?: number;
	}) {
		const count = config.count || 10;
		const speed = config.speed || 5;
		const spread = config.spread || Math.PI * 2;
		const angleOffset = config.angleOffset || 0;

		for (let i = 0; i < count; i++) {
			const angle = angleOffset + (Math.random() - 0.5) * spread;
			const velocity = Math.random() * speed;

			let selectedColor = "#ffffff";
			if (Array.isArray(config.color)) {
				selectedColor =
					config.color[Math.floor(Math.random() * config.color.length)];
			} else if (config.color) {
				selectedColor = config.color;
			}

			this.particles.push({
				x: config.x,
				y: config.y,
				vx: Math.cos(angle) * velocity,
				vy: Math.sin(angle) * velocity,
				life: (config.life || 40) + Math.random() * 20,
				maxLife: (config.life || 40) + 20,
				color: selectedColor,
				size: (config.size || 4) + Math.random() * 3,
				shape: config.shape || "circle",
				gravity: config.gravity ?? 0,
				friction: config.friction ?? 1,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 0.2,
				opacity: 1,
			});
		}
	}

	emitExplosion(x: number, y: number, color: string, count: number = 10) {
		this.emit({
			x,
			y,
			color,
			count,
			speed: 6,
			shape: "circle",
			friction: 0.95,
			gravity: 0.1,
			size: 5,
		});
	}

	emitConfetti(
		x: number,
		y: number,
		colors: string[] = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"]
	) {
		this.emit({
			x,
			y,
			color: colors,
			count: 30,
			speed: 12,
			shape: "square",
			gravity: 0.2,
			friction: 0.92,
			life: 100,
			spread: Math.PI,
			angleOffset: -Math.PI / 2,
			size: 8,
		});
	}

	emitSparks(x: number, y: number, color: string = "#fbbf24") {
		this.emit({
			x,
			y,
			color,
			count: 5,
			speed: 15,
			shape: "spark",
			friction: 0.8,
			life: 15,
			size: 3,
		});
	}

	emitSmoke(x: number, y: number, color: string = "#cbd5e1") {
		this.emit({
			x,
			y,
			color,
			count: 4,
			speed: 2,
			shape: "circle",
			gravity: -0.05,
			friction: 0.9,
			life: 30,
			size: 8,
			angleOffset: -Math.PI / 2,
			spread: Math.PI / 2,
		});
	}

	update() {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];

			p.vx *= p.friction;
			p.vy *= p.friction;
			p.vy += p.gravity;

			p.x += p.vx;
			p.y += p.vy;

			p.rotation += p.rotationSpeed;
			p.life--;

			if (p.shape !== "spark") {
				p.size *= 0.96;
			}

			if (p.life <= 0 || p.size < 0.2) {
				this.particles.splice(i, 1);
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.particles.forEach((p) => {
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rotation);
			ctx.globalAlpha = Math.min(p.life / 20, 1);

			ctx.fillStyle = p.color;
			ctx.strokeStyle = p.color;

			switch (p.shape) {
				case "square":
					ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
					break;

				case "triangle":
					ctx.beginPath();
					ctx.moveTo(0, -p.size);
					ctx.lineTo(p.size, p.size);
					ctx.lineTo(-p.size, p.size);
					ctx.closePath();
					ctx.fill();
					break;

				case "star":
					this.drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
					break;

				case "spark":
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(-p.vx * 3, -p.vy * 3);
					ctx.stroke();
					break;

				case "circle":
				default:
					ctx.beginPath();
					ctx.arc(0, 0, p.size, 0, Math.PI * 2);
					ctx.fill();
					break;
			}

			ctx.restore();
		});
	}

	private drawStar(
		ctx: CanvasRenderingContext2D,
		cx: number,
		cy: number,
		spikes: number,
		outerRadius: number,
		innerRadius: number
	) {
		let rot = (Math.PI / 2) * 3;
		let x = cx;
		let y = cy;
		let step = Math.PI / spikes;

		ctx.beginPath();
		ctx.moveTo(cx, cy - outerRadius);
		for (let i = 0; i < spikes; i++) {
			x = cx + Math.cos(rot) * outerRadius;
			y = cy + Math.sin(rot) * outerRadius;
			ctx.lineTo(x, y);
			rot += step;

			x = cx + Math.cos(rot) * innerRadius;
			y = cy + Math.sin(rot) * innerRadius;
			ctx.lineTo(x, y);
			rot += step;
		}
		ctx.lineTo(cx, cy - outerRadius);
		ctx.closePath();
		ctx.fill();
	}
}
