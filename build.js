import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

function lint() {
  
  run("npm run lint");
}

function run(cmd) {
  console.log(`🔧 ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}



function combine() {
  

  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const TopComment = `/*! Vocabug, version ${version}*/`;

  const srcDir = "src";
  const files = readdirSync(srcDir)
    .filter(f => f.endsWith(".ts") && f !== "index.ts")
    .map(f => join(srcDir, f));

  const indexPath = join(srcDir, "index.ts");
  const output = [TopComment];

  for (const file of files) {
    const content = readFileSync(file, "utf8")
      .split("\n")
      .filter(line => !line.startsWith("import") && !line.startsWith("export"))
      .join("\n");
    output.push(content);
  }

  const indexContent = readFileSync(indexPath, "utf8")
    .split("\n")
    .filter(line => !line.startsWith("import") && !line.startsWith("export"))
    .join("\n");

  output.push(indexContent);
  output.push("export = main;");

  writeFileSync("index.ts", output.join("\n"));
}

function compile() {
  
  run("npx tsc");
  run("npx tsc -p bin");
}

function minify() {
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const preamble = `#! /usr/bin/env node\n/* Vocabug ${version} */`;

  run(`sed '$d' dist/index.js | npx terser -m reserved='[genWords]' --ecma 2022 --toplevel -c unsafe,unsafe_symbols,top_retain='genWords' -o dist/vocabug.min.js -f wrap_func_args=false`);
  run(`npx terser bin/index.js -mc unsafe --ecma 2022 --toplevel -o bin/vocabug -f wrap_func_args=false,semicolons=false,preamble='${preamble.replace(/\n/g, "\\n")}'`);
}

function main() {
  lint();
  console.log("Linting");

  //run("vitest run");
  //console.log("Finished Testing");

  combine();
  console.log("Files were combined");

  compile();
  console.log("Compilied to JS");

  minify();
  console.log("Minified");

  console.log("✅ Done.");
}

main();
