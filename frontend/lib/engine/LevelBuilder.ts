import { Entity } from "./Entity";
import { LegendDefinition } from "./types";

type Legend = Record<string, LegendDefinition>;

export class LevelBuilder {
	static parse(schema: string[], legend: Legend, tileSize: number = 40) {
		const walls: Entity[] = [];
		const hazards: Entity[] = [];
		const doors: Entity[] = [];
		const boxes: Entity[] = [];

		schema.forEach((row, rowIndex) => {
			row.split("").forEach((symbol, colIndex) => {
				const def = legend[symbol];
				if (!def) return;

				const width = tileSize;

				const height = def.height ?? tileSize;

				const x = colIndex * tileSize;

				const y = rowIndex * tileSize + (def.offsetY ?? 0);

				const id = `${def.label}_${colIndex}_${rowIndex}`;

				const entity = new Entity(
					id,
					def.type,
					def.label,
					x,
					y,
					width,
					height,
					def.color
				);

				entity.stats.shape = def.shape || "rectangle";

				if (def.type === "BOX") boxes.push(entity);
				else if (
					def.label.includes("lava") ||
					def.label.includes("water") ||
					def.label.includes("acid")
				)
					hazards.push(entity);
				else if (def.type === "SOLID") walls.push(entity);
				else if (def.label.includes("door")) doors.push(entity);
			});
		});

		return { walls, hazards, doors, boxes };
	}
}
