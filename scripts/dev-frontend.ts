import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CSS_ASSET_CACHE, CSS_ASSET_ROUTE } from "./css-assets";
import { parseArgs } from "node:util";
import page from "../index.html";

const { values } = parseArgs({ args: process.argv.slice(2).filter(arg => arg !== "--"), options: { host: { type: "string", default: "127.0.0.1" }, port: { type: "string" }, preview: { type: "boolean", default: false }, strictPort: { type: "boolean" }, base: { type: "string", default: "/" } } });
if (values.host !== "127.0.0.1" && values.host !== "localhost") throw new Error("Frontend must listen on loopback.");
const port = Number(values.port ?? process.env.LOCALWEB_DEV_PORT ?? "0");
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid frontend port");
mkdirSync(CSS_ASSET_CACHE, { recursive: true });
const staticRoot = values.preview ? "dist" : "public";
const base = values.base!.endsWith("/") ? values.base! : `${values.base}/`;
const staticRoutes = existsSync(staticRoot) ? Object.fromEntries([...new Set(["/", base])].flatMap(prefix => readdirSync(staticRoot, { withFileTypes: true }).map(entry => [
  `${prefix}${entry.name}${entry.isDirectory() ? "/*" : ""}`,
  entry.isDirectory() ? { dir: resolve(staticRoot, entry.name) } : Bun.file(join(staticRoot, entry.name)),
]))) : {};
const server = Bun.serve({
  hostname: values.host,
  port,
  development: values.preview ? false : { hmr: true, console: true },
  routes: values.preview ? { ...staticRoutes, [CSS_ASSET_ROUTE]: { dir: CSS_ASSET_CACHE }, "/*": Bun.file("dist/index.html") } : { ...staticRoutes, [CSS_ASSET_ROUTE]: { dir: CSS_ASSET_CACHE }, "/*": page },
});
console.log(`Frontend listening on ${server.url}`);
