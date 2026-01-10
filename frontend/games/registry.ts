import PongGame from "./pong/PongGame";
import PongController from "./pong/PongController";
import ClickGame from "./clickwar/ClickGame";
import ClickController from "./clickwar/ClickwarController";
import { GameConfig } from "@/types";
import FireWaterGame from "./firewater/FireWaterGame";
import FireWaterController from "./firewater/FireWaterController";

export const GAMES: Record<string, GameConfig> = {
	pong: {
		id: "pong",
		name: "Retro Pong",
		description: "Klasik tenis oyunu. Raketi kontrol et, topu kaçırma!",
		minPlayers: 1,
		HostComponent: PongGame,
		ControllerComponent: PongController,
	},
	clickwar: {
		id: "clickwar",
		name: "Halat Çekme",
		description: "Parmaklarına güvenen kazansın! Seri tıklama savaşı.",
		minPlayers: 1,
		HostComponent: ClickGame,
		ControllerComponent: ClickController,
	},
	firewater: {
		id: "firewater",
		name: "Ateş ve Su",
		description: "Klasik Co-op. Zıt elementlerden kaçın, kapıya ulaşın!",
		minPlayers: 1,
		HostComponent: FireWaterGame,
		ControllerComponent: FireWaterController,
	},
};
