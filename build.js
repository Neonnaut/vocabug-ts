import { execSync } from "child_process";
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';


function run(cmd) {
  console.log(`🔧 ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}
function log(msg) {
  console.log(`\u001b[1;32m${msg}\u001b[0m`);
}

function main() {
  const pkg = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'));
  const projectVersion = pkg.version;
  const output = `// Auto-generated -- do not edit.\nexport const VERSION = '${projectVersion}';\n`;
  writeFileSync(resolve('./src/utils/version.ts'), output);

  log("Running linter...");
  run("npm run lint");

  log("Running formatter...");
  run("npm run format");

  log("Running tests...");
  run("npm run test");

  log("Building app-folder scripts");
  run("npm run build:app-vocabug");
  run("npm run build:app-nesca");

  log("creating codemirror bundle...")
  run("npm run build:cm6-vocabug")
  run("npm run build:cm6-nesca")

  log("Building main scripts");
  run("npm run build:ts");

  log("Making modules/ for index.d.ts");
  run("npm run build:win")

  log("Building CLI scripts");
  run("npm run build:cli-vocabug");
  run("npm run build:cli-nesca");
  
  log("✅ Done.");
}
main();
