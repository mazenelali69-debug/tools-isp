const { spawn } = require("child_process");
const path = require("path");

const port = process.env.PORT || "5177";
const host = process.env.HOST || "0.0.0.0";

const viteJs = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");

const args = [viteJs, "--host", host, "--port", String(port), "--strictPort"];

console.log("[pm2-vite] starting:", "node", args.join(" "));

const p = spawn(process.execPath, args, {
  cwd: __dirname,
  stdio: "inherit",
  env: process.env
});

p.on("exit", (code) => process.exit(code ?? 0));
