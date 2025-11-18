import path from "node:path";
import { defineConfig, env } from "prisma/config";

require("@dotenvx/dotenvx").config();

export default defineConfig({
	migrations: {
		path: path.join("generated", "prisma"),
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
