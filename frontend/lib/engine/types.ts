export interface Vector2 {
	x: number;
	y: number;
}

export interface EngineConfig {
	mode: "platformer" | "topdown";
	gravity: Vector2;
	friction: number;
	worldWidth: number;
	worldHeight: number;
	debug?: boolean;
}

export interface EntityStats {
	speed: number;
	acceleration: number;
	jumpForce: number;
	mass: number;

	originalY?: number;
	pressedY?: number;
	originY?: number;
	targetY?: number;

	[key: string]: any;
}

export type EntityType = "SOLID" | "TRIGGER" | "PLAYER" | "BOX" | "BALL";

export interface GameState {
	status: "PLAYING" | "WON" | "GAME_OVER";
	level: number;
}

export type ParticleShape = "circle" | "square" | "star" | "triangle" | "spark";

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	color: string;
	size: number;
	shape: ParticleShape;
	gravity: number;
	friction: number;
	rotation: number;
	rotationSpeed: number;
	opacity: number;
}
