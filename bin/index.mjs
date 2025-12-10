#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import fs, { statSync, readdirSync } from "fs";
import { strictEqual, notStrictEqual } from "assert";
import stringWidth from "string-width";
import { resolve, dirname, join, relative, extname, basename } from "path";
import { inspect } from "util";
import { fileURLToPath } from "url";
import Parser$1 from "yargs-parser";
import y18n from "y18n";
import { createRequire } from "node:module";
import getCallerFile from "get-caller-file";
import { readdirSync as readdirSync$1, readFileSync } from "node:fs";
import { hideBin } from "yargs/helpers";
const align = {
  right: alignRight,
  center: alignCenter
};
const top = 0;
const right = 1;
const bottom = 2;
const left = 3;
class UI {
  constructor(opts) {
    var _a;
    this.width = opts.width;
    this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
    this.rows = [];
  }
  span(...args) {
    const cols = this.div(...args);
    cols.span = true;
  }
  resetOutput() {
    this.rows = [];
  }
  div(...args) {
    if (args.length === 0) {
      this.div("");
    }
    if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === "string") {
      return this.applyLayoutDSL(args[0]);
    }
    const cols = args.map((arg) => {
      if (typeof arg === "string") {
        return this.colFromString(arg);
      }
      return arg;
    });
    this.rows.push(cols);
    return cols;
  }
  shouldApplyLayoutDSL(...args) {
    return args.length === 1 && typeof args[0] === "string" && /[\t\n]/.test(args[0]);
  }
  applyLayoutDSL(str) {
    const rows = str.split("\n").map((row) => row.split("	"));
    let leftColumnWidth = 0;
    rows.forEach((columns) => {
      if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
        leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
      }
    });
    rows.forEach((columns) => {
      this.div(...columns.map((r, i) => {
        return {
          text: r.trim(),
          padding: this.measurePadding(r),
          width: i === 0 && columns.length > 1 ? leftColumnWidth : void 0
        };
      }));
    });
    return this.rows[this.rows.length - 1];
  }
  colFromString(text) {
    return {
      text,
      padding: this.measurePadding(text)
    };
  }
  measurePadding(str) {
    const noAnsi = mixin.stripAnsi(str);
    return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
  }
  toString() {
    const lines = [];
    this.rows.forEach((row) => {
      this.rowToString(row, lines);
    });
    return lines.filter((line) => !line.hidden).map((line) => line.text).join("\n");
  }
  rowToString(row, lines) {
    this.rasterize(row).forEach((rrow, r) => {
      let str = "";
      rrow.forEach((col, c) => {
        const { width } = row[c];
        const wrapWidth = this.negatePadding(row[c]);
        let ts = col;
        if (wrapWidth > mixin.stringWidth(col)) {
          ts += " ".repeat(wrapWidth - mixin.stringWidth(col));
        }
        if (row[c].align && row[c].align !== "left" && this.wrap) {
          const fn = align[row[c].align];
          ts = fn(ts, wrapWidth);
          if (mixin.stringWidth(ts) < wrapWidth) {
            ts += " ".repeat((width || 0) - mixin.stringWidth(ts) - 1);
          }
        }
        const padding = row[c].padding || [0, 0, 0, 0];
        if (padding[left]) {
          str += " ".repeat(padding[left]);
        }
        str += addBorder(row[c], ts, "| ");
        str += ts;
        str += addBorder(row[c], ts, " |");
        if (padding[right]) {
          str += " ".repeat(padding[right]);
        }
        if (r === 0 && lines.length > 0) {
          str = this.renderInline(str, lines[lines.length - 1]);
        }
      });
      lines.push({
        text: str.replace(/ +$/, ""),
        span: row.span
      });
    });
    return lines;
  }
  // if the full 'source' can render in
  // the target line, do so.
  renderInline(source, previousLine) {
    const match = source.match(/^ */);
    const leadingWhitespace = match ? match[0].length : 0;
    const target = previousLine.text;
    const targetTextWidth = mixin.stringWidth(target.trimRight());
    if (!previousLine.span) {
      return source;
    }
    if (!this.wrap) {
      previousLine.hidden = true;
      return target + source;
    }
    if (leadingWhitespace < targetTextWidth) {
      return source;
    }
    previousLine.hidden = true;
    return target.trimRight() + " ".repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
  }
  rasterize(row) {
    const rrows = [];
    const widths = this.columnWidths(row);
    let wrapped;
    row.forEach((col, c) => {
      col.width = widths[c];
      if (this.wrap) {
        wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split("\n");
      } else {
        wrapped = col.text.split("\n");
      }
      if (col.border) {
        wrapped.unshift("." + "-".repeat(this.negatePadding(col) + 2) + ".");
        wrapped.push("'" + "-".repeat(this.negatePadding(col) + 2) + "'");
      }
      if (col.padding) {
        wrapped.unshift(...new Array(col.padding[top] || 0).fill(""));
        wrapped.push(...new Array(col.padding[bottom] || 0).fill(""));
      }
      wrapped.forEach((str, r) => {
        if (!rrows[r]) {
          rrows.push([]);
        }
        const rrow = rrows[r];
        for (let i = 0; i < c; i++) {
          if (rrow[i] === void 0) {
            rrow.push("");
          }
        }
        rrow.push(str);
      });
    });
    return rrows;
  }
  negatePadding(col) {
    let wrapWidth = col.width || 0;
    if (col.padding) {
      wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
    }
    if (col.border) {
      wrapWidth -= 4;
    }
    return wrapWidth;
  }
  columnWidths(row) {
    if (!this.wrap) {
      return row.map((col) => {
        return col.width || mixin.stringWidth(col.text);
      });
    }
    let unset = row.length;
    let remainingWidth = this.width;
    const widths = row.map((col) => {
      if (col.width) {
        unset--;
        remainingWidth -= col.width;
        return col.width;
      }
      return void 0;
    });
    const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
    return widths.map((w, i) => {
      if (w === void 0) {
        return Math.max(unsetWidth, _minWidth(row[i]));
      }
      return w;
    });
  }
}
function addBorder(col, ts, style) {
  if (col.border) {
    if (/[.']-+[.']/.test(ts)) {
      return "";
    }
    if (ts.trim().length !== 0) {
      return style;
    }
    return "  ";
  }
  return "";
}
function _minWidth(col) {
  const padding = col.padding || [];
  const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
  if (col.border) {
    return minWidth + 4;
  }
  return minWidth;
}
function getWindowWidth() {
  if (typeof process === "object" && process.stdout && process.stdout.columns) {
    return process.stdout.columns;
  }
  return 80;
}
function alignRight(str, width) {
  str = str.trim();
  const strWidth = mixin.stringWidth(str);
  if (strWidth < width) {
    return " ".repeat(width - strWidth) + str;
  }
  return str;
}
function alignCenter(str, width) {
  str = str.trim();
  const strWidth = mixin.stringWidth(str);
  if (strWidth >= width) {
    return str;
  }
  return " ".repeat(width - strWidth >> 1) + str;
}
let mixin;
function cliui(opts, _mixin) {
  mixin = _mixin;
  return new UI({
    width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
    wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
  });
}
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi}`;
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}
const ANSI_BACKGROUND_OFFSET = 10;
const wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
const wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
const styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
Object.keys(styles.modifier);
const foregroundColorNames = Object.keys(styles.color);
const backgroundColorNames = Object.keys(styles.bgColor);
[...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
const ansiStyles = assembleStyles();
const ESCAPES = /* @__PURE__ */ new Set([
  "\x1B",
  ""
]);
const END_CODE = 39;
const ANSI_ESCAPE_BELL = "\x07";
const ANSI_CSI = "[";
const ANSI_OSC = "]";
const ANSI_SGR_TERMINATOR = "m";
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
const wrapAnsiCode = (code) => `${ESCAPES.values().next().value}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = (url) => `${ESCAPES.values().next().value}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
const wordLengths = (string) => string.split(" ").map((character) => stringWidth(character));
const wrapWord = (rows, word, columns) => {
  const characters = [...word];
  let isInsideEscape = false;
  let isInsideLinkEscape = false;
  let visible = stringWidth(stripAnsi(rows.at(-1)));
  for (const [index, character] of characters.entries()) {
    const characterLength = stringWidth(character);
    if (visible + characterLength <= columns) {
      rows[rows.length - 1] += character;
    } else {
      rows.push(character);
      visible = 0;
    }
    if (ESCAPES.has(character)) {
      isInsideEscape = true;
      const ansiEscapeLinkCandidate = characters.slice(index + 1, index + 1 + ANSI_ESCAPE_LINK.length).join("");
      isInsideLinkEscape = ansiEscapeLinkCandidate === ANSI_ESCAPE_LINK;
    }
    if (isInsideEscape) {
      if (isInsideLinkEscape) {
        if (character === ANSI_ESCAPE_BELL) {
          isInsideEscape = false;
          isInsideLinkEscape = false;
        }
      } else if (character === ANSI_SGR_TERMINATOR) {
        isInsideEscape = false;
      }
      continue;
    }
    visible += characterLength;
    if (visible === columns && index < characters.length - 1) {
      rows.push("");
      visible = 0;
    }
  }
  if (!visible && rows.at(-1).length > 0 && rows.length > 1) {
    rows[rows.length - 2] += rows.pop();
  }
};
const stringVisibleTrimSpacesRight = (string) => {
  const words = string.split(" ");
  let last = words.length;
  while (last > 0) {
    if (stringWidth(words[last - 1]) > 0) {
      break;
    }
    last--;
  }
  if (last === words.length) {
    return string;
  }
  return words.slice(0, last).join(" ") + words.slice(last).join("");
};
const exec = (string, columns, options = {}) => {
  if (options.trim !== false && string.trim() === "") {
    return "";
  }
  let returnValue = "";
  let escapeCode;
  let escapeUrl;
  const lengths = wordLengths(string);
  let rows = [""];
  for (const [index, word] of string.split(" ").entries()) {
    if (options.trim !== false) {
      rows[rows.length - 1] = rows.at(-1).trimStart();
    }
    let rowLength = stringWidth(rows.at(-1));
    if (index !== 0) {
      if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
        rows.push("");
        rowLength = 0;
      }
      if (rowLength > 0 || options.trim === false) {
        rows[rows.length - 1] += " ";
        rowLength++;
      }
    }
    if (options.hard && lengths[index] > columns) {
      const remainingColumns = columns - rowLength;
      const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
      const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
      if (breaksStartingNextLine < breaksStartingThisLine) {
        rows.push("");
      }
      wrapWord(rows, word, columns);
      continue;
    }
    if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
      if (options.wordWrap === false && rowLength < columns) {
        wrapWord(rows, word, columns);
        continue;
      }
      rows.push("");
    }
    if (rowLength + lengths[index] > columns && options.wordWrap === false) {
      wrapWord(rows, word, columns);
      continue;
    }
    rows[rows.length - 1] += word;
  }
  if (options.trim !== false) {
    rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
  }
  const preString = rows.join("\n");
  const pre = [...preString];
  let preStringIndex = 0;
  for (const [index, character] of pre.entries()) {
    returnValue += character;
    if (ESCAPES.has(character)) {
      const { groups } = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`).exec(preString.slice(preStringIndex)) || { groups: {} };
      if (groups.code !== void 0) {
        const code2 = Number.parseFloat(groups.code);
        escapeCode = code2 === END_CODE ? void 0 : code2;
      } else if (groups.uri !== void 0) {
        escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
      }
    }
    const code = ansiStyles.codes.get(Number(escapeCode));
    if (pre[index + 1] === "\n") {
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink("");
      }
      if (escapeCode && code) {
        returnValue += wrapAnsiCode(code);
      }
    } else if (character === "\n") {
      if (escapeCode && code) {
        returnValue += wrapAnsiCode(escapeCode);
      }
      if (escapeUrl) {
        returnValue += wrapAnsiHyperlink(escapeUrl);
      }
    }
    preStringIndex += character.length;
  }
  return returnValue;
};
function wrapAnsi(string, columns, options) {
  return String(string).normalize().replaceAll("\r\n", "\n").split("\n").map((line) => exec(line, columns, options)).join("\n");
}
function ui(opts) {
  return cliui(opts, {
    stringWidth,
    stripAnsi,
    wrap: wrapAnsi
  });
}
function escalade(start, callback) {
  let dir = resolve(".", start);
  let tmp, stats = statSync(dir);
  if (!stats.isDirectory()) {
    dir = dirname(dir);
  }
  while (true) {
    tmp = callback(dir, readdirSync(dir));
    if (tmp) return resolve(dir, tmp);
    dir = dirname(tmp = dir);
    if (tmp === dir) break;
  }
}
function getProcessArgvBinIndex() {
  if (isBundledElectronApp())
    return 0;
  return 1;
}
function isBundledElectronApp() {
  return isElectronApp() && !process.defaultApp;
}
function isElectronApp() {
  return !!process.versions.electron;
}
function getProcessArgvBin() {
  return process.argv[getProcessArgvBinIndex()];
}
const __dirname = fileURLToPath(import.meta.url);
const mainFilename = __dirname.substring(0, __dirname.lastIndexOf("node_modules"));
const require2 = createRequire(import.meta.url);
const esmPlatformShim = {
  assert: {
    notStrictEqual,
    strictEqual
  },
  cliui: ui,
  findUp: escalade,
  getEnv: (key) => {
    return process.env[key];
  },
  inspect,
  getProcessArgvBin,
  mainFilename: mainFilename || process.cwd(),
  Parser: Parser$1,
  path: {
    basename,
    dirname,
    extname,
    relative,
    resolve,
    join
  },
  process: {
    argv: () => process.argv,
    cwd: process.cwd,
    emitWarning: (warning, type) => process.emitWarning(warning, type),
    execPath: () => process.execPath,
    exit: (code) => {
      process.exit(code);
    },
    nextTick: process.nextTick,
    stdColumns: typeof process.stdout.columns !== "undefined" ? process.stdout.columns : null
  },
  readFileSync,
  readdirSync: readdirSync$1,
  require: require2,
  getCallerFile: () => {
    const callerFile = getCallerFile(3);
    return callerFile.match(/^file:\/\//) ? fileURLToPath(callerFile) : callerFile;
  },
  stringWidth,
  y18n: y18n({
    directory: resolve(__dirname, "../../../locales"),
    updateFiles: false
  })
};
function assertNotStrictEqual(actual, expected, shim2, message) {
  shim2.assert.notStrictEqual(actual, expected, message);
}
function assertSingleKey(actual, shim2) {
  shim2.assert.strictEqual(typeof actual, "string");
}
function objectKeys(object) {
  return Object.keys(object);
}
function isPromise(maybePromise) {
  return !!maybePromise && !!maybePromise.then && typeof maybePromise.then === "function";
}
class YError extends Error {
  constructor(msg) {
    super(msg || "yargs error");
    this.name = "YError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YError);
    }
  }
}
function parseCommand(cmd) {
  const extraSpacesStrippedCommand = cmd.replace(/\s{2,}/g, " ");
  const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
  const bregex = /\.*[\][<>]/g;
  const firstCommand = splitCommand.shift();
  if (!firstCommand)
    throw new Error(`No command found in: ${cmd}`);
  const parsedCommand = {
    cmd: firstCommand.replace(bregex, ""),
    demanded: [],
    optional: []
  };
  splitCommand.forEach((cmd2, i) => {
    let variadic = false;
    cmd2 = cmd2.replace(/\s/g, "");
    if (/\.+[\]>]/.test(cmd2) && i === splitCommand.length - 1)
      variadic = true;
    if (/^\[/.test(cmd2)) {
      parsedCommand.optional.push({
        cmd: cmd2.replace(bregex, "").split("|"),
        variadic
      });
    } else {
      parsedCommand.demanded.push({
        cmd: cmd2.replace(bregex, "").split("|"),
        variadic
      });
    }
  });
  return parsedCommand;
}
const positionName = ["first", "second", "third", "fourth", "fifth", "sixth"];
function argsert(arg1, arg2, arg3) {
  function parseArgs() {
    return typeof arg1 === "object" ? [{ demanded: [], optional: [] }, arg1, arg2] : [
      parseCommand(`cmd ${arg1}`),
      arg2,
      arg3
    ];
  }
  try {
    let position = 0;
    const [parsed, callerArguments, _length] = parseArgs();
    const args = [].slice.call(callerArguments);
    while (args.length && args[args.length - 1] === void 0)
      args.pop();
    const length = _length || args.length;
    if (length < parsed.demanded.length) {
      throw new YError(`Not enough arguments provided. Expected ${parsed.demanded.length} but received ${args.length}.`);
    }
    const totalCommands = parsed.demanded.length + parsed.optional.length;
    if (length > totalCommands) {
      throw new YError(`Too many arguments provided. Expected max ${totalCommands} but received ${length}.`);
    }
    parsed.demanded.forEach((demanded) => {
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = demanded.cmd.filter((type) => type === observedType || type === "*");
      if (matchingTypes.length === 0)
        argumentTypeError(observedType, demanded.cmd, position);
      position += 1;
    });
    parsed.optional.forEach((optional) => {
      if (args.length === 0)
        return;
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = optional.cmd.filter((type) => type === observedType || type === "*");
      if (matchingTypes.length === 0)
        argumentTypeError(observedType, optional.cmd, position);
      position += 1;
    });
  } catch (err) {
    console.warn(err.stack);
  }
}
function guessType(arg) {
  if (Array.isArray(arg)) {
    return "array";
  } else if (arg === null) {
    return "null";
  }
  return typeof arg;
}
function argumentTypeError(observedType, allowedTypes, position) {
  throw new YError(`Invalid ${positionName[position] || "manyith"} argument. Expected ${allowedTypes.join(" or ")} but received ${observedType}.`);
}
class GlobalMiddleware {
  constructor(yargs) {
    this.globalMiddleware = [];
    this.frozens = [];
    this.yargs = yargs;
  }
  addMiddleware(callback, applyBeforeValidation, global = true, mutates = false) {
    argsert("<array|function> [boolean] [boolean] [boolean]", [callback, applyBeforeValidation, global], arguments.length);
    if (Array.isArray(callback)) {
      for (let i = 0; i < callback.length; i++) {
        if (typeof callback[i] !== "function") {
          throw Error("middleware must be a function");
        }
        const m = callback[i];
        m.applyBeforeValidation = applyBeforeValidation;
        m.global = global;
      }
      Array.prototype.push.apply(this.globalMiddleware, callback);
    } else if (typeof callback === "function") {
      const m = callback;
      m.applyBeforeValidation = applyBeforeValidation;
      m.global = global;
      m.mutates = mutates;
      this.globalMiddleware.push(callback);
    }
    return this.yargs;
  }
  addCoerceMiddleware(callback, option) {
    const aliases = this.yargs.getAliases();
    this.globalMiddleware = this.globalMiddleware.filter((m) => {
      const toCheck = [...aliases[option] || [], option];
      if (!m.option)
        return true;
      else
        return !toCheck.includes(m.option);
    });
    callback.option = option;
    return this.addMiddleware(callback, true, true, true);
  }
  getMiddleware() {
    return this.globalMiddleware;
  }
  freeze() {
    this.frozens.push([...this.globalMiddleware]);
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    if (frozen !== void 0)
      this.globalMiddleware = frozen;
  }
  reset() {
    this.globalMiddleware = this.globalMiddleware.filter((m) => m.global);
  }
}
function commandMiddlewareFactory(commandMiddleware) {
  if (!commandMiddleware)
    return [];
  return commandMiddleware.map((middleware) => {
    middleware.applyBeforeValidation = false;
    return middleware;
  });
}
function applyMiddleware(argv2, yargs, middlewares, beforeValidation) {
  return middlewares.reduce((acc, middleware) => {
    if (middleware.applyBeforeValidation !== beforeValidation) {
      return acc;
    }
    if (middleware.mutates) {
      if (middleware.applied)
        return acc;
      middleware.applied = true;
    }
    if (isPromise(acc)) {
      return acc.then((initialObj) => Promise.all([initialObj, middleware(initialObj, yargs)])).then(([initialObj, middlewareObj]) => Object.assign(initialObj, middlewareObj));
    } else {
      const result = middleware(acc, yargs);
      return isPromise(result) ? result.then((middlewareObj) => Object.assign(acc, middlewareObj)) : Object.assign(acc, result);
    }
  }, argv2);
}
function maybeAsyncResult(getResult, resultHandler, errorHandler = (err) => {
  throw err;
}) {
  try {
    const result = isFunction(getResult) ? getResult() : getResult;
    return isPromise(result) ? result.then((result2) => resultHandler(result2)) : resultHandler(result);
  } catch (err) {
    return errorHandler(err);
  }
}
function isFunction(arg) {
  return typeof arg === "function";
}
const DEFAULT_MARKER = /(^\*)|(^\$0)/;
class CommandInstance {
  constructor(usage2, validation2, globalMiddleware, shim2) {
    this.requireCache = /* @__PURE__ */ new Set();
    this.handlers = {};
    this.aliasMap = {};
    this.frozens = [];
    this.shim = shim2;
    this.usage = usage2;
    this.globalMiddleware = globalMiddleware;
    this.validation = validation2;
  }
  addDirectory(dir, req, callerFile, opts) {
    opts = opts || {};
    this.requireCache.add(callerFile);
    const fullDirPath = this.shim.path.resolve(this.shim.path.dirname(callerFile), dir);
    const files = this.shim.readdirSync(fullDirPath, {
      recursive: opts.recurse ? true : false
    });
    if (!Array.isArray(opts.extensions))
      opts.extensions = ["js"];
    const visit = typeof opts.visit === "function" ? opts.visit : (o) => o;
    for (const fileb of files) {
      const file = fileb.toString();
      if (opts.exclude) {
        let exclude = false;
        if (typeof opts.exclude === "function") {
          exclude = opts.exclude(file);
        } else {
          exclude = opts.exclude.test(file);
        }
        if (exclude)
          continue;
      }
      if (opts.include) {
        let include = false;
        if (typeof opts.include === "function") {
          include = opts.include(file);
        } else {
          include = opts.include.test(file);
        }
        if (!include)
          continue;
      }
      let supportedExtension = false;
      for (const ext of opts.extensions) {
        if (file.endsWith(ext))
          supportedExtension = true;
      }
      if (supportedExtension) {
        const joined = this.shim.path.join(fullDirPath, file);
        const module = req(joined);
        const extendableModule = Object.create(null, Object.getOwnPropertyDescriptors({ ...module }));
        const visited = visit(extendableModule, joined, file);
        if (visited) {
          if (this.requireCache.has(joined))
            continue;
          else
            this.requireCache.add(joined);
          if (!extendableModule.command) {
            extendableModule.command = this.shim.path.basename(joined, this.shim.path.extname(joined));
          }
          this.addHandler(extendableModule);
        }
      }
    }
  }
  addHandler(cmd, description, builder, handler, commandMiddleware, deprecated) {
    let aliases = [];
    const middlewares = commandMiddlewareFactory(commandMiddleware);
    handler = handler || (() => {
    });
    if (Array.isArray(cmd)) {
      if (isCommandAndAliases(cmd)) {
        [cmd, ...aliases] = cmd;
      } else {
        for (const command2 of cmd) {
          this.addHandler(command2);
        }
      }
    } else if (isCommandHandlerDefinition(cmd)) {
      let command2 = Array.isArray(cmd.command) || typeof cmd.command === "string" ? cmd.command : null;
      if (command2 === null) {
        throw new Error(`No command name given for module: ${this.shim.inspect(cmd)}`);
      }
      if (cmd.aliases)
        command2 = [].concat(command2).concat(cmd.aliases);
      this.addHandler(command2, this.extractDesc(cmd), cmd.builder, cmd.handler, cmd.middlewares, cmd.deprecated);
      return;
    } else if (isCommandBuilderDefinition(builder)) {
      this.addHandler([cmd].concat(aliases), description, builder.builder, builder.handler, builder.middlewares, builder.deprecated);
      return;
    }
    if (typeof cmd === "string") {
      const parsedCommand = parseCommand(cmd);
      aliases = aliases.map((alias) => parseCommand(alias).cmd);
      let isDefault = false;
      const parsedAliases = [parsedCommand.cmd].concat(aliases).filter((c) => {
        if (DEFAULT_MARKER.test(c)) {
          isDefault = true;
          return false;
        }
        return true;
      });
      if (parsedAliases.length === 0 && isDefault)
        parsedAliases.push("$0");
      if (isDefault) {
        parsedCommand.cmd = parsedAliases[0];
        aliases = parsedAliases.slice(1);
        cmd = cmd.replace(DEFAULT_MARKER, parsedCommand.cmd);
      }
      aliases.forEach((alias) => {
        this.aliasMap[alias] = parsedCommand.cmd;
      });
      if (description !== false) {
        this.usage.command(cmd, description, isDefault, aliases, deprecated);
      }
      this.handlers[parsedCommand.cmd] = {
        original: cmd,
        description,
        handler,
        builder: builder || {},
        middlewares,
        deprecated,
        demanded: parsedCommand.demanded,
        optional: parsedCommand.optional
      };
      if (isDefault)
        this.defaultCommand = this.handlers[parsedCommand.cmd];
    }
  }
  getCommandHandlers() {
    return this.handlers;
  }
  getCommands() {
    return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
  }
  hasDefaultCommand() {
    return !!this.defaultCommand;
  }
  runCommand(command2, yargs, parsed, commandIndex, helpOnly, helpOrVersionSet) {
    const commandHandler = this.handlers[command2] || this.handlers[this.aliasMap[command2]] || this.defaultCommand;
    const currentContext = yargs.getInternalMethods().getContext();
    const parentCommands = currentContext.commands.slice();
    const isDefaultCommand = !command2;
    if (command2) {
      currentContext.commands.push(command2);
      currentContext.fullCommands.push(commandHandler.original);
    }
    const builderResult = this.applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, parsed.aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet);
    return isPromise(builderResult) ? builderResult.then((result) => this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, result.innerArgv, currentContext, helpOnly, result.aliases, yargs)) : this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, builderResult.innerArgv, currentContext, helpOnly, builderResult.aliases, yargs);
  }
  applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet) {
    const builder = commandHandler.builder;
    let innerYargs = yargs;
    if (isCommandBuilderCallback(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      const builderOutput = builder(yargs.getInternalMethods().reset(aliases), helpOrVersionSet);
      if (isPromise(builderOutput)) {
        return builderOutput.then((output) => {
          innerYargs = isYargsInstance(output) ? output : yargs;
          return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
        });
      }
    } else if (isCommandBuilderOptionDefinitions(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      innerYargs = yargs.getInternalMethods().reset(aliases);
      Object.keys(commandHandler.builder).forEach((key) => {
        innerYargs.option(key, builder[key]);
      });
    }
    return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
  }
  parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly) {
    if (isDefaultCommand)
      innerYargs.getInternalMethods().getUsageInstance().unfreeze(true);
    if (this.shouldUpdateUsage(innerYargs)) {
      innerYargs.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(parentCommands, commandHandler), commandHandler.description);
    }
    const innerArgv = innerYargs.getInternalMethods().runYargsParserAndExecuteCommands(null, void 0, true, commandIndex, helpOnly);
    return isPromise(innerArgv) ? innerArgv.then((argv2) => ({
      aliases: innerYargs.parsed.aliases,
      innerArgv: argv2
    })) : {
      aliases: innerYargs.parsed.aliases,
      innerArgv
    };
  }
  shouldUpdateUsage(yargs) {
    return !yargs.getInternalMethods().getUsageInstance().getUsageDisabled() && yargs.getInternalMethods().getUsageInstance().getUsage().length === 0;
  }
  usageFromParentCommandsCommandHandler(parentCommands, commandHandler) {
    const c = DEFAULT_MARKER.test(commandHandler.original) ? commandHandler.original.replace(DEFAULT_MARKER, "").trim() : commandHandler.original;
    const pc = parentCommands.filter((c2) => {
      return !DEFAULT_MARKER.test(c2);
    });
    pc.push(c);
    return `$0 ${pc.join(" ")}`;
  }
  handleValidationAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, aliases, yargs, middlewares, positionalMap) {
    if (!yargs.getInternalMethods().getHasOutput()) {
      const validation2 = yargs.getInternalMethods().runValidation(aliases, positionalMap, yargs.parsed.error, isDefaultCommand);
      innerArgv = maybeAsyncResult(innerArgv, (result) => {
        validation2(result);
        return result;
      });
    }
    if (commandHandler.handler && !yargs.getInternalMethods().getHasOutput()) {
      yargs.getInternalMethods().setHasOutput();
      const populateDoubleDash = !!yargs.getOptions().configuration["populate--"];
      yargs.getInternalMethods().postProcess(innerArgv, populateDoubleDash, false, false);
      innerArgv = applyMiddleware(innerArgv, yargs, middlewares, false);
      innerArgv = maybeAsyncResult(innerArgv, (result) => {
        const handlerResult = commandHandler.handler(result);
        return isPromise(handlerResult) ? handlerResult.then(() => result) : result;
      });
      if (!isDefaultCommand) {
        yargs.getInternalMethods().getUsageInstance().cacheHelpMessage();
      }
      if (isPromise(innerArgv) && !yargs.getInternalMethods().hasParseCallback()) {
        innerArgv.catch((error) => {
          try {
            yargs.getInternalMethods().getUsageInstance().fail(null, error);
          } catch (_err) {
          }
        });
      }
    }
    if (!isDefaultCommand) {
      currentContext.commands.pop();
      currentContext.fullCommands.pop();
    }
    return innerArgv;
  }
  applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, helpOnly, aliases, yargs) {
    let positionalMap = {};
    if (helpOnly)
      return innerArgv;
    if (!yargs.getInternalMethods().getHasOutput()) {
      positionalMap = this.populatePositionals(commandHandler, innerArgv, currentContext, yargs);
    }
    const middlewares = this.globalMiddleware.getMiddleware().slice(0).concat(commandHandler.middlewares);
    const maybePromiseArgv = applyMiddleware(innerArgv, yargs, middlewares, true);
    return isPromise(maybePromiseArgv) ? maybePromiseArgv.then((resolvedInnerArgv) => this.handleValidationAndGetResult(isDefaultCommand, commandHandler, resolvedInnerArgv, currentContext, aliases, yargs, middlewares, positionalMap)) : this.handleValidationAndGetResult(isDefaultCommand, commandHandler, maybePromiseArgv, currentContext, aliases, yargs, middlewares, positionalMap);
  }
  populatePositionals(commandHandler, argv2, context, yargs) {
    argv2._ = argv2._.slice(context.commands.length);
    const demanded = commandHandler.demanded.slice(0);
    const optional = commandHandler.optional.slice(0);
    const positionalMap = {};
    this.validation.positionalCount(demanded.length, argv2._.length);
    while (demanded.length) {
      const demand = demanded.shift();
      this.populatePositional(demand, argv2, positionalMap);
    }
    while (optional.length) {
      const maybe = optional.shift();
      this.populatePositional(maybe, argv2, positionalMap);
    }
    argv2._ = context.commands.concat(argv2._.map((a) => "" + a));
    this.postProcessPositionals(argv2, positionalMap, this.cmdToParseOptions(commandHandler.original), yargs);
    return positionalMap;
  }
  populatePositional(positional, argv2, positionalMap) {
    const cmd = positional.cmd[0];
    if (positional.variadic) {
      positionalMap[cmd] = argv2._.splice(0).map(String);
    } else {
      if (argv2._.length)
        positionalMap[cmd] = [String(argv2._.shift())];
    }
  }
  cmdToParseOptions(cmdString) {
    const parseOptions = {
      array: [],
      default: {},
      alias: {},
      demand: {}
    };
    const parsed = parseCommand(cmdString);
    parsed.demanded.forEach((d) => {
      const [cmd, ...aliases] = d.cmd;
      if (d.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
      parseOptions.demand[cmd] = true;
    });
    parsed.optional.forEach((o) => {
      const [cmd, ...aliases] = o.cmd;
      if (o.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
    });
    return parseOptions;
  }
  postProcessPositionals(argv2, positionalMap, parseOptions, yargs) {
    const options = Object.assign({}, yargs.getOptions());
    options.default = Object.assign(parseOptions.default, options.default);
    for (const key of Object.keys(parseOptions.alias)) {
      options.alias[key] = (options.alias[key] || []).concat(parseOptions.alias[key]);
    }
    options.array = options.array.concat(parseOptions.array);
    options.config = {};
    const unparsed = [];
    Object.keys(positionalMap).forEach((key) => {
      positionalMap[key].map((value) => {
        if (options.configuration["unknown-options-as-args"])
          options.key[key] = true;
        unparsed.push(`--${key}`);
        unparsed.push(value);
      });
    });
    if (!unparsed.length)
      return;
    const config = Object.assign({}, options.configuration, {
      "populate--": false
    });
    const parsed = this.shim.Parser.detailed(unparsed, Object.assign({}, options, {
      configuration: config
    }));
    if (parsed.error) {
      yargs.getInternalMethods().getUsageInstance().fail(parsed.error.message, parsed.error);
    } else {
      const positionalKeys = Object.keys(positionalMap);
      Object.keys(positionalMap).forEach((key) => {
        positionalKeys.push(...parsed.aliases[key]);
      });
      Object.keys(parsed.argv).forEach((key) => {
        if (positionalKeys.includes(key)) {
          if (!positionalMap[key])
            positionalMap[key] = parsed.argv[key];
          if (!this.isInConfigs(yargs, key) && !this.isDefaulted(yargs, key) && Object.prototype.hasOwnProperty.call(argv2, key) && Object.prototype.hasOwnProperty.call(parsed.argv, key) && (Array.isArray(argv2[key]) || Array.isArray(parsed.argv[key]))) {
            argv2[key] = [].concat(argv2[key], parsed.argv[key]);
          } else {
            argv2[key] = parsed.argv[key];
          }
        }
      });
    }
  }
  isDefaulted(yargs, key) {
    const { default: defaults } = yargs.getOptions();
    return Object.prototype.hasOwnProperty.call(defaults, key) || Object.prototype.hasOwnProperty.call(defaults, this.shim.Parser.camelCase(key));
  }
  isInConfigs(yargs, key) {
    const { configObjects } = yargs.getOptions();
    return configObjects.some((c) => Object.prototype.hasOwnProperty.call(c, key)) || configObjects.some((c) => Object.prototype.hasOwnProperty.call(c, this.shim.Parser.camelCase(key)));
  }
  runDefaultBuilderOn(yargs) {
    if (!this.defaultCommand)
      return;
    if (this.shouldUpdateUsage(yargs)) {
      const commandString = DEFAULT_MARKER.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, "$0 ");
      yargs.getInternalMethods().getUsageInstance().usage(commandString, this.defaultCommand.description);
    }
    const builder = this.defaultCommand.builder;
    if (isCommandBuilderCallback(builder)) {
      return builder(yargs, true);
    } else if (!isCommandBuilderDefinition(builder)) {
      Object.keys(builder).forEach((key) => {
        yargs.option(key, builder[key]);
      });
    }
    return void 0;
  }
  extractDesc({ describe, description, desc }) {
    for (const test of [describe, description, desc]) {
      if (typeof test === "string" || test === false)
        return test;
      assertNotStrictEqual(test, true, this.shim);
    }
    return false;
  }
  freeze() {
    this.frozens.push({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    });
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    assertNotStrictEqual(frozen, void 0, this.shim);
    ({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    } = frozen);
  }
  reset() {
    this.handlers = {};
    this.aliasMap = {};
    this.defaultCommand = void 0;
    this.requireCache = /* @__PURE__ */ new Set();
    return this;
  }
}
function command(usage2, validation2, globalMiddleware, shim2) {
  return new CommandInstance(usage2, validation2, globalMiddleware, shim2);
}
function isCommandBuilderDefinition(builder) {
  return typeof builder === "object" && !!builder.builder && typeof builder.handler === "function";
}
function isCommandAndAliases(cmd) {
  return cmd.every((c) => typeof c === "string");
}
function isCommandBuilderCallback(builder) {
  return typeof builder === "function";
}
function isCommandBuilderOptionDefinitions(builder) {
  return typeof builder === "object";
}
function isCommandHandlerDefinition(cmd) {
  return typeof cmd === "object" && !Array.isArray(cmd);
}
function objFilter(original = {}, filter = () => true) {
  const obj = {};
  objectKeys(original).forEach((key) => {
    if (filter(key, original[key])) {
      obj[key] = original[key];
    }
  });
  return obj;
}
function setBlocking(blocking) {
  if (typeof process === "undefined")
    return;
  [process.stdout, process.stderr].forEach((_stream) => {
    const stream = _stream;
    if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === "function") {
      stream._handle.setBlocking(blocking);
    }
  });
}
function isBoolean(fail) {
  return typeof fail === "boolean";
}
function usage(yargs, shim2) {
  const __ = shim2.y18n.__;
  const self = {};
  const fails = [];
  self.failFn = function failFn(f) {
    fails.push(f);
  };
  let failMessage = null;
  let globalFailMessage = null;
  let showHelpOnFail = true;
  self.showHelpOnFail = function showHelpOnFailFn(arg1 = true, arg2) {
    const [enabled, message] = typeof arg1 === "string" ? [true, arg1] : [arg1, arg2];
    if (yargs.getInternalMethods().isGlobalContext()) {
      globalFailMessage = message;
    }
    failMessage = message;
    showHelpOnFail = enabled;
    return self;
  };
  let failureOutput = false;
  self.fail = function fail(msg, err) {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (fails.length) {
      for (let i = fails.length - 1; i >= 0; --i) {
        const fail2 = fails[i];
        if (isBoolean(fail2)) {
          if (err)
            throw err;
          else if (msg)
            throw Error(msg);
        } else {
          fail2(msg, err, self);
        }
      }
    } else {
      if (yargs.getExitProcess())
        setBlocking(true);
      if (!failureOutput) {
        failureOutput = true;
        if (showHelpOnFail) {
          yargs.showHelp("error");
          logger.error();
        }
        if (msg || err)
          logger.error(msg || err);
        const globalOrCommandFailMessage = failMessage || globalFailMessage;
        if (globalOrCommandFailMessage) {
          if (msg || err)
            logger.error("");
          logger.error(globalOrCommandFailMessage);
        }
      }
      err = err || new YError(msg);
      if (yargs.getExitProcess()) {
        return yargs.exit(1);
      } else if (yargs.getInternalMethods().hasParseCallback()) {
        return yargs.exit(1, err);
      } else {
        throw err;
      }
    }
  };
  let usages = [];
  let usageDisabled = false;
  self.usage = (msg, description) => {
    if (msg === null) {
      usageDisabled = true;
      usages = [];
      return self;
    }
    usageDisabled = false;
    usages.push([msg, description || ""]);
    return self;
  };
  self.getUsage = () => {
    return usages;
  };
  self.getUsageDisabled = () => {
    return usageDisabled;
  };
  self.getPositionalGroupName = () => {
    return __("Positionals:");
  };
  let examples = [];
  self.example = (cmd, description) => {
    examples.push([cmd, description || ""]);
  };
  let commands = [];
  self.command = function command2(cmd, description, isDefault, aliases, deprecated = false) {
    if (isDefault) {
      commands = commands.map((cmdArray) => {
        cmdArray[2] = false;
        return cmdArray;
      });
    }
    commands.push([cmd, description || "", isDefault, aliases, deprecated]);
  };
  self.getCommands = () => commands;
  let descriptions = {};
  self.describe = function describe(keyOrKeys, desc) {
    if (Array.isArray(keyOrKeys)) {
      keyOrKeys.forEach((k) => {
        self.describe(k, desc);
      });
    } else if (typeof keyOrKeys === "object") {
      Object.keys(keyOrKeys).forEach((k) => {
        self.describe(k, keyOrKeys[k]);
      });
    } else {
      descriptions[keyOrKeys] = desc;
    }
  };
  self.getDescriptions = () => descriptions;
  let epilogs = [];
  self.epilog = (msg) => {
    epilogs.push(msg);
  };
  let wrapSet = false;
  let wrap;
  self.wrap = (cols) => {
    wrapSet = true;
    wrap = cols;
  };
  self.getWrap = () => {
    if (shim2.getEnv("YARGS_DISABLE_WRAP")) {
      return null;
    }
    if (!wrapSet) {
      wrap = windowWidth();
      wrapSet = true;
    }
    return wrap;
  };
  const deferY18nLookupPrefix = "__yargsString__:";
  self.deferY18nLookup = (str) => deferY18nLookupPrefix + str;
  self.help = function help() {
    if (cachedHelpMessage)
      return cachedHelpMessage;
    normalizeAliases();
    const base$0 = yargs.customScriptName ? yargs.$0 : shim2.path.basename(yargs.$0);
    const demandedOptions = yargs.getDemandedOptions();
    const demandedCommands = yargs.getDemandedCommands();
    const deprecatedOptions = yargs.getDeprecatedOptions();
    const groups = yargs.getGroups();
    const options = yargs.getOptions();
    let keys = [];
    keys = keys.concat(Object.keys(descriptions));
    keys = keys.concat(Object.keys(demandedOptions));
    keys = keys.concat(Object.keys(demandedCommands));
    keys = keys.concat(Object.keys(options.default));
    keys = keys.filter(filterHiddenOptions);
    keys = Object.keys(keys.reduce((acc, key) => {
      if (key !== "_")
        acc[key] = true;
      return acc;
    }, {}));
    const theWrap = self.getWrap();
    const ui2 = shim2.cliui({
      width: theWrap,
      wrap: !!theWrap
    });
    if (!usageDisabled) {
      if (usages.length) {
        usages.forEach((usage2) => {
          ui2.div({ text: `${usage2[0].replace(/\$0/g, base$0)}` });
          if (usage2[1]) {
            ui2.div({ text: `${usage2[1]}`, padding: [1, 0, 0, 0] });
          }
        });
        ui2.div();
      } else if (commands.length) {
        let u = null;
        if (demandedCommands._) {
          u = `${base$0} <${__("command")}>
`;
        } else {
          u = `${base$0} [${__("command")}]
`;
        }
        ui2.div(`${u}`);
      }
    }
    if (commands.length > 1 || commands.length === 1 && !commands[0][2]) {
      ui2.div(__("Commands:"));
      const context = yargs.getInternalMethods().getContext();
      const parentCommands = context.commands.length ? `${context.commands.join(" ")} ` : "";
      if (yargs.getInternalMethods().getParserConfiguration()["sort-commands"] === true) {
        commands = commands.sort((a, b) => a[0].localeCompare(b[0]));
      }
      const prefix = base$0 ? `${base$0} ` : "";
      commands.forEach((command2) => {
        const commandString = `${prefix}${parentCommands}${command2[0].replace(/^\$0 ?/, "")}`;
        ui2.span({
          text: commandString,
          padding: [0, 2, 0, 2],
          width: maxWidth(commands, theWrap, `${base$0}${parentCommands}`) + 4
        }, { text: command2[1] });
        const hints = [];
        if (command2[2])
          hints.push(`[${__("default")}]`);
        if (command2[3] && command2[3].length) {
          hints.push(`[${__("aliases:")} ${command2[3].join(", ")}]`);
        }
        if (command2[4]) {
          if (typeof command2[4] === "string") {
            hints.push(`[${__("deprecated: %s", command2[4])}]`);
          } else {
            hints.push(`[${__("deprecated")}]`);
          }
        }
        if (hints.length) {
          ui2.div({
            text: hints.join(" "),
            padding: [0, 0, 0, 2],
            align: "right"
          });
        } else {
          ui2.div();
        }
      });
      ui2.div();
    }
    const aliasKeys = (Object.keys(options.alias) || []).concat(Object.keys(yargs.parsed.newAliases) || []);
    keys = keys.filter((key) => !yargs.parsed.newAliases[key] && aliasKeys.every((alias) => (options.alias[alias] || []).indexOf(key) === -1));
    const defaultGroup = __("Options:");
    if (!groups[defaultGroup])
      groups[defaultGroup] = [];
    addUngroupedKeys(keys, options.alias, groups, defaultGroup);
    const isLongSwitch = (sw) => /^--/.test(getText(sw));
    const displayedGroups = Object.keys(groups).filter((groupName) => groups[groupName].length > 0).map((groupName) => {
      const normalizedKeys = groups[groupName].filter(filterHiddenOptions).map((key) => {
        if (aliasKeys.includes(key))
          return key;
        for (let i = 0, aliasKey; (aliasKey = aliasKeys[i]) !== void 0; i++) {
          if ((options.alias[aliasKey] || []).includes(key))
            return aliasKey;
        }
        return key;
      });
      return { groupName, normalizedKeys };
    }).filter(({ normalizedKeys }) => normalizedKeys.length > 0).map(({ groupName, normalizedKeys }) => {
      const switches = normalizedKeys.reduce((acc, key) => {
        acc[key] = [key].concat(options.alias[key] || []).map((sw) => {
          if (groupName === self.getPositionalGroupName())
            return sw;
          else {
            return (/^[0-9]$/.test(sw) ? options.boolean.includes(key) ? "-" : "--" : sw.length > 1 ? "--" : "-") + sw;
          }
        }).sort((sw1, sw2) => isLongSwitch(sw1) === isLongSwitch(sw2) ? 0 : isLongSwitch(sw1) ? 1 : -1).join(", ");
        return acc;
      }, {});
      return { groupName, normalizedKeys, switches };
    });
    const shortSwitchesUsed = displayedGroups.filter(({ groupName }) => groupName !== self.getPositionalGroupName()).some(({ normalizedKeys, switches }) => !normalizedKeys.every((key) => isLongSwitch(switches[key])));
    if (shortSwitchesUsed) {
      displayedGroups.filter(({ groupName }) => groupName !== self.getPositionalGroupName()).forEach(({ normalizedKeys, switches }) => {
        normalizedKeys.forEach((key) => {
          if (isLongSwitch(switches[key])) {
            switches[key] = addIndentation(switches[key], "-x, ".length);
          }
        });
      });
    }
    displayedGroups.forEach(({ groupName, normalizedKeys, switches }) => {
      ui2.div(groupName);
      normalizedKeys.forEach((key) => {
        const kswitch = switches[key];
        let desc = descriptions[key] || "";
        let type = null;
        if (desc.includes(deferY18nLookupPrefix))
          desc = __(desc.substring(deferY18nLookupPrefix.length));
        if (options.boolean.includes(key))
          type = `[${__("boolean")}]`;
        if (options.count.includes(key))
          type = `[${__("count")}]`;
        if (options.string.includes(key))
          type = `[${__("string")}]`;
        if (options.normalize.includes(key))
          type = `[${__("string")}]`;
        if (options.array.includes(key))
          type = `[${__("array")}]`;
        if (options.number.includes(key))
          type = `[${__("number")}]`;
        const deprecatedExtra = (deprecated) => typeof deprecated === "string" ? `[${__("deprecated: %s", deprecated)}]` : `[${__("deprecated")}]`;
        const extra = [
          key in deprecatedOptions ? deprecatedExtra(deprecatedOptions[key]) : null,
          type,
          key in demandedOptions ? `[${__("required")}]` : null,
          options.choices && options.choices[key] ? `[${__("choices:")} ${self.stringifiedValues(options.choices[key])}]` : null,
          defaultString(options.default[key], options.defaultDescription[key])
        ].filter(Boolean).join(" ");
        ui2.span({
          text: getText(kswitch),
          padding: [0, 2, 0, 2 + getIndentation(kswitch)],
          width: maxWidth(switches, theWrap) + 4
        }, desc);
        const shouldHideOptionExtras = yargs.getInternalMethods().getUsageConfiguration()["hide-types"] === true;
        if (extra && !shouldHideOptionExtras)
          ui2.div({ text: extra, padding: [0, 0, 0, 2], align: "right" });
        else
          ui2.div();
      });
      ui2.div();
    });
    if (examples.length) {
      ui2.div(__("Examples:"));
      examples.forEach((example) => {
        example[0] = example[0].replace(/\$0/g, base$0);
      });
      examples.forEach((example) => {
        if (example[1] === "") {
          ui2.div({
            text: example[0],
            padding: [0, 2, 0, 2]
          });
        } else {
          ui2.div({
            text: example[0],
            padding: [0, 2, 0, 2],
            width: maxWidth(examples, theWrap) + 4
          }, {
            text: example[1]
          });
        }
      });
      ui2.div();
    }
    if (epilogs.length > 0) {
      const e = epilogs.map((epilog) => epilog.replace(/\$0/g, base$0)).join("\n");
      ui2.div(`${e}
`);
    }
    return ui2.toString().replace(/\s*$/, "");
  };
  function maxWidth(table, theWrap, modifier) {
    let width = 0;
    if (!Array.isArray(table)) {
      table = Object.values(table).map((v) => [v]);
    }
    table.forEach((v) => {
      width = Math.max(shim2.stringWidth(modifier ? `${modifier} ${getText(v[0])}` : getText(v[0])) + getIndentation(v[0]), width);
    });
    if (theWrap)
      width = Math.min(width, parseInt((theWrap * 0.5).toString(), 10));
    return width;
  }
  function normalizeAliases() {
    const demandedOptions = yargs.getDemandedOptions();
    const options = yargs.getOptions();
    (Object.keys(options.alias) || []).forEach((key) => {
      options.alias[key].forEach((alias) => {
        if (descriptions[alias])
          self.describe(key, descriptions[alias]);
        if (alias in demandedOptions)
          yargs.demandOption(key, demandedOptions[alias]);
        if (options.boolean.includes(alias))
          yargs.boolean(key);
        if (options.count.includes(alias))
          yargs.count(key);
        if (options.string.includes(alias))
          yargs.string(key);
        if (options.normalize.includes(alias))
          yargs.normalize(key);
        if (options.array.includes(alias))
          yargs.array(key);
        if (options.number.includes(alias))
          yargs.number(key);
      });
    });
  }
  let cachedHelpMessage;
  self.cacheHelpMessage = function() {
    cachedHelpMessage = this.help();
  };
  self.clearCachedHelpMessage = function() {
    cachedHelpMessage = void 0;
  };
  self.hasCachedHelpMessage = function() {
    return !!cachedHelpMessage;
  };
  function addUngroupedKeys(keys, aliases, groups, defaultGroup) {
    let groupedKeys = [];
    let toCheck = null;
    Object.keys(groups).forEach((group) => {
      groupedKeys = groupedKeys.concat(groups[group]);
    });
    keys.forEach((key) => {
      toCheck = [key].concat(aliases[key]);
      if (!toCheck.some((k) => groupedKeys.indexOf(k) !== -1)) {
        groups[defaultGroup].push(key);
      }
    });
    return groupedKeys;
  }
  function filterHiddenOptions(key) {
    return yargs.getOptions().hiddenOptions.indexOf(key) < 0 || yargs.parsed.argv[yargs.getOptions().showHiddenOpt];
  }
  self.showHelp = (level) => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level)
      level = "error";
    const emit = typeof level === "function" ? level : logger[level];
    emit(self.help());
  };
  self.functionDescription = (fn) => {
    const description = fn.name ? shim2.Parser.decamelize(fn.name, "-") : __("generated-value");
    return ["(", description, ")"].join("");
  };
  self.stringifiedValues = function stringifiedValues(values, separator) {
    let string = "";
    const sep = separator || ", ";
    const array = [].concat(values);
    if (!values || !array.length)
      return string;
    array.forEach((value) => {
      if (string.length)
        string += sep;
      string += JSON.stringify(value);
    });
    return string;
  };
  function defaultString(value, defaultDescription) {
    let string = `[${__("default:")} `;
    if (value === void 0 && !defaultDescription)
      return null;
    if (defaultDescription) {
      string += defaultDescription;
    } else {
      switch (typeof value) {
        case "string":
          string += `"${value}"`;
          break;
        case "object":
          string += JSON.stringify(value);
          break;
        default:
          string += value;
      }
    }
    return `${string}]`;
  }
  function windowWidth() {
    const maxWidth2 = 80;
    if (shim2.process.stdColumns) {
      return Math.min(maxWidth2, shim2.process.stdColumns);
    } else {
      return maxWidth2;
    }
  }
  let version = null;
  self.version = (ver) => {
    version = ver;
  };
  self.showVersion = (level) => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level)
      level = "error";
    const emit = typeof level === "function" ? level : logger[level];
    emit(version);
  };
  self.reset = function reset(localLookup) {
    failMessage = null;
    failureOutput = false;
    usages = [];
    usageDisabled = false;
    epilogs = [];
    examples = [];
    commands = [];
    descriptions = objFilter(descriptions, (k) => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      failMessage,
      failureOutput,
      usages,
      usageDisabled,
      epilogs,
      examples,
      commands,
      descriptions
    });
  };
  self.unfreeze = function unfreeze(defaultCommand = false) {
    const frozen = frozens.pop();
    if (!frozen)
      return;
    if (defaultCommand) {
      descriptions = { ...frozen.descriptions, ...descriptions };
      commands = [...frozen.commands, ...commands];
      usages = [...frozen.usages, ...usages];
      examples = [...frozen.examples, ...examples];
      epilogs = [...frozen.epilogs, ...epilogs];
    } else {
      ({
        failMessage,
        failureOutput,
        usages,
        usageDisabled,
        epilogs,
        examples,
        commands,
        descriptions
      } = frozen);
    }
  };
  return self;
}
function isIndentedText(text) {
  return typeof text === "object";
}
function addIndentation(text, indent) {
  return isIndentedText(text) ? { text: text.text, indentation: text.indentation + indent } : { text, indentation: indent };
}
function getIndentation(text) {
  return isIndentedText(text) ? text.indentation : 0;
}
function getText(text) {
  return isIndentedText(text) ? text.text : text;
}
const completionShTemplate = `###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc
#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    # see https://stackoverflow.com/a/40944195/7080036 for the spaces-handling awk
    mapfile -t type_list < <({{app_path}} --get-yargs-completions "\${args[@]}")
    mapfile -t COMPREPLY < <(compgen -W "$( printf '%q ' "\${type_list[@]}" )" -- "\${cur_word}" |
        awk '/ / { print "\\""$0"\\"" } /^[^ ]+$/ { print $0 }')

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
const completionZshTemplate = `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zprofile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  if [[ \${#reply} -gt 0 ]]; then
    _describe 'values' reply
  else
    _default
  fi
}
if [[ "'\${zsh_eval_context[-1]}" == "loadautofunc" ]]; then
  _{{app_name}}_yargs_completions "$@"
else
  compdef _{{app_name}}_yargs_completions {{app_name}}
fi
###-end-{{app_name}}-completions-###
`;
class Completion {
  constructor(yargs, usage2, command2, shim2) {
    var _a, _b, _c;
    this.yargs = yargs;
    this.usage = usage2;
    this.command = command2;
    this.shim = shim2;
    this.completionKey = "get-yargs-completions";
    this.aliases = null;
    this.customCompletionFunction = null;
    this.indexAfterLastReset = 0;
    this.zshShell = (_c = ((_a = this.shim.getEnv("SHELL")) === null || _a === void 0 ? void 0 : _a.includes("zsh")) || ((_b = this.shim.getEnv("ZSH_NAME")) === null || _b === void 0 ? void 0 : _b.includes("zsh"))) !== null && _c !== void 0 ? _c : false;
  }
  defaultCompletion(args, argv2, current, done) {
    const handlers = this.command.getCommandHandlers();
    for (let i = 0, ii = args.length; i < ii; ++i) {
      if (handlers[args[i]] && handlers[args[i]].builder) {
        const builder = handlers[args[i]].builder;
        if (isCommandBuilderCallback(builder)) {
          this.indexAfterLastReset = i + 1;
          const y = this.yargs.getInternalMethods().reset();
          builder(y, true);
          return y.argv;
        }
      }
    }
    const completions = [];
    this.commandCompletions(completions, args, current);
    this.optionCompletions(completions, args, argv2, current);
    this.choicesFromOptionsCompletions(completions, args, argv2, current);
    this.choicesFromPositionalsCompletions(completions, args, argv2, current);
    done(null, completions);
  }
  commandCompletions(completions, args, current) {
    const parentCommands = this.yargs.getInternalMethods().getContext().commands;
    if (!current.match(/^-/) && parentCommands[parentCommands.length - 1] !== current && !this.previousArgHasChoices(args)) {
      this.usage.getCommands().forEach((usageCommand) => {
        const commandName = parseCommand(usageCommand[0]).cmd;
        if (args.indexOf(commandName) === -1) {
          if (!this.zshShell) {
            completions.push(commandName);
          } else {
            const desc = usageCommand[1] || "";
            completions.push(commandName.replace(/:/g, "\\:") + ":" + desc);
          }
        }
      });
    }
  }
  optionCompletions(completions, args, argv2, current) {
    if ((current.match(/^-/) || current === "" && completions.length === 0) && !this.previousArgHasChoices(args)) {
      const options = this.yargs.getOptions();
      const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
      Object.keys(options.key).forEach((key) => {
        const negable = !!options.configuration["boolean-negation"] && options.boolean.includes(key);
        const isPositionalKey = positionalKeys.includes(key);
        if (!isPositionalKey && !options.hiddenOptions.includes(key) && !this.argsContainKey(args, key, negable)) {
          this.completeOptionKey(key, completions, current, negable && !!options.default[key]);
        }
      });
    }
  }
  choicesFromOptionsCompletions(completions, args, argv2, current) {
    if (this.previousArgHasChoices(args)) {
      const choices = this.getPreviousArgChoices(args);
      if (choices && choices.length > 0) {
        completions.push(...choices.map((c) => c.replace(/:/g, "\\:")));
      }
    }
  }
  choicesFromPositionalsCompletions(completions, args, argv2, current) {
    if (current === "" && completions.length > 0 && this.previousArgHasChoices(args)) {
      return;
    }
    const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
    const offset = Math.max(this.indexAfterLastReset, this.yargs.getInternalMethods().getContext().commands.length + 1);
    const positionalKey = positionalKeys[argv2._.length - offset - 1];
    if (!positionalKey) {
      return;
    }
    const choices = this.yargs.getOptions().choices[positionalKey] || [];
    for (const choice of choices) {
      if (choice.startsWith(current)) {
        completions.push(choice.replace(/:/g, "\\:"));
      }
    }
  }
  getPreviousArgChoices(args) {
    if (args.length < 1)
      return;
    let previousArg = args[args.length - 1];
    let filter = "";
    if (!previousArg.startsWith("-") && args.length > 1) {
      filter = previousArg;
      previousArg = args[args.length - 2];
    }
    if (!previousArg.startsWith("-"))
      return;
    const previousArgKey = previousArg.replace(/^-+/, "");
    const options = this.yargs.getOptions();
    const possibleAliases = [
      previousArgKey,
      ...this.yargs.getAliases()[previousArgKey] || []
    ];
    let choices;
    for (const possibleAlias of possibleAliases) {
      if (Object.prototype.hasOwnProperty.call(options.key, possibleAlias) && Array.isArray(options.choices[possibleAlias])) {
        choices = options.choices[possibleAlias];
        break;
      }
    }
    if (choices) {
      return choices.filter((choice) => !filter || choice.startsWith(filter));
    }
  }
  previousArgHasChoices(args) {
    const choices = this.getPreviousArgChoices(args);
    return choices !== void 0 && choices.length > 0;
  }
  argsContainKey(args, key, negable) {
    const argsContains = (s) => args.indexOf((/^[^0-9]$/.test(s) ? "-" : "--") + s) !== -1;
    if (argsContains(key))
      return true;
    if (negable && argsContains(`no-${key}`))
      return true;
    if (this.aliases) {
      for (const alias of this.aliases[key]) {
        if (argsContains(alias))
          return true;
      }
    }
    return false;
  }
  completeOptionKey(key, completions, current, negable) {
    var _a, _b, _c, _d;
    let keyWithDesc = key;
    if (this.zshShell) {
      const descs = this.usage.getDescriptions();
      const aliasKey = (_b = (_a = this === null || this === void 0 ? void 0 : this.aliases) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b.find((alias) => {
        const desc2 = descs[alias];
        return typeof desc2 === "string" && desc2.length > 0;
      });
      const descFromAlias = aliasKey ? descs[aliasKey] : void 0;
      const desc = (_d = (_c = descs[key]) !== null && _c !== void 0 ? _c : descFromAlias) !== null && _d !== void 0 ? _d : "";
      keyWithDesc = `${key.replace(/:/g, "\\:")}:${desc.replace("__yargsString__:", "").replace(/(\r\n|\n|\r)/gm, " ")}`;
    }
    const startsByTwoDashes = (s) => /^--/.test(s);
    const isShortOption = (s) => /^[^0-9]$/.test(s);
    const dashes = !startsByTwoDashes(current) && isShortOption(key) ? "-" : "--";
    completions.push(dashes + keyWithDesc);
    if (negable) {
      completions.push(dashes + "no-" + keyWithDesc);
    }
  }
  customCompletion(args, argv2, current, done) {
    assertNotStrictEqual(this.customCompletionFunction, null, this.shim);
    if (isSyncCompletionFunction(this.customCompletionFunction)) {
      const result = this.customCompletionFunction(current, argv2);
      if (isPromise(result)) {
        return result.then((list) => {
          this.shim.process.nextTick(() => {
            done(null, list);
          });
        }).catch((err) => {
          this.shim.process.nextTick(() => {
            done(err, void 0);
          });
        });
      }
      return done(null, result);
    } else if (isFallbackCompletionFunction(this.customCompletionFunction)) {
      return this.customCompletionFunction(current, argv2, (onCompleted = done) => this.defaultCompletion(args, argv2, current, onCompleted), (completions) => {
        done(null, completions);
      });
    } else {
      return this.customCompletionFunction(current, argv2, (completions) => {
        done(null, completions);
      });
    }
  }
  getCompletion(args, done) {
    const current = args.length ? args[args.length - 1] : "";
    const argv2 = this.yargs.parse(args, true);
    const completionFunction = this.customCompletionFunction ? (argv3) => this.customCompletion(args, argv3, current, done) : (argv3) => this.defaultCompletion(args, argv3, current, done);
    return isPromise(argv2) ? argv2.then(completionFunction) : completionFunction(argv2);
  }
  generateCompletionScript($0, cmd) {
    let script = this.zshShell ? completionZshTemplate : completionShTemplate;
    const name = this.shim.path.basename($0);
    if ($0.match(/\.js$/))
      $0 = `./${$0}`;
    script = script.replace(/{{app_name}}/g, name);
    script = script.replace(/{{completion_command}}/g, cmd);
    return script.replace(/{{app_path}}/g, $0);
  }
  registerFunction(fn) {
    this.customCompletionFunction = fn;
  }
  setParsed(parsed) {
    this.aliases = parsed.aliases;
  }
}
function completion(yargs, usage2, command2, shim2) {
  return new Completion(yargs, usage2, command2, shim2);
}
function isSyncCompletionFunction(completionFunction) {
  return completionFunction.length < 3;
}
function isFallbackCompletionFunction(completionFunction) {
  return completionFunction.length > 3;
}
function levenshtein(a, b) {
  if (a.length === 0)
    return b.length;
  if (b.length === 0)
    return a.length;
  const matrix = [];
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        if (i > 1 && j > 1 && b.charAt(i - 2) === a.charAt(j - 1) && b.charAt(i - 1) === a.charAt(j - 2)) {
          matrix[i][j] = matrix[i - 2][j - 2] + 1;
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
  }
  return matrix[b.length][a.length];
}
const specialKeys = ["$0", "--", "_"];
function validation(yargs, usage2, shim2) {
  const __ = shim2.y18n.__;
  const __n = shim2.y18n.__n;
  const self = {};
  self.nonOptionCount = function nonOptionCount(argv2) {
    const demandedCommands = yargs.getDemandedCommands();
    const positionalCount = argv2._.length + (argv2["--"] ? argv2["--"].length : 0);
    const _s = positionalCount - yargs.getInternalMethods().getContext().commands.length;
    if (demandedCommands._ && (_s < demandedCommands._.min || _s > demandedCommands._.max)) {
      if (_s < demandedCommands._.min) {
        if (demandedCommands._.minMsg !== void 0) {
          usage2.fail(demandedCommands._.minMsg ? demandedCommands._.minMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.min.toString()) : null);
        } else {
          usage2.fail(__n("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", _s, _s.toString(), demandedCommands._.min.toString()));
        }
      } else if (_s > demandedCommands._.max) {
        if (demandedCommands._.maxMsg !== void 0) {
          usage2.fail(demandedCommands._.maxMsg ? demandedCommands._.maxMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.max.toString()) : null);
        } else {
          usage2.fail(__n("Too many non-option arguments: got %s, maximum of %s", "Too many non-option arguments: got %s, maximum of %s", _s, _s.toString(), demandedCommands._.max.toString()));
        }
      }
    }
  };
  self.positionalCount = function positionalCount(required, observed) {
    if (observed < required) {
      usage2.fail(__n("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", observed, observed + "", required + ""));
    }
  };
  self.requiredArguments = function requiredArguments(argv2, demandedOptions) {
    let missing = null;
    for (const key of Object.keys(demandedOptions)) {
      if (!Object.prototype.hasOwnProperty.call(argv2, key) || typeof argv2[key] === "undefined") {
        missing = missing || {};
        missing[key] = demandedOptions[key];
      }
    }
    if (missing) {
      const customMsgs = [];
      for (const key of Object.keys(missing)) {
        const msg = missing[key];
        if (msg && customMsgs.indexOf(msg) < 0) {
          customMsgs.push(msg);
        }
      }
      const customMsg = customMsgs.length ? `
${customMsgs.join("\n")}` : "";
      usage2.fail(__n("Missing required argument: %s", "Missing required arguments: %s", Object.keys(missing).length, Object.keys(missing).join(", ") + customMsg));
    }
  };
  self.unknownArguments = function unknownArguments(argv2, aliases, positionalMap, isDefaultCommand, checkPositionals = true) {
    var _a;
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    Object.keys(argv2).forEach((key) => {
      if (!specialKeys.includes(key) && !Object.prototype.hasOwnProperty.call(positionalMap, key) && !Object.prototype.hasOwnProperty.call(yargs.getInternalMethods().getParseContext(), key) && !self.isValidAndSomeAliasIsNotNew(key, aliases)) {
        unknown.push(key);
      }
    });
    if (checkPositionals && (currentContext.commands.length > 0 || commandKeys.length > 0 || isDefaultCommand)) {
      argv2._.slice(currentContext.commands.length).forEach((key) => {
        if (!commandKeys.includes("" + key)) {
          unknown.push("" + key);
        }
      });
    }
    if (checkPositionals) {
      const demandedCommands = yargs.getDemandedCommands();
      const maxNonOptDemanded = ((_a = demandedCommands._) === null || _a === void 0 ? void 0 : _a.max) || 0;
      const expected = currentContext.commands.length + maxNonOptDemanded;
      if (expected < argv2._.length) {
        argv2._.slice(expected).forEach((key) => {
          key = String(key);
          if (!currentContext.commands.includes(key) && !unknown.includes(key)) {
            unknown.push(key);
          }
        });
      }
    }
    if (unknown.length) {
      usage2.fail(__n("Unknown argument: %s", "Unknown arguments: %s", unknown.length, unknown.map((s) => s.trim() ? s : `"${s}"`).join(", ")));
    }
  };
  self.unknownCommands = function unknownCommands(argv2) {
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    if (currentContext.commands.length > 0 || commandKeys.length > 0) {
      argv2._.slice(currentContext.commands.length).forEach((key) => {
        if (!commandKeys.includes("" + key)) {
          unknown.push("" + key);
        }
      });
    }
    if (unknown.length > 0) {
      usage2.fail(__n("Unknown command: %s", "Unknown commands: %s", unknown.length, unknown.join(", ")));
      return true;
    } else {
      return false;
    }
  };
  self.isValidAndSomeAliasIsNotNew = function isValidAndSomeAliasIsNotNew(key, aliases) {
    if (!Object.prototype.hasOwnProperty.call(aliases, key)) {
      return false;
    }
    const newAliases = yargs.parsed.newAliases;
    return [key, ...aliases[key]].some((a) => !Object.prototype.hasOwnProperty.call(newAliases, a) || !newAliases[key]);
  };
  self.limitedChoices = function limitedChoices(argv2) {
    const options = yargs.getOptions();
    const invalid = {};
    if (!Object.keys(options.choices).length)
      return;
    Object.keys(argv2).forEach((key) => {
      if (specialKeys.indexOf(key) === -1 && Object.prototype.hasOwnProperty.call(options.choices, key)) {
        [].concat(argv2[key]).forEach((value) => {
          if (options.choices[key].indexOf(value) === -1 && value !== void 0) {
            invalid[key] = (invalid[key] || []).concat(value);
          }
        });
      }
    });
    const invalidKeys = Object.keys(invalid);
    if (!invalidKeys.length)
      return;
    let msg = __("Invalid values:");
    invalidKeys.forEach((key) => {
      msg += `
  ${__("Argument: %s, Given: %s, Choices: %s", key, usage2.stringifiedValues(invalid[key]), usage2.stringifiedValues(options.choices[key]))}`;
    });
    usage2.fail(msg);
  };
  let implied = {};
  self.implies = function implies(key, value) {
    argsert("<string|object> [array|number|string]", [key, value], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        self.implies(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!implied[key]) {
        implied[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach((i) => self.implies(key, i));
      } else {
        assertNotStrictEqual(value, void 0, shim2);
        implied[key].push(value);
      }
    }
  };
  self.getImplied = function getImplied() {
    return implied;
  };
  function keyExists(argv2, val) {
    const num = Number(val);
    val = isNaN(num) ? val : num;
    if (typeof val === "number") {
      val = argv2._.length >= val;
    } else if (val.match(/^--no-.+/)) {
      val = val.match(/^--no-(.+)/)[1];
      val = !Object.prototype.hasOwnProperty.call(argv2, val);
    } else {
      val = Object.prototype.hasOwnProperty.call(argv2, val);
    }
    return val;
  }
  self.implications = function implications(argv2) {
    const implyFail = [];
    Object.keys(implied).forEach((key) => {
      const origKey = key;
      (implied[key] || []).forEach((value) => {
        let key2 = origKey;
        const origValue = value;
        key2 = keyExists(argv2, key2);
        value = keyExists(argv2, value);
        if (key2 && !value) {
          implyFail.push(` ${origKey} -> ${origValue}`);
        }
      });
    });
    if (implyFail.length) {
      let msg = `${__("Implications failed:")}
`;
      implyFail.forEach((value) => {
        msg += value;
      });
      usage2.fail(msg);
    }
  };
  let conflicting = {};
  self.conflicts = function conflicts(key, value) {
    argsert("<string|object> [array|string]", [key, value], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        self.conflicts(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!conflicting[key]) {
        conflicting[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach((i) => self.conflicts(key, i));
      } else {
        conflicting[key].push(value);
      }
    }
  };
  self.getConflicting = () => conflicting;
  self.conflicting = function conflictingFn(argv2) {
    Object.keys(argv2).forEach((key) => {
      if (conflicting[key]) {
        conflicting[key].forEach((value) => {
          if (value && argv2[key] !== void 0 && argv2[value] !== void 0) {
            usage2.fail(__("Arguments %s and %s are mutually exclusive", key, value));
          }
        });
      }
    });
    if (yargs.getInternalMethods().getParserConfiguration()["strip-dashed"]) {
      Object.keys(conflicting).forEach((key) => {
        conflicting[key].forEach((value) => {
          if (value && argv2[shim2.Parser.camelCase(key)] !== void 0 && argv2[shim2.Parser.camelCase(value)] !== void 0) {
            usage2.fail(__("Arguments %s and %s are mutually exclusive", key, value));
          }
        });
      });
    }
  };
  self.recommendCommands = function recommendCommands(cmd, potentialCommands) {
    const threshold = 3;
    potentialCommands = potentialCommands.sort((a, b) => b.length - a.length);
    let recommended = null;
    let bestDistance = Infinity;
    for (let i = 0, candidate; (candidate = potentialCommands[i]) !== void 0; i++) {
      const d = levenshtein(cmd, candidate);
      if (d <= threshold && d < bestDistance) {
        bestDistance = d;
        recommended = candidate;
      }
    }
    if (recommended)
      usage2.fail(__("Did you mean %s?", recommended));
  };
  self.reset = function reset(localLookup) {
    implied = objFilter(implied, (k) => !localLookup[k]);
    conflicting = objFilter(conflicting, (k) => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      implied,
      conflicting
    });
  };
  self.unfreeze = function unfreeze() {
    const frozen = frozens.pop();
    assertNotStrictEqual(frozen, void 0, shim2);
    ({ implied, conflicting } = frozen);
  };
  return self;
}
let previouslyVisitedConfigs = [];
let shim;
function applyExtends(config, cwd, mergeExtends, _shim) {
  shim = _shim;
  let defaultConfig = {};
  if (Object.prototype.hasOwnProperty.call(config, "extends")) {
    if (typeof config.extends !== "string")
      return defaultConfig;
    const isPath = /\.json|\..*rc$/.test(config.extends);
    let pathToDefault = null;
    if (!isPath) {
      try {
        pathToDefault = import.meta.resolve(config.extends);
      } catch (_err) {
        return config;
      }
    } else {
      pathToDefault = getPathToDefaultConfig(cwd, config.extends);
    }
    checkForCircularExtends(pathToDefault);
    previouslyVisitedConfigs.push(pathToDefault);
    defaultConfig = isPath ? JSON.parse(shim.readFileSync(pathToDefault, "utf8")) : _shim.require(config.extends);
    delete config.extends;
    defaultConfig = applyExtends(defaultConfig, shim.path.dirname(pathToDefault), mergeExtends, shim);
  }
  previouslyVisitedConfigs = [];
  return mergeExtends ? mergeDeep(defaultConfig, config) : Object.assign({}, defaultConfig, config);
}
function checkForCircularExtends(cfgPath) {
  if (previouslyVisitedConfigs.indexOf(cfgPath) > -1) {
    throw new YError(`Circular extended configurations: '${cfgPath}'.`);
  }
}
function getPathToDefaultConfig(cwd, pathToExtend) {
  return shim.path.resolve(cwd, pathToExtend);
}
function mergeDeep(config1, config2) {
  const target = {};
  function isObject(obj) {
    return obj && typeof obj === "object" && !Array.isArray(obj);
  }
  Object.assign(target, config1);
  for (const key of Object.keys(config2)) {
    if (isObject(config2[key]) && isObject(target[key])) {
      target[key] = mergeDeep(config1[key], config2[key]);
    } else {
      target[key] = config2[key];
    }
  }
  return target;
}
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _YargsInstance_command, _YargsInstance_cwd, _YargsInstance_context, _YargsInstance_completion, _YargsInstance_completionCommand, _YargsInstance_defaultShowHiddenOpt, _YargsInstance_exitError, _YargsInstance_detectLocale, _YargsInstance_emittedWarnings, _YargsInstance_exitProcess, _YargsInstance_frozens, _YargsInstance_globalMiddleware, _YargsInstance_groups, _YargsInstance_hasOutput, _YargsInstance_helpOpt, _YargsInstance_isGlobalContext, _YargsInstance_logger, _YargsInstance_output, _YargsInstance_options, _YargsInstance_parentRequire, _YargsInstance_parserConfig, _YargsInstance_parseFn, _YargsInstance_parseContext, _YargsInstance_pkgs, _YargsInstance_preservedGroups, _YargsInstance_processArgs, _YargsInstance_recommendCommands, _YargsInstance_shim, _YargsInstance_strict, _YargsInstance_strictCommands, _YargsInstance_strictOptions, _YargsInstance_usage, _YargsInstance_usageConfig, _YargsInstance_versionOpt, _YargsInstance_validation;
function YargsFactory(_shim) {
  return (processArgs = [], cwd = _shim.process.cwd(), parentRequire) => {
    const yargs = new YargsInstance(processArgs, cwd, parentRequire, _shim);
    Object.defineProperty(yargs, "argv", {
      get: () => {
        return yargs.parse();
      },
      enumerable: true
    });
    yargs.help();
    yargs.version();
    return yargs;
  };
}
const kCopyDoubleDash = Symbol("copyDoubleDash");
const kCreateLogger = Symbol("copyDoubleDash");
const kDeleteFromParserHintObject = Symbol("deleteFromParserHintObject");
const kEmitWarning = Symbol("emitWarning");
const kFreeze = Symbol("freeze");
const kGetDollarZero = Symbol("getDollarZero");
const kGetParserConfiguration = Symbol("getParserConfiguration");
const kGetUsageConfiguration = Symbol("getUsageConfiguration");
const kGuessLocale = Symbol("guessLocale");
const kGuessVersion = Symbol("guessVersion");
const kParsePositionalNumbers = Symbol("parsePositionalNumbers");
const kPkgUp = Symbol("pkgUp");
const kPopulateParserHintArray = Symbol("populateParserHintArray");
const kPopulateParserHintSingleValueDictionary = Symbol("populateParserHintSingleValueDictionary");
const kPopulateParserHintArrayDictionary = Symbol("populateParserHintArrayDictionary");
const kPopulateParserHintDictionary = Symbol("populateParserHintDictionary");
const kSanitizeKey = Symbol("sanitizeKey");
const kSetKey = Symbol("setKey");
const kUnfreeze = Symbol("unfreeze");
const kValidateAsync = Symbol("validateAsync");
const kGetCommandInstance = Symbol("getCommandInstance");
const kGetContext = Symbol("getContext");
const kGetHasOutput = Symbol("getHasOutput");
const kGetLoggerInstance = Symbol("getLoggerInstance");
const kGetParseContext = Symbol("getParseContext");
const kGetUsageInstance = Symbol("getUsageInstance");
const kGetValidationInstance = Symbol("getValidationInstance");
const kHasParseCallback = Symbol("hasParseCallback");
const kIsGlobalContext = Symbol("isGlobalContext");
const kPostProcess = Symbol("postProcess");
const kRebase = Symbol("rebase");
const kReset = Symbol("reset");
const kRunYargsParserAndExecuteCommands = Symbol("runYargsParserAndExecuteCommands");
const kRunValidation = Symbol("runValidation");
const kSetHasOutput = Symbol("setHasOutput");
const kTrackManuallySetKeys = Symbol("kTrackManuallySetKeys");
const DEFAULT_LOCALE = "en_US";
class YargsInstance {
  constructor(processArgs = [], cwd, parentRequire, shim2) {
    this.customScriptName = false;
    this.parsed = false;
    _YargsInstance_command.set(this, void 0);
    _YargsInstance_cwd.set(this, void 0);
    _YargsInstance_context.set(this, { commands: [], fullCommands: [] });
    _YargsInstance_completion.set(this, null);
    _YargsInstance_completionCommand.set(this, null);
    _YargsInstance_defaultShowHiddenOpt.set(this, "show-hidden");
    _YargsInstance_exitError.set(this, null);
    _YargsInstance_detectLocale.set(this, true);
    _YargsInstance_emittedWarnings.set(this, {});
    _YargsInstance_exitProcess.set(this, true);
    _YargsInstance_frozens.set(this, []);
    _YargsInstance_globalMiddleware.set(this, void 0);
    _YargsInstance_groups.set(this, {});
    _YargsInstance_hasOutput.set(this, false);
    _YargsInstance_helpOpt.set(this, null);
    _YargsInstance_isGlobalContext.set(this, true);
    _YargsInstance_logger.set(this, void 0);
    _YargsInstance_output.set(this, "");
    _YargsInstance_options.set(this, void 0);
    _YargsInstance_parentRequire.set(this, void 0);
    _YargsInstance_parserConfig.set(this, {});
    _YargsInstance_parseFn.set(this, null);
    _YargsInstance_parseContext.set(this, null);
    _YargsInstance_pkgs.set(this, {});
    _YargsInstance_preservedGroups.set(this, {});
    _YargsInstance_processArgs.set(this, void 0);
    _YargsInstance_recommendCommands.set(this, false);
    _YargsInstance_shim.set(this, void 0);
    _YargsInstance_strict.set(this, false);
    _YargsInstance_strictCommands.set(this, false);
    _YargsInstance_strictOptions.set(this, false);
    _YargsInstance_usage.set(this, void 0);
    _YargsInstance_usageConfig.set(this, {});
    _YargsInstance_versionOpt.set(this, null);
    _YargsInstance_validation.set(this, void 0);
    __classPrivateFieldSet(this, _YargsInstance_shim, shim2, "f");
    __classPrivateFieldSet(this, _YargsInstance_processArgs, processArgs, "f");
    __classPrivateFieldSet(this, _YargsInstance_cwd, cwd, "f");
    __classPrivateFieldSet(this, _YargsInstance_parentRequire, parentRequire, "f");
    __classPrivateFieldSet(this, _YargsInstance_globalMiddleware, new GlobalMiddleware(this), "f");
    this.$0 = this[kGetDollarZero]();
    this[kReset]();
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f"), "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    __classPrivateFieldSet(this, _YargsInstance_logger, this[kCreateLogger](), "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.setLocale(DEFAULT_LOCALE);
  }
  addHelpOpt(opt, msg) {
    const defaultHelpOpt = "help";
    argsert("[string|boolean] [string]", [opt, msg], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
      __classPrivateFieldSet(this, _YargsInstance_helpOpt, null, "f");
    }
    if (opt === false && msg === void 0)
      return this;
    __classPrivateFieldSet(this, _YargsInstance_helpOpt, typeof opt === "string" ? opt : defaultHelpOpt, "f");
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"), msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show help"));
    return this;
  }
  help(opt, msg) {
    return this.addHelpOpt(opt, msg);
  }
  addShowHiddenOpt(opt, msg) {
    argsert("[string|boolean] [string]", [opt, msg], arguments.length);
    if (opt === false && msg === void 0)
      return this;
    const showHiddenOpt = typeof opt === "string" ? opt : __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    this.boolean(showHiddenOpt);
    this.describe(showHiddenOpt, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show hidden options"));
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = showHiddenOpt;
    return this;
  }
  showHidden(opt, msg) {
    return this.addShowHiddenOpt(opt, msg);
  }
  alias(key, value) {
    argsert("<object|string|array> [string|array]", [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.alias.bind(this), "alias", key, value);
    return this;
  }
  array(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("array", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  boolean(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("boolean", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  check(f, global) {
    argsert("<function> [boolean]", [f, global], arguments.length);
    this.middleware((argv2, _yargs) => {
      return maybeAsyncResult(() => {
        return f(argv2, _yargs.getOptions());
      }, (result) => {
        if (!result) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(__classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__("Argument check failed: %s", f.toString()));
        } else if (typeof result === "string" || result instanceof Error) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(result.toString(), result);
        }
        return argv2;
      }, (err) => {
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message ? err.message : err.toString(), err);
        return argv2;
      });
    }, false, global);
    return this;
  }
  choices(key, value) {
    argsert("<object|string|array> [string|array]", [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.choices.bind(this), "choices", key, value);
    return this;
  }
  coerce(keys, value) {
    argsert("<object|string|array> [function]", [keys, value], arguments.length);
    if (Array.isArray(keys)) {
      if (!value) {
        throw new YError("coerce callback must be provided");
      }
      for (const key of keys) {
        this.coerce(key, value);
      }
      return this;
    } else if (typeof keys === "object") {
      for (const key of Object.keys(keys)) {
        this.coerce(key, keys[key]);
      }
      return this;
    }
    if (!value) {
      throw new YError("coerce callback must be provided");
    }
    const coerceKey = keys;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").key[coerceKey] = true;
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addCoerceMiddleware((argv2, yargs) => {
      var _a;
      const coerceKeyAliases = (_a = yargs.getAliases()[coerceKey]) !== null && _a !== void 0 ? _a : [];
      const argvKeys = [coerceKey, ...coerceKeyAliases].filter((key) => Object.prototype.hasOwnProperty.call(argv2, key));
      if (argvKeys.length === 0) {
        return argv2;
      }
      return maybeAsyncResult(() => {
        return value(argv2[argvKeys[0]]);
      }, (result) => {
        argvKeys.forEach((key) => {
          argv2[key] = result;
        });
        return argv2;
      }, (err) => {
        throw new YError(err.message);
      });
    }, coerceKey);
    return this;
  }
  conflicts(key1, key2) {
    argsert("<string|object> [string|array]", [key1, key2], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicts(key1, key2);
    return this;
  }
  config(key = "config", msg, parseFn) {
    argsert("[object|string] [string|function] [function]", [key, msg, parseFn], arguments.length);
    if (typeof key === "object" && !Array.isArray(key)) {
      key = applyExtends(key, __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()["deep-merge-config"] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(key);
      return this;
    }
    if (typeof msg === "function") {
      parseFn = msg;
      msg = void 0;
    }
    this.describe(key, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Path to JSON config file"));
    (Array.isArray(key) ? key : [key]).forEach((k) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").config[k] = parseFn || true;
    });
    return this;
  }
  completion(cmd, desc, fn) {
    argsert("[string] [string|boolean|function] [function]", [cmd, desc, fn], arguments.length);
    if (typeof desc === "function") {
      fn = desc;
      desc = void 0;
    }
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || "completion", "f");
    if (!desc && desc !== false) {
      desc = "generate completion script";
    }
    this.command(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"), desc);
    if (fn)
      __classPrivateFieldGet(this, _YargsInstance_completion, "f").registerFunction(fn);
    return this;
  }
  command(cmd, description, builder, handler, middlewares, deprecated) {
    argsert("<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]", [cmd, description, builder, handler, middlewares, deprecated], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addHandler(cmd, description, builder, handler, middlewares, deprecated);
    return this;
  }
  commands(cmd, description, builder, handler, middlewares, deprecated) {
    return this.command(cmd, description, builder, handler, middlewares, deprecated);
  }
  commandDir(dir, opts) {
    argsert("<string> [object]", [dir, opts], arguments.length);
    const req = __classPrivateFieldGet(this, _YargsInstance_parentRequire, "f") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").require;
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addDirectory(dir, req, __classPrivateFieldGet(this, _YargsInstance_shim, "f").getCallerFile(), opts);
    return this;
  }
  count(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("count", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  default(key, value, defaultDescription) {
    argsert("<object|string|array> [*] [string]", [key, value, defaultDescription], arguments.length);
    if (defaultDescription) {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = defaultDescription;
    }
    if (typeof value === "function") {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key])
        __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = __classPrivateFieldGet(this, _YargsInstance_usage, "f").functionDescription(value);
      value = value.call();
    }
    this[kPopulateParserHintSingleValueDictionary](this.default.bind(this), "default", key, value);
    return this;
  }
  defaults(key, value, defaultDescription) {
    return this.default(key, value, defaultDescription);
  }
  demandCommand(min = 1, max, minMsg, maxMsg) {
    argsert("[number] [number|string] [string|null|undefined] [string|null|undefined]", [min, max, minMsg, maxMsg], arguments.length);
    if (typeof max !== "number") {
      minMsg = max;
      max = Infinity;
    }
    this.global("_", false);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands._ = {
      min,
      max,
      minMsg,
      maxMsg
    };
    return this;
  }
  demand(keys, max, msg) {
    if (Array.isArray(max)) {
      max.forEach((key) => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
      max = Infinity;
    } else if (typeof max !== "number") {
      msg = max;
      max = Infinity;
    }
    if (typeof keys === "number") {
      assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      this.demandCommand(keys, max, msg, msg);
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
    } else {
      if (typeof msg === "string") {
        this.demandOption(keys, msg);
      } else if (msg === true || typeof msg === "undefined") {
        this.demandOption(keys);
      }
    }
    return this;
  }
  demandOption(keys, msg) {
    argsert("<object|string|array> [string]", [keys, msg], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.demandOption.bind(this), "demandedOptions", keys, msg);
    return this;
  }
  deprecateOption(option, message) {
    argsert("<string> [string|boolean]", [option, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions[option] = message;
    return this;
  }
  describe(keys, description) {
    argsert("<object|string|array> [string]", [keys, description], arguments.length);
    this[kSetKey](keys, true);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").describe(keys, description);
    return this;
  }
  detectLocale(detect) {
    argsert("<boolean>", [detect], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, detect, "f");
    return this;
  }
  env(prefix) {
    argsert("[string|boolean]", [prefix], arguments.length);
    if (prefix === false)
      delete __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
    else
      __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix = prefix || "";
    return this;
  }
  epilogue(msg) {
    argsert("<string>", [msg], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").epilog(msg);
    return this;
  }
  epilog(msg) {
    return this.epilogue(msg);
  }
  example(cmd, description) {
    argsert("<string|array> [string]", [cmd, description], arguments.length);
    if (Array.isArray(cmd)) {
      cmd.forEach((exampleParams) => this.example(...exampleParams));
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").example(cmd, description);
    }
    return this;
  }
  exit(code, err) {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, err, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
      __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.exit(code);
  }
  exitProcess(enabled = true) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_exitProcess, enabled, "f");
    return this;
  }
  fail(f) {
    argsert("<function|boolean>", [f], arguments.length);
    if (typeof f === "boolean" && f !== false) {
      throw new YError("Invalid first argument. Expected function or boolean 'false'");
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").failFn(f);
    return this;
  }
  getAliases() {
    return this.parsed ? this.parsed.aliases : {};
  }
  async getCompletion(args, done) {
    argsert("<array> [function]", [args, done], arguments.length);
    if (!done) {
      return new Promise((resolve2, reject) => {
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, (err, completions) => {
          if (err)
            reject(err);
          else
            resolve2(completions);
        });
      });
    } else {
      return __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, done);
    }
  }
  getDemandedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedOptions;
  }
  getDemandedCommands() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands;
  }
  getDeprecatedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions;
  }
  getDetectLocale() {
    return __classPrivateFieldGet(this, _YargsInstance_detectLocale, "f");
  }
  getExitProcess() {
    return __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f");
  }
  getGroups() {
    return Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_groups, "f"), __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"));
  }
  getHelp() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), void 0, void 0, 0, true);
        if (isPromise(parse)) {
          return parse.then(() => {
            return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
          });
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        return builderResponse.then(() => {
          return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
        });
      }
    }
    return Promise.resolve(__classPrivateFieldGet(this, _YargsInstance_usage, "f").help());
  }
  getOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_options, "f");
  }
  getStrict() {
    return __classPrivateFieldGet(this, _YargsInstance_strict, "f");
  }
  getStrictCommands() {
    return __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f");
  }
  getStrictOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f");
  }
  global(globals, global) {
    argsert("<string|array> [boolean]", [globals, global], arguments.length);
    globals = [].concat(globals);
    if (global !== false) {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local.filter((l) => globals.indexOf(l) === -1);
    } else {
      globals.forEach((g) => {
        if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").local.includes(g))
          __classPrivateFieldGet(this, _YargsInstance_options, "f").local.push(g);
      });
    }
    return this;
  }
  group(opts, groupName) {
    argsert("<string|array> <string>", [opts, groupName], arguments.length);
    const existing = __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName] || __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName];
    if (__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName]) {
      delete __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName];
    }
    const seen = {};
    __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName] = (existing || []).concat(opts).filter((key) => {
      if (seen[key])
        return false;
      return seen[key] = true;
    });
    return this;
  }
  hide(key) {
    argsert("<string>", [key], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").hiddenOptions.push(key);
    return this;
  }
  implies(key, value) {
    argsert("<string|object> [number|string|array]", [key, value], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").implies(key, value);
    return this;
  }
  locale(locale) {
    argsert("[string]", [locale], arguments.length);
    if (locale === void 0) {
      this[kGuessLocale]();
      return __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.getLocale();
    }
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.setLocale(locale);
    return this;
  }
  middleware(callback, applyBeforeValidation, global) {
    return __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addMiddleware(callback, !!applyBeforeValidation, global);
  }
  nargs(key, value) {
    argsert("<string|object|array> [number]", [key, value], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.nargs.bind(this), "narg", key, value);
    return this;
  }
  normalize(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("normalize", keys);
    return this;
  }
  number(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("number", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  option(key, opt) {
    argsert("<string|object> [object]", [key, opt], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        this.options(k, key[k]);
      });
    } else {
      if (typeof opt !== "object") {
        opt = {};
      }
      this[kTrackManuallySetKeys](key);
      if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && (key === "version" || (opt === null || opt === void 0 ? void 0 : opt.alias) === "version")) {
        this[kEmitWarning]([
          '"version" is a reserved word.',
          "Please do one of the following:",
          '- Disable version with `yargs.version(false)` if using "version" as an option',
          "- Use the built-in `yargs.version` method instead (if applicable)",
          "- Use a different option key",
          "https://yargs.js.org/docs/#api-reference-version"
        ].join("\n"), void 0, "versionWarning");
      }
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[key] = true;
      if (opt.alias)
        this.alias(key, opt.alias);
      const deprecate = opt.deprecate || opt.deprecated;
      if (deprecate) {
        this.deprecateOption(key, deprecate);
      }
      const demand = opt.demand || opt.required || opt.require;
      if (demand) {
        this.demand(key, demand);
      }
      if (opt.demandOption) {
        this.demandOption(key, typeof opt.demandOption === "string" ? opt.demandOption : void 0);
      }
      if (opt.conflicts) {
        this.conflicts(key, opt.conflicts);
      }
      if ("default" in opt) {
        this.default(key, opt.default);
      }
      if (opt.implies !== void 0) {
        this.implies(key, opt.implies);
      }
      if (opt.nargs !== void 0) {
        this.nargs(key, opt.nargs);
      }
      if (opt.config) {
        this.config(key, opt.configParser);
      }
      if (opt.normalize) {
        this.normalize(key);
      }
      if (opt.choices) {
        this.choices(key, opt.choices);
      }
      if (opt.coerce) {
        this.coerce(key, opt.coerce);
      }
      if (opt.group) {
        this.group(key, opt.group);
      }
      if (opt.boolean || opt.type === "boolean") {
        this.boolean(key);
        if (opt.alias)
          this.boolean(opt.alias);
      }
      if (opt.array || opt.type === "array") {
        this.array(key);
        if (opt.alias)
          this.array(opt.alias);
      }
      if (opt.number || opt.type === "number") {
        this.number(key);
        if (opt.alias)
          this.number(opt.alias);
      }
      if (opt.string || opt.type === "string") {
        this.string(key);
        if (opt.alias)
          this.string(opt.alias);
      }
      if (opt.count || opt.type === "count") {
        this.count(key);
      }
      if (typeof opt.global === "boolean") {
        this.global(key, opt.global);
      }
      if (opt.defaultDescription) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = opt.defaultDescription;
      }
      if (opt.skipValidation) {
        this.skipValidation(key);
      }
      const desc = opt.describe || opt.description || opt.desc;
      const descriptions = __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions();
      if (!Object.prototype.hasOwnProperty.call(descriptions, key) || typeof desc === "string") {
        this.describe(key, desc);
      }
      if (opt.hidden) {
        this.hide(key);
      }
      if (opt.requiresArg) {
        this.requiresArg(key);
      }
    }
    return this;
  }
  options(key, opt) {
    return this.option(key, opt);
  }
  parse(args, shortCircuit, _parseFn) {
    argsert("[string|array] [function|boolean|object] [function]", [args, shortCircuit, _parseFn], arguments.length);
    this[kFreeze]();
    if (typeof args === "undefined") {
      args = __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    }
    if (typeof shortCircuit === "object") {
      __classPrivateFieldSet(this, _YargsInstance_parseContext, shortCircuit, "f");
      shortCircuit = _parseFn;
    }
    if (typeof shortCircuit === "function") {
      __classPrivateFieldSet(this, _YargsInstance_parseFn, shortCircuit, "f");
      shortCircuit = false;
    }
    if (!shortCircuit)
      __classPrivateFieldSet(this, _YargsInstance_processArgs, args, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
      __classPrivateFieldSet(this, _YargsInstance_exitProcess, false, "f");
    const parsed = this[kRunYargsParserAndExecuteCommands](args, !!shortCircuit);
    const tmpParsed = this.parsed;
    __classPrivateFieldGet(this, _YargsInstance_completion, "f").setParsed(this.parsed);
    if (isPromise(parsed)) {
      return parsed.then((argv2) => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
          __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), argv2, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        return argv2;
      }).catch((err) => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) {
          __classPrivateFieldGet(this, _YargsInstance_parseFn, "f")(err, this.parsed.argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        }
        throw err;
      }).finally(() => {
        this[kUnfreeze]();
        this.parsed = tmpParsed;
      });
    } else {
      if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
        __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), parsed, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
      this[kUnfreeze]();
      this.parsed = tmpParsed;
    }
    return parsed;
  }
  parseAsync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    return !isPromise(maybePromise) ? Promise.resolve(maybePromise) : maybePromise;
  }
  parseSync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    if (isPromise(maybePromise)) {
      throw new YError(".parseSync() must not be used with asynchronous builders, handlers, or middleware");
    }
    return maybePromise;
  }
  parserConfiguration(config) {
    argsert("<object>", [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_parserConfig, config, "f");
    return this;
  }
  pkgConf(key, rootPath) {
    argsert("<string> [string]", [key, rootPath], arguments.length);
    let conf = null;
    const obj = this[kPkgUp](rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"));
    if (obj[key] && typeof obj[key] === "object") {
      conf = applyExtends(obj[key], rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()["deep-merge-config"] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(conf);
    }
    return this;
  }
  positional(key, opts) {
    argsert("<string> <object>", [key, opts], arguments.length);
    const supportedOpts = [
      "default",
      "defaultDescription",
      "implies",
      "normalize",
      "choices",
      "conflicts",
      "coerce",
      "type",
      "describe",
      "desc",
      "description",
      "alias"
    ];
    opts = objFilter(opts, (k, v) => {
      if (k === "type" && !["string", "number", "boolean"].includes(v))
        return false;
      return supportedOpts.includes(k);
    });
    const fullCommand = __classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands[__classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands.length - 1];
    const parseOptions = fullCommand ? __classPrivateFieldGet(this, _YargsInstance_command, "f").cmdToParseOptions(fullCommand) : {
      array: [],
      alias: {},
      default: {},
      demand: {}
    };
    objectKeys(parseOptions).forEach((pk) => {
      const parseOption = parseOptions[pk];
      if (Array.isArray(parseOption)) {
        if (parseOption.indexOf(key) !== -1)
          opts[pk] = true;
      } else {
        if (parseOption[key] && !(pk in opts))
          opts[pk] = parseOption[key];
      }
    });
    this.group(key, __classPrivateFieldGet(this, _YargsInstance_usage, "f").getPositionalGroupName());
    return this.option(key, opts);
  }
  recommendCommands(recommend = true) {
    argsert("[boolean]", [recommend], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_recommendCommands, recommend, "f");
    return this;
  }
  required(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  require(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  requiresArg(keys) {
    argsert("<array|string|object> [number]", [keys], arguments.length);
    if (typeof keys === "string" && __classPrivateFieldGet(this, _YargsInstance_options, "f").narg[keys]) {
      return this;
    } else {
      this[kPopulateParserHintSingleValueDictionary](this.requiresArg.bind(this), "narg", keys, NaN);
    }
    return this;
  }
  showCompletionScript($0, cmd) {
    argsert("[string] [string]", [$0, cmd], arguments.length);
    $0 = $0 || this.$0;
    __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(__classPrivateFieldGet(this, _YargsInstance_completion, "f").generateCompletionScript($0, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || "completion"));
    return this;
  }
  showHelp(level) {
    argsert("[string|function]", [level], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), void 0, void 0, 0, true);
        if (isPromise(parse)) {
          parse.then(() => {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
          });
          return this;
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        builderResponse.then(() => {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
        });
        return this;
      }
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
    return this;
  }
  scriptName(scriptName) {
    this.customScriptName = true;
    this.$0 = scriptName;
    return this;
  }
  showHelpOnFail(enabled, message) {
    argsert("[boolean|string] [string]", [enabled, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelpOnFail(enabled, message);
    return this;
  }
  showVersion(level) {
    argsert("[string|function]", [level], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion(level);
    return this;
  }
  skipValidation(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("skipValidation", keys);
    return this;
  }
  strict(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strict, enabled !== false, "f");
    return this;
  }
  strictCommands(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictCommands, enabled !== false, "f");
    return this;
  }
  strictOptions(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictOptions, enabled !== false, "f");
    return this;
  }
  string(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("string", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  terminalWidth() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.stdColumns;
  }
  updateLocale(obj) {
    return this.updateStrings(obj);
  }
  updateStrings(obj) {
    argsert("<object>", [obj], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.updateLocale(obj);
    return this;
  }
  usage(msg, description, builder, handler) {
    argsert("<string|null|undefined> [string|boolean] [function|object] [function]", [msg, description, builder, handler], arguments.length);
    if (description !== void 0) {
      assertNotStrictEqual(msg, null, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if ((msg || "").match(/^\$0( |$)/)) {
        return this.command(msg, description, builder, handler);
      } else {
        throw new YError(".usage() description must start with $0 if being used as alias for .command()");
      }
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").usage(msg);
      return this;
    }
  }
  usageConfiguration(config) {
    argsert("<object>", [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_usageConfig, config, "f");
    return this;
  }
  version(opt, msg, ver) {
    const defaultVersionOpt = "version";
    argsert("[boolean|string] [string] [string]", [opt, msg, ver], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(void 0);
      __classPrivateFieldSet(this, _YargsInstance_versionOpt, null, "f");
    }
    if (arguments.length === 0) {
      ver = this[kGuessVersion]();
      opt = defaultVersionOpt;
    } else if (arguments.length === 1) {
      if (opt === false) {
        return this;
      }
      ver = opt;
      opt = defaultVersionOpt;
    } else if (arguments.length === 2) {
      ver = msg;
      msg = void 0;
    }
    __classPrivateFieldSet(this, _YargsInstance_versionOpt, typeof opt === "string" ? opt : defaultVersionOpt, "f");
    msg = msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show version number");
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(ver || void 0);
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"), msg);
    return this;
  }
  wrap(cols) {
    argsert("<number|null|undefined>", [cols], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").wrap(cols);
    return this;
  }
  [(_YargsInstance_command = /* @__PURE__ */ new WeakMap(), _YargsInstance_cwd = /* @__PURE__ */ new WeakMap(), _YargsInstance_context = /* @__PURE__ */ new WeakMap(), _YargsInstance_completion = /* @__PURE__ */ new WeakMap(), _YargsInstance_completionCommand = /* @__PURE__ */ new WeakMap(), _YargsInstance_defaultShowHiddenOpt = /* @__PURE__ */ new WeakMap(), _YargsInstance_exitError = /* @__PURE__ */ new WeakMap(), _YargsInstance_detectLocale = /* @__PURE__ */ new WeakMap(), _YargsInstance_emittedWarnings = /* @__PURE__ */ new WeakMap(), _YargsInstance_exitProcess = /* @__PURE__ */ new WeakMap(), _YargsInstance_frozens = /* @__PURE__ */ new WeakMap(), _YargsInstance_globalMiddleware = /* @__PURE__ */ new WeakMap(), _YargsInstance_groups = /* @__PURE__ */ new WeakMap(), _YargsInstance_hasOutput = /* @__PURE__ */ new WeakMap(), _YargsInstance_helpOpt = /* @__PURE__ */ new WeakMap(), _YargsInstance_isGlobalContext = /* @__PURE__ */ new WeakMap(), _YargsInstance_logger = /* @__PURE__ */ new WeakMap(), _YargsInstance_output = /* @__PURE__ */ new WeakMap(), _YargsInstance_options = /* @__PURE__ */ new WeakMap(), _YargsInstance_parentRequire = /* @__PURE__ */ new WeakMap(), _YargsInstance_parserConfig = /* @__PURE__ */ new WeakMap(), _YargsInstance_parseFn = /* @__PURE__ */ new WeakMap(), _YargsInstance_parseContext = /* @__PURE__ */ new WeakMap(), _YargsInstance_pkgs = /* @__PURE__ */ new WeakMap(), _YargsInstance_preservedGroups = /* @__PURE__ */ new WeakMap(), _YargsInstance_processArgs = /* @__PURE__ */ new WeakMap(), _YargsInstance_recommendCommands = /* @__PURE__ */ new WeakMap(), _YargsInstance_shim = /* @__PURE__ */ new WeakMap(), _YargsInstance_strict = /* @__PURE__ */ new WeakMap(), _YargsInstance_strictCommands = /* @__PURE__ */ new WeakMap(), _YargsInstance_strictOptions = /* @__PURE__ */ new WeakMap(), _YargsInstance_usage = /* @__PURE__ */ new WeakMap(), _YargsInstance_usageConfig = /* @__PURE__ */ new WeakMap(), _YargsInstance_versionOpt = /* @__PURE__ */ new WeakMap(), _YargsInstance_validation = /* @__PURE__ */ new WeakMap(), kCopyDoubleDash)](argv2) {
    if (!argv2._ || !argv2["--"])
      return argv2;
    argv2._.push.apply(argv2._, argv2["--"]);
    try {
      delete argv2["--"];
    } catch (_err) {
    }
    return argv2;
  }
  [kCreateLogger]() {
    return {
      log: (...args) => {
        if (!this[kHasParseCallback]())
          console.log(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length)
          __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + "\n", "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(" "), "f");
      },
      error: (...args) => {
        if (!this[kHasParseCallback]())
          console.error(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length)
          __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + "\n", "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(" "), "f");
      }
    };
  }
  [kDeleteFromParserHintObject](optionKey) {
    objectKeys(__classPrivateFieldGet(this, _YargsInstance_options, "f")).forEach((hintKey) => {
      if (/* @__PURE__ */ ((key) => key === "configObjects")(hintKey))
        return;
      const hint = __classPrivateFieldGet(this, _YargsInstance_options, "f")[hintKey];
      if (Array.isArray(hint)) {
        if (hint.includes(optionKey))
          hint.splice(hint.indexOf(optionKey), 1);
      } else if (typeof hint === "object") {
        delete hint[optionKey];
      }
    });
    delete __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions()[optionKey];
  }
  [kEmitWarning](warning, type, deduplicationId) {
    if (!__classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId]) {
      __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.emitWarning(warning, type);
      __classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId] = true;
    }
  }
  [kFreeze]() {
    __classPrivateFieldGet(this, _YargsInstance_frozens, "f").push({
      options: __classPrivateFieldGet(this, _YargsInstance_options, "f"),
      configObjects: __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects.slice(0),
      exitProcess: __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"),
      groups: __classPrivateFieldGet(this, _YargsInstance_groups, "f"),
      strict: __classPrivateFieldGet(this, _YargsInstance_strict, "f"),
      strictCommands: __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f"),
      strictOptions: __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f"),
      completionCommand: __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"),
      output: __classPrivateFieldGet(this, _YargsInstance_output, "f"),
      exitError: __classPrivateFieldGet(this, _YargsInstance_exitError, "f"),
      hasOutput: __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f"),
      parsed: this.parsed,
      parseFn: __classPrivateFieldGet(this, _YargsInstance_parseFn, "f"),
      parseContext: __classPrivateFieldGet(this, _YargsInstance_parseContext, "f")
    });
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").freeze();
  }
  [kGetDollarZero]() {
    let $0 = "";
    let default$0;
    if (/\b(node|iojs|electron)(\.exe)?$/.test(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv()[0])) {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(1, 2);
    } else {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(0, 1);
    }
    $0 = default$0.map((x) => {
      const b = this[kRebase](__classPrivateFieldGet(this, _YargsInstance_cwd, "f"), x);
      return x.match(/^(\/|([a-zA-Z]:)?\\)/) && b.length < x.length ? b : x;
    }).join(" ").trim();
    if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_") && __classPrivateFieldGet(this, _YargsInstance_shim, "f").getProcessArgvBin() === __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_")) {
      $0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_").replace(`${__classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.execPath())}/`, "");
    }
    return $0;
  }
  [kGetParserConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_parserConfig, "f");
  }
  [kGetUsageConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_usageConfig, "f");
  }
  [kGuessLocale]() {
    if (!__classPrivateFieldGet(this, _YargsInstance_detectLocale, "f"))
      return;
    const locale = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LC_ALL") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LC_MESSAGES") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LANG") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LANGUAGE") || "en_US";
    this.locale(locale.replace(/[.:].*/, ""));
  }
  [kGuessVersion]() {
    const obj = this[kPkgUp]();
    return obj.version || "unknown";
  }
  [kParsePositionalNumbers](argv2) {
    const args = argv2["--"] ? argv2["--"] : argv2._;
    for (let i = 0, arg; (arg = args[i]) !== void 0; i++) {
      if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.looksLikeNumber(arg) && Number.isSafeInteger(Math.floor(parseFloat(`${arg}`)))) {
        args[i] = Number(arg);
      }
    }
    return argv2;
  }
  [kPkgUp](rootPath) {
    const npath = rootPath || "*";
    if (__classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath])
      return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
    let obj = {};
    try {
      let startDir = rootPath || __classPrivateFieldGet(this, _YargsInstance_shim, "f").mainFilename;
      if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").path.extname(startDir)) {
        startDir = __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(startDir);
      }
      const pkgJsonPath = __classPrivateFieldGet(this, _YargsInstance_shim, "f").findUp(startDir, (dir, names) => {
        if (names.includes("package.json")) {
          return "package.json";
        } else {
          return void 0;
        }
      });
      assertNotStrictEqual(pkgJsonPath, void 0, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      obj = JSON.parse(__classPrivateFieldGet(this, _YargsInstance_shim, "f").readFileSync(pkgJsonPath, "utf8"));
    } catch (_noop) {
    }
    __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath] = obj || {};
    return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
  }
  [kPopulateParserHintArray](type, keys) {
    keys = [].concat(keys);
    keys.forEach((key) => {
      key = this[kSanitizeKey](key);
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type].push(key);
    });
  }
  [kPopulateParserHintSingleValueDictionary](builder, type, key, value) {
    this[kPopulateParserHintDictionary](builder, type, key, value, (type2, key2, value2) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type2][key2] = value2;
    });
  }
  [kPopulateParserHintArrayDictionary](builder, type, key, value) {
    this[kPopulateParserHintDictionary](builder, type, key, value, (type2, key2, value2) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type2][key2] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[type2][key2] || []).concat(value2);
    });
  }
  [kPopulateParserHintDictionary](builder, type, key, value, singleKeyHandler) {
    if (Array.isArray(key)) {
      key.forEach((k) => {
        builder(k, value);
      });
    } else if (/* @__PURE__ */ ((key2) => typeof key2 === "object")(key)) {
      for (const k of objectKeys(key)) {
        builder(k, key[k]);
      }
    } else {
      singleKeyHandler(type, this[kSanitizeKey](key), value);
    }
  }
  [kSanitizeKey](key) {
    if (key === "__proto__")
      return "___proto___";
    return key;
  }
  [kSetKey](key, set) {
    this[kPopulateParserHintSingleValueDictionary](this[kSetKey].bind(this), "key", key, set);
    return this;
  }
  [kUnfreeze]() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const frozen = __classPrivateFieldGet(this, _YargsInstance_frozens, "f").pop();
    assertNotStrictEqual(frozen, void 0, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
    let configObjects;
    _a = this, _b = this, _c = this, _d = this, _e = this, _f = this, _g = this, _h = this, _j = this, _k = this, _l = this, _m = this, {
      options: { set value(_o) {
        __classPrivateFieldSet(_a, _YargsInstance_options, _o, "f");
      } }.value,
      configObjects,
      exitProcess: { set value(_o) {
        __classPrivateFieldSet(_b, _YargsInstance_exitProcess, _o, "f");
      } }.value,
      groups: { set value(_o) {
        __classPrivateFieldSet(_c, _YargsInstance_groups, _o, "f");
      } }.value,
      output: { set value(_o) {
        __classPrivateFieldSet(_d, _YargsInstance_output, _o, "f");
      } }.value,
      exitError: { set value(_o) {
        __classPrivateFieldSet(_e, _YargsInstance_exitError, _o, "f");
      } }.value,
      hasOutput: { set value(_o) {
        __classPrivateFieldSet(_f, _YargsInstance_hasOutput, _o, "f");
      } }.value,
      parsed: this.parsed,
      strict: { set value(_o) {
        __classPrivateFieldSet(_g, _YargsInstance_strict, _o, "f");
      } }.value,
      strictCommands: { set value(_o) {
        __classPrivateFieldSet(_h, _YargsInstance_strictCommands, _o, "f");
      } }.value,
      strictOptions: { set value(_o) {
        __classPrivateFieldSet(_j, _YargsInstance_strictOptions, _o, "f");
      } }.value,
      completionCommand: { set value(_o) {
        __classPrivateFieldSet(_k, _YargsInstance_completionCommand, _o, "f");
      } }.value,
      parseFn: { set value(_o) {
        __classPrivateFieldSet(_l, _YargsInstance_parseFn, _o, "f");
      } }.value,
      parseContext: { set value(_o) {
        __classPrivateFieldSet(_m, _YargsInstance_parseContext, _o, "f");
      } }.value
    } = frozen;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = configObjects;
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").unfreeze();
  }
  [kValidateAsync](validation2, argv2) {
    return maybeAsyncResult(argv2, (result) => {
      validation2(result);
      return result;
    });
  }
  getInternalMethods() {
    return {
      getCommandInstance: this[kGetCommandInstance].bind(this),
      getContext: this[kGetContext].bind(this),
      getHasOutput: this[kGetHasOutput].bind(this),
      getLoggerInstance: this[kGetLoggerInstance].bind(this),
      getParseContext: this[kGetParseContext].bind(this),
      getParserConfiguration: this[kGetParserConfiguration].bind(this),
      getUsageConfiguration: this[kGetUsageConfiguration].bind(this),
      getUsageInstance: this[kGetUsageInstance].bind(this),
      getValidationInstance: this[kGetValidationInstance].bind(this),
      hasParseCallback: this[kHasParseCallback].bind(this),
      isGlobalContext: this[kIsGlobalContext].bind(this),
      postProcess: this[kPostProcess].bind(this),
      reset: this[kReset].bind(this),
      runValidation: this[kRunValidation].bind(this),
      runYargsParserAndExecuteCommands: this[kRunYargsParserAndExecuteCommands].bind(this),
      setHasOutput: this[kSetHasOutput].bind(this)
    };
  }
  [kGetCommandInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_command, "f");
  }
  [kGetContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_context, "f");
  }
  [kGetHasOutput]() {
    return __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f");
  }
  [kGetLoggerInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_logger, "f");
  }
  [kGetParseContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_parseContext, "f") || {};
  }
  [kGetUsageInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_usage, "f");
  }
  [kGetValidationInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_validation, "f");
  }
  [kHasParseCallback]() {
    return !!__classPrivateFieldGet(this, _YargsInstance_parseFn, "f");
  }
  [kIsGlobalContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_isGlobalContext, "f");
  }
  [kPostProcess](argv2, populateDoubleDash, calledFromCommand, runGlobalMiddleware) {
    if (calledFromCommand)
      return argv2;
    if (isPromise(argv2))
      return argv2;
    if (!populateDoubleDash) {
      argv2 = this[kCopyDoubleDash](argv2);
    }
    const parsePositionalNumbers = this[kGetParserConfiguration]()["parse-positional-numbers"] || this[kGetParserConfiguration]()["parse-positional-numbers"] === void 0;
    if (parsePositionalNumbers) {
      argv2 = this[kParsePositionalNumbers](argv2);
    }
    if (runGlobalMiddleware) {
      argv2 = applyMiddleware(argv2, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
    }
    return argv2;
  }
  [kReset](aliases = {}) {
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f") || {}, "f");
    const tmpOptions = {};
    tmpOptions.local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local || [];
    tmpOptions.configObjects = __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || [];
    const localLookup = {};
    tmpOptions.local.forEach((l) => {
      localLookup[l] = true;
      (aliases[l] || []).forEach((a) => {
        localLookup[a] = true;
      });
    });
    Object.assign(__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"), Object.keys(__classPrivateFieldGet(this, _YargsInstance_groups, "f")).reduce((acc, groupName) => {
      const keys = __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName].filter((key) => !(key in localLookup));
      if (keys.length > 0) {
        acc[groupName] = keys;
      }
      return acc;
    }, {}));
    __classPrivateFieldSet(this, _YargsInstance_groups, {}, "f");
    const arrayOptions = [
      "array",
      "boolean",
      "string",
      "skipValidation",
      "count",
      "normalize",
      "number",
      "hiddenOptions"
    ];
    const objectOptions = [
      "narg",
      "key",
      "alias",
      "default",
      "defaultDescription",
      "config",
      "choices",
      "demandedOptions",
      "demandedCommands",
      "deprecatedOptions"
    ];
    arrayOptions.forEach((k) => {
      tmpOptions[k] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[k] || []).filter((k2) => !localLookup[k2]);
    });
    objectOptions.forEach((k) => {
      tmpOptions[k] = objFilter(__classPrivateFieldGet(this, _YargsInstance_options, "f")[k], (k2) => !localLookup[k2]);
    });
    tmpOptions.envPrefix = __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
    __classPrivateFieldSet(this, _YargsInstance_options, tmpOptions, "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f") ? __classPrivateFieldGet(this, _YargsInstance_usage, "f").reset(localLookup) : usage(this, __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f") ? __classPrivateFieldGet(this, _YargsInstance_validation, "f").reset(localLookup) : validation(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f") ? __classPrivateFieldGet(this, _YargsInstance_command, "f").reset() : command(__classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_validation, "f"), __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_completion, "f"))
      __classPrivateFieldSet(this, _YargsInstance_completion, completion(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_command, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").reset();
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_output, "", "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, false, "f");
    this.parsed = false;
    return this;
  }
  [kRebase](base, dir) {
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.relative(base, dir);
  }
  [kRunYargsParserAndExecuteCommands](args, shortCircuit, calledFromCommand, commandIndex = 0, helpOnly = false) {
    var _a, _b, _c, _d;
    let skipValidation = !!calledFromCommand || helpOnly;
    args = args || __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").__ = __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration = this[kGetParserConfiguration]();
    const populateDoubleDash = !!__classPrivateFieldGet(this, _YargsInstance_options, "f").configuration["populate--"];
    const config = Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration, {
      "populate--": true
    });
    const parsed = __classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.detailed(args, Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f"), {
      configuration: { "parse-positional-numbers": false, ...config }
    }));
    const argv2 = Object.assign(parsed.argv, __classPrivateFieldGet(this, _YargsInstance_parseContext, "f"));
    let argvPromise = void 0;
    const aliases = parsed.aliases;
    let helpOptSet = false;
    let versionOptSet = false;
    Object.keys(argv2).forEach((key) => {
      if (key === __classPrivateFieldGet(this, _YargsInstance_helpOpt, "f") && argv2[key]) {
        helpOptSet = true;
      } else if (key === __classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && argv2[key]) {
        versionOptSet = true;
      }
    });
    argv2.$0 = this.$0;
    this.parsed = parsed;
    if (commandIndex === 0) {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").clearCachedHelpMessage();
    }
    try {
      this[kGuessLocale]();
      if (shortCircuit) {
        return this[kPostProcess](argv2, populateDoubleDash, !!calledFromCommand, false);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
        const helpCmds = [__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")].concat(aliases[__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")] || []).filter((k) => k.length > 1);
        if (helpCmds.includes("" + argv2._[argv2._.length - 1])) {
          argv2._.pop();
          helpOptSet = true;
        }
      }
      __classPrivateFieldSet(this, _YargsInstance_isGlobalContext, false, "f");
      const handlerKeys = __classPrivateFieldGet(this, _YargsInstance_command, "f").getCommands();
      const requestCompletions = ((_a = __classPrivateFieldGet(this, _YargsInstance_completion, "f")) === null || _a === void 0 ? void 0 : _a.completionKey) ? [
        (_b = __classPrivateFieldGet(this, _YargsInstance_completion, "f")) === null || _b === void 0 ? void 0 : _b.completionKey,
        ...(_d = this.getAliases()[(_c = __classPrivateFieldGet(this, _YargsInstance_completion, "f")) === null || _c === void 0 ? void 0 : _c.completionKey]) !== null && _d !== void 0 ? _d : []
      ].some((key) => Object.prototype.hasOwnProperty.call(argv2, key)) : false;
      const skipRecommendation = helpOptSet || requestCompletions || helpOnly;
      if (argv2._.length) {
        if (handlerKeys.length) {
          let firstUnknownCommand;
          for (let i = commandIndex || 0, cmd; argv2._[i] !== void 0; i++) {
            cmd = String(argv2._[i]);
            if (handlerKeys.includes(cmd) && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(cmd, this, parsed, i + 1, helpOnly, helpOptSet || versionOptSet || helpOnly);
              return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
            } else if (!firstUnknownCommand && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              firstUnknownCommand = cmd;
              break;
            }
          }
          if (!__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && __classPrivateFieldGet(this, _YargsInstance_recommendCommands, "f") && firstUnknownCommand && !skipRecommendation) {
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").recommendCommands(firstUnknownCommand, handlerKeys);
          }
        }
        if (__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") && argv2._.includes(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) && !requestCompletions) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          this.showCompletionScript();
          this.exit(0);
        }
      }
      if (__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && !skipRecommendation) {
        const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(null, this, parsed, 0, helpOnly, helpOptSet || versionOptSet || helpOnly);
        return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
      }
      if (requestCompletions) {
        if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
          setBlocking(true);
        args = [].concat(args);
        const completionArgs = args.slice(args.indexOf(`--${__classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey}`) + 1);
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(completionArgs, (err, completions) => {
          if (err)
            throw new YError(err.message);
          (completions || []).forEach((completion2) => {
            __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(completion2);
          });
          this.exit(0);
        });
        return this[kPostProcess](argv2, !populateDoubleDash, !!calledFromCommand, false);
      }
      if (!__classPrivateFieldGet(this, _YargsInstance_hasOutput, "f")) {
        if (helpOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          skipValidation = true;
          this.showHelp((message) => {
            __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(message);
            this.exit(0);
          });
        } else if (versionOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          skipValidation = true;
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion("log");
          this.exit(0);
        }
      }
      if (!skipValidation && __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.length > 0) {
        skipValidation = Object.keys(argv2).some((key) => __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.indexOf(key) >= 0 && argv2[key] === true);
      }
      if (!skipValidation) {
        if (parsed.error)
          throw new YError(parsed.error.message);
        if (!requestCompletions) {
          const validation2 = this[kRunValidation](aliases, {}, parsed.error);
          if (!calledFromCommand) {
            argvPromise = applyMiddleware(argv2, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), true);
          }
          argvPromise = this[kValidateAsync](validation2, argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv2);
          if (isPromise(argvPromise) && !calledFromCommand) {
            argvPromise = argvPromise.then(() => {
              return applyMiddleware(argv2, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
            });
          }
        }
      }
    } catch (err) {
      if (err instanceof YError)
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message, err);
      else
        throw err;
    }
    return this[kPostProcess](argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv2, populateDoubleDash, !!calledFromCommand, true);
  }
  [kRunValidation](aliases, positionalMap, parseErrors, isDefaultCommand) {
    const demandedOptions = { ...this.getDemandedOptions() };
    return (argv2) => {
      if (parseErrors)
        throw new YError(parseErrors.message);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").nonOptionCount(argv2);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").requiredArguments(argv2, demandedOptions);
      let failedStrictCommands = false;
      if (__classPrivateFieldGet(this, _YargsInstance_strictCommands, "f")) {
        failedStrictCommands = __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownCommands(argv2);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_strict, "f") && !failedStrictCommands) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv2, aliases, positionalMap, !!isDefaultCommand);
      } else if (__classPrivateFieldGet(this, _YargsInstance_strictOptions, "f")) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv2, aliases, {}, false, false);
      }
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").limitedChoices(argv2);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").implications(argv2);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicting(argv2);
    };
  }
  [kSetHasOutput]() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
  }
  [kTrackManuallySetKeys](keys) {
    if (typeof keys === "string") {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
    } else {
      for (const k of keys) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").key[k] = true;
      }
    }
  }
}
function isYargsInstance(y) {
  return !!y && typeof y.getInternalMethods === "function";
}
const Yargs = YargsFactory(esmPlatformShim);
const cappa = "[A-ZÁĆÉǴÍḰĹḾŃÓṔŔŚÚẂÝŹÄËḦÏÖÜẄẌŸǍČĎĚǦȞǏǨĽŇǑŘŠŤǓŽÀÈÌǸÒÙẀỲΓΔΘΛΞΠΣΦΨΩ]";
const get_last = (arr) => (
  // This thing fetches the last item of an array
  arr == null ? void 0 : arr[arr.length - 1]
);
const get_first = (arr) => (
  // This thing fetches the first item of an array
  arr == null ? void 0 : arr[0]
);
function capitalise(str) {
  return str[0].toUpperCase() + str.slice(1);
}
const make_percentage = (input) => {
  const num = Number(input);
  return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};
function swap_first_last_items(array) {
  if (array.length >= 2) {
    const first_item = array[0];
    const last_item_index = array.length - 1;
    const last_item = array[last_item_index];
    array[0] = last_item;
    array[last_item_index] = first_item;
  }
  return array;
}
function reverse_items(array) {
  return array.slice().reverse();
}
function final_sentence(items) {
  const len = items.length;
  if (len === 0) return "";
  if (len === 1) return items[0];
  const all_but_last = items.slice(0, len - 1).join(", ");
  const last = items[len - 1];
  return `${all_but_last} and ${last}`;
}
function recursive_expansion(input, mappings, enclose_in_brackets = false) {
  const mapping_keys = [...mappings.keys()].sort((a, b) => b.length - a.length);
  const resolve_mapping = (str, history = []) => {
    let result = "", i = 0;
    while (i < str.length) {
      let matched = false;
      for (const key of mapping_keys) {
        if (str.startsWith(key, i)) {
          if (history.includes(key)) {
            result += "�";
          } else {
            const entry = mappings.get(key);
            const resolved = resolve_mapping((entry == null ? void 0 : entry.content) || "", [
              ...history,
              key
            ]);
            result += enclose_in_brackets ? `{${resolved}}` : resolved;
          }
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) result += str[i++];
    }
    return result;
  };
  return resolve_mapping(input);
}
function graphemosis(input, canon_graphemes) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const g of canon_graphemes.sort((a, b) => b.length - a.length)) {
      if (input.startsWith(g, i)) {
        tokens.push(g);
        i += g.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(input[i]);
      i++;
    }
  }
  return tokens;
}
class Parser {
  constructor(logger, escape_mapper, supra_builder, num_of_words_string, output_mode, sort_words, remove_duplicates, force_word_limit, word_divider) {
    __publicField(this, "logger");
    __publicField(this, "escape_mapper");
    __publicField(this, "supra_builder");
    __publicField(this, "num_of_words");
    __publicField(this, "output_mode");
    __publicField(this, "remove_duplicates");
    __publicField(this, "force_word_limit");
    __publicField(this, "sort_words");
    __publicField(this, "word_divider");
    __publicField(this, "directive", "none");
    __publicField(this, "category_distribution");
    __publicField(this, "category_pending");
    __publicField(this, "units");
    __publicField(this, "optionals_weight");
    __publicField(this, "wordshape_distribution");
    __publicField(this, "wordshape_pending");
    __publicField(this, "feature_pending");
    __publicField(this, "transform_pending");
    __publicField(this, "graphemes");
    __publicField(this, "graphemes_pending", "");
    __publicField(this, "alphabet");
    __publicField(this, "invisible");
    __publicField(this, "file_line_num", 0);
    this.logger = logger;
    this.escape_mapper = escape_mapper;
    this.supra_builder = supra_builder;
    if (num_of_words_string === "") {
      num_of_words_string = "100";
    }
    let num_of_words = Number(num_of_words_string);
    if (isNaN(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not a number. Genearating 100 words instead`
      );
      num_of_words = 100;
    } else if (!Number.isInteger(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was rounded to the nearest whole number`
      );
      num_of_words = Math.ceil(num_of_words);
    }
    if (num_of_words > 1e5 || num_of_words < 1) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not between 1 and 100,000. Genearating 100 words instead`
      );
      num_of_words = 100;
    }
    this.num_of_words = num_of_words;
    this.output_mode = output_mode;
    this.sort_words = sort_words;
    this.remove_duplicates = remove_duplicates;
    this.force_word_limit = force_word_limit;
    this.word_divider = word_divider === "" ? " " : word_divider;
    this.word_divider = this.word_divider.replace(
      new RegExp("\\\\n", "g"),
      "\n"
    );
    if (this.output_mode === "paragraph") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.word_divider = " ";
    } else if (this.output_mode === "debug") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.word_divider = "\n";
    }
    this.category_distribution = "gusein-zade";
    this.category_pending = /* @__PURE__ */ new Map();
    this.optionals_weight = 10;
    this.units = /* @__PURE__ */ new Map();
    this.wordshape_distribution = "zipfian";
    this.wordshape_pending = { content: "", line_num: 0 };
    this.transform_pending = [];
    this.feature_pending = /* @__PURE__ */ new Map();
    this.alphabet = [];
    this.invisible = [];
    this.graphemes_pending = "";
    this.graphemes = [];
  }
  parse_file(file) {
    const file_array = file.split("\n");
    let my_decorator = "none";
    let my_directive = "none";
    let my_subdirective = "none";
    let my_header = [];
    let my_clusterfield_transform = [];
    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      let line = file_array[this.file_line_num];
      line = this.escape_mapper.escape_backslash_pairs(line);
      line = line.replace(/;.*/u, "").trim();
      line = this.escape_mapper.escape_named_escape(line);
      if (line.includes("&[")) {
        this.logger.validation_error(
          `Invalid named escape`,
          this.file_line_num
        );
      }
      if (line === "") {
        continue;
      }
      if (line.startsWith("@")) {
        my_decorator = this.parse_decorator(line, my_decorator);
        if (my_decorator != "none") {
          my_header = [];
          continue;
        }
      }
      const temp_directive = this.parse_directive(line, my_decorator);
      if (temp_directive != "none") {
        if (my_subdirective != "none") {
          this.logger.validation_error(
            `${my_subdirective} was not closed before directive change`,
            this.file_line_num
          );
        }
        my_directive = temp_directive;
        my_decorator = "none";
        continue;
      }
      if (my_directive === "none") {
        this.logger.validation_error(
          `Invalid syntax -- expected a decorator or directive`,
          this.file_line_num
        );
      }
      if (my_directive === "categories") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "category");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a category declaration`,
            this.file_line_num
          );
        }
        this.category_pending.set(key, {
          content: field,
          line_num: this.file_line_num
        });
      }
      if (my_directive === "words") {
        if (!this.valid_words_brackets(line)) {
          this.logger.validation_error(
            `Wordshapes had missmatched brackets`,
            this.file_line_num
          );
        }
        this.wordshape_pending.content += " " + line;
        this.wordshape_pending.line_num = this.file_line_num;
        continue;
      }
      if (my_directive === "units") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "unit");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a unit declaration`,
            this.file_line_num
          );
        }
        if (!this.validate_unit(field)) {
          this.logger.validation_error(
            `The unit '${key}' had separator(s) outside sets -- expected separators for units to appear only in sets`,
            this.file_line_num
          );
        }
        if (!this.valid_words_brackets(field)) {
          this.logger.validation_error(
            `The unit '${key}' had missmatched brackets`,
            this.file_line_num
          );
        }
        this.units.set(`<${key}>`, {
          content: `${field}`,
          line_num: this.file_line_num
        });
      }
      if (my_directive === "features") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "feature");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a feature declaration`,
            this.file_line_num
          );
        }
        const graphemes = field.split(/[,\s]+/).filter(Boolean);
        if (graphemes.length == 0) {
          this.logger.validation_error(
            `Feature ${key} had no graphemes`,
            this.file_line_num
          );
        }
        this.feature_pending.set(key, {
          content: graphemes.join(","),
          line_num: this.file_line_num
        });
      }
      if (my_directive === "feature-field") {
        if (my_header.length === 0) {
          const top_row = line.split(/[,\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num
            );
          }
          my_header = top_row;
          continue;
        } else {
          this.parse_featurefield(line, my_header);
        }
      }
      if (my_directive === "alphabet") {
        const alphabet = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < alphabet.length; i++) {
          alphabet[i] = this.escape_mapper.restore_escaped_chars(alphabet[i]);
        }
        this.alphabet.push(...alphabet);
      }
      if (my_directive === "invisible") {
        const invisible = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < invisible.length; i++) {
          invisible[i] = this.escape_mapper.restore_escaped_chars(invisible[i]);
        }
        this.invisible.push(...invisible);
      }
      if (my_directive === "graphemes") {
        this.graphemes_pending += " " + line;
        continue;
      }
      if (my_directive === "stage") {
        if (my_subdirective === "clusterfield") {
          if (line.startsWith(">")) {
            this.transform_pending.push(...my_clusterfield_transform);
            my_subdirective = "none";
            my_header = [];
            my_clusterfield_transform = [];
            continue;
          }
          my_clusterfield_transform = this.parse_clusterfield(
            line,
            my_header,
            my_clusterfield_transform
          );
          continue;
        } else if (line.startsWith("< ")) {
          my_clusterfield_transform.push({
            routine: null,
            target: "",
            result: "",
            conditions: [],
            exceptions: [],
            chance: null,
            line_num: this.file_line_num
          });
          line = line.substring(2).trim();
          const top_row = line.split(/[,\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num
            );
          }
          my_subdirective = "clusterfield";
          my_header = top_row;
          continue;
        } else if (line.startsWith("<routine")) {
          const my_routine = this.parse_routine(line);
          this.transform_pending.push({
            routine: my_routine,
            target: "\\",
            result: "\\",
            conditions: [],
            exceptions: [],
            chance: null,
            line_num: this.file_line_num
          });
          continue;
        } else {
          const [target, result, conditions, exceptions] = this.get_transform(line);
          this.transform_pending.push({
            routine: null,
            target,
            result,
            conditions,
            exceptions,
            chance: null,
            line_num: this.file_line_num
          });
          continue;
        }
      }
    }
    if (my_decorator != "none") {
      this.logger.validation_error(
        `Decorator '${my_decorator}' was not followed by a directive`,
        this.file_line_num
      );
    }
  }
  get_cat_seg_fea(input, mode) {
    const divider = "=";
    if (input === "") {
      return ["", "", false];
    }
    const divided = input.split(divider);
    if (divided.length !== 2) {
      return [input, "", false];
    }
    const key = divided[0].trim();
    const field = divided[1].trim();
    if (key === "" || field === "") {
      return [input, "", false];
    }
    const categoryRegex = new RegExp(`^${cappa}$`);
    const unitRegex = /^[A-Za-z+$-]+$/;
    const featureRegex = /^(\+|-|>)[a-zA-Z+-]+$/;
    if (mode === "category") {
      if (categoryRegex.test(key)) {
        return [key, field, true];
      }
    } else if (mode === "unit") {
      if (unitRegex.test(key)) {
        return [key, field, true];
      }
    } else if (mode === "feature") {
      if (featureRegex.test(key)) {
        return [key, field, true];
      }
    }
    return [input, "", false];
  }
  parse_distribution(value) {
    if (value.toLowerCase().startsWith("g")) {
      return "gusein-zade";
    } else if (value.toLowerCase().startsWith("z")) {
      return "zipfian";
    } else if (value.toLowerCase().startsWith("s")) {
      return "shallow";
    }
    return "flat";
  }
  validate_unit(str) {
    let inside_square = false;
    let inside_paren = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "{") inside_square = true;
      else if (char === "}") inside_square = false;
      else if (char === "(") inside_paren = true;
      else if (char === ")") inside_paren = false;
      if ((char === "," || char === " ") && !inside_square && !inside_paren) {
        return false;
      }
    }
    return true;
  }
  parse_decorator(line, old_decorator) {
    let new_decorator = "none";
    line = line.substring(1);
    line = this.escape_mapper.restore_preserve_escaped_chars(line);
    const dotCount = (line.match(/\./g) || []).length;
    const eqCount = (line.match(/=/g) || []).length;
    if (dotCount !== 1 || eqCount !== 1) {
      this.logger.validation_error(
        `Invalid decorator format`,
        this.file_line_num
      );
    }
    const [my_directive, my_thing] = line.split(/\.(.+)/).filter(Boolean);
    let [my_property, my_value] = my_thing.split("=");
    my_property = my_property.trim();
    my_value = my_value.trim();
    if (my_directive === "words") {
      if (my_property === "distribution") {
        this.wordshape_distribution = this.parse_distribution(my_value);
        new_decorator = "words";
      } else if (my_property === "optionals-weight") {
        const optionals_weight = make_percentage(my_value);
        if (optionals_weight == null) {
          this.logger.validation_error(
            `Invalid optionals-weight '${my_value}' -- expected a number between 1 and 100`,
            this.file_line_num
          );
        }
        this.optionals_weight = optionals_weight;
        new_decorator = "words";
      }
    } else if (my_directive === "categories") {
      if (my_property === "distribution") {
        this.wordshape_distribution = this.parse_distribution(my_value);
        new_decorator = "categories";
      }
    }
    if (new_decorator === "none") {
      this.logger.validation_error(`Invalid decorator`, this.file_line_num);
    } else if (old_decorator !== "none" && old_decorator !== new_decorator) {
      this.logger.validation_error(
        `Decorator mismatch -- expected '${old_decorator}' decorator after '${old_decorator}' decorator`,
        this.file_line_num
      );
    }
    return new_decorator;
  }
  parse_directive(line, current_decorator) {
    let temp_directive = "none";
    if (line === "categories:") {
      temp_directive = "categories";
    } else if (line === "words:") {
      temp_directive = "words";
    } else if (line === "units:") {
      temp_directive = "units";
    } else if (line === "alphabet:") {
      temp_directive = "alphabet";
    } else if (line === "invisible:") {
      temp_directive = "invisible";
    } else if (line === "graphemes:") {
      temp_directive = "graphemes";
    } else if (line === "features:") {
      temp_directive = "features";
    } else if (line === "feature-field:") {
      temp_directive = "feature-field";
    } else if (line === "stage:") {
      temp_directive = "stage";
    }
    if (temp_directive === "none") {
      return "none";
    }
    if (current_decorator != "none" && temp_directive != current_decorator) {
      this.logger.validation_error(
        `Directive mismatch -- expected '${current_decorator}' directive after '${current_decorator}' decorator`,
        this.file_line_num
      );
    }
    return temp_directive;
  }
  valid_words_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      ">": "<",
      "}": "{"
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  parse_clusterfield(line, my_header, my_transforms) {
    if (my_transforms.length === 0) {
      this.logger.validation_error(
        `Clusterfield transform not started properly`,
        this.file_line_num
      );
    }
    const my_transform = my_transforms[0];
    if (line.startsWith("/") || line.startsWith("!")) {
      const { conditions, exceptions } = this.get_environment(line);
      my_transform.conditions.push(...conditions);
      my_transform.exceptions.push(...exceptions);
      return [my_transform];
    }
    const my_row = line.split(/[,\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_row.length !== my_header.length || my_key === void 0) {
      this.logger.validation_error(
        `Cluster-field row length mismatch with header length -- expected row length of ${my_header.length} but got lenght of ${my_row.length}`,
        this.file_line_num
      );
    }
    const my_target = [];
    const my_result = [];
    for (let i = 0; i < my_header.length; ++i) {
      if (my_row[i] === "+") {
        continue;
      } else {
        my_target.push(my_key + my_header[i]);
        my_result.push(my_row[i]);
      }
    }
    my_transform.target += my_target.join(", ");
    my_transform.result += my_result.join(", ");
    return [my_transform];
  }
  parse_routine(line) {
    line = this.escape_mapper.restore_preserve_escaped_chars(line);
    const eqCount = (line.match(/=/g) || []).length;
    if (eqCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format1 '${line}'`,
        this.file_line_num
      );
    }
    let [, right2] = line.split("=");
    right2 = right2.trim();
    const gtCount = (right2.match(/>/g) || []).length;
    if (gtCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format2 '${line}'`,
        this.file_line_num
      );
    }
    let [routine] = right2.split(">");
    routine = routine.trim();
    routine = routine.replace(/\bcapitalize\b/g, "capitalise");
    routine = routine.replace(/\broman-to-hangeul\b/g, "roman-to-hangul");
    switch (routine) {
      case "reverse":
      case "compose":
      case "decompose":
      case "capitalise":
      case "roman-to-hangul":
      case "decapitalise":
      case "to-uppercase":
      case "to-lowercase":
      case "xsampa-to-ipa":
      case "ipa-to-xsampa":
        return routine;
    }
    this.logger.validation_error(
      `Invalid routine3 '${routine}'`,
      this.file_line_num
    );
  }
  // TRANSFORMS !!!
  // This is run on parsing file. We then have to run resolve_transforms aftter parse file
  get_transform(input) {
    if (input === "") {
      this.logger.validation_error(`No input`, this.file_line_num);
    }
    input = input.replace(/\/\//g, "!");
    const divided = input.split(/>>|->|→|=>|⇒/);
    if (divided.length === 1) {
      this.logger.validation_error(
        `No arrows in transform`,
        this.file_line_num
      );
    }
    if (divided.length !== 2) {
      this.logger.validation_error(
        `Too many arrows in transform`,
        this.file_line_num
      );
    }
    const target = divided[0].trim();
    if (target === "") {
      this.logger.validation_error(
        `Target is empty in transform`,
        this.file_line_num
      );
    }
    if (!this.valid_transform_brackets(target)) {
      this.logger.validation_error(
        `Target had missmatched brackets`,
        this.file_line_num
      );
    }
    const slash_index = divided[1].indexOf("/");
    const bang_index = divided[1].indexOf("!");
    const question_index = divided[1].indexOf("?");
    const delimiter_index = Math.min(
      slash_index === -1 ? Infinity : slash_index,
      bang_index === -1 ? Infinity : bang_index,
      question_index === -1 ? Infinity : question_index
    );
    const result = delimiter_index === Infinity ? divided[1].trim() : divided[1].slice(0, delimiter_index).trim();
    if (result == "") {
      this.logger.validation_error(
        `Result is empty in transform`,
        this.file_line_num
      );
    }
    if (!this.valid_transform_brackets(result)) {
      this.logger.validation_error(
        `Result had missmatched brackets`,
        this.file_line_num
      );
    }
    const environment = delimiter_index === Infinity ? "" : divided[1].slice(delimiter_index).trim();
    const { conditions, exceptions } = this.get_environment(environment);
    return [target, result, conditions, exceptions];
  }
  get_environment(environment_string) {
    const conditions = [];
    const exceptions = [];
    let buffer = "";
    let mode = "condition";
    for (let i = 0; i < environment_string.length; i++) {
      const ch = environment_string[i];
      if (ch === "/") {
        if (buffer.trim()) {
          const validated = this.validate_environment(buffer.trim(), mode);
          (mode === "condition" ? conditions : exceptions).push(validated);
        }
        buffer = "";
        mode = "condition";
      } else if (ch === "!") {
        if (buffer.trim()) {
          const validated = this.validate_environment(buffer.trim(), mode);
          (mode === "condition" ? conditions : exceptions).push(validated);
        }
        buffer = "";
        mode = "exception";
      } else {
        buffer += ch;
      }
    }
    if (buffer.trim()) {
      const unit = buffer.trim();
      const validated = this.validate_environment(unit, mode);
      (mode === "condition" ? conditions : exceptions).push(validated);
    }
    return {
      conditions,
      exceptions
    };
  }
  validate_environment(unit, kind) {
    if (kind === "chance") {
      const parsed = parseInt(unit, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return unit;
      } else {
        this.logger.validation_error(
          `Chance "${unit}" must be a number between 0 and 100`,
          this.file_line_num
        );
      }
    }
    const parts = unit.split("_");
    if (parts.length !== 2) {
      this.logger.validation_error(
        `${kind} "${unit}" must contain exactly one underscore`,
        this.file_line_num
      );
    }
    const [before, after] = parts;
    if (!before && !after) {
      this.logger.validation_error(
        `${kind} "${unit}" must have content on at least one side of '_'`,
        this.file_line_num
      );
    }
    return `${before}_${after}`;
  }
  parse_featurefield(line, top_row) {
    const my_row = line.split(/[,\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_row.length !== top_row.length || my_key === void 0) {
      this.logger.validation_error(
        `Feature-field row length mismatch with header length -- expected row length of ${top_row.length} but got lenght of ${my_row.length}`,
        this.file_line_num
      );
    }
    const keyRegex = /^[a-zA-Z+-]+$/;
    if (!keyRegex.test(my_key)) {
      this.logger.validation_error(
        `A feature in a feature-field must be of lowercase letters only.`,
        this.file_line_num
      );
    }
    const my_pro_graphemes = [];
    const my_anti_graphemes = [];
    const row_length = top_row.length;
    for (let i = 0; i < row_length; ++i) {
      if (my_row[i] === ".") {
        continue;
      } else if (my_row[i] === "+") {
        my_pro_graphemes.push(top_row[i]);
      } else if (my_row[i] === "-") {
        my_anti_graphemes.push(top_row[i]);
      }
    }
    if (my_pro_graphemes.length > 0) {
      this.feature_pending.set(`+${my_key}`, {
        content: my_pro_graphemes.join(","),
        line_num: this.file_line_num
      });
    }
    if (my_anti_graphemes.length > 0) {
      this.feature_pending.set(`-${my_key}`, {
        content: my_anti_graphemes.join(","),
        line_num: this.file_line_num
      });
    }
  }
  valid_transform_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      "}": "{",
      "]": "["
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
}
const _Word = class _Word {
  constructor(first_form, second_form) {
    __publicField(this, "transformations");
    __publicField(this, "forms");
    __publicField(this, "rejected");
    __publicField(this, "line_nums");
    this.transformations = [first_form];
    this.forms = [second_form];
    this.rejected = false;
    this.line_nums = [""];
  }
  get_last_form() {
    const output = get_last(this.forms);
    if (output == void 0) {
      return "undefined";
    }
    return output;
  }
  get_word() {
    let output = "";
    if (_Word.output_mode == "debug") {
      for (let i = 0; i < this.forms.length; i++) {
        if (i == 0) {
          output += `${this.transformations[i]} ➤ ⟨${this.forms[i]}⟩
`;
        } else if (!this.transformations[i]) {
          output += `⟨${this.forms[i]}⟩
`;
        } else {
          output += `${this.transformations[i]} ➤ ⟨${this.forms[i]}⟩ @ ln${this.line_nums[i]}
`;
        }
      }
      return output;
    }
    if (_Word.output_mode == "old-to-new") {
      output = `${this.forms[0]} => ${get_last(this.forms)}`;
      return output;
    }
    output = get_last(this.forms);
    if (output == void 0) {
      return "undefined";
    }
    return output;
  }
  record_transformation(rule, form, line_num = null) {
    this.transformations.push(rule);
    this.forms.push(form);
    let my_line_num = "";
    if (line_num != null) {
      my_line_num = `:${line_num + 1}`;
    }
    this.line_nums.push(my_line_num);
  }
};
__publicField(_Word, "output_mode", "word-list");
let Word = _Word;
function weighted_random_pick(items, weights) {
  const total_weight = weights.reduce((acc, w) => acc + w, 0);
  let random_value = Math.random() * total_weight;
  for (let i = 0; i < items.length; i++) {
    if (random_value < weights[i]) {
      return items[i];
    }
    random_value -= weights[i];
  }
  return "";
}
function supra_weighted_random_pick(items, weights) {
  for (let i = 0; i < items.length; i++) {
    if (weights[i] === "s") {
      return items[i];
    }
  }
  const total_weight = weights.reduce(
    (sum, w) => typeof w === "number" && w > 0 ? sum + w : sum,
    0
  );
  if (total_weight === 0) return "";
  let random_value = Math.random() * total_weight;
  for (let i = 0; i < items.length; i++) {
    const w = weights[i];
    if (typeof w !== "number" || w <= 0) continue;
    if (random_value < w) return items[i];
    random_value -= w;
  }
  return "";
}
function guseinzade_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(Math.log(no_of_items + 1) - Math.log(i + 1));
  }
  return weights;
}
function zipfian_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(10 / Math.pow(i + 1, 0.9));
  }
  return weights;
}
function shallow_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    const rank = i + 1;
    const t = i / (no_of_items - 1);
    const exponent = 0.5 - t * 0.07;
    weights.push(1 / Math.pow(rank, exponent));
  }
  return weights;
}
function flat_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(1);
  }
  return weights;
}
function get_distribution(n, default_distribution) {
  if (n == 1) return [1];
  if (default_distribution === "zipfian") return zipfian_distribution(n);
  if (default_distribution === "gusein-zade") return guseinzade_distribution(n);
  if (default_distribution === "shallow") return shallow_distribution(n);
  return flat_distribution(n);
}
class Word_Builder {
  constructor(escape_mapper, supra_builder, categories, wordshapes, category_distribution, optionals_weight, output_mode) {
    //private logger: Logger;
    __publicField(this, "escape_mapper");
    __publicField(this, "supra_builder");
    __publicField(this, "categories");
    __publicField(this, "wordshapes");
    __publicField(this, "category_distribution");
    __publicField(this, "optionals_weight");
    this.escape_mapper = escape_mapper;
    this.supra_builder = supra_builder;
    this.categories = categories;
    this.wordshapes = wordshapes;
    this.category_distribution = category_distribution;
    this.optionals_weight = optionals_weight;
    Word.output_mode = output_mode;
  }
  make_word() {
    let stage_one = weighted_random_pick(
      this.wordshapes.items,
      this.wordshapes.weights
    );
    const stage_two = this.resolve_wordshape_sets(
      stage_one,
      this.category_distribution,
      this.optionals_weight
    );
    let stage_three = stage_two;
    if (this.supra_builder.id_counter != 1) {
      const [ids, weights] = this.supra_builder.extract_letters_and_weights(stage_two);
      const chosen_id = supra_weighted_random_pick(ids, weights);
      stage_three = this.supra_builder.replace_letter_and_clean(
        stage_two,
        Number(chosen_id)
      );
    }
    let stage_four = "";
    for (let i = 0; i < stage_three.length; i++) {
      let new_char = stage_three[i];
      for (const [category_key, category_field] of this.categories) {
        if (category_key == new_char) {
          new_char = weighted_random_pick(
            category_field.graphemes,
            category_field.weights
          );
          break;
        }
      }
      stage_four += new_char;
    }
    let stage_five = stage_four.replace(/\^/g, "");
    if (this.escape_mapper.counter != 0) {
      stage_one = this.escape_mapper.restore_escaped_chars(stage_one);
      stage_five = this.escape_mapper.restore_escaped_chars(stage_five);
    }
    return new Word(stage_one, stage_five);
  }
  resolve_wordshape_sets(input_list, distribution, optionals_weight) {
    const curly_pattern = /\{[^{}]*\}/g;
    const round_pattern = /\([^()]*\)/g;
    let matches;
    let items = [];
    let outputs;
    while ((matches = input_list.match(round_pattern)) !== null) {
      const group = matches[matches.length - 1];
      const candidates = group.slice(1, -1).split(/[,\s]+/).filter(Boolean);
      const include = Math.random() * 100 < optionals_weight;
      if (include && candidates.length > 0) {
        const uses_explicit_weights = candidates.some((c) => c.includes("*"));
        const dist_type = uses_explicit_weights ? "flat" : distribution;
        outputs = this.extract_value_and_weight(candidates, dist_type);
        const selected = weighted_random_pick(outputs[0], outputs[1]);
        input_list = input_list.replace(group, selected);
      } else {
        input_list = input_list.replace(group, "");
      }
    }
    while ((matches = input_list.match(curly_pattern)) !== null) {
      const most_nested = matches[matches.length - 1];
      items = most_nested.slice(1, -1).split(/[,\s]+/).filter(Boolean);
      if (items.length === 0) {
        items = ["^"];
      } else {
        const uses_explicit_weights = items.some((c) => c.includes("*"));
        const dist_type = uses_explicit_weights ? "flat" : distribution;
        outputs = this.extract_value_and_weight(items, dist_type);
        const picked = weighted_random_pick(outputs[0], outputs[1]);
        items = [picked];
      }
      input_list = input_list.replace(most_nested, items[0]);
    }
    const final_pick = input_list;
    return final_pick;
  }
  extract_value_and_weight(input_list, default_distribution) {
    let my_values = [];
    let my_weights = [];
    const all_default_weights = input_list.every((item) => !item.includes("*"));
    if (all_default_weights) {
      my_values = input_list;
      my_weights = get_distribution(input_list.length, default_distribution);
      return [my_values, my_weights];
    }
    input_list.forEach((item) => {
      const [value, weight_str] = item.split("*");
      const weight = weight_str && !isNaN(Number(weight_str)) ? parseFloat(weight_str) : 1;
      my_values.push(value);
      my_weights.push(weight);
    });
    return [my_values, my_weights];
  }
}
class Reference_Mapper {
  constructor() {
    __publicField(this, "map", /* @__PURE__ */ new Map());
    __publicField(this, "capture_stream_index", null);
    __publicField(this, "capture_stream", []);
    __publicField(this, "is_capturing_sequence", false);
    this.map = /* @__PURE__ */ new Map();
  }
  reset_capture_stream_index() {
    this.capture_stream_index = null;
  }
  set_capture_stream_index(index) {
    this.capture_stream_index = index;
  }
  capture_reference(key, stream) {
    if (this.capture_stream_index === null) {
      const last_item = get_last(stream);
      if (last_item) {
        this.map.set(key, [last_item]);
      } else {
        this.map.set(key, [""]);
      }
    } else {
      const captured_sequence = stream.slice(this.capture_stream_index);
      this.map.set(key, captured_sequence);
    }
  }
  get_captured_reference(key) {
    return this.map.get(key) ?? [key];
  }
  clone() {
    const clone = new Reference_Mapper();
    clone.map = new Map(this.map);
    clone.capture_stream_index = this.capture_stream_index;
    return clone;
  }
  absorb(other) {
    for (const [key, value] of other.map.entries()) {
      this.map.set(key, value);
    }
  }
}
const xsampa_to_ipa_code_map = {
  "b_<": 595,
  // voiced bilabial implosive [ɓ]
  "d_<": 599,
  // voiced alveolar implosive [ɗ]
  "d`": 598,
  // voiced retroflex plosive [ɖ]
  "g_<": 608,
  // voiced velar implosive [ɠ]
  "h\\": 614,
  // voiced glottal fricative [ɦ]
  "j\\": 669,
  // voiced palatal fricative [ʝ]
  "l\\": 634,
  // alveolar lateral flap [ɺ]
  "l`": 621,
  // retroflex lateral approximant [ɭ]
  "n`": 627,
  // retroflex nasal [ɳ]
  "p\\": 632,
  // voiceless bilabial fricative [ɸ]
  "r\\": 633,
  // alveolar approximant [ɹ]
  "r\\`": 635,
  // retroflex approximant [ɻ]
  "r`": 637,
  // retroflex flap [ɽ]
  "s\\": 597,
  // voiceless alveolo-palatal fricative [ɕ]
  "s`": 642,
  // voiceless retroflex fricative [ʂ]
  "t`": 648,
  // voiceless retroflex plosive [ʈ]
  "x\\": 615,
  // voiceless palatal-velar fricative [ɧ]
  "z\\": 657,
  // voiced alveolo-palatal fricative [ʑ]
  "z`": 656,
  // voiced retroflex fricative [ʐ]
  A: 593,
  // open back unrounded vowel [ɑ]
  B: 946,
  // voiced bilabial fricative [β]
  "B\\": 665,
  // bilabial trill [ʙ]
  C: 231,
  // voiceless palatal fricative [ç]
  D: 240,
  // voiced dental fricative [ð]
  E: 603,
  // open-mid front unrounded vowel [ɛ]
  F: 625,
  // labiodental nasal [ɱ]
  G: 611,
  // voiced velar fricative [ɣ]
  "G\\": 610,
  // voiced uvular plosive [ɢ]
  "G\\_<": 667,
  // voiced uvular implosive [ʛ]
  H: 613,
  // labial-palatal approximant [ɥ]
  "H\\": 668,
  // voiceless epiglottal fricative [ʜ]
  I: 618,
  // near-close front unrounded vowel [ɪ]
  J: 626,
  // palatal nasal [ɲ]
  "J\\": 607,
  // voiced palatal plosive [ɟ]
  "J\\_<": 644,
  // voiced palatal implosive [ʄ]
  K: 620,
  // voiceless alveolar lateral fricative [ɬ]
  "K\\": 622,
  // voiced alveolar lateral fricative [ɮ]
  L: 654,
  // palatal lateral approximant [ʎ]
  "L\\": 671,
  // velar lateral approximant [ʟ]
  M: 623,
  // close back unrounded vowel [ɯ]
  "M\\": 624,
  // velar approximant [ɰ]
  N: 331,
  // velar nasal [ŋ]
  "N\\": 628,
  // uvular nasal [ɴ]
  O: 596,
  // open-mid back rounded vowel [ɔ]
  "O\\": 664,
  // bilabial click [ʘ]
  "v\\": 651,
  // labiodental approximant [ʋ]
  P: 651,
  // labiodental approximant [ʋ]
  Q: 594,
  // open back rounded vowel [ɒ]
  R: 641,
  // voiced uvular fricative [ʁ]
  "R\\": 640,
  // uvular trill [ʀ]
  S: 643,
  // voiceless postalveolar fricative [ʃ]
  T: 952,
  // voiceless dental fricative [θ]
  U: 650,
  // near-close back rounded vowel [ʊ]
  V: 652,
  // open-mid back unrounded vowel [ʌ]
  W: 653,
  // voiceless labial-velar fricative [ʍ]
  X: 967,
  // voiceless uvular fricative [χ]
  "X\\": 295,
  // voiceless pharyngeal fricative [ħ]
  Y: 655,
  // near-close front rounded vowel [ʏ]
  Z: 658,
  // voiced postalveolar fricative [ʒ]
  '"': 712,
  // primary stress [ˈ◌]
  "%": 716,
  // secondary stress [ˌ◌]
  ":": 720,
  // long [◌ː]
  ":\\": 721,
  // half long [◌ˑ]
  "@": 601,
  // schwa [ə]
  "@\\": 600,
  // close-mid central unrounded vowel [ɘ]
  "@`": 602,
  // r-coloured schwa [ɚ]
  "{": 230,
  // near-open front unrounded vowel [æ]
  "}": 649,
  // close central rounded vowel [ʉ]
  "1": 616,
  // close central unrounded vowel [ɨ]
  "2": 248,
  // close-mid front rounded vowel [ø]
  "3": 604,
  // open-mid central unrounded vowel [ɜ]
  "3\\": 606,
  // open-mid central rounded vowel [ɞ]
  "4": 638,
  // alveolar flap [ɾ]
  "5": 619,
  // velarized alveolar lateral approximant [ɫ]
  "6": 592,
  // near-open central vowel [ɐ]
  "7": 612,
  // close-mid back unrounded vowel [ɤ]
  "8": 629,
  // close-mid central rounded vowel [ɵ]
  "9": 339,
  // open-mid front rounded vowel [œ]
  "&": 630,
  // open front rounded vowel [ɶ]
  "?": 660,
  // glottal stop [ʔ]
  "?\\": 661,
  // voiced pharyngeal fricative [ʕ]
  "<\\": 674,
  // voiced epiglottal fricative [ʢ]
  ">\\": 673,
  // epiglottal plosive [ʡ]
  "^": 42779,
  // upstep [ꜛ]
  "!": 42780,
  // downstep [ꜜ]
  "!\\": 451,
  // (post)alveolar click [ǃ]
  "|": 124,
  // minor (foot) group [|]
  "|\\": 448,
  // dental click [ǀ]
  "||": 8214,
  // major (intonation) group [‖]
  "|\\|\\": 449,
  // alveolar lateral click [ǁ]
  "=\\": 450,
  // palatal click [ǂ]
  "-\\": 8255,
  // linking mark [‿]
  '_"': 776,
  // centralized [◌̈]
  "_+": 799,
  // advanced [◌̟]
  "_-": 800,
  // retracted [◌̠]
  _0: 805,
  // voiceless [◌̥]
  "_>": 700,
  // ejective [◌ʼ]
  "_?\\": 740,
  // pharyngealized [◌ˤ]
  "_^": 815,
  // non-syllabic [◌̯]
  "_}": 794,
  // no audible release [◌̚]
  "`": 734,
  // retroflexion & rhoticity [◌˞]
  "=": 809,
  // syllabic [◌̩]
  "_=": 809,
  // syllabic [◌̩]
  "~": 771,
  // anasalized [◌̃]
  "_~)": 771,
  // anasalized [◌̃]
  _A: 792,
  // advanced tongue root [◌̘]
  _a: 826,
  // apical [◌̺]
  _B: 783,
  // extra low tone [◌̏]
  _B_L: 7622,
  // low rising tone [◌᷆]
  _c: 796,
  // less rounded [◌̜]
  _d: 810,
  // dental [◌̪]
  _e: 820,
  // velarized or pharyngealized; also see 5 [◌̴]
  "<F>": 8600,
  // global fall [↘︎]
  _G: 736,
  // velarized [◌ˠ]
  _H: 769,
  // high tone [◌́]
  _H_T: 7620,
  // high rising tone [◌᷄]
  _h: 688,
  // aspirated [◌ʰ]
  _j: 690,
  // palatalized [◌ʲ]
  "'": 690,
  // palatalized [◌ʲ]
  _k: 816,
  // creaky voice [◌̰]
  _L: 768,
  // low tone [◌̀]
  _l: 737,
  // lateral release [◌ˡ]
  _M: 772,
  // mid tone [◌̄]
  _m: 827,
  // laminal [◌̻]
  _N: 828,
  // linguolabial [◌̼]
  _n: 8319,
  // nasal release [◌ⁿ]
  _O: 825,
  // more rounded [◌̹]
  _o: 798,
  // lowered [◌̞]
  _q: 793,
  // retracted tongue root [◌̙]
  "<R>": 8599,
  // global rise [↗︎]
  _R_F: 7624,
  // rising-falling tone [◌᷈]
  _r: 797,
  // raised [◌̝]
  _T: 779,
  // extra high tone [◌̋]
  _t: 804,
  // breathy voice [◌̤]
  _v: 812,
  // voiced [◌̬]
  _w: 695,
  // labialized [◌ʷ]
  _X: 774,
  // extra-short [◌̆]
  _x: 829,
  // mid-centralized [◌̽]
  _F: 770,
  // falling tone [◌̂]
  "_\\": 770,
  // falling tone [◌̂]
  _R: 780,
  // rising tone [◌̌]
  "_/": 780,
  // rising tone [◌̌]
  "b\\": 11377,
  // voiced labiodental flap [ⱱ]
  "!\\!\\": 8252,
  // retroflex click "ad hoc digraph" [‼︎]
  _f: 846,
  // whistled [◌͎]
  _i: 8595,
  // ingressive [◌↓]
  _s: 845,
  // spread lips [◌͍]
  _u: 840,
  // tenseness [◌͈]
  _W: 841,
  // weak articulation [◌͉]
  _z: 842
  // denasalisation [◌͊]
};
const ipa_code_map_to_xsampa = {
  595: "b_<",
  // voiced bilabial implosive [ɓ]
  599: "d_<",
  // voiced alveolar implosive [ɗ]
  598: "d`",
  // voiced retroflex plosive [ɖ]
  608: "g_<",
  // voiced velar implosive [ɠ]
  614: "h\\",
  // voiced glottal fricative [ɦ]
  669: "j\\",
  // voiced palatal fricative [ʝ]
  634: "l\\",
  // alveolar lateral flap [ɺ]
  621: "l`",
  // retroflex lateral approximant [ɭ]
  627: "n`",
  // retroflex nasal [ɳ]
  632: "p\\",
  // voiceless bilabial fricative [ɸ]
  633: "r\\",
  // alveolar approximant [ɹ]
  635: "r\\`",
  // retroflex approximant [ɻ]
  637: "r`",
  // retroflex flap [ɽ]
  597: "s\\",
  // voiceless alveolo-palatal fricative [ɕ]
  642: "s`",
  // voiceless retroflex fricative [ʂ]
  648: "t`",
  // voiceless retroflex plosive [ʈ]
  615: "x\\",
  // voiceless palatal-velar fricative [ɧ]
  657: "z\\",
  // voiced alveolo-palatal fricative [ʑ]
  656: "z`",
  // voiced retroflex fricative [ʐ]
  593: "A",
  // open back unrounded vowel [ɑ]
  946: "B",
  // voiced bilabial fricative [β]
  665: "B\\",
  // bilabial trill [ʙ]
  231: "C",
  // voiceless palatal fricative [ç]
  240: "D",
  // voiced dental fricative [ð]
  603: "E",
  // open-mid front unrounded vowel [ɛ]
  625: "F",
  // labiodental nasal [ɱ]
  611: "G",
  // voiced velar fricative [ɣ]
  610: "G\\",
  // voiced uvular plosive [ɢ]
  667: "G\\_<",
  // voiced uvular implosive [ʛ]
  613: "H",
  // labial-palatal approximant [ɥ]
  668: "H\\",
  // voiceless epiglottal fricative [ʜ]
  618: "I",
  // near-close front unrounded vowel [ɪ]
  626: "J",
  // palatal nasal [ɲ]
  607: "J\\",
  // voiced palatal plosive [ɟ]
  644: "J\\_<",
  // voiced palatal implosive [ʄ]
  620: "K",
  // voiceless alveolar lateral fricative [ɬ]
  622: "K\\",
  // voiced alveolar lateral fricative [ɮ]
  654: "L",
  // palatal lateral approximant [ʎ]
  671: "L\\",
  // velar lateral approximant [ʟ]
  623: "M",
  // close back unrounded vowel [ɯ]
  624: "M\\",
  // velar approximant [ɰ]
  331: "N",
  // velar nasal [ŋ]
  628: "N\\",
  // uvular nasal [ɴ]
  596: "O",
  // open-mid back rounded vowel [ɔ]
  664: "O\\",
  // bilabial click [ʘ]
  651: "v\\",
  // labiodental approximant [ʋ]
  594: "Q",
  // open back rounded vowel [ɒ]
  641: "R",
  // voiced uvular fricative [ʁ]
  640: "R\\",
  // uvular trill [ʀ]
  643: "S",
  // voiceless postalveolar fricative [ʃ]
  952: "T",
  // voiceless dental fricative [θ]
  650: "U",
  // near-close back rounded vowel [ʊ]
  652: "V",
  // open-mid back unrounded vowel [ʌ]
  653: "W",
  // voiceless labial-velar fricative [ʍ]
  967: "X",
  // voiceless uvular fricative [χ]
  295: "X\\",
  // voiceless pharyngeal fricative [ħ]
  655: "Y",
  // near-close front rounded vowel [ʏ]
  658: "Z",
  // voiced postalveolar fricative [ʒ]
  712: '"',
  // primary stress [ˈ◌]
  716: "%",
  // secondary stress [ˌ◌]
  720: ":",
  // long [◌ː]
  721: ":\\",
  // half long [◌ˑ]
  601: "@",
  // schwa [ə]
  600: "@\\",
  // close-mid central unrounded vowel [ɘ]
  602: "@`",
  // r-coloured schwa [ɚ]
  230: "{",
  // near-open front unrounded vowel [æ]
  649: "}",
  // close central rounded vowel [ʉ]
  616: "1",
  // close central unrounded vowel [ɨ]
  248: "2",
  // close-mid front rounded vowel [ø]
  604: "3",
  // open-mid central unrounded vowel [ɜ]
  606: "3\\",
  // open-mid central rounded vowel [ɞ]
  638: "4",
  // alveolar flap [ɾ]
  619: "5",
  // velarized alveolar lateral approximant [ɫ]
  592: "6",
  // near-open central vowel [ɐ]
  612: "7",
  // close-mid back unrounded vowel [ɤ]
  629: "8",
  // close-mid central rounded vowel [ɵ]
  339: "9",
  // open-mid front rounded vowel [œ]
  630: "&",
  // open front rounded vowel [ɶ]
  660: "?",
  // glottal stop [ʔ]
  661: "?\\",
  // voiced pharyngeal fricative [ʕ]
  674: "<\\",
  // voiced epiglottal fricative [ʢ]
  673: ">\\",
  // epiglottal plosive [ʡ]
  42779: "^",
  // upstep [ꜛ]
  42780: "!",
  // downstep [ꜜ]
  451: "!\\",
  // (post)alveolar click [ǃ]
  124: "|",
  // minor (foot) group [|]
  448: "|\\",
  // dental click [ǀ]
  8214: "||",
  // major (intonation) group [‖]
  449: "|\\|\\",
  // alveolar lateral click [ǁ]
  450: "=\\",
  // palatal click [ǂ]
  8255: "-\\",
  // linking mark [‿]
  776: '_"',
  // centralized [◌̈]
  799: "_+",
  // advanced [◌̟]
  800: "_-",
  // retracted [◌̠]
  805: "_0",
  // voiceless [◌̥]
  700: "_>",
  // ejective [◌ʼ]
  740: "_?\\",
  // pharyngealized [◌ˤ]
  815: "_^",
  // non-syllabic [◌̯]
  794: "_}",
  // no audible release [◌̚]
  734: "`",
  // retroflexion & rhoticity [◌˞]
  809: "=",
  // syllabic [◌̩]
  771: "~",
  // anasalized [◌̃]
  792: "_A",
  // advanced tongue root [◌̘]
  826: "_a",
  // apical [◌̺]
  783: "_B",
  // extra low tone [◌̏]
  7622: "_B_L",
  // low rising tone [◌᷆]
  796: "_c",
  // less rounded [◌̜]
  810: "_d",
  // dental [◌̪]
  820: "_e",
  // velarized or pharyngealized; also see 5 [◌̴]
  8600: "<F>",
  // global fall [↘︎]
  736: "_G",
  // velarized [◌ˠ]
  769: "_H",
  // high tone [◌́]
  7620: "_H_T",
  // high rising tone [◌᷄]
  688: "_h",
  // aspirated [◌ʰ]
  690: "_j",
  // palatalized [◌ʲ]
  816: "_k",
  // creaky voice [◌̰]
  768: "_L",
  // low tone [◌̀]
  737: "_l",
  // lateral release [◌ˡ]
  772: "_M",
  // mid tone [◌̄]
  827: "_m",
  // laminal [◌̻]
  828: "_N",
  // linguolabial [◌̼]
  8319: "_n",
  // nasal release [◌ⁿ]
  825: "_O",
  // more rounded [◌̹]
  798: "_o",
  // lowered [◌̞]
  793: "_q",
  // retracted tongue root [◌̙]
  8599: "<R>",
  // global rise [↗︎]
  7624: "_R_F",
  // rising-falling tone [◌᷈]
  797: "_r",
  // raised [◌̝]
  779: "_T",
  // extra high tone [◌̋]
  804: "_t",
  // breathy voice [◌̤]
  812: "_v",
  // voiced [◌̬]
  695: "_w",
  // labialized [◌ʷ]
  774: "_X",
  // extra-short [◌̆]"_w"
  829: "_x",
  // mid-centralized [◌̽]
  770: "_F",
  // falling tone [◌̂]
  780: "_R",
  // rising tone [◌̌]
  11377: "b\\",
  // voiced labiodental flap [ⱱ]
  8252: "!\\!\\",
  // retroflex click "ad hoc digraph" [‼︎]
  846: "_f",
  // whistled [◌͎]
  8595: "_i",
  // ingressive [◌↓]
  845: "_s",
  // spread lips [◌͍]
  840: "_u",
  // tenseness [◌͈]
  841: "_W",
  // weak articulation [◌͉]
  842: "_z"
  // denasalisation [◌͊]
};
function xsampa_to_ipa(input) {
  const tokens = Object.keys(xsampa_to_ipa_code_map).sort(
    (a, b) => b.length - a.length
  );
  let result = "";
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const token of tokens) {
      if (input.startsWith(token, i)) {
        const code = xsampa_to_ipa_code_map[token];
        result += String.fromCharCode(code);
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += input[i];
      i++;
    }
  }
  return result;
}
function ipa_to_xsampa(ipa_in) {
  let result = "";
  for (let i = 0; i < ipa_in.length; i++) {
    const code = ipa_in.charCodeAt(i);
    const xsampa = ipa_code_map_to_xsampa[code];
    result += xsampa !== void 0 ? xsampa : ipa_in[i];
  }
  return result;
}
const initials = {
  gk: 1,
  // ㄲ
  dt: 4,
  // ㄸ
  bp: 8,
  // ㅃ
  ch: 13,
  // ㅊ
  kh: 14,
  // ㅋ
  th: 15,
  // ㅌ
  ph: 17,
  // ㅍ
  k: 0,
  // ㄱ
  n: 2,
  // ㄴ
  t: 3,
  // ㄷ
  r: 5,
  // ㄹ
  m: 6,
  // ㅁ
  p: 7,
  // ㅂ
  s: 9,
  // ㅅ
  z: 10,
  // ㅆ
  c: 12,
  // ㅈ
  j: 13,
  // ㅉ
  x: 18
  // ㅎ
};
const finals = {
  gk: 2,
  // ㄲ
  gn: 21,
  // ㅇ
  ch: 23,
  // ㅊ
  kh: 24,
  // ㅋ
  th: 25,
  // ㅌ
  ph: 26,
  // ㅍ
  k: 1,
  // ㄱ
  n: 4,
  // ㄴ
  t: 7,
  // ㄷ
  r: 8,
  // ㄹ
  m: 16,
  // ㅁ
  p: 17,
  // ㅂ
  s: 19,
  // ㅅ
  z: 20,
  // ㅆ
  c: 22,
  // ㅈ
  x: 27
  // ㅎ
};
const medials = {
  uí: 16,
  // ㅟ
  ùí: 19,
  // ㅢ
  yo: 12,
  // ㅛ
  yu: 17,
  // ㅠ
  yẹ: 3,
  // ㅒ
  ya: 2,
  // ㅑ
  ye: 7,
  // ㅖ
  yọ: 6,
  // ㅕ
  wa: 9,
  // ㅘ
  wẹ: 10,
  // ㅙ
  wọ: 14,
  // ㅝ
  we: 15,
  // ㅞ
  wi: 11,
  // ㅚ
  o: 8,
  // ㅗ
  u: 13,
  // ㅜ
  ẹ: 1,
  // ㅐ
  a: 0,
  // ㅏ
  ọ: 4,
  // ㅓ
  e: 5,
  // ㅔ
  ù: 18,
  // ㅡ
  i: 20
  // ㅣ
};
const compatibility_jamos = [
  12593,
  12594,
  12596,
  12599,
  12600,
  12601,
  12609,
  12610,
  12611,
  12613,
  12614,
  12615,
  12616,
  12617,
  12618,
  12619,
  12620,
  12621,
  12622
];
function roman_to_hangul(input) {
  let output = "";
  const init_tokens = Object.keys(initials);
  const medial_tokens = Object.keys(medials);
  const final_tokens = Object.keys(finals);
  while (input.length > 0) {
    let consumed = 0;
    let initial_index = null;
    for (const token of init_tokens) {
      if (input.startsWith(token)) {
        initial_index = initials[token];
        consumed += token.length;
        break;
      }
    }
    let medial_index = null;
    for (const token of medial_tokens) {
      if (input.slice(consumed).startsWith(token)) {
        medial_index = medials[token];
        consumed += token.length;
        break;
      }
    }
    if (initial_index === null && medial_index === null) {
      output += input[0];
      input = input.slice(1);
      continue;
    }
    if (initial_index !== null && medial_index === null) {
      const jamo2 = String.fromCharCode(
        compatibility_jamos[initial_index]
      );
      output += jamo2;
      input = input.slice(consumed);
      continue;
    }
    let final_index = null;
    let final_token = null;
    for (const token of final_tokens) {
      if (input.slice(consumed).startsWith(token)) {
        const lookahead = input.slice(consumed + token.length);
        const has_medial_ahead = medial_tokens.some(
          (m) => lookahead.startsWith(m)
        );
        if (!has_medial_ahead) {
          final_index = finals[token];
          final_token = token;
        }
        break;
      }
    }
    if (final_token !== null) {
      consumed += final_token.length;
    }
    const jamo = combine_jamo(
      initial_index !== null ? initial_index : 11,
      // use ㅇ if no initial
      medial_index,
      // guaranteed to exist here
      final_index ?? 0
      // use 0 if no final
    );
    output += jamo;
    input = input.slice(consumed);
  }
  return output;
}
function combine_jamo(initial, medial, final) {
  const base_code = 44032;
  const initial_offset = initial >= 0 ? initial : 0;
  const medial_offset = medial >= 0 ? medial : 0;
  const final_offset = final >= 0 ? final : 0;
  const syllable_code = base_code + initial_offset * 588 + medial_offset * 28 + final_offset;
  return String.fromCharCode(syllable_code);
}
class Carryover_Associator {
  constructor() {
    __publicField(this, "caryover_list");
    this.caryover_list = [];
  }
  // Called when a word's grapheme in TARGET matches a rule's grapheme with associateme-mark
  set_item(entry_id, variant_id) {
    this.caryover_list.push({ entry_id, variant_id });
  }
  // Get grapheme from
  // result token base and
  // first item in carryover_list entry and variant
  // If not null, removes first item from carryover_list
  // return null or found grapheme
  get_result_associateme(association, associateme_mapper) {
    const item = this.find_first_item();
    if (!item) {
      return null;
    }
    const [entry_id, variant_id] = item;
    const base_id = association.base_id;
    const my_grapheme = this.find_grapheme(
      entry_id,
      base_id,
      variant_id,
      associateme_mapper
    );
    if (!my_grapheme) {
      return null;
    }
    if (entry_id != association.entry_id) {
      return null;
    }
    this.remove_first_item();
    return my_grapheme;
  }
  find_first_item() {
    const item = get_first(this.caryover_list);
    return item ? [item.entry_id, item.variant_id] : void 0;
  }
  remove_first_item() {
    this.caryover_list.shift();
  }
  find_grapheme(entry_id, base_id, variant_id, associateme_mapper) {
    if (entry_id < 0 || entry_id >= associateme_mapper.length) {
      return null;
    }
    const entry = associateme_mapper[entry_id];
    if (variant_id < 0 || variant_id >= entry.variants.length) {
      return null;
    }
    const variantGroup = entry.variants[variant_id];
    if (base_id < 0 || base_id >= variantGroup.length) {
      return null;
    }
    return variantGroup[base_id];
  }
}
class Transformer {
  constructor(logger, graphemes, transforms, output_mode, associateme_mapper) {
    __publicField(this, "logger");
    __publicField(this, "transforms");
    __publicField(this, "graphemes");
    __publicField(this, "debug", false);
    __publicField(this, "associateme_mapper");
    this.logger = logger;
    this.graphemes = graphemes;
    this.transforms = transforms;
    this.associateme_mapper = associateme_mapper;
    this.debug = output_mode === "debug";
  }
  run_routine(routine, word, word_stream, line_num) {
    const full_word = word_stream.join("");
    let modified_word = "";
    switch (routine) {
      case "decompose":
        modified_word = full_word.normalize("NFD");
        break;
      case "compose":
        modified_word = full_word.normalize("NFC");
        break;
      case "capitalise":
        modified_word = full_word.charAt(0).toUpperCase() + full_word.slice(1);
        break;
      case "decapitalise":
        modified_word = full_word.charAt(0).toLowerCase() + full_word.slice(1);
        break;
      case "to-uppercase":
        modified_word = full_word.toUpperCase();
        break;
      case "to-lowercase":
        modified_word = full_word.toLowerCase();
        break;
      case "reverse":
        modified_word = reverse_items(word_stream).join("");
        break;
      case "xsampa-to-ipa":
        modified_word = xsampa_to_ipa(full_word);
        break;
      case "ipa-to-xsampa":
        modified_word = ipa_to_xsampa(full_word);
        break;
      case "roman-to-hangul":
        modified_word = roman_to_hangul(full_word);
        break;
      default:
        this.logger.validation_error("This should not have happened");
    }
    word.record_transformation(
      `<routine = ${routine}>`,
      modified_word,
      line_num
    );
    return graphemosis(modified_word, this.graphemes);
  }
  target_to_word_match(word_tokens, raw_target, reference_mapper, carryover_associator) {
    for (let j = 0; j <= word_tokens.length; j++) {
      const result = this.match_pattern_at(
        word_tokens,
        raw_target,
        j,
        reference_mapper,
        carryover_associator,
        word_tokens.length
      );
      if (result !== null) {
        return [result.start, result.end - result.start, result.matched];
      }
    }
    return [0, 0, []];
  }
  result_former(raw_result, target_stream, reference_mapper, carryover_associator) {
    const replacement_stream = [];
    for (let j = 0; j < raw_result.length; j++) {
      const my_result_token = raw_result[j];
      if (my_result_token.type === "grapheme") {
        if (my_result_token.association) {
          const my_grapheme = carryover_associator.get_result_associateme(
            my_result_token.association,
            this.associateme_mapper
          );
          if (my_grapheme === null) {
            for (let k = 0; k < my_result_token.min; k++) {
              replacement_stream.push(my_result_token.base);
            }
          } else {
            for (let k = 0; k < my_result_token.min; k++) {
              replacement_stream.push(my_grapheme);
            }
          }
        } else {
          for (let k = 0; k < my_result_token.min; k++) {
            replacement_stream.push(my_result_token.base);
          }
        }
      } else if (my_result_token.type === "target-mark") {
        for (let k = 0; k < target_stream.length; k++) {
          replacement_stream.push(target_stream[k]);
        }
      } else if (my_result_token.type === "metathesis-mark") {
        const my_metathesis_graphemes = swap_first_last_items([
          ...target_stream
        ]);
        replacement_stream.push(...my_metathesis_graphemes);
      } else if (my_result_token.type === "reference-start-capture") {
        reference_mapper.set_capture_stream_index(replacement_stream.length);
      } else if (my_result_token.type === "reference-capture") {
        reference_mapper.capture_reference(
          my_result_token.key,
          replacement_stream
        );
      } else if (my_result_token.type === "reference-mark") {
        const reference_value = reference_mapper.get_captured_reference(my_result_token.key);
        replacement_stream.push(...reference_value);
      }
    }
    reference_mapper.reset_capture_stream_index();
    return replacement_stream;
  }
  resolve_association(mapper, grapheme) {
    for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
      const entry = mapper[entry_id];
      for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
        const group = entry.variants[variant_id];
        for (let base_id = 0; base_id < group.length; base_id++) {
          if (group[base_id] === grapheme) {
            return { entry_id, base_id, variant_id };
          }
        }
      }
    }
    return null;
  }
  get_variant_id_for_base(mapper, entry_id, base_id, grapheme) {
    if (entry_id < 0 || entry_id >= mapper.length) return null;
    const entry = mapper[entry_id];
    if (base_id < 0 || base_id >= entry.bases.length) return null;
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id;
      }
    }
    return null;
  }
  // BEFORE and AFTER and TARGET use this
  match_pattern_at(stream, pattern, start, reference_mapper, carryover_associator, max_end, target_stream) {
    let i = start;
    let j = 0;
    const matched = [];
    while (j < pattern.length) {
      const token = pattern[j];
      if (token.type !== "grapheme" && token.type !== "wildcard" && token.type !== "anythings-mark" && token.type !== "target-mark" && token.type !== "metathesis-mark" && token.type !== "syllable-boundary" && token.type !== "word-boundary" && token.type !== "empty-mark" && token.type !== "reference-capture" && token.type !== "reference-mark" && token.type !== "reference-start-capture") {
        j++;
        continue;
      }
      const min = token.min;
      const max = token.max;
      const max_available = max_end !== void 0 ? Math.min(max, max_end - i) : max;
      if (token.type === "grapheme") {
        if (token.association) {
          let count = 0;
          const baseEntryId = token.association.entry_id;
          const baseBaseId = token.association.base_id;
          while (count < token.max && i + count < stream.length) {
            const grapheme = stream[i + count];
            const variant_id = this.get_variant_id_for_base(
              this.associateme_mapper,
              baseEntryId,
              baseBaseId,
              grapheme
            );
            if (variant_id !== null) {
              if (token.association.is_target && carryover_associator) {
                carryover_associator.set_item(baseEntryId, variant_id);
              }
              count++;
            } else {
              break;
            }
          }
          if (count < token.min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else {
          let count = 0;
          while (count < max_available && stream[i + count] === token.base) {
            count++;
          }
          if (count < min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        }
      } else if (token.type === "target-mark") {
        if (!target_stream || target_stream.length === 0) {
          this.logger.validation_error(
            "Target-mark requires a non-empty target_stream"
          );
        }
        const unit = target_stream;
        const unit_length = unit.length;
        const min2 = token.min;
        const max2 = token.max;
        const max_available2 = max_end !== void 0 ? Math.min(max2, Math.floor((max_end - i) / unit_length)) : max2;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === unit[idx])) {
          repetitions++;
        }
        if (repetitions < min2) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "metathesis-mark") {
        if (!target_stream || target_stream.length === 0) {
          this.logger.validation_error(
            "Metathesis-mark requires a non-empty target_stream"
          );
        }
        const unit = swap_first_last_items([...target_stream]);
        const unit_length = unit.length;
        const min2 = token.min;
        const max2 = token.max;
        const max_available2 = max_end !== void 0 ? Math.min(max2, Math.floor((max_end - i) / unit_length)) : max2;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === unit[idx])) {
          repetitions++;
        }
        if (repetitions < min2) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "empty-mark") {
        matched.push("");
        i += 0;
      } else if (token.type === "wildcard") {
        const available = Math.min(max_available, stream.length - i);
        if (available < min) {
          return null;
        }
        matched.push(...stream.slice(i, i + available));
        i += available;
      } else if (token.type === "syllable-boundary") {
        let count = 0;
        if (stream[i] === ".") {
          while (count < max_available && stream[i + count] === ".") {
            count++;
          }
          if (count < min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else if (i === 0 || i === stream.length) {
          if (min > 1) return null;
          matched.push("$");
        } else {
          return null;
        }
      } else if (token.type === "word-boundary") {
        if (i === 0 || i === stream.length) {
          if (min > 1) return null;
          matched.push("#");
        } else {
          return null;
        }
      } else if (token.type === "anythings-mark") {
        const blocked = token.blocked_by ?? [];
        const consume = token.consume ?? [];
        let count = 0;
        outer: while (count < max_available && stream[i + count] !== void 0) {
          for (const group of blocked) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);
            if (slice.length === group_len && slice.every((val, idx) => val === group[idx])) {
              break outer;
            }
          }
          for (const group of consume) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);
            if (slice.length === group_len && slice.every((val, idx) => val === group[idx])) {
              count += group_len;
              break outer;
            }
          }
          count++;
        }
        if (count < token.min) {
          return null;
        }
        matched.push(...stream.slice(i, i + count));
        i += count;
      } else if (token.type === "reference-start-capture") {
        reference_mapper.set_capture_stream_index(matched.length);
      } else if (token.type === "reference-capture") {
        reference_mapper.capture_reference(token.key, matched);
      } else if (token.type === "reference-mark") {
        const reference_value = reference_mapper.get_captured_reference(token.key);
        const unit_length = reference_value.length;
        if (unit_length === 0) {
          return null;
        }
        const max_available2 = max_end !== void 0 ? Math.min(token.max, Math.floor((max_end - i) / unit_length)) : token.max;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === reference_value[idx])) {
          repetitions++;
        }
        if (repetitions < token.min) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      }
      j++;
    }
    reference_mapper.reset_capture_stream_index();
    return {
      start,
      end: i,
      matched
    };
  }
  environment_match(word_stream, target_stream, startIdx, raw_target, before, after, reference_mapper) {
    const human_readable_condition_match = [" / "];
    const target_len = raw_target.length;
    const before_tokens = before;
    let before_matched = false;
    for (let i = 0; i <= startIdx; i++) {
      const result2 = this.match_pattern_at(
        word_stream,
        before_tokens,
        i,
        reference_mapper,
        null,
        startIdx,
        target_stream
      );
      if (result2 !== null && result2.end === startIdx) {
        before_matched = true;
        human_readable_condition_match.push(...result2.matched);
        break;
      }
    }
    if (!before_matched) return [false, ""];
    human_readable_condition_match.push("_");
    const after_tokens = after;
    const after_start = startIdx + target_len;
    const result = this.match_pattern_at(
      word_stream,
      after_tokens,
      after_start,
      reference_mapper,
      null,
      word_stream.length,
      target_stream
    );
    if (result === null) {
      return [false, ""];
    }
    human_readable_condition_match.push(...result.matched);
    return [true, human_readable_condition_match.join("")];
  }
  // Non destructively apply replacements
  replacementa(word_stream, replacements, word, exceptions, line_num) {
    replacements.sort((a, b) => a.index_span - b.index_span);
    const blocked = /* @__PURE__ */ new Set();
    const insertion_map = /* @__PURE__ */ new Map();
    const replacement_map = /* @__PURE__ */ new Map();
    for (const r of replacements) {
      if (r.length_span === 0) {
        if (!insertion_map.has(r.index_span))
          insertion_map.set(r.index_span, []);
        insertion_map.get(r.index_span).push(...r.replacement_stream);
      } else {
        replacement_map.set(r.index_span, {
          length_span: r.length_span,
          replacement_stream: r.replacement_stream
        });
      }
    }
    const result_tokens = [];
    const applied_targets = [];
    const applied_results = [];
    let i = 0;
    while (i < word_stream.length) {
      if (insertion_map.has(i)) {
        for (const rep of insertion_map.get(i)) {
          applied_targets.push("^");
          applied_results.push(rep);
          result_tokens.push(rep);
        }
      }
      const replacement = replacement_map.get(i);
      if (replacement && ![...Array(replacement.length_span).keys()].some(
        (k) => blocked.has(i + k)
      )) {
        const replaced_chunk = word_stream.slice(
          i,
          i + replacement.length_span
        );
        if (replacement.replacement_stream.length > 0) {
          result_tokens.push(...replacement.replacement_stream);
        }
        applied_targets.push(replaced_chunk.join(""));
        applied_results.push(
          replacement.replacement_stream.length === 0 ? "∅" : replacement.replacement_stream.join("")
        );
        for (let k = 0; k < replacement.length_span; k++) {
          blocked.add(i + k);
        }
        i += replacement.length_span;
      } else {
        result_tokens.push(word_stream[i]);
        i++;
      }
    }
    if (insertion_map.has(word_stream.length)) {
      for (const rep of insertion_map.get(word_stream.length)) {
        applied_targets.push("^");
        applied_results.push(rep);
        result_tokens.push(rep);
      }
    }
    const normalized = result_tokens;
    if (applied_targets.length > 0 && this.debug) {
      let my_exceptions = "";
      for (const e of exceptions) {
        const my_before = e.before.map((t) => t.base).join("");
        const my_after = e.after.map((t) => t.base).join("");
        my_exceptions += ` ! ${my_before}_${my_after}`;
      }
      let my_conditions = "";
      for (const r of replacements) {
        if (r.matched_conditions.length != 0) {
          for (const c of r.matched_conditions) {
            my_conditions += c;
          }
        }
      }
      const transformation_str = `${applied_targets.join(", ")} → ${applied_results.join(", ")}`;
      word.record_transformation(
        `${transformation_str}${my_conditions}${my_exceptions}`,
        normalized.join(" "),
        line_num
      );
    }
    return normalized;
  }
  apply_transform(word, word_stream, transform) {
    const {
      routine,
      target,
      result,
      conditions,
      exceptions,
      chance,
      line_num
    } = transform;
    if (chance != null && Math.random() * 100 >= chance) {
      return word_stream;
    }
    if (routine != null) {
      word_stream = this.run_routine(routine, word, word_stream, line_num);
      return word_stream;
    }
    if (target.length !== result.length) {
      this.logger.validation_error(
        "Mismatched target/result concurrent set lengths in a transform",
        line_num
      );
    }
    const replacements = [];
    for (let i = 0; i < target.length; i++) {
      const reference_mapper = new Reference_Mapper();
      const carryover_associator = new Carryover_Associator();
      const raw_target = target[i];
      const raw_result = result[i];
      let mode = "replacement";
      if (raw_result[0].type === "deletion") {
        mode = "deletion";
      } else if (raw_result[0].type === "reject") {
        mode = "reject";
      } else {
        this.target_to_word_match(
          word_stream,
          raw_target,
          reference_mapper,
          carryover_associator
        );
      }
      if (raw_target[0].type === "insertion") {
        if (mode === "deletion" || mode === "reject") {
          this.logger.validation_error(
            `Inserion of ${mode} is not valid`,
            line_num
          );
        }
        if (conditions.length === 0) {
          this.logger.validation_error(
            "Insertion without a condition is not valid",
            line_num
          );
        }
        mode = "insertion";
        for (let insert_index = 0; insert_index <= word_stream.length; insert_index++) {
          const my_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator
          );
          const matched_conditions = [];
          let passes = conditions.length === 0;
          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result2] = this.environment_match(
              word_stream,
              my_replacement_stream,
              insert_index,
              [],
              c.before,
              c.after,
              temp_mapper
            );
            if (pass) {
              matched_conditions.push(result2);
              reference_mapper.absorb(temp_mapper);
              passes = true;
            }
          }
          const blocked = exceptions.some((e) => {
            const temp_mapper = reference_mapper.clone();
            const [block] = this.environment_match(
              word_stream,
              my_replacement_stream,
              insert_index,
              [],
              e.before,
              e.after,
              temp_mapper
            );
            return block;
          });
          if (!passes || blocked) continue;
          const second_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator
          );
          replacements.push({
            index_span: insert_index,
            length_span: 0,
            target_stream: ["^"],
            // symbolic marker for insertion
            replacement_stream: second_replacement_stream,
            matched_conditions
          });
        }
      } else {
        let cursor = 0;
        while (cursor <= word_stream.length) {
          const [match_index, match_length, matched_stream] = this.target_to_word_match(
            word_stream.slice(cursor),
            raw_target,
            reference_mapper,
            carryover_associator
          );
          if (match_length === 0) {
            cursor++;
            continue;
          }
          const global_index = cursor + match_index;
          const matched_conditions = [];
          let passes = conditions.length === 0;
          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result2] = this.environment_match(
              word_stream,
              matched_stream,
              global_index,
              matched_stream,
              c.before,
              c.after,
              temp_mapper
            );
            if (pass) {
              matched_conditions.push(result2);
              reference_mapper.absorb(temp_mapper);
              passes = true;
            }
          }
          const blocked = exceptions.some((e) => {
            const temp_mapper = reference_mapper.clone();
            const [block] = this.environment_match(
              word_stream,
              matched_stream,
              global_index,
              matched_stream,
              e.before,
              e.after,
              temp_mapper
            );
            return block;
          });
          if (!passes || blocked) {
            cursor = global_index + 1;
            continue;
          }
          if (mode === "reject") {
            word.rejected = true;
            word.record_transformation(
              `${matched_stream.join("")} → 0`,
              "∅",
              line_num
            );
            return word_stream;
          } else if (mode === "deletion") {
            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: [],
              matched_conditions
            });
          } else {
            const my_replacement_stream = this.result_former(
              raw_result,
              matched_stream,
              reference_mapper,
              carryover_associator
            );
            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: my_replacement_stream,
              matched_conditions
            });
          }
          cursor = global_index + match_length;
        }
      }
    }
    word_stream = this.replacementa(
      word_stream,
      replacements,
      word,
      exceptions,
      line_num
    );
    return word_stream;
  }
  do_transforms(word) {
    if (word.get_last_form() == "") {
      word.rejected = true;
      return word;
    }
    if (this.transforms.length == 0) {
      return word;
    }
    let tokens = graphemosis(word.get_last_form(), this.graphemes);
    for (const t of this.transforms) {
      if (word.rejected) {
        break;
      }
      if (t.target.length == 0) {
        continue;
      }
      tokens = this.apply_transform(word, tokens, t);
      if (tokens.length == 0) {
        word.rejected = true;
        if (this.debug) {
          word.record_transformation(`<reject-null-word>`, `∅`);
        }
      }
    }
    if (!word.rejected) {
      if (this.debug) {
        if (word.transformations.length > 1) {
          word.record_transformation(null, `${tokens.join("")}`);
        }
      } else {
        word.record_transformation(null, `${tokens.join("")}`);
      }
    }
    return word;
  }
  get_variant_id(mapper, grapheme, baseToken) {
    const { entry_id, base_id } = baseToken;
    if (entry_id < 0 || entry_id >= mapper.length) return null;
    const entry = mapper[entry_id];
    if (base_id < 0 || base_id >= entry.bases.length) return null;
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id;
      }
    }
    return null;
  }
}
function collator(logger, words, custom_alphabet, invisible = []) {
  if (custom_alphabet.length === 0) {
    if (invisible.length == 0) {
      return words.sort(Intl.Collator().compare);
    } else {
      const invisible_set2 = new Set(invisible);
      const collator2 = Intl.Collator();
      const stripped_words = words.map((w) => ({
        original: w,
        stripped: strip_invisible(w, invisible_set2)
      }));
      return stripped_words.sort((a, b) => collator2.compare(a.stripped, b.stripped)).map((entry) => entry.original);
    }
  }
  custom_alphabet.push("�");
  const order_map = /* @__PURE__ */ new Map();
  custom_alphabet.forEach((char, index) => order_map.set(char, index));
  const invisible_set = new Set(invisible);
  const unknown_set = /* @__PURE__ */ new Set();
  function tokenize(input) {
    const tokens = [];
    const graphemes = Array.from(order_map.keys()).concat(Array.from(invisible_set)).sort((a, b) => b.length - a.length);
    let i = 0;
    while (i < input.length) {
      let matched = false;
      for (const g of graphemes) {
        if (input.startsWith(g, i)) {
          tokens.push(g);
          i += g.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(input[i]);
        i += 1;
      }
    }
    return tokens;
  }
  function custom_compare(a, b) {
    const aTokens = tokenize(a).filter((t) => !invisible_set.has(t));
    const bTokens = tokenize(b).filter((t) => !invisible_set.has(t));
    for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
      const aTok = aTokens[i];
      const bTok = bTokens[i];
      if (aTok === void 0) return -1;
      if (bTok === void 0) return 1;
      const aIndex = order_map.get(aTok);
      const bIndex = order_map.get(bTok);
      if (aIndex === void 0) unknown_set.add(aTok);
      if (bIndex === void 0) unknown_set.add(bTok);
      if ((aIndex ?? Infinity) !== (bIndex ?? Infinity)) {
        return (aIndex ?? Infinity) - (bIndex ?? Infinity);
      }
    }
    return 0;
  }
  function strip_invisible(word, invisible_set2) {
    const graphemes = Array.from(invisible_set2).sort(
      (a, b) => b.length - a.length
    );
    let result = "";
    let i = 0;
    while (i < word.length) {
      let matched = false;
      for (const g of graphemes) {
        if (word.startsWith(g, i)) {
          i += g.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += word[i];
        i += 1;
      }
    }
    return result;
  }
  const sorted = [...words].sort(custom_compare);
  if (unknown_set.size > 0) {
    logger.warn(
      `The custom order stated in 'alphabet' was ignored because words had unknown graphemes: '${Array.from(unknown_set).join(", ")}' missing from 'alphabet'`
    );
    return words.sort(Intl.Collator().compare);
  }
  return sorted;
}
class Text_Builder {
  constructor(logger, build_start, num_of_words, output_mode, remove_duplicates, force_word_limit, sort_words, word_divider, alphabet, invisible) {
    __publicField(this, "logger");
    __publicField(this, "build_start");
    __publicField(this, "num_of_words");
    __publicField(this, "output_mode");
    __publicField(this, "remove_duplicates");
    __publicField(this, "force_word_limit");
    __publicField(this, "sort_words");
    __publicField(this, "word_divider");
    __publicField(this, "alphabet");
    __publicField(this, "invisible");
    __publicField(this, "terminated");
    __publicField(this, "words");
    __publicField(this, "num_of_duplicates");
    __publicField(this, "num_of_rejects");
    __publicField(this, "num_of_duds");
    __publicField(this, "upper_gen_limit");
    this.logger = logger;
    this.build_start = build_start;
    this.num_of_words = num_of_words;
    this.output_mode = output_mode;
    this.remove_duplicates = remove_duplicates;
    this.force_word_limit = force_word_limit;
    this.sort_words = sort_words;
    this.word_divider = word_divider;
    this.alphabet = alphabet;
    this.invisible = invisible;
    this.terminated = false;
    this.words = [];
    this.num_of_duplicates = 0;
    this.num_of_rejects = 0;
    this.num_of_duds = 0;
    this.upper_gen_limit = num_of_words * 5;
    if (this.upper_gen_limit > 1e6) {
      this.upper_gen_limit = 1e6;
    }
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  add_word(word) {
    let do_it = false;
    if (word.rejected && Word.output_mode !== "debug") {
      this.num_of_rejects++;
      this.num_of_duds++;
    } else if (this.remove_duplicates) {
      if (this.words.includes(word.get_last_form())) {
        this.num_of_duplicates++;
        this.num_of_duds++;
      } else {
        do_it = true;
      }
    } else {
      do_it = true;
    }
    if (do_it) {
      this.words.push(word.get_word());
    }
    if (this.words.length >= this.num_of_words) {
      this.terminated = true;
    } else if (Date.now() - this.build_start >= 3e4) {
      this.terminated = true;
      if (this.remove_duplicates) {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`
        );
      } else {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`
        );
      }
    } else if (this.num_of_duds >= this.upper_gen_limit && !this.force_word_limit) {
      this.terminated = true;
      if (this.remove_duplicates) {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`
        );
      } else {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`
        );
      }
    }
  }
  create_record() {
    const ms = Date.now() - this.build_start;
    const display = ms >= 1e3 ? `${(ms / 1e3).toFixed(ms % 1e3 === 0 ? 0 : 1)} s` : `${ms} ms`;
    const records = [];
    if (this.words.length == 1) {
      records.push(`1 word generated`);
    } else if (this.words.length > 1) {
      records.push(`${this.words.length} words generated`);
    } else if (this.words.length == 0) {
      records.push(`Zero words generated`);
    }
    if (this.num_of_duplicates == 1) {
      records.push(`1 duplicate word removed`);
    } else if (this.num_of_duplicates > 1) {
      records.push(`${this.num_of_duplicates} duplicate words removed`);
    }
    if (this.num_of_rejects == 1) {
      records.push(`1 word rejected`);
    } else if (this.num_of_rejects > 1) {
      records.push(`${this.num_of_rejects} words rejected`);
    }
    this.logger.info(`${final_sentence(records)} -- in ${display}`);
  }
  make_text() {
    if (this.sort_words) {
      this.words = collator(
        this.logger,
        this.words,
        this.alphabet,
        this.invisible
      );
    }
    this.create_record();
    if (this.output_mode === "paragraph") {
      return this.paragraphify(this.words);
    }
    return this.words.join(this.word_divider);
  }
  paragraphify(words) {
    if (words.length === 0) return "";
    if (words.length === 1)
      return capitalise(words[0]) + this.random_end_punctuation();
    const result = [];
    let should_capitalise = true;
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      if (should_capitalise) {
        word = capitalise(word);
        should_capitalise = false;
      }
      if (i === words.length - 1) {
        result.push(word);
      } else if (i % 7 === 0 && i !== 0) {
        const punctuation = this.random_end_punctuation();
        result.push(word + punctuation);
        should_capitalise = true;
      } else if (i % 6 === 0 && i !== 0) {
        result.push(word + ",");
      } else {
        result.push(word);
      }
    }
    let paragraph = result.join(" ");
    paragraph = paragraph.replace(/[,\s]*$/, "");
    paragraph += this.random_end_punctuation();
    return paragraph;
  }
  random_end_punctuation() {
    const roll = Math.random();
    if (roll < 5e-3) return "...";
    if (roll < 0.03) return "!";
    if (roll < 0.08) return "?";
    return ".";
  }
  show_debug() {
    const info = `Num of words: ` + this.num_of_words + `
Mode: ` + this.output_mode + `
Remove duplicates: ` + this.remove_duplicates + `
Force word limit: ` + this.force_word_limit + `
Sort words: ` + this.sort_words + `
Word divider: "` + this.word_divider + `"
Alphabet: ` + this.alphabet.join(", ") + `
Invisible: ` + this.invisible.join(", ");
    this.logger.diagnostic(info);
  }
}
const VOCABUG_VERSION = "0.5.0";
class Logger {
  constructor() {
    __publicField(this, "errors");
    __publicField(this, "warnings");
    __publicField(this, "infos");
    __publicField(this, "diagnostics");
    __publicField(this, "Uncaught_Error", class Uncaught_Error extends Error {
      constructor(original) {
        super(original.message);
        this.name = original.name || "Error";
        Object.setPrototypeOf(this, new.target.prototype);
        if (original.stack) {
          this.stack = original.stack;
        }
      }
    });
    __publicField(this, "Validation_Error", class Validation_Error extends Error {
      constructor(message) {
        super(message);
        this.name = "Validation_Error";
        Object.setPrototypeOf(this, new.target.prototype);
      }
    });
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.diagnostics = [];
  }
  uncaught_error(original) {
    const err = new this.Uncaught_Error(original);
    const location = this.extract_location(err.stack);
    const log_message = `${err.name}: ${err.message}${location ? " @ " + location : ""}`;
    this.errors.push(log_message);
  }
  validation_error(message, line_num = null) {
    const err = new this.Validation_Error(message);
    if (line_num || line_num === 0) {
      this.errors.push(`Error: ${message} @ line ${line_num + 1}`);
    } else {
      this.errors.push(`Error: ${message}`);
    }
    throw err;
  }
  extract_location(stack) {
    if (!stack) return null;
    const lines = stack.split("\n");
    for (const line of lines) {
      const match = line.match(/(?:\(|\bat\s+)?(.*?):(\d+):(\d+)\)?/);
      if (match) {
        let file_path = match[1].replace(/\?.*$/, "");
        file_path = file_path.replace(/^.*\/src\//, "modules/");
        file_path = file_path.replace(/(\bmodules\b\/)\1/, "$1");
        return `${file_path}:${match[2]}`;
      }
    }
    return null;
  }
  warn(warn, line_num = null) {
    if (line_num || line_num === 0) {
      this.warnings.push(`Warning: ${warn} @ line ${line_num + 1}`);
    } else {
      this.warnings.push(`Warning: ${warn}`);
    }
  }
  info(info) {
    this.infos.push(`Vocabug version ${VOCABUG_VERSION}: ${info}`);
  }
  diagnostic(diagnostic) {
    this.diagnostics.push(diagnostic);
  }
}
const SYNTAX_CHARS = [
  "<",
  ">",
  "@",
  "⇒",
  "→",
  "->",
  ">>",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "0",
  "/",
  "!",
  "#",
  "$",
  "+",
  "?",
  ":",
  "*",
  "&",
  "%",
  "|",
  "~",
  "=",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
];
const SYNTAX_CHARS_AND_CARET = [...SYNTAX_CHARS, "^"];
const escapeMap = {
  "&[Space]": " ",
  "&[Tab]": "	",
  "&[Newline]": "\n",
  "&[Acute]": "́",
  "&[DoubleAcute]": "̋",
  "&[Grave]": "̀",
  "&[DoubleGrave]": "̏",
  "&[Circumflex]": "̂",
  "&[Caron]": "̌",
  "&[Breve]": "̆",
  "&[BreveBelow]": "̮",
  // ◌̮
  "&[InvertedBreve]": "̑",
  "&[InvertedBreveBelow]": "̯",
  // ◌̯
  "&[TildeAbove]": "̃",
  "&[TildeBelow]": "̰",
  "&[Macron]": "̄",
  "&[MacronBelow]": "̱",
  // ◌̠
  "&[MacronBelowStandalone]": "˗",
  // ˗
  "&[Dot]": "̇",
  "&[DotBelow]": "̣",
  "&[Diaeresis]": "̈",
  "&[DiaeresisBelow]": "̤",
  "&[Ring]": "̊",
  "&[RingBelow]": "̥",
  "&[Horn]": "̛",
  "&[Hook]": "̉",
  "&[CommaAbove]": "̓",
  "&[CommaBelow]": "̦",
  "&[Cedilla]": "̧",
  "&[Ogonek]": "̨",
  "&[VerticalLineBelow]": "̩",
  // ◌̩
  "&[VerticalLineAbove]": "̍",
  // ◌̍
  "&[DoubleVerticalLineBelow]": "͈",
  // ◌͈
  "&[PlusSignBelow]": "̟",
  // ◌̟
  "&[PlusSignStandalone]": "˖",
  // ˖
  "&[uptackBelow]": "̝",
  // ◌̝
  "&[UpTackStandalone]": "˔",
  // ˔
  "&[LeftTackBelow]": "̘",
  // ◌̘
  "&[rightTackBelow]": "̙",
  // ◌̙
  "&[DownTackBelow]": "̞",
  // ◌̞
  "&[DownTackStandalone]": "˕",
  // ˕
  "&[BridgeBelow]": "̪",
  // ◌̪
  "&[BridgeAbove]": "͆",
  // ◌͆
  "&[InvertedBridgeBelow]": "̺",
  // ◌̺
  "&[SquareBelow]": "̻",
  // ◌̻
  "&[SeagullBelow]": "̼",
  // ◌̼
  "&[LeftBracketBelow]": "͉"
  // ◌͉
};
class Escape_Mapper {
  constructor() {
    __publicField(this, "map");
    __publicField(this, "counter");
    this.map = /* @__PURE__ */ new Map();
    this.map.set(String.fromCharCode(917504), " ");
    this.counter = 1;
  }
  escape_backslash_pairs(input) {
    const reverse = /* @__PURE__ */ new Map();
    const result = input.replace(/\\(.)/g, (_, char) => {
      if (reverse.has(char)) {
        return reverse.get(char);
      }
      const placeholder = String.fromCharCode(57344 + this.counter);
      reverse.set(char, placeholder);
      this.map.set(placeholder, char);
      this.counter++;
      return placeholder;
    });
    return result;
  }
  escape_special_chars(input) {
    const special_chars = new Set(SYNTAX_CHARS);
    const reverse = /* @__PURE__ */ new Map();
    const result = input.split("").map((char) => {
      if (special_chars.has(char)) {
        if (reverse.has(char)) {
          return reverse.get(char);
        }
        const placeholder = String.fromCharCode(57344 + this.counter);
        reverse.set(char, placeholder);
        this.map.set(placeholder, char);
        this.counter++;
        return placeholder;
      }
      return char;
    }).join("");
    return result;
  }
  escape_named_escape(input) {
    return input.replace(
      /&\[[A-Za-z]+\]/g,
      (match) => escapeMap[match] ?? match
    );
  }
  restore_escaped_chars(input) {
    return input.split("").map((c) => this.map.has(c) ? this.map.get(c) : c).join("");
  }
  // Restore but append a backslash before each character that was escaped
  restore_preserve_escaped_chars(input) {
    return input.split("").map((c) => this.map.has(c) ? "\\" + this.map.get(c) : c).join("");
  }
}
class Supra_Builder {
  constructor(logger) {
    __publicField(this, "logger");
    __publicField(this, "weights");
    __publicField(this, "letters");
    __publicField(this, "id_counter");
    this.logger = logger;
    this.weights = {};
    this.letters = {};
    this.id_counter = 1;
  }
  process_string(input, wordshape_line_num) {
    const token_regex = /\[([^\]]*)\]/g;
    const valid_content_regex = new RegExp(
      `^(\\^|${cappa})(?:\\*((\\d+(?:\\.\\d+)?)|s))?$`
    );
    return input.replace(token_regex, (fullMatch, content) => {
      const match = valid_content_regex.exec(content);
      if (!match) {
        this.logger.validation_error(
          `Invalid supra-set item '${fullMatch}' -- expected all supra-set items to look like '[A]', '[^]' or '[A*2]'`,
          wordshape_line_num
        );
      }
      const letter = match[1];
      const raw_weight = match[2];
      const weight = raw_weight === "s" ? "s" : raw_weight ? Number(raw_weight) : 1;
      const id = this.id_counter++;
      this.weights[id] = weight;
      this.letters[id] = letter;
      return `[${id}]`;
    });
  }
  extract_letters_and_weights(input) {
    const id_regex = /\[(\d+)\]/g;
    const ids = [];
    const weights = [];
    let match;
    while ((match = id_regex.exec(input)) !== null) {
      const id = Number(match[1]);
      if (!(id in this.letters) || !(id in this.weights)) {
        this.logger.validation_error(`Missing data for ID '${id}'`, null);
      }
      ids.push(id.toString());
      weights.push(this.weights[id]);
    }
    return [ids, weights];
  }
  replace_letter_and_clean(input, target_ID) {
    const id_regex = /\[(\d+)\]/g;
    return input.replace(id_regex, (_match, id_str) => {
      const id = Number(id_str);
      if (!(id in this.letters)) {
        this.logger.validation_error(
          `Unknown ID '${id}' found in input.`,
          null
        );
      }
      return id === target_ID ? `${this.letters[id]}` : "";
    });
  }
  getWeights() {
    return this.weights;
  }
  getLetters() {
    return this.letters;
  }
}
class Transform_Resolver {
  constructor(logger, output_mode, nesca_grmmar_stream, categories, transform_pending, features) {
    __publicField(this, "logger");
    __publicField(this, "output_mode");
    __publicField(this, "nesca_grammar_stream");
    __publicField(this, "categories");
    __publicField(this, "transform_pending");
    __publicField(this, "transforms", []);
    __publicField(this, "features", /* @__PURE__ */ new Map());
    __publicField(this, "line_num");
    this.logger = logger;
    this.output_mode = output_mode;
    this.nesca_grammar_stream = nesca_grmmar_stream;
    this.categories = categories;
    this.transform_pending = transform_pending;
    this.features = features;
    this.line_num = 0;
    this.resolve_transforms();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_transforms() {
    for (let i = 0; i < this.transform_pending.length; i++) {
      this.line_num = this.transform_pending[i].line_num;
      const target = this.transform_pending[i].target;
      const target_with_cat = this.categories_into_transform(target);
      const target_with_fea = this.features_into_transform(target_with_cat);
      const target_altors = this.resolve_alt_opt(target_with_fea);
      const result = this.transform_pending[i].result;
      const result_with_cat = this.categories_into_transform(result);
      const result_with_fea = this.features_into_transform(result_with_cat);
      const result_altors = this.resolve_alt_opt(result_with_fea);
      const { result_array, target_array } = this.normaliseTransformLength(
        target_altors,
        result_altors
      );
      const result_length_match = result_array.flat();
      const target_length_match = target_array.flat();
      const tokenised_target_array = [];
      for (let j = 0; j < target_length_match.length; j++) {
        tokenised_target_array.push(
          this.nesca_grammar_stream.main_parser(
            target_length_match[j],
            "TARGET",
            this.line_num
          )
        );
      }
      const tokenised_result_array = [];
      for (let j = 0; j < result_length_match.length; j++) {
        tokenised_result_array.push(
          this.nesca_grammar_stream.main_parser(
            result_length_match[j],
            "RESULT",
            this.line_num
          )
        );
      }
      const chance = this.transform_pending[i].chance;
      const new_conditions = [];
      const new_exceptions = [];
      for (let j = 0; j < this.transform_pending[i].conditions.length; j++) {
        let my_condition = this.transform_pending[i].conditions[j];
        my_condition = this.categories_into_transform(my_condition);
        my_condition = this.features_into_transform(my_condition);
        if (!this.valid_transform_brackets(my_condition)) {
          this.logger.validation_error(
            `Invalid brackets in condition "${my_condition}"`,
            this.line_num
          );
        }
        const alt_opt_condition = this.resolve_alt_opt(my_condition);
        for (let k = 0; k < alt_opt_condition[0].length; k++) {
          const split_condition = alt_opt_condition[0][k].split("_");
          const before = this.nesca_grammar_stream.main_parser(
            split_condition[0],
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            split_condition[1],
            "AFTER",
            this.line_num
          );
          new_conditions.push({
            before,
            after
          });
        }
      }
      for (let j = 0; j < this.transform_pending[i].exceptions.length; j++) {
        let my_exception = this.transform_pending[i].exceptions[j];
        my_exception = this.categories_into_transform(my_exception);
        my_exception = this.features_into_transform(my_exception);
        if (!this.valid_transform_brackets(my_exception)) {
          this.logger.validation_error(
            `Invalid brackets in exception "${my_exception}"`,
            this.line_num
          );
        }
        const alt_opt_exception = this.resolve_alt_opt(my_exception);
        for (let k = 0; k < alt_opt_exception[0].length; k++) {
          const split_exception = alt_opt_exception[0][k].split("_");
          const before = this.nesca_grammar_stream.main_parser(
            split_exception[0],
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            split_exception[1],
            "AFTER",
            this.line_num
          );
          new_exceptions.push({
            before,
            after
          });
        }
      }
      this.transforms.push({
        routine: this.transform_pending[i].routine,
        target: tokenised_target_array,
        result: tokenised_result_array,
        conditions: new_conditions,
        exceptions: new_exceptions,
        chance,
        line_num: this.line_num
      });
    }
    return this.transforms;
  }
  // 🧱 Internal: Split input into top-level chunks
  split_top_level(str) {
    const chunks = [];
    let depth = 0;
    let buffer = "";
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "[" || char === "(" || char === "{") depth++;
      else if (char === "]" || char === ")" || char === "}") depth--;
      if ((char === "," || /\s/.test(char)) && depth === 0) {
        if (buffer.trim()) chunks.push(buffer.trim());
        buffer = "";
      } else {
        buffer += char;
      }
    }
    if (buffer.trim()) chunks.push(buffer.trim());
    return chunks;
  }
  check_grammar_rules(str) {
    const stack = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "{" || char === "(") {
        if (stack.length >= 1) {
          this.logger.validation_error(
            "Nested alternator / optionalator not allowed",
            this.line_num
          );
        }
        stack.push({ char, index: i });
      }
      if (char === "}" || char === ")") {
        if (stack.length === 0) {
          this.logger.validation_error(
            "Mismatched closing bracket",
            this.line_num
          );
        }
        const { char: open_char, index: open_index } = stack.pop();
        const is_matching = open_char === "{" && char === "}" || open_char === "(" && char === ")";
        if (!is_matching) {
          this.logger.validation_error(
            "Mismatched bracket types",
            this.line_num
          );
        }
        const inner = str.slice(open_index + 1, i).trim();
        if (!/[^\s,]/.test(inner)) {
          this.logger.validation_error(
            "Alternator / optionalator must not be empty",
            this.line_num
          );
        }
        const before = str.slice(0, open_index).trim();
        const after = str.slice(i + 1).trim();
        const has_outside_content = /[^\s,]/.test(before) || /[^\s,]/.test(after);
        if (!has_outside_content && char === ")") {
          this.logger.validation_error(
            "Optionalator must be part of a larger token",
            this.line_num
          );
        }
      }
    }
    if (stack.length !== 0) {
      this.logger.validation_error("Unclosed bracket", this.line_num);
    }
  }
  // 🔄 Internal: Expand a single chunk
  expand_chunk(chunk) {
    this.check_grammar_rules(chunk);
    const regex2 = /([^{(})]+)|(\{[^}]+\})|(\([^)]+\))/g;
    const parts = [...chunk.matchAll(regex2)].map((m) => m[0]);
    const expansions = parts.map((part) => {
      if (part.startsWith("{")) {
        return part.slice(1, -1).split(/[\s,]+/);
      } else if (part.startsWith("(")) {
        const val = part.slice(1, -1);
        return [val, ""];
      } else {
        return [part];
      }
    });
    return expansions.reduce(
      (acc, curr) => {
        const combo = [];
        for (const a of acc) {
          for (const c of curr) {
            combo.push(a + c);
          }
        }
        return combo;
      },
      [""]
    );
  }
  resolve_alt_opt(input) {
    const chunks = this.split_top_level(input);
    return chunks.map((chunk) => this.expand_chunk(chunk));
  }
  getTransformLengths(target, result) {
    if (result.length === 1 && target.length > 1) {
      result = Array(target.length).fill(result[0]);
    }
    if (result.length !== target.length) {
      this.logger.validation_error(
        `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
        this.line_num
      );
    }
    return result.map((resItem, i) => {
      const target_item = target[i];
      if (resItem.length === 1 && target_item.length > 1) {
        resItem = Array(target_item.length).fill(resItem[0]);
      }
      if (resItem.length !== target_item.length) {
        this.logger.validation_error(
          `Alternator / optionalator length mismatch at index ${i}: target has ${target_item.length}, result has ${resItem.length}`,
          this.line_num
        );
      }
      return resItem;
    });
  }
  categories_into_transform(input) {
    let output = "";
    const length = input.length;
    for (let i = 0; i < length; i++) {
      const char = input[i];
      if (char === "<") {
        if (/^[A-Z]$/.test(input[i + 1])) {
          output += char + input[i + 1];
          i += 1;
          continue;
        }
      }
      if (this.categories.has(char)) {
        const prev = input[i - 1] ?? "";
        const next = input[i + 1] ?? "";
        const is_boundary_before = i === 0 || " ,([{)}]".includes(prev);
        const is_boundary_after = i === length - 1 || " ,([{)}]".includes(next);
        if (is_boundary_before && is_boundary_after) {
          const entry = this.categories.get(char);
          output += entry.filter((g) => !["^"].some((b) => g.includes(b))).join(", ");
        } else {
          this.logger.validation_error(
            `Category key "${char}" is adjacent to other content`,
            this.line_num
          );
        }
      } else {
        output += char;
      }
    }
    return output;
  }
  features_into_transform(stream) {
    const length = stream.length;
    const output = [];
    let feature_mode = false;
    let feature_matrix = "";
    let feature_begin_index = 0;
    for (let i = 0; i < stream.length; i++) {
      if (feature_mode) {
        if (stream[i] === "]") {
          feature_mode = false;
          if (feature_matrix.length != 0) {
            const prev = stream[feature_begin_index - 1] ?? "";
            const next = stream[i + 1] ?? "";
            const is_boundary_before = i === 0 || " ,([{)}]".includes(prev);
            const is_boundary_after = i === length - 1 || " ,([{)}]".includes(next);
            if (is_boundary_before && is_boundary_after) {
              output.push(`${this.get_graphemes_from_matrix(feature_matrix)}`);
            } else {
              this.logger.validation_error(
                `Feature "[${feature_matrix}]" is adjacent to other content`,
                this.line_num
              );
            }
          }
          feature_matrix = "";
          continue;
        }
        feature_matrix += stream[i];
        continue;
      }
      if (stream[i] === "[") {
        feature_begin_index = i;
        if (stream[i + 1] === "+" || stream[i + 1] === "-") {
          feature_mode = true;
          continue;
        } else {
          output.push("[");
          continue;
        }
      }
      output.push(stream[i]);
    }
    if (feature_mode) {
      this.logger.validation_error(
        "Unclosed feature-matrix missing ']'",
        this.line_num
      );
    }
    return output.join("");
  }
  get_graphemes_from_matrix(feature_matrix) {
    const keys = feature_matrix.split(",").map((k) => k.trim());
    const grapheme_sets = [];
    for (const key of keys) {
      const entry = this.features.get(key);
      if (!entry) {
        this.logger.validation_error(`Unknown feature '${key}'`, this.line_num);
      }
      grapheme_sets.push(entry.graphemes);
    }
    if (grapheme_sets.length === 0) return "";
    const intersection = grapheme_sets.slice(1).reduce(
      (acc, set) => acc.filter((g) => set.includes(g)),
      grapheme_sets[0]
    );
    return intersection.join(", ");
  }
  normaliseTransformLength(target, result) {
    if (result.length === 1 && target.length > 1) {
      result = Array(target.length).fill(result[0]);
    }
    if (result.length !== target.length) {
      this.logger.validation_error(
        `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
        this.line_num
      );
    }
    result = result.map((resItem, i) => {
      const target_item = target[i];
      if (resItem.length === 1 && target_item.length > 1) {
        resItem = Array(target_item.length).fill(resItem[0]);
      }
      if (resItem.length !== target_item.length) {
        this.logger.validation_error(
          `An alternator / optionalator length mismatch occured: target has ${target_item.length}, result has ${resItem.length}`,
          this.line_num
        );
      }
      return resItem;
    });
    const target_array = target;
    const result_array = result;
    return { target_array, result_array };
  }
  valid_transform_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      "}": "{",
      "]": "["
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  format_tokens(seq) {
    return seq.map((t) => {
      let s = t.base;
      if (t.type === "anythings-mark") {
        if ("consume" in t && t.consume) {
          const groups = t.consume.map((group) => group.join("")).join(", ");
          s += `[${groups}]`;
        }
        if ("blocked_by" in t && t.blocked_by) {
          const groups = t.blocked_by.map((group) => group.join("")).join(", ");
          s += `^[${groups}]`;
        }
      }
      if ("escaped" in t && t.escaped) {
        s = "\\" + s;
      }
      if ("min" in t && t.min === 1 && t.max === Infinity) {
        s += `+`;
      } else if ("min" in t && t.max === Infinity) {
        s += `+[${t.min},]`;
      } else if ("min" in t && t.min == t.max) {
        if (t.min == 1) ;
        else {
          s += `+[${t.min}]`;
        }
      } else if ("min" in t) {
        s += `+[${t.min}${t.max !== Infinity ? "," + t.max : ""}]`;
      }
      if ("association" in t) {
        s += `~`;
      }
      return s;
    }).join(" ");
  }
  show_debug() {
    const transforms = [];
    for (let i = 0; i < this.transforms.length; i++) {
      const my_transform = this.transforms[i];
      if (my_transform.routine) {
        transforms.push(
          `  <routine = ${my_transform.routine}> @ ln:${my_transform.line_num}`
        );
        continue;
      }
      const my_target = [];
      for (let j = 0; j < my_transform.target.length; j++) {
        my_target.push(this.format_tokens(my_transform.target[j]));
      }
      const my_result = [];
      for (let j = 0; j < my_transform.result.length; j++) {
        my_result.push(this.format_tokens(my_transform.result[j]));
      }
      const chance = my_transform.chance ? ` CHANCE ${my_transform.chance}` : "";
      let exceptions = "";
      for (let j = 0; j < my_transform.exceptions.length; j++) {
        exceptions += ` ! ${this.format_tokens(my_transform.exceptions[j].before)}_${this.format_tokens(my_transform.exceptions[j].after)}`;
      }
      let conditions = "";
      for (let j = 0; j < my_transform.conditions.length; j++) {
        conditions += ` / ${this.format_tokens(my_transform.conditions[j].before)}_${this.format_tokens(my_transform.conditions[j].after)}`;
      }
      transforms.push(
        `  ${my_target.join(", ")} → ${my_result.join(", ")}${conditions}${exceptions}${chance} @ ln:${my_transform.line_num}`
      );
    }
    const features = [];
    for (const [key, value] of this.features) {
      features.push(`  ${key} = ${value.graphemes.join(", ")}`);
    }
    const parts = [];
    for (const entry of this.nesca_grammar_stream.associateme_mapper) {
      const variantStrings = entry.variants.map(
        (group) => `{${group.join(",")}}`
      );
      const chain = "  " + variantStrings.join("<");
      parts.push(chain);
    }
    const associatemes = parts.join("\n");
    const info = `Graphemes: ` + this.nesca_grammar_stream.graphemes.join(", ") + `
Associatemes: 
` + associatemes + `
Features {
` + features.join("\n") + `
}
Transforms {
` + transforms.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
}
class Nesca_Grammar_Stream {
  constructor(logger, graphemes, associateme_mapper, escape_mapper) {
    __publicField(this, "logger");
    __publicField(this, "graphemes");
    __publicField(this, "associateme_mapper");
    __publicField(this, "escape_mapper");
    this.logger = logger;
    this.graphemes = graphemes;
    this.associateme_mapper = associateme_mapper;
    this.escape_mapper = escape_mapper;
  }
  main_parser(stream, mode, line_num) {
    let i = 0;
    const tokens = [];
    if (stream.startsWith("@routine")) {
      const routine = stream.slice(8);
      return [{ type: "routine", base: routine, routine }];
    } else if (stream === "^") {
      if (mode === "RESULT") {
        return [{ type: "deletion", base: "^" }];
      } else if (mode === "TARGET") {
        return [{ type: "insertion", base: "^" }];
      } else {
        this.logger.validation_error(
          `Unexpected character '${stream}' in mode '${mode}'`,
          line_num
        );
      }
    } else if (stream === "0") {
      if (mode !== "RESULT") {
        this.logger.validation_error(
          `Reject not allowed in '${mode}'`,
          line_num
        );
      }
      return [{ type: "reject", base: "0" }];
    }
    while (i < stream.length) {
      let new_token = { type: "pending", base: "", min: 1, max: 1 };
      const char = stream[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      if (char === "%") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Anythings-mark not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = {
          type: "anythings-mark",
          base: "%",
          min: 1,
          max: Infinity
        };
        let look_ahead = i + 1;
        if (stream[look_ahead] !== "[") {
          this.logger.validation_error(
            `Expected '[' after '%' for anythings-mark`,
            line_num
          );
        } else {
          look_ahead++;
          let garde_stream = "";
          while (look_ahead < stream.length) {
            const next_char = stream[look_ahead];
            if (next_char === "]") break;
            garde_stream += next_char;
            look_ahead++;
          }
          if (look_ahead >= stream.length || stream[look_ahead] !== "]") {
            this.logger.validation_error(`Unclosed blocker`, line_num);
          }
          const consume = [];
          const blocked_by = [];
          const raw_groups = garde_stream.split(",").map((group) => group.trim()).filter(Boolean);
          let is_blocker = false;
          for (const group of raw_groups) {
            if (group.startsWith("|")) {
              is_blocker = true;
            }
            const graphemes = graphemosis(group, this.graphemes).map((g) => this.escape_mapper.restore_escaped_chars(g)).filter(Boolean);
            if (graphemes.length > 0) {
              if (is_blocker) {
                blocked_by.push(graphemes);
              } else {
                consume.push(graphemes);
              }
            }
          }
          if (consume.length !== 0) {
            new_token.consume = consume;
          }
          if (blocked_by.length !== 0) {
            new_token.blocked_by = blocked_by;
          }
          look_ahead++;
          i = look_ahead;
        }
      } else if (char === "*") {
        if (mode == "RESULT") {
          this.logger.validation_error(
            `Wildcard not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = { type: "wildcard", base: "*", min: 1, max: 1 };
        i++;
      } else if (char == "#") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Word-boundary not allowed in '${mode}'`,
            line_num
          );
        }
        if (i !== 0 && i + 1 !== stream.length) {
          this.logger.validation_error(
            `Hash must be at the start or end of '${mode}'`,
            line_num
          );
        }
        new_token = { type: "word-boundary", base: "#", min: 1, max: 1 };
        tokens.push(new_token);
        i++;
        continue;
      } else if (char == "$") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Syllable-boundary not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = { type: "syllable-boundary", base: "$", min: 1, max: 1 };
        tokens.push(new_token);
        i++;
        continue;
      } else if (char == "&") {
        const look_ahead = i + 1;
        if (stream[look_ahead] === "T") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Target-mark not allowed in '${mode}'`,
              line_num
            );
          }
          new_token = { type: "target-mark", base: "&T", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "M") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Metathesis-mark not allowed in '${mode}'`,
              line_num
            );
          }
          new_token = { type: "metathesis-mark", base: "&M", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "E") {
          if (mode !== "TARGET") {
            this.logger.validation_error(
              `Empty-mark only allowed in 'TARGET'`,
              line_num
            );
          }
          new_token = { type: "empty-mark", base: "&E", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "=") {
          new_token = {
            type: "reference-start-capture",
            base: "&=",
            min: 1,
            max: 1
          };
          i = look_ahead + 1;
          tokens.push(new_token);
          continue;
        } else {
          this.logger.validation_error(
            `A 'T', 'M' or '=' did not follow '&' in '${mode}'`,
            line_num
          );
        }
        i++;
      } else if (char === "=") {
        const look_ahead = i + 1;
        const digit = stream[look_ahead];
        if (/^[1-9]$/.test(digit)) {
          new_token = {
            type: "reference-capture",
            base: `=${digit}`,
            key: digit,
            min: 1,
            max: 1
          };
          tokens.push(new_token);
          i = look_ahead + 1;
          continue;
        } else {
          this.logger.validation_error(
            `Invalid reference capture syntax in '${mode}'`,
            line_num
          );
        }
      } else if (/^[1-9]$/.test(char)) {
        if (mode === "TARGET") {
          this.logger.validation_error(
            "Reference-mark not allowed in 'TARGET'",
            line_num
          );
        }
        new_token = {
          type: "reference-mark",
          base: char,
          key: char,
          min: 1,
          max: 1
        };
        i++;
      } else if (char === "~") {
        i++;
      } else if (
        // Syntax character used wrongly
        SYNTAX_CHARS_AND_CARET.includes(char)
      ) {
        this.logger.validation_error(
          `Unexpected syntax character '${char}' in ${mode}`,
          line_num
        );
      } else {
        const escaped_stream = this.escape_mapper.restore_escaped_chars(stream);
        let is_escaped = false;
        if (escaped_stream[i] !== stream[i]) {
          is_escaped = true;
        }
        let matched = false;
        for (const g of this.graphemes.sort((a, b) => b.length - a.length)) {
          if (escaped_stream.startsWith(g, i)) {
            new_token = { type: "grapheme", base: g, min: 1, max: 1 };
            i += g.length;
            matched = true;
            break;
          }
        }
        if (!matched) {
          new_token = {
            type: "grapheme",
            base: escaped_stream[i],
            min: 1,
            max: 1
          };
          i++;
        }
        if (is_escaped && new_token.type === "grapheme") {
          new_token.escaped = true;
        }
      }
      if (stream[i] === ":") {
        tokens.push({ ...new_token });
        let look_ahead = i + 1;
        while (stream[look_ahead] == ":") {
          tokens.push({ ...new_token });
          look_ahead++;
        }
        new_token.min = 2;
        new_token.max = 2;
        i++;
      } else if (stream[i] === "+") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Quantifier not allowed in '${mode}'`,
            line_num
          );
        }
        new_token.min = 1;
        new_token.max = Infinity;
        i++;
      } else if (stream[i] === "?") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Bounded quantifier not allowed in '${mode}'`,
            line_num
          );
        }
        let look_ahead = i + 1;
        if (stream[look_ahead] !== "[") {
          this.logger.validation_error(
            `Expected '[' after '?' for quantifier`,
            line_num
          );
        } else {
          look_ahead += 1;
          let quantifier = "";
          while (look_ahead < stream.length && stream[look_ahead] !== "]") {
            quantifier += stream[look_ahead];
            look_ahead++;
          }
          if (stream[look_ahead] !== "]") {
            this.logger.validation_error(`Unclosed quantifier`, line_num);
          }
          const parts = quantifier.split(",");
          if (parts.length === 1) {
            const n = parseInt(parts[0], 10);
            if (isNaN(n)) {
              this.logger.validation_error(
                `Invalid quantifier value: "${parts[0]}"`,
                line_num
              );
            }
            new_token.min = n;
            new_token.max = n;
          } else if (parts.length === 2) {
            const [minStr, maxStr] = parts;
            const min = minStr === "" ? 1 : parseInt(minStr, 10);
            const max = maxStr === "" ? Infinity : parseInt(maxStr, 10);
            if (minStr !== "" && isNaN(min)) {
              this.logger.validation_error(
                `Invalid min value: "${minStr}"`,
                line_num
              );
            }
            if (maxStr !== "" && max !== null && isNaN(max)) {
              this.logger.validation_error(
                `Invalid max value: "${maxStr}"`,
                line_num
              );
            }
            new_token.min = min;
            new_token.max = max;
          } else {
            this.logger.validation_error(
              `Invalid quantifier format: "${quantifier}"`,
              line_num
            );
          }
          i = look_ahead + 1;
        }
        if (new_token.max != Infinity) {
          if (new_token.min > new_token.max) {
            this.logger.validation_error(
              `Invalid quantifier: min '${new_token.min}' cannot be greater than max '${new_token.max}'`,
              line_num
            );
          }
        }
      }
      if (stream[i] === "~") {
        if (new_token.type !== "grapheme") {
          this.logger.validation_error(
            `Associateme-mark only allowed after grapheme token`,
            line_num
          );
        }
        const location = this.find_base_location(
          this.associateme_mapper,
          new_token.base
        );
        if (!location) {
          this.logger.validation_error(
            `Grapheme "${new_token.base}" with an asociateme-mark was not an associateme base`,
            line_num
          );
        }
        const [entry_id, base_id] = location;
        new_token.association = {
          entry_id,
          base_id,
          variant_id: 0,
          // Placeholder; to be filled during generation
          is_target: mode === "TARGET"
        };
        i++;
      }
      if (new_token.type !== "pending") {
        tokens.push(new_token);
      }
    }
    return tokens;
  }
  find_base_location(mapper, grapheme) {
    for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
      const entry = mapper[entry_id];
      for (let base_id = 0; base_id < entry.bases.length; base_id++) {
        if (entry.bases[base_id] === grapheme) {
          return [entry_id, base_id];
        }
      }
    }
    return null;
  }
}
class Category_Resolver {
  constructor(logger, output_mode, escape_mapper, category_distribution, category_pending) {
    __publicField(this, "logger");
    __publicField(this, "escape_mapper");
    __publicField(this, "output_mode");
    __publicField(this, "category_distribution");
    __publicField(this, "category_pending");
    __publicField(this, "categories");
    __publicField(this, "trans_categories");
    this.logger = logger;
    this.output_mode = output_mode;
    this.escape_mapper = escape_mapper;
    this.category_distribution = category_distribution;
    this.category_pending = category_pending;
    this.categories = /* @__PURE__ */ new Map();
    this.trans_categories = /* @__PURE__ */ new Map();
    this.resolve_categories();
    this.get_trans_categories();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  get_trans_categories() {
    for (const [key, value] of this.categories) {
      this.trans_categories.set(key, value.graphemes);
    }
  }
  resolve_categories() {
    for (const [key, value] of this.category_pending) {
      if (!this.valid_category_brackets(value.content)) {
        this.logger.validation_error(
          `Category '${key}' had missmatched brackets`,
          value.line_num
        );
      }
      if (!this.valid_category_weights(value.content)) {
        this.logger.validation_error(
          `Category '${key}' had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',', a bracket, or ' '`,
          value.line_num
        );
      }
      for (const [key2, value2] of this.category_pending.entries()) {
        const expanded_content = recursive_expansion(
          value2.content,
          this.category_pending,
          true
        );
        this.category_pending.set(key2, {
          content: expanded_content,
          line_num: value2.line_num
          // Preserve original line_num
        });
      }
    }
    for (const [key, value] of this.category_pending) {
      const new_category_field = this.resolve_nested_categories(
        value.content,
        this.category_distribution
      );
      for (let i = 0; i < new_category_field.graphemes.length; i++) {
        new_category_field.graphemes[i] = this.escape_mapper.escape_special_chars(
          new_category_field.graphemes[i]
        );
      }
      this.categories.set(key, new_category_field);
    }
  }
  valid_category_brackets(str) {
    const stack = [];
    const bracket_pairs = { "}": "{" };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  valid_category_weights(str) {
    const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;
    const asterisk_at_start = /^\*/;
    const asterisk_after_space_or_comma = /[ ,{}]\*/g;
    const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;
    if (asterisk_without_number.test(str) || asterisk_at_start.test(str) || asterisk_after_space_or_comma.test(str) || asterisk_number_bad_suffix.test(str)) {
      return false;
    }
    return true;
  }
  resolve_nested_categories(input, default_distribution) {
    function tokenize(expr) {
      const tokens = [];
      let i = 0;
      let buffer = "";
      while (i < expr.length) {
        if (expr[i] === "{") {
          if (buffer.trim()) {
            tokens.push(buffer.trim());
            buffer = "";
          }
          let depth = 1, j = i + 1;
          while (j < expr.length && depth > 0) {
            if (expr[j] === "{") depth++;
            else if (expr[j] === "}") depth--;
            j++;
          }
          const content = expr.slice(i + 1, j - 1);
          i = j;
          let weight = 1;
          if (expr[i] === "*") {
            i++;
            let w = "";
            while (i < expr.length && /[\d.]/.test(expr[i])) w += expr[i++];
            weight = parseFloat(w || "1");
          }
          tokens.push({ group: content, weight });
        } else if (/[,\s]/.test(expr[i])) {
          if (buffer.trim()) {
            tokens.push(buffer.trim());
            buffer = "";
          }
          i++;
        } else {
          buffer += expr[i++];
        }
      }
      if (buffer.trim()) {
        tokens.push(buffer.trim());
      }
      return tokens;
    }
    function evaluate(expr, multiplier = 1) {
      const tokens = tokenize(expr);
      const uses_explicit_weights = tokens.some(
        (t) => typeof t === "string" && t.includes("*")
      );
      const dist = uses_explicit_weights ? Array(tokens.length).fill(1) : get_distribution(tokens.length, default_distribution);
      const entries = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const token_weight = dist[i] * multiplier;
        if (typeof token === "string") {
          const [key, raw_weight] = token.split("*");
          const has_custom_weight = raw_weight !== void 0 && raw_weight !== "";
          const literal_weight = has_custom_weight ? parseFloat(raw_weight) : 1;
          const final_weight = has_custom_weight ? literal_weight * multiplier : token_weight;
          entries.push({ key: key.trim(), weight: final_weight });
        } else {
          const inner_entries = evaluate(token.group, 1);
          const total = inner_entries.reduce((sum, e) => sum + e.weight, 0);
          for (const { key, weight } of inner_entries) {
            const scaled = weight / total * token.weight * token_weight;
            entries.push({ key, weight: scaled });
          }
        }
      }
      return entries;
    }
    const evaluated = evaluate(input);
    const keys = evaluated.map((e) => e.key);
    const weights = evaluated.map((e) => e.weight);
    return { graphemes: keys, weights };
  }
  show_debug() {
    const categories = [];
    for (const [key, value] of this.categories) {
      const cat_field = [];
      for (let i = 0; i < value.graphemes.length; i++) {
        cat_field.push(`${value.graphemes[i]}*${value.weights[i]}`);
      }
      const category_field = `${cat_field.join(", ")}`;
      categories.push(`  ${key} = ${category_field}`);
    }
    const info = `Category-distribution: ` + this.category_distribution + `
Categories {
` + categories.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
}
class Generation_Resolver {
  constructor(logger, output_mode, supra_builder, wordshape_distribution, units, wordshape_pending, optionals_weight) {
    __publicField(this, "logger");
    __publicField(this, "supra_builder");
    __publicField(this, "output_mode");
    __publicField(this, "optionals_weight");
    __publicField(this, "units");
    __publicField(this, "wordshape_distribution");
    __publicField(this, "wordshape_pending");
    __publicField(this, "wordshapes");
    this.logger = logger;
    this.output_mode = output_mode;
    this.supra_builder = supra_builder;
    this.optionals_weight = optionals_weight;
    this.units = units;
    this.wordshape_distribution = wordshape_distribution;
    this.wordshape_pending = wordshape_pending;
    this.wordshapes = { items: [], weights: [] };
    this.expand_units();
    this.expand_wordshape_units();
    this.set_wordshapes();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  set_wordshapes() {
    const result = [];
    let buffer = "";
    let inside_brackets = 0;
    if (this.wordshape_pending.content.length == 0) {
      this.logger.validation_error(
        `No word-shapes to choose from -- expected 'words: wordshape1 wordshape2 ...'`,
        this.wordshape_pending.line_num
      );
    }
    this.wordshape_pending.content = this.supra_builder.process_string(
      this.wordshape_pending.content,
      this.wordshape_pending.line_num
    );
    if (!this.valid_words_brackets(this.wordshape_pending.content)) {
      this.logger.validation_error(
        `Word-shapes had missmatched brackets`,
        this.wordshape_pending.line_num
      );
    }
    if (!this.valid_words_weights(this.wordshape_pending.content)) {
      this.logger.validation_error(
        `Word-shapes had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',' a bracket, or ' '`,
        this.wordshape_pending.line_num
      );
    }
    for (let i = 0; i < this.wordshape_pending.content.length; i++) {
      const char = this.wordshape_pending.content[i];
      if (char === "{" || char === "(") {
        inside_brackets++;
      } else if (char === "}" || char === ")") {
        inside_brackets--;
      }
      if ((char === " " || char === ",") && inside_brackets === 0) {
        if (buffer.length > 0) {
          result.push(buffer);
          buffer = "";
        }
      } else {
        buffer += char;
      }
    }
    if (buffer.length > 0) {
      result.push(buffer);
    }
    const [result_str, result_num] = this.extract_wordshape_value_and_weight(
      result,
      this.wordshape_distribution
    );
    for (let i = 0; i < result_str.length; i++) {
      this.wordshapes.items.push(result_str[i]);
      this.wordshapes.weights.push(result_num[i]);
    }
  }
  valid_words_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      ">": "<",
      "}": "{"
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  extract_wordshape_value_and_weight(input_list, default_distribution) {
    const my_values = [];
    const my_weights = [];
    const combine_adjacent_chunks = (str) => {
      const chunks = [];
      let buffer = "";
      let bracket_depth = 0;
      let paren_depth = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        buffer += char;
        if (char === "{") bracket_depth++;
        if (char === "}") bracket_depth--;
        if (char === "(") paren_depth++;
        if (char === ")") paren_depth--;
        const atEnd = i === str.length - 1;
        if (char === "," && bracket_depth === 0 && paren_depth === 0 || atEnd) {
          if (char !== "," && atEnd) ;
          else {
            buffer = buffer.slice(0, -1);
          }
          if (buffer.trim()) chunks.push(buffer.trim());
          buffer = "";
        }
      }
      return chunks;
    };
    const all_parts = input_list.flatMap(combine_adjacent_chunks);
    const all_default_weights = all_parts.every(
      (part) => !/^(?:\{.*\}|[^*]+)\*[\d.]+$/.test(part)
    );
    if (all_default_weights) {
      const trimmed_values = all_parts.map((part) => part.trim());
      const total_items = trimmed_values.length;
      const chosen_distribution = get_distribution(
        total_items,
        default_distribution
      );
      my_values.push(...trimmed_values);
      my_weights.push(...chosen_distribution);
      return [my_values, my_weights];
    }
    for (const part of all_parts) {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.*)\*([\d.]+)$/);
      if (match && !/\{.*\*.*\}$/.test(match[1])) {
        my_values.push(match[1]);
        my_weights.push(parseFloat(match[2]));
      } else if (/^\{.*\}\*[\d.]+$/.test(trimmed)) {
        const i = trimmed.lastIndexOf("*");
        my_values.push(trimmed.slice(0, i));
        my_weights.push(parseFloat(trimmed.slice(i + 1)));
      } else {
        my_values.push(trimmed);
        my_weights.push(1);
      }
    }
    return [my_values, my_weights];
  }
  valid_words_weights(str) {
    const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;
    const asterisk_at_start = /^\*/;
    const asterisk_after_space_or_comma = /[ ,]\*/g;
    const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\])\n]|$)/g;
    if (asterisk_without_number.test(str) || asterisk_at_start.test(str) || asterisk_after_space_or_comma.test(str) || asterisk_number_bad_suffix.test(str)) {
      return false;
    }
    return true;
  }
  expand_wordshape_units() {
    this.wordshape_pending.content = recursive_expansion(
      this.wordshape_pending.content,
      this.units
    );
    const match = this.wordshape_pending.content.match(/<[A-Za-z+$-]+>/);
    if (match) {
      this.logger.validation_error(
        `Nonexistent unit detected: '${match[0]}'`,
        this.wordshape_pending.line_num
      );
    }
  }
  expand_units() {
    for (const [key, value] of this.units.entries()) {
      const expanded_content = recursive_expansion(value.content, this.units);
      this.units.set(key, {
        content: expanded_content,
        line_num: value.line_num
        // Preserve original line_num
      });
    }
  }
  show_debug() {
    const units = [];
    for (const [key, value] of this.units) {
      units.push(`  ${key.slice(1, -1)} = ${value.content}`);
    }
    const wordshapes = [];
    for (let i = 0; i < this.wordshapes.items.length; i++) {
      wordshapes.push(
        `  ${this.wordshapes.items[i]}*${this.wordshapes.weights[i]}`
      );
    }
    const info = `Wordshape-distribution: ` + this.wordshape_distribution + `
Optionals-weight: ` + this.optionals_weight + `
Units {
` + units.join("\n") + `
}
Wordshapes {
` + wordshapes.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
}
class Resolver {
  constructor(logger, output_mode, escape_mapper, feature_pending, graphemes) {
    __publicField(this, "logger");
    __publicField(this, "escape_mapper");
    __publicField(this, "output_mode");
    __publicField(this, "feature_pending");
    __publicField(this, "features");
    __publicField(this, "graphemes");
    this.logger = logger;
    this.output_mode = output_mode;
    this.escape_mapper = escape_mapper;
    this.graphemes = graphemes;
    this.feature_pending = feature_pending;
    this.features = /* @__PURE__ */ new Map();
    this.resolve_features();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_features() {
    for (const [key, value] of this.feature_pending) {
      if (key.startsWith(">")) {
        this.feature_pending.delete(key);
        const to_delete = value.content.split(",").map((str) => "^" + str);
        const anti_graphemes = to_delete.join(",") + this.graphemes.join(",");
        this.feature_pending.set(key.replace(">", "-"), {
          content: anti_graphemes,
          line_num: value.line_num
        });
        this.feature_pending.set(key.replace(">", "+"), {
          content: value.content,
          line_num: value.line_num
        });
      }
    }
    for (const [key, value] of this.feature_pending) {
      const expanded_content = recursive_expansion(
        value.content,
        this.feature_pending
      );
      this.feature_pending.set(key, {
        content: expanded_content,
        line_num: value.line_num
        // Preserve original line_num
      });
    }
    for (const [key, value] of this.feature_pending) {
      const unique_graphemes = Array.from(new Set(value.content.split(",")));
      const filtered_graphemes = [];
      const graphemes_to_remove = [];
      for (const item of unique_graphemes) {
        if (item.startsWith("^")) {
          const modified = item.slice(1);
          graphemes_to_remove.push(modified);
          continue;
        }
        if (item.includes("^")) {
          this.logger.validation_error(
            `Invalid grapheme '${item}' has a misplaced caret`,
            value.line_num
          );
        }
        if (item.startsWith("+") || item.startsWith("-") || item.startsWith(">")) {
          this.logger.validation_error(
            `Referenced feature '${item}' not found`,
            value.line_num
          );
        }
        filtered_graphemes.push(item);
      }
      const x_filtered = filtered_graphemes.filter(
        (item) => !graphemes_to_remove.includes(item)
      );
      if (x_filtered.length === 0) {
        this.logger.validation_error(
          `Feature '${key}' had zero graphemes`,
          value.line_num
        );
      }
      for (let i = 0; i < x_filtered.length; i++) {
        x_filtered[i] = this.escape_mapper.escape_special_chars(x_filtered[i]);
      }
      this.features.set(key, { graphemes: x_filtered });
    }
  }
  show_debug() {
    const features = [];
    for (const [key, value] of this.features) {
      features.push(`  ${key} = ${value.graphemes.join(", ")}`);
    }
    const info = `Features {
` + features.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
}
class Canon_Graphemes_Resolver {
  constructor(logger, escape_mapper, graphemes_pending) {
    __publicField(this, "logger");
    __publicField(this, "escape_mapper");
    __publicField(this, "graphemes_pending");
    __publicField(this, "graphemes");
    __publicField(this, "associateme_mapper");
    this.logger = logger;
    this.escape_mapper = escape_mapper;
    this.graphemes_pending = graphemes_pending;
    this.graphemes = [];
    this.associateme_mapper = [];
    this.resolve_canon_graphemes();
    this.resolve_associatemes();
  }
  resolve_canon_graphemes() {
    const new_graphemes = this.graphemes_pending.replace(/(<\{|\})/g, ",");
    const graphemes = new_graphemes.split(/[,\s]+/).filter(Boolean);
    for (let i = 0; i < graphemes.length; i++) {
      graphemes[i] = this.escape_mapper.restore_escaped_chars(graphemes[i]);
    }
    this.graphemes = Array.from(new Set(graphemes));
  }
  resolve_associatemes() {
    const mapper = [];
    const input = this.graphemes_pending ?? "";
    const setRegex = /\{[^}]+\}(?:\s*<\s*\{[^}]+\})*/g;
    const matches = [...input.matchAll(setRegex)];
    let scrubbed = input;
    for (const m of matches) {
      scrubbed = scrubbed.replace(m[0], "");
    }
    if (scrubbed.includes("<")) {
      this.logger.validation_error(
        `Stray "<" found outside of a valid associateme entry`
      );
    }
    for (const m of matches) {
      const segment = m[0];
      const groups = segment.split("<").map(
        (g) => g.replace(/[{}]/g, "").trim().split(/[,\s]+/).map((x) => x.trim()).filter((x) => x.length > 0)
      );
      if (groups.length === 0) {
        this.logger.validation_error(
          `A base associateme was empty in the graphemes directive`
        );
      }
      const bases = groups[0];
      if (bases.length === 0) {
        this.logger.validation_error(
          `A base associateme was empty in the graphemes directive`
        );
      }
      const expectedLen = bases.length;
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        if (g.length !== expectedLen) {
          const label = i === 0 ? "bases" : `variant ${i}`;
          this.logger.validation_error(
            `Mismatched associateme entry variant group length in "${segment}": ${label} had a length of ${g.length} -- expected length of ${expectedLen}`
          );
        }
      }
      const variants = [...groups];
      mapper.push({ bases, variants });
    }
    this.associateme_mapper = mapper;
  }
}
function generate({
  file,
  num_of_words = 100,
  mode = "word-list",
  remove_duplicates = true,
  force_word_limit = false,
  sort_words = true,
  word_divider = " "
}) {
  const logger = new Logger();
  let text = "";
  try {
    const build_start = Date.now();
    const escape_mapper = new Escape_Mapper();
    const supra_builder = new Supra_Builder(logger);
    const p = new Parser(
      logger,
      escape_mapper,
      supra_builder,
      num_of_words,
      mode,
      sort_words,
      remove_duplicates,
      force_word_limit,
      word_divider
    );
    p.parse_file(file);
    const category_resolver = new Category_Resolver(
      logger,
      p.output_mode,
      escape_mapper,
      p.category_distribution,
      p.category_pending
    );
    const generation_resolver = new Generation_Resolver(
      logger,
      p.output_mode,
      supra_builder,
      p.wordshape_distribution,
      p.units,
      p.wordshape_pending,
      p.optionals_weight
    );
    const canon_graphemes_resolver = new Canon_Graphemes_Resolver(
      logger,
      escape_mapper,
      p.graphemes_pending
    );
    const feature_resolver = new Resolver(
      logger,
      p.output_mode,
      escape_mapper,
      p.feature_pending,
      canon_graphemes_resolver.graphemes
    );
    const nesca_grammar_stream = new Nesca_Grammar_Stream(
      logger,
      canon_graphemes_resolver.graphemes,
      canon_graphemes_resolver.associateme_mapper,
      escape_mapper
    );
    const transform_resolver = new Transform_Resolver(
      logger,
      p.output_mode,
      nesca_grammar_stream,
      category_resolver.trans_categories,
      p.transform_pending,
      feature_resolver.features
    );
    const word_builder = new Word_Builder(
      escape_mapper,
      supra_builder,
      category_resolver.categories,
      generation_resolver.wordshapes,
      category_resolver.category_distribution,
      generation_resolver.optionals_weight,
      p.output_mode
    );
    const transformer = new Transformer(
      logger,
      canon_graphemes_resolver.graphemes,
      transform_resolver.transforms,
      p.output_mode,
      canon_graphemes_resolver.associateme_mapper
    );
    const text_builder = new Text_Builder(
      logger,
      build_start,
      p.num_of_words,
      p.output_mode,
      p.remove_duplicates,
      p.force_word_limit,
      p.sort_words,
      p.word_divider,
      p.alphabet,
      p.invisible
    );
    while (!text_builder.terminated) {
      let word = word_builder.make_word();
      word = transformer.do_transforms(word);
      text_builder.add_word(word);
    }
    text = text_builder.make_text();
  } catch (e) {
    if (!(e instanceof logger.Validation_Error)) {
      logger.uncaught_error(e);
    }
  }
  return {
    text,
    errors: logger.errors,
    warnings: logger.warnings,
    infos: logger.infos,
    diagnostics: logger.diagnostics
  };
}
const encodings = [
  "ascii",
  "binary",
  "latin1",
  "ucs-2",
  "ucs2",
  "utf-8",
  "utf16le",
  "utf8"
];
const argv = Yargs(hideBin(process.argv)).usage("Usage: $0 <path> [options]").alias({ help: "?", version: "v" }).option("num_of_words", {
  alias: "n",
  describe: "Number of words to generate",
  type: "number",
  default: 100
}).option("output_mode", {
  alias: "m",
  describe: "Output mode",
  choices: ["word-list", "debug", "paragraph"],
  default: "word-list"
}).option("remove_duplicates", {
  alias: "d",
  describe: "Remove duplicate words",
  type: "boolean",
  default: true
}).option("force_word_limit", {
  alias: "l",
  describe: "Force word limit",
  type: "boolean",
  default: false
}).option("sort_words", {
  alias: "s",
  describe: "Sort generated words",
  type: "boolean",
  default: true
}).option("word_divider", {
  alias: "w",
  describe: "Divider between words",
  type: "string",
  default: " "
}).option("encoding", {
  alias: "e",
  choices: encodings,
  describe: "What file encoding to use",
  default: "utf8",
  requiresArg: true,
  coerce: (enc) => {
    const littleEnc = enc.toLowerCase();
    if (littleEnc === "utf-16le") {
      return "utf16le";
    } else if (!encodings.includes(littleEnc)) {
      let errorString = `Invalid values:
  Argument: encoding, Given: "${enc}", Choices: `;
      for (let i = 0; i < encodings.length; ++i) {
        if (i !== 0) {
          errorString += ", ";
        }
        errorString += `"${encodings[i]}"`;
      }
      throw new Error(errorString);
    }
    return littleEnc;
  }
}).check((argv2) => {
  return true;
}).parseSync();
const filePath = argv._[0];
if (!filePath) {
  console.error("Error: No file path provided.");
  process.exitCode = 1;
  process.exit();
}
const file_text = fs.readFileSync(filePath, argv.encoding);
try {
  const run = generate({
    file: file_text,
    num_of_words: argv.num_of_words,
    mode: argv.output_mode,
    remove_duplicates: argv.remove_duplicates,
    force_word_limit: argv.force_word_limit,
    sort_words: argv.sort_words,
    word_divider: argv.word_divider
  });
  for (const warning of run.warnings) {
    console.warn(warning);
  }
  for (const error of run.errors) {
    console.error(error);
  }
  for (const info of run.infos) {
    console.info(info);
  }
  console.log(
    run.text
  );
} catch {
  process.exitCode = 1;
  console.error(`Error: Could not find file '${argv._[0]}'.`);
}
