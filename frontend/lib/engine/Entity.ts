import { EntityStats, EntityType, Vector2 } from "./types";

export class Entity {
	id: string;
	type: EntityType;
	label: string;
	pos: Vector2;
	vel: Vector2;
	size: Vector2;
	color: string;
	stats: EntityStats;

	isGrounded: boolean = false;

	image?: HTMLImageElement;
	sprites: Record<string, HTMLImageElement> = {};
	facingRight: boolean = true;

	moveInput: { x: number; y: number } = { x: 0, y: 0 };
	axisLock: "none" | "x" | "y" = "none";

	constructor(
		id: string,
		type: EntityType,
		label: string,
		x: number,
		y: number,
		w: number,
		h: number,
		color: string,
		stats?: EntityStats
	) {
		this.id = id;
		this.type = type;
		this.label = label;
		this.pos = { x, y };
		this.vel = { x: 0, y: 0 };
		this.size = { x: w, y: h };
		this.color = color;

		this.stats = stats || {
			speed: 1.5,
			acceleration: 0.5,
			jumpForce: 8,
			mass: 1,
		};

		this.moveInput = { x: 0, y: 0 };
	}

	setStats(newStats: Partial<EntityStats>) {
		this.stats = { ...this.stats, ...newStats };
	}

	loadSprite(name: string, src: string) {
		if (typeof window !== "undefined") {
			const img = new Image();
			img.src = src;
			this.sprites[name] = img;
		}
	}
}
