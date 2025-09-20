/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import { url } from "valibot";
import { string } from "valibot";
import { pipe } from "valibot";
import { parse } from "valibot";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: parse(pipe(string(), url()), process.env.DATABASE_URL),
  },
});
