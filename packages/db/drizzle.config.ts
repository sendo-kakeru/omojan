/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import { parse, pipe, string, url } from "valibot";

export default defineConfig({
	dbCredentials: {
		url: parse(pipe(string(), url()), process.env.DATABASE_URL),
	},
	dialect: "postgresql",
	out: "./drizzle",
	schema: "./src/schema",
});
