import { execSync } from "child_process";

function run(cmd) {
  console.log(`🔧 ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}
function log(msg) {
  console.log(`\u001b[1;32m${msg}\u001b[0m`);
}

function main() {
  log("Running EsLint...");
  run("npm run lint");

  log("Running Prettier...");
  run("npm run prettier");

  log("Running Vitest");
  run("npm run test");

  log("Building app-folder scripts");
  run("npm run build:app");

  log("Building main scripts");
  run("npm run build:ts");

  log("Making modules/ for index.d.ts");
  run("npm run build:win")

  log("Building CLI script");
  run("npm run build:cli");
  
  log("✅ Done.");
}
main();
