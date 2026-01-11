import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
	maxHttpBufferSize: 1e3, // 1KB
});

interface Room {
	id: string;
	hostSocketId: string;
	players: string[];
	gameStatus: "waiting" | "playing";
}

const rooms: Record<string, Room> = {};

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("create_room", () => {
		const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

		rooms[roomId] = {
			id: roomId,
			hostSocketId: socket.id,
			players: [],
			gameStatus: "waiting",
		};

		socket.join(roomId);
		socket.emit("room_created", roomId);
		console.log(`Room created: ${roomId} by Host: ${socket.id}`);
	});

	socket.on("join_room", (data: { roomId: string; name: string }) => {
		const { roomId, name } = data;
		const room = rooms[roomId];

		if (room) {
			if (room.players.length >= 2) {
				socket.emit("error", "Oda dolu! (Maksimum 2 Oyuncu)");
				return;
			}

			room.players.push(socket.id);
			socket.join(roomId);

			io.to(room.hostSocketId).emit("player_joined", {
				id: socket.id,
				name: name || `Player ${room.players.length}`,
			});

			const isAdmin = room.players[0] === socket.id;

			socket.emit("joined_success", { roomId, isAdmin });

			console.log(`Player ${name} (${socket.id}) joined room ${roomId}`);
		} else {
			socket.emit("error", "Oda bulunamadı!");
		}
	});

	socket.on(
		"request_start_game",
		(data: { roomId: string; gameId: string }) => {
			const room = rooms[data.roomId];
			if (!room) return;

			if (room.players[0] === socket.id) {
				console.log(`Mobil Admin oyunu başlatıyor: ${data.gameId}`);

				io.to(data.roomId).emit("game_started", { gameId: data.gameId });
			}
		}
	);

	socket.on("start_game", (data: { roomId: string; gameId: string }) => {
		console.log(`Oyun Başlatılıyor: Oda ${data.roomId} -> Oyun ${data.gameId}`);
		io.to(data.roomId).emit("game_started", { gameId: data.gameId });
	});

	socket.on("stop_game", (data: { roomId: string }) => {
		io.to(data.roomId).emit("game_stopped");
	});

	const ALLOWED_KEYS = ["type", "val", "action", "value", "name", "color"];

	const sanitizeInput = (input: any) => {
		const cleanData: any = {};

		ALLOWED_KEYS.forEach((key) => {
			if (input[key] !== undefined) {
				if (typeof input[key] === "string" && input[key].length > 50) {
					cleanData[key] = input[key].substring(0, 50);
				} else {
					cleanData[key] = input[key];
				}
			}
		});

		return cleanData;
	};

	socket.on("input", (data) => {
		const safeData = sanitizeInput(data);

		if (Object.keys(safeData).length === 0) return;

		for (const roomId in rooms) {
			if (rooms[roomId].players.includes(socket.id)) {
				io.to(rooms[roomId].hostSocketId).emit("input", {
					...safeData,
					playerId: socket.id,
				});

				break;
			}
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);

		for (const roomId in rooms) {
			const room = rooms[roomId];

			const playerIndex = room.players.indexOf(socket.id);
			if (playerIndex !== -1) {
				room.players.splice(playerIndex, 1);

				io.to(room.hostSocketId).emit("player_left", { playerId: socket.id });
				
				console.log(`Player ${socket.id} left room ${roomId}`);

				if (playerIndex === 0 && room.players.length > 0) {
					const newAdminSocketId = room.players[0];
					io.to(newAdminSocketId).emit("promoted_to_admin");
				}
				break;
			}

			if (room.hostSocketId === socket.id) {
				io.to(roomId).emit("room_destroyed");

				delete rooms[roomId];
				console.log(`Host left, room ${roomId} deleted`);
				break;
			}
		}
	});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
