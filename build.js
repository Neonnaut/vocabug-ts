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
  const output = `// Auto-generated -- do not edit.\nexport const VOCABUG_VERSION = '${projectVersion}';\n`;
  writeFileSync(resolve('./src/utils/vocabug-version.ts'), output);

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
