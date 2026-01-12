import PongGame from "./pong/PongGame";
import PongController from "./pong/PongController";
import ClickGame from "./clickwar/ClickGame";
import ClickController from "./clickwar/ClickwarController";
import { GameConfig } from "@/types";
import FireWaterGame from "./firewater/FireWaterGame";
import FireWaterController from "./firewater/FireWaterController";
import HeadBallGame from "./headball/HeadBallGame";
import HeadBallController from "./headball/HeadBallController";

export const GAMES: Record<string, GameConfig> = {
	pong: {
		id: "pong",
		name: "Retro Pong",
		description:
			"A classic tennis game. Control your racket, don't miss the ball!",
		minPlayers: 1,
		HostComponent: PongGame,
		ControllerComponent: PongController,
	},
	clickwar: {
		id: "clickwar",
		name: "Tug of War",
		description:
			"May the one who trusts their fingers win! A rapid-click battle.",
		minPlayers: 1,
		HostComponent: ClickGame,
		ControllerComponent: ClickController,
	},
	firewater: {
		id: "firewater",
		name: "Fire and Water",
		description: "Classic co-op. Avoid opposing elements and reach the door!",
		minPlayers: 2,
		HostComponent: FireWaterGame,
		ControllerComponent: FireWaterController,
	},
	headball: {
		id: "headball",
		name: "HeadBall",
		description:
			"First one to reach 5 wins! Get closer to take a shot and press the button.",
		minPlayers: 2,
		HostComponent: HeadBallGame,
		ControllerComponent: HeadBallController,
	},
};
