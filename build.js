import { execSync } from "child_process";

function run(cmd) {
  console.log(`🔧 ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function lint() {
  console.log("Running EsLint...");
  run("npm run lint");
}

function prettier() {
  console.log("Running Prettier...");
  run("npx prettier --write 'src/**/*.{ts,js,json,md}'");
}

function test() {
  console.log("Running Vitest");
  run("npm run test");
}

function app_build() {
  console.log("Building app-folder scripts");
  run("npm run build:app");
}

function main_build() {
  console.log("Building main scripts");
  run("npm run build:ts");
}

function main_build_d_modules() {
  console.log("Making modules/ for index.d.ts");
  run("npm run build:win")
}

function cli_build() {
  console.log("Building CLI script");
  run("npm run build:cli");
}

function main() {
  lint();
  prettier();
  test();

  app_build();

  main_build();
  main_build_d_modules();

  cli_build();
  console.log("✅ Done.");
}
main();
