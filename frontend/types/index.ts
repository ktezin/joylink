export interface Player {
	id: string;
	name: string;
	score?: number;
	color?: string;
}

export interface GameConfig {
	id: string;
	name: string;
	description: string;
	minPlayers: number;
	HostComponent: React.ComponentType<any>;
	ControllerComponent: React.ComponentType<any>;
}
