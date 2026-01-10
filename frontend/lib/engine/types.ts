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
}

export type EntityType = "SOLID" | "TRIGGER" | "PLAYER" | "BOX" | "BALL";

export interface GameState {
	status: "PLAYING" | "WON" | "GAME_OVER";
	level: number;
}
