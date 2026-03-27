#!/usr/bin/env node

// src/index.ts
import { createRequire } from "module";

// ../core/dist/index.js
import { createHmac } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1; i <= line + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError = class extends Error {
  line;
  column;
  codeblock;
  constructor(message, options) {
    const [line, column] = getLineColFromPtr(options.toml, options.ptr);
    const codeblock = makeCodeBlock(options.toml, line, column);
    super(`Invalid TOML document: ${message}

${codeblock}`, options);
    this.line = line;
    this.column = column;
    this.codeblock = codeblock;
  }
};

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/util.js
function isEscaped(str, ptr) {
  let i = 0;
  while (str[ptr - ++i] === "\\")
    ;
  return --i && i % 2;
}
function indexOfNewline(str, start = 0, end = str.length) {
  let idx = str.indexOf("\n", start);
  if (str[idx - 1] === "\r")
    idx--;
  return idx <= end ? idx : -1;
}
function skipComment(str, ptr) {
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "\n")
      return i;
    if (c === "\r" && str[i + 1] === "\n")
      return i + 1;
    if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in comments", {
        toml: str,
        ptr
      });
    }
  }
  return str.length;
}
function skipVoid(str, ptr, banNewLines, banComments) {
  let c;
  while ((c = str[ptr]) === " " || c === "	" || !banNewLines && (c === "\n" || c === "\r" && str[ptr + 1] === "\n"))
    ptr++;
  return banComments || c !== "#" ? ptr : skipVoid(str, skipComment(str, ptr), banNewLines);
}
function skipUntil(str, ptr, sep, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr; i < str.length; i++) {
    let c = str[i];
    if (c === "#") {
      i = indexOfNewline(str, i);
    } else if (c === sep) {
      return i + 1;
    } else if (c === end || banNewLines && (c === "\n" || c === "\r" && str[i + 1] === "\n")) {
      return i;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: str,
    ptr
  });
}
function getStringEnd(str, seek) {
  let first = str[seek];
  let target = first === str[seek + 1] && str[seek + 1] === str[seek + 2] ? str.slice(seek, seek + 3) : first;
  seek += target.length - 1;
  do
    seek = str.indexOf(target, ++seek);
  while (seek > -1 && first !== "'" && isEscaped(str, seek));
  if (seek > -1) {
    seek += target.length;
    if (target.length > 1) {
      if (str[seek] === first)
        seek++;
      if (str[seek] === first)
        seek++;
    }
  }
  return seek;
}

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/date.js
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class _TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    if (typeof date === "string") {
      let match = date.match(DATE_TIME_RE);
      if (match) {
        if (!match[1]) {
          hasDate = false;
          date = `0000-01-01T${date}`;
        }
        hasTime = !!match[2];
        hasTime && date[10] === " " && (date = date.replace(" ", "T"));
        if (match[2] && +match[2] > 23) {
          date = "";
        } else {
          offset = match[3] || null;
          date = date.toUpperCase();
          if (!offset && hasTime)
            date += "Z";
        }
      } else {
        date = "";
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 6e4);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new _TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
};

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/primitive.js
var INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var LEADING_ZERO = /^[+-]?0[0-9_]/;
var ESCAPE_REGEX = /^[0-9a-f]{2,8}$/i;
var ESC_MAP = {
  b: "\b",
  t: "	",
  n: "\n",
  f: "\f",
  r: "\r",
  e: "\x1B",
  '"': '"',
  "\\": "\\"
};
function parseString(str, ptr = 0, endPtr = str.length) {
  let isLiteral = str[ptr] === "'";
  let isMultiline = str[ptr++] === str[ptr] && str[ptr] === str[ptr + 1];
  if (isMultiline) {
    endPtr -= 2;
    if (str[ptr += 2] === "\r")
      ptr++;
    if (str[ptr] === "\n")
      ptr++;
  }
  let tmp = 0;
  let isEscape;
  let parsed = "";
  let sliceStart = ptr;
  while (ptr < endPtr - 1) {
    let c = str[ptr++];
    if (c === "\n" || c === "\r" && str[ptr] === "\n") {
      if (!isMultiline) {
        throw new TomlError("newlines are not allowed in strings", {
          toml: str,
          ptr: ptr - 1
        });
      }
    } else if (c < " " && c !== "	" || c === "\x7F") {
      throw new TomlError("control characters are not allowed in strings", {
        toml: str,
        ptr: ptr - 1
      });
    }
    if (isEscape) {
      isEscape = false;
      if (c === "x" || c === "u" || c === "U") {
        let code = str.slice(ptr, ptr += c === "x" ? 2 : c === "u" ? 4 : 8);
        if (!ESCAPE_REGEX.test(code)) {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
        try {
          parsed += String.fromCodePoint(parseInt(code, 16));
        } catch {
          throw new TomlError("invalid unicode escape", {
            toml: str,
            ptr: tmp
          });
        }
      } else if (isMultiline && (c === "\n" || c === " " || c === "	" || c === "\r")) {
        ptr = skipVoid(str, ptr - 1, true);
        if (str[ptr] !== "\n" && str[ptr] !== "\r") {
          throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
            toml: str,
            ptr: tmp
          });
        }
        ptr = skipVoid(str, ptr);
      } else if (c in ESC_MAP) {
        parsed += ESC_MAP[c];
      } else {
        throw new TomlError("unrecognized escape sequence", {
          toml: str,
          ptr: tmp
        });
      }
      sliceStart = ptr;
    } else if (!isLiteral && c === "\\") {
      tmp = ptr - 1;
      isEscape = true;
      parsed += str.slice(sliceStart, tmp);
    }
  }
  return parsed + str.slice(sliceStart, endPtr - 1);
}
function parseValue(value, toml, ptr, integersAsBigInt) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid()) {
    throw new TomlError("invalid value", {
      toml,
      ptr
    });
  }
  return date;
}

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/extract.js
function sliceAndTrimEndOf(str, startPtr, endPtr) {
  let value = str.slice(startPtr, endPtr);
  let commentIdx = value.indexOf("#");
  if (commentIdx > -1) {
    skipComment(str, commentIdx);
    value = value.slice(0, commentIdx);
  }
  return [value.trimEnd(), commentIdx];
}
function extractValue(str, ptr, end, depth, integersAsBigInt) {
  if (depth === 0) {
    throw new TomlError("document contains excessively nested structures. aborting.", {
      toml: str,
      ptr
    });
  }
  let c = str[ptr];
  if (c === "[" || c === "{") {
    let [value, endPtr2] = c === "[" ? parseArray(str, ptr, depth, integersAsBigInt) : parseInlineTable(str, ptr, depth, integersAsBigInt);
    if (end) {
      endPtr2 = skipVoid(str, endPtr2);
      if (str[endPtr2] === ",")
        endPtr2++;
      else if (str[endPtr2] !== end) {
        throw new TomlError("expected comma or end of structure", {
          toml: str,
          ptr: endPtr2
        });
      }
    }
    return [value, endPtr2];
  }
  let endPtr;
  if (c === '"' || c === "'") {
    endPtr = getStringEnd(str, ptr);
    let parsed = parseString(str, ptr, endPtr);
    if (end) {
      endPtr = skipVoid(str, endPtr);
      if (str[endPtr] && str[endPtr] !== "," && str[endPtr] !== end && str[endPtr] !== "\n" && str[endPtr] !== "\r") {
        throw new TomlError("unexpected character encountered", {
          toml: str,
          ptr: endPtr
        });
      }
      endPtr += +(str[endPtr] === ",");
    }
    return [parsed, endPtr];
  }
  endPtr = skipUntil(str, ptr, ",", end);
  let slice = sliceAndTrimEndOf(str, ptr, endPtr - +(str[endPtr - 1] === ","));
  if (!slice[0]) {
    throw new TomlError("incomplete key-value declaration: no value specified", {
      toml: str,
      ptr
    });
  }
  if (end && slice[1] > -1) {
    endPtr = skipVoid(str, ptr + slice[1]);
    endPtr += +(str[endPtr] === ",");
  }
  return [
    parseValue(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/struct.js
var KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
function parseKey(str, ptr, end = "=") {
  let dot = ptr - 1;
  let parsed = [];
  let endPtr = str.indexOf(end, ptr);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: str,
      ptr
    });
  }
  do {
    let c = str[ptr = ++dot];
    if (c !== " " && c !== "	") {
      if (c === '"' || c === "'") {
        if (c === str[ptr + 1] && c === str[ptr + 2]) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: str,
            ptr
          });
        }
        let eos = getStringEnd(str, ptr);
        if (eos < 0) {
          throw new TomlError("unfinished string encountered", {
            toml: str,
            ptr
          });
        }
        dot = str.indexOf(".", eos);
        let strEnd = str.slice(eos, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: str,
            ptr: ptr + dot + newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: str,
            ptr: eos
          });
        }
        if (endPtr < eos) {
          endPtr = str.indexOf(end, eos);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: str,
              ptr
            });
          }
        }
        parsed.push(parseString(str, ptr, eos));
      } else {
        dot = str.indexOf(".", ptr);
        let part = str.slice(ptr, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: str,
            ptr
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  return [parsed, skipVoid(str, endPtr + 1, true, true)];
}
function parseInlineTable(str, ptr, depth, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "}" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "	" && c !== "\n" && c !== "\r") {
      let k;
      let t = res;
      let hasOwn = false;
      let [key, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0; i < key.length; i++) {
        if (i)
          t = hasOwn ? t[k] : t[k] = {};
        k = key[i];
        if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: str,
          ptr
        });
      }
      let [value, valueEndPtr] = extractValue(str, keyEndPtr, "}", depth - 1, integersAsBigInt);
      seen.add(value);
      t[k] = value;
      ptr = valueEndPtr;
    }
  }
  if (!c) {
    throw new TomlError("unfinished table encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}
function parseArray(str, ptr, depth, integersAsBigInt) {
  let res = [];
  let c;
  ptr++;
  while ((c = str[ptr++]) !== "]" && c) {
    if (c === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c === "#")
      ptr = skipComment(str, ptr);
    else if (c !== " " && c !== "	" && c !== "\n" && c !== "\r") {
      let e = extractValue(str, ptr - 1, "]", depth - 1, integersAsBigInt);
      res.push(e[0]);
      ptr = e[1];
    }
  }
  if (!c) {
    throw new TomlError("unfinished array encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/parse.js
function peekTable(key, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key[i];
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k === "__proto__") {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t, state.c];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let res = {};
  let meta = {};
  let tbl = res;
  let m = meta;
  for (let ptr = skipVoid(toml, 0); ptr < toml.length; ) {
    if (toml[ptr] === "[") {
      let isTableArray = toml[++ptr] === "[";
      let k = parseKey(toml, ptr += +isTableArray, "]");
      if (isTableArray) {
        if (toml[k[1] - 1] !== "]") {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: k[1] - 1
          });
        }
        k[1]++;
      }
      let p = peekTable(
        k[0],
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      m = p[2];
      tbl = p[1];
      ptr = k[1];
    } else {
      let k = parseKey(toml, ptr);
      let p = peekTable(
        k[0],
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      let v = extractValue(toml, k[1], void 0, maxDepth, integersAsBigInt);
      p[1][p[0]] = v[0];
      ptr = v[1];
    }
    ptr = skipVoid(toml, ptr, true);
    if (toml[ptr] && toml[ptr] !== "\n" && toml[ptr] !== "\r") {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr
      });
    }
    ptr = skipVoid(toml, ptr);
  }
  return res;
}

// ../../node_modules/.pnpm/smol-toml@1.6.0/node_modules/smol-toml/dist/stringify.js
var BARE_KEY = /^[a-z0-9-_]+$/i;
function extendedTypeOf(obj) {
  let type = typeof obj;
  if (type === "object") {
    if (Array.isArray(obj))
      return "array";
    if (obj instanceof Date)
      return "date";
  }
  return type;
}
function isArrayOfTables(obj) {
  for (let i = 0; i < obj.length; i++) {
    if (extendedTypeOf(obj[i]) !== "object")
      return false;
  }
  return obj.length != 0;
}
function formatString(s) {
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyValue(val, type, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  if (type === "number") {
    if (isNaN(val))
      return "nan";
    if (val === Infinity)
      return "inf";
    if (val === -Infinity)
      return "-inf";
    if (numberAsFloat && Number.isInteger(val))
      return val.toFixed(1);
    return val.toString();
  }
  if (type === "bigint" || type === "boolean") {
    return val.toString();
  }
  if (type === "string") {
    return formatString(val);
  }
  if (type === "date") {
    if (isNaN(val.getTime())) {
      throw new TypeError("cannot serialize invalid date");
    }
    return val.toISOString();
  }
  if (type === "object") {
    return stringifyInlineTable(val, depth, numberAsFloat);
  }
  if (type === "array") {
    return stringifyArray(val, depth, numberAsFloat);
  }
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
  let keys = Object.keys(obj);
  if (keys.length === 0)
    return "{}";
  let res = "{ ";
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (i)
      res += ", ";
    res += BARE_KEY.test(k) ? k : formatString(k);
    res += " = ";
    res += stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat);
  }
  return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
  if (array.length === 0)
    return "[]";
  let res = "[ ";
  for (let i = 0; i < array.length; i++) {
    if (i)
      res += ", ";
    if (array[i] === null || array[i] === void 0) {
      throw new TypeError("arrays cannot contain null or undefined values");
    }
    res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat);
  }
  return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let res = "";
  for (let i = 0; i < array.length; i++) {
    res += `${res && "\n"}[[${key}]]
`;
    res += stringifyTable(0, array[i], key, depth, numberAsFloat);
  }
  return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let preamble = "";
  let tables = "";
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (obj[k] !== null && obj[k] !== void 0) {
      let type = extendedTypeOf(obj[k]);
      if (type === "symbol" || type === "function") {
        throw new TypeError(`cannot serialize values of type '${type}'`);
      }
      let key = BARE_KEY.test(k) ? k : formatString(k);
      if (type === "array" && isArrayOfTables(obj[k])) {
        tables += (tables && "\n") + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
      } else if (type === "object") {
        let tblKey = prefix ? `${prefix}.${key}` : key;
        tables += (tables && "\n") + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat);
      } else {
        preamble += key;
        preamble += " = ";
        preamble += stringifyValue(obj[k], type, depth, numberAsFloat);
        preamble += "\n";
      }
    }
  }
  if (tableKey && (preamble || !tables))
    preamble = preamble ? `[${tableKey}]
${preamble}` : `[${tableKey}]`;
  return preamble && tables ? `${preamble}
${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false } = {}) {
  if (extendedTypeOf(obj) !== "object") {
    throw new TypeError("stringify can only be called with an object");
  }
  let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
  if (str[str.length - 1] !== "\n")
    return str + "\n";
  return str;
}

// ../core/dist/index.js
import { readFileSync as readFileSync2, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2, existsSync as existsSync2 } from "fs";
import { join as join2 } from "path";
import { homedir as homedir2 } from "os";
import * as fs3 from "fs";
import * as path3 from "path";
import * as os3 from "os";
import { execFileSync } from "child_process";
function getNow() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function signOkxPayload(payload, secretKey) {
  return createHmac("sha256", secretKey).update(payload).digest("base64");
}
var OkxMcpError = class extends Error {
  type;
  code;
  suggestion;
  endpoint;
  traceId;
  constructor(type, message, options) {
    super(message, options?.cause ? { cause: options.cause } : void 0);
    this.name = type;
    this.type = type;
    this.code = options?.code;
    this.suggestion = options?.suggestion;
    this.endpoint = options?.endpoint;
    this.traceId = options?.traceId;
  }
};
var ConfigError = class extends OkxMcpError {
  constructor(message, suggestion) {
    super("ConfigError", message, { suggestion });
  }
};
var ValidationError = class extends OkxMcpError {
  constructor(message, suggestion) {
    super("ValidationError", message, { suggestion });
  }
};
var RateLimitError = class extends OkxMcpError {
  constructor(message, suggestion, endpoint, traceId) {
    super("RateLimitError", message, { suggestion, endpoint, traceId });
  }
};
var AuthenticationError = class extends OkxMcpError {
  constructor(message, suggestion, endpoint, traceId) {
    super("AuthenticationError", message, { suggestion, endpoint, traceId });
  }
};
var OkxApiError = class extends OkxMcpError {
  constructor(message, options) {
    super("OkxApiError", message, options);
  }
};
var NetworkError = class extends OkxMcpError {
  constructor(message, endpoint, cause) {
    super("NetworkError", message, {
      endpoint,
      cause,
      suggestion: "Please check network connectivity and retry the request in a few seconds."
    });
  }
};
function toToolErrorPayload(error, fallbackEndpoint) {
  if (error instanceof OkxMcpError) {
    return {
      error: true,
      type: error.type,
      code: error.code,
      message: error.message,
      suggestion: error.suggestion,
      endpoint: error.endpoint ?? fallbackEndpoint,
      traceId: error.traceId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    error: true,
    type: "InternalError",
    message,
    suggestion: "Unexpected server error. Check tool arguments and retry. If it persists, inspect server logs.",
    endpoint: fallbackEndpoint,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
var RateLimiter = class {
  buckets = /* @__PURE__ */ new Map();
  maxWaitMs;
  constructor(maxWaitMs = 3e4) {
    this.maxWaitMs = maxWaitMs;
  }
  async consume(config, amount = 1) {
    const bucket = this.getBucket(config);
    this.refill(bucket);
    if (bucket.tokens >= amount) {
      bucket.tokens -= amount;
      return;
    }
    const missing = amount - bucket.tokens;
    const secondsToWait = missing / bucket.refillPerSecond;
    const waitMs = Math.ceil(secondsToWait * 1e3);
    if (waitMs > this.maxWaitMs) {
      throw new RateLimitError(
        `Client-side rate limit reached for ${config.key}. Required wait ${waitMs}ms exceeds allowed max ${this.maxWaitMs}ms.`,
        "Reduce tool call frequency or retry later."
      );
    }
    await sleep(waitMs);
    this.refill(bucket);
    if (bucket.tokens < amount) {
      throw new RateLimitError(
        `Rate limiter failed to acquire enough tokens for ${config.key}.`
      );
    }
    bucket.tokens -= amount;
  }
  getBucket(config) {
    const existing = this.buckets.get(config.key);
    if (existing) {
      if (existing.capacity !== config.capacity || existing.refillPerSecond !== config.refillPerSecond) {
        existing.capacity = config.capacity;
        existing.refillPerSecond = config.refillPerSecond;
        existing.tokens = Math.min(existing.tokens, config.capacity);
      }
      return existing;
    }
    const now = Date.now();
    const created = {
      tokens: config.capacity,
      lastRefillMs: now,
      capacity: config.capacity,
      refillPerSecond: config.refillPerSecond
    };
    this.buckets.set(config.key, created);
    return created;
  }
  refill(bucket) {
    const now = Date.now();
    const elapsedMs = now - bucket.lastRefillMs;
    if (elapsedMs <= 0) {
      return;
    }
    const refillTokens = elapsedMs / 1e3 * bucket.refillPerSecond;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refillTokens);
    bucket.lastRefillMs = now;
  }
};
var OKX_CODE_BEHAVIORS = {
  // Rate limit → throw RateLimitError
  "50011": { retry: true, suggestion: "Rate limited. Back off and retry after a delay." },
  "50061": { retry: true, suggestion: "Too many connections. Reduce request frequency and retry." },
  // Server temporarily unavailable → retryable
  "50001": { retry: true, suggestion: "OKX system upgrade in progress. Retry in a few minutes." },
  "50004": { retry: true, suggestion: "Endpoint temporarily unavailable. Retry later." },
  "50013": { retry: true, suggestion: "System busy. Retry after 1-2 seconds." },
  "50026": { retry: true, suggestion: "Order book system upgrading. Retry in a few minutes." },
  // Region / compliance restriction → do not retry
  "51155": { retry: false, suggestion: "Feature unavailable in your region (site: {site}). Verify your site setting matches your account registration region. Available sites: global, eea, us. Do not retry." },
  "51734": { retry: false, suggestion: "Feature not supported for your KYC country (site: {site}). Verify your site setting matches your account registration region. Available sites: global, eea, us. Do not retry." },
  // Account issues → do not retry
  "50007": { retry: false, suggestion: "Account suspended. Contact OKX support. Do not retry." },
  "50009": { retry: false, suggestion: "Account blocked by risk control. Contact OKX support. Do not retry." },
  "51009": { retry: false, suggestion: "Account mode not supported for this operation. Check account settings." },
  // API key permission / expiry → do not retry
  "50100": { retry: false, suggestion: "API key lacks required permissions. Update API key permissions." },
  "50110": { retry: false, suggestion: "API key expired. Generate a new API key." },
  // Insufficient funds / margin → do not retry
  "51008": { retry: false, suggestion: "Insufficient balance. Top up account before retrying." },
  "51119": { retry: false, suggestion: "Insufficient margin. Add margin before retrying." },
  "51127": { retry: false, suggestion: "Insufficient available margin. Reduce position or add margin." },
  // Instrument unavailable → do not retry
  "51021": { retry: false, suggestion: "Instrument does not exist. Check instId." },
  "51022": { retry: false, suggestion: "Instrument not available for trading." },
  "51027": { retry: false, suggestion: "Contract has expired." }
};
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function extractTraceId(headers) {
  return headers.get("x-trace-id") ?? headers.get("x-request-id") ?? headers.get("traceid") ?? void 0;
}
function stringifyQueryValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }
  return String(value);
}
function buildQueryString(query) {
  if (!query) {
    return "";
  }
  const entries = Object.entries(query).filter(([, value]) => isDefined(value));
  if (entries.length === 0) {
    return "";
  }
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.set(key, stringifyQueryValue(value));
  }
  return params.toString();
}
var OkxRestClient = class {
  config;
  rateLimiter = new RateLimiter();
  constructor(config) {
    this.config = config;
  }
  async publicGet(path4, query, rateLimit) {
    return this.request({
      method: "GET",
      path: path4,
      auth: "public",
      query,
      rateLimit
    });
  }
  async privateGet(path4, query, rateLimit) {
    return this.request({
      method: "GET",
      path: path4,
      auth: "private",
      query,
      rateLimit
    });
  }
  async privatePost(path4, body, rateLimit) {
    return this.request({
      method: "POST",
      path: path4,
      auth: "private",
      body,
      rateLimit
    });
  }
  async request(config) {
    const queryString = buildQueryString(config.query);
    const requestPath = queryString.length > 0 ? `${config.path}?${queryString}` : config.path;
    const url = `${this.config.baseUrl}${requestPath}`;
    const bodyJson = config.body ? JSON.stringify(config.body) : "";
    const timestamp = getNow();
    if (config.rateLimit) {
      await this.rateLimiter.consume(config.rateLimit);
    }
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json"
    });
    if (this.config.userAgent) {
      headers.set("User-Agent", this.config.userAgent);
    }
    if (config.auth === "private") {
      if (!this.config.hasAuth) {
        throw new ConfigError(
          "Private endpoint requires API credentials.",
          "Configure OKX_API_KEY, OKX_SECRET_KEY and OKX_PASSPHRASE."
        );
      }
      if (!this.config.apiKey || !this.config.secretKey || !this.config.passphrase) {
        throw new ConfigError(
          "Invalid private API credentials state.",
          "Ensure all OKX credentials are set."
        );
      }
      const payload = `${timestamp}${config.method.toUpperCase()}${requestPath}${bodyJson}`;
      const signature = signOkxPayload(payload, this.config.secretKey);
      headers.set("OK-ACCESS-KEY", this.config.apiKey);
      headers.set("OK-ACCESS-SIGN", signature);
      headers.set("OK-ACCESS-PASSPHRASE", this.config.passphrase);
      headers.set("OK-ACCESS-TIMESTAMP", timestamp);
    }
    if (this.config.demo) {
      headers.set("x-simulated-trading", "1");
    }
    let response;
    try {
      response = await fetch(url, {
        method: config.method,
        headers,
        body: config.method === "POST" ? bodyJson : void 0,
        signal: AbortSignal.timeout(this.config.timeoutMs)
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to call OKX endpoint ${config.method} ${requestPath}.`,
        `${config.method} ${requestPath}`,
        error
      );
    }
    const rawText = await response.text();
    const traceId = extractTraceId(response.headers);
    let parsed;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
      if (!response.ok) {
        const messagePreview = rawText.slice(0, 160).replace(/\s+/g, " ").trim();
        throw new OkxApiError(
          `HTTP ${response.status} from OKX: ${messagePreview || "Non-JSON response body"}`,
          {
            code: String(response.status),
            endpoint: `${config.method} ${config.path}`,
            suggestion: "Verify endpoint path and request parameters.",
            traceId
          }
        );
      }
      throw new NetworkError(
        `OKX returned non-JSON response for ${config.method} ${requestPath}.`,
        `${config.method} ${requestPath}`,
        error
      );
    }
    if (!response.ok) {
      throw new OkxApiError(
        `HTTP ${response.status} from OKX: ${parsed.msg ?? "Unknown error"}`,
        {
          code: String(response.status),
          endpoint: `${config.method} ${config.path}`,
          suggestion: "Retry later or verify endpoint parameters.",
          traceId
        }
      );
    }
    const responseCode = parsed.code;
    if (responseCode && responseCode !== "0" && responseCode !== "1") {
      const message = parsed.msg || "OKX API request failed.";
      const endpoint = `${config.method} ${config.path}`;
      if (responseCode === "50111" || responseCode === "50112" || responseCode === "50113") {
        throw new AuthenticationError(
          message,
          "Check API key, secret, passphrase and permissions.",
          endpoint,
          traceId
        );
      }
      const behavior = OKX_CODE_BEHAVIORS[responseCode];
      const suggestion = behavior?.suggestion?.replace("{site}", this.config.site);
      if (responseCode === "50011" || responseCode === "50061") {
        throw new RateLimitError(message, suggestion, endpoint, traceId);
      }
      throw new OkxApiError(message, {
        code: responseCode,
        endpoint,
        suggestion,
        traceId
      });
    }
    return {
      endpoint: `${config.method} ${config.path}`,
      requestTime: (/* @__PURE__ */ new Date()).toISOString(),
      data: parsed.data ?? null,
      raw: parsed
    };
  }
};
var OKX_SITES = {
  global: {
    label: "Global",
    apiBaseUrl: "https://www.okx.com",
    webUrl: "https://www.okx.com"
  },
  eea: {
    label: "EEA",
    apiBaseUrl: "https://eea.okx.com",
    webUrl: "https://my.okx.com"
  },
  us: {
    label: "US",
    apiBaseUrl: "https://app.okx.com",
    webUrl: "https://app.okx.com"
  }
};
var SITE_IDS = Object.keys(OKX_SITES);
var BOT_SUB_MODULE_IDS = ["bot.grid", "bot.dca"];
var BOT_DEFAULT_SUB_MODULES = ["bot.grid"];
var MODULES = [
  "market",
  "spot",
  "swap",
  "futures",
  "option",
  "account",
  "earn",
  ...BOT_SUB_MODULE_IDS
];
var DEFAULT_MODULES = [
  "spot",
  "swap",
  "option",
  "account",
  ...BOT_DEFAULT_SUB_MODULES
];
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}
function readString(args, key) {
  const value = args[key];
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`Parameter "${key}" must be a string.`);
  }
  return value;
}
function readNumber(args, key) {
  const value = args[key];
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`Parameter "${key}" must be a number.`);
  }
  return value;
}
function readBoolean(args, key) {
  const value = args[key];
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "boolean") {
    throw new ValidationError(`Parameter "${key}" must be a boolean.`);
  }
  return value;
}
function requireString(args, key) {
  const value = readString(args, key);
  if (!value || value.length === 0) {
    throw new ValidationError(`Missing required parameter "${key}".`);
  }
  return value;
}
function assertEnum(value, key, values) {
  if (value === void 0) {
    return;
  }
  if (!values.includes(value)) {
    throw new ValidationError(
      `Parameter "${key}" must be one of: ${values.join(", ")}.`
    );
  }
}
function compactObject(object) {
  const next = {};
  for (const [key, value] of Object.entries(object)) {
    if (value !== void 0 && value !== null) {
      next[key] = value;
    }
  }
  return next;
}
var OKX_CANDLE_BARS = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1H",
  "2H",
  "4H",
  "6H",
  "12H",
  "1D",
  "2D",
  "3D",
  "1W",
  "1M",
  "3M"
];
var OKX_INST_TYPES = [
  "SPOT",
  "SWAP",
  "FUTURES",
  "OPTION",
  "MARGIN"
];
function publicRateLimit(key, rps = 20) {
  return {
    key: `public:${key}`,
    capacity: rps,
    refillPerSecond: rps
  };
}
function privateRateLimit(key, rps = 10) {
  return {
    key: `private:${key}`,
    capacity: rps,
    refillPerSecond: rps
  };
}
function assertNotDemo(config, endpoint) {
  if (config.demo) {
    throw new ConfigError(
      `"${endpoint}" is not supported in simulated trading mode.`,
      "Disable demo mode (remove OKX_DEMO=1 or --demo flag) to use this endpoint."
    );
  }
}
function normalize(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerAccountTools() {
  return [
    {
      name: "account_get_balance",
      module: "account",
      description: "Get account balance for trading account. Returns balances for all currencies or a specific one. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. BTC or BTC,ETH. Omit for all."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/balance",
          compactObject({ ccy: readString(args, "ccy") }),
          privateRateLimit("account_get_balance", 10)
        );
        return normalize(response);
      }
    },
    {
      name: "account_transfer",
      module: "account",
      description: "Transfer funds between accounts (trading, funding, etc.). [CAUTION] Moves real funds. Private endpoint. Rate limit: 2 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT"
          },
          amt: {
            type: "string",
            description: "Transfer amount"
          },
          from: {
            type: "string",
            description: "Source account: 6=funding, 18=trading (unified)"
          },
          to: {
            type: "string",
            description: "Destination account: 6=funding, 18=trading (unified)"
          },
          type: {
            type: "string",
            description: "0=main account (default), 1=main\u2192sub, 2=sub\u2192main, 3=sub\u2192sub"
          },
          subAcct: {
            type: "string",
            description: "Sub-account name. Required when type=1/2/3"
          },
          clientId: {
            type: "string",
            description: "Client ID (max 32 chars)"
          }
        },
        required: ["ccy", "amt", "from", "to"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/asset/transfer",
          compactObject({
            ccy: requireString(args, "ccy"),
            amt: requireString(args, "amt"),
            from: requireString(args, "from"),
            to: requireString(args, "to"),
            type: readString(args, "type"),
            subAcct: readString(args, "subAcct"),
            clientId: readString(args, "clientId")
          }),
          privateRateLimit("account_transfer", 2)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_max_size",
      module: "account",
      description: "Get max buy/sell order size for a SWAP/FUTURES instrument given current balance and leverage. Useful before placing orders. Private. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated"]
          },
          px: {
            type: "string",
            description: "Limit order price (omit for market)"
          },
          leverage: {
            type: "string",
            description: "Leverage (defaults to account setting)"
          },
          ccy: {
            type: "string",
            description: "Margin currency. Required for isolated mode."
          }
        },
        required: ["instId", "tdMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/max-size",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            px: readString(args, "px"),
            leverage: readString(args, "leverage"),
            ccy: readString(args, "ccy")
          }),
          privateRateLimit("account_get_max_size", 20)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_asset_balance",
      module: "account",
      description: "Get funding account balance (asset account). Different from account_get_balance which queries the trading account. Private. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. BTC or BTC,ETH. Omit for all."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/asset/balances",
          compactObject({ ccy: readString(args, "ccy") }),
          privateRateLimit("account_get_asset_balance", 6)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_bills",
      module: "account",
      description: "Get account ledger: fees paid, funding charges, realized PnL, transfers, etc. Default 20 records (last 7 days), max 100. Private endpoint. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["SPOT", "MARGIN", "SWAP", "FUTURES", "OPTION"]
          },
          ccy: {
            type: "string",
            description: "e.g. USDT"
          },
          mgnMode: {
            type: "string",
            enum: ["isolated", "cross"]
          },
          type: {
            type: "string",
            description: "1=transfer,2=trade,3=delivery,4=auto convert,5=liquidation,6=margin transfer,7=interest,8=funding fee,9=adl,10=clawback,11=sys convert,12=strategy transfer,13=ddh"
          },
          after: {
            type: "string",
            description: "Pagination: before this bill ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this bill ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 20)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/bills",
          compactObject({
            instType: readString(args, "instType"),
            ccy: readString(args, "ccy"),
            mgnMode: readString(args, "mgnMode"),
            type: readString(args, "type"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? 20
          }),
          privateRateLimit("account_get_bills", 6)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_positions_history",
      module: "account",
      description: "Get closed position history for SWAP or FUTURES. Default 20 records, max 100. Private endpoint. Rate limit: 1 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["SWAP", "FUTURES", "MARGIN", "OPTION"],
            description: "Default SWAP"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          mgnMode: {
            type: "string",
            enum: ["cross", "isolated"]
          },
          type: {
            type: "string",
            description: "1=close long,2=close short,3=liq long,4=liq short,5=ADL long,6=ADL short"
          },
          posId: {
            type: "string"
          },
          after: {
            type: "string",
            description: "Pagination: before this timestamp (ms)"
          },
          before: {
            type: "string",
            description: "Pagination: after this timestamp (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 20)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/positions-history",
          compactObject({
            instType: readString(args, "instType") ?? "SWAP",
            instId: readString(args, "instId"),
            mgnMode: readString(args, "mgnMode"),
            type: readString(args, "type"),
            posId: readString(args, "posId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit") ?? 20
          }),
          privateRateLimit("account_get_positions_history", 1)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_trade_fee",
      module: "account",
      description: "Get maker/taker fee rates for the account. Useful to understand your fee tier before trading. Private endpoint. Rate limit: 5 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["SPOT", "MARGIN", "SWAP", "FUTURES", "OPTION"]
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          }
        },
        required: ["instType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/trade-fee",
          compactObject({
            instType: requireString(args, "instType"),
            instId: readString(args, "instId")
          }),
          privateRateLimit("account_get_trade_fee", 5)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_config",
      module: "account",
      description: "Get account configuration: position mode (net vs hedge), account level, auto-loan settings, etc. Private endpoint. Rate limit: 5 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {}
      },
      handler: async (_rawArgs, context) => {
        const response = await context.client.privateGet(
          "/api/v5/account/config",
          {},
          privateRateLimit("account_get_config", 5)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_max_withdrawal",
      module: "account",
      description: "Get maximum withdrawable amount for a currency from the trading account. Useful before initiating a transfer or withdrawal. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT or BTC,ETH. Omit for all."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/max-withdrawal",
          compactObject({ ccy: readString(args, "ccy") }),
          privateRateLimit("account_get_max_withdrawal", 20)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_max_avail_size",
      module: "account",
      description: "Get maximum available size for opening or reducing a position. Different from account_get_max_size which calculates new order size. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP or BTC-USDT"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated", "cash"],
            description: "cash=spot"
          },
          ccy: {
            type: "string",
            description: "Margin currency. Required for isolated MARGIN mode."
          },
          reduceOnly: {
            type: "boolean",
            description: "true=calculate max size for closing position"
          }
        },
        required: ["instId", "tdMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = readBoolean(args, "reduceOnly");
        const response = await context.client.privateGet(
          "/api/v5/account/max-avail-size",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            ccy: readString(args, "ccy"),
            reduceOnly: reduceOnly !== void 0 ? String(reduceOnly) : void 0
          }),
          privateRateLimit("account_get_max_avail_size", 20)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_positions",
      module: "account",
      description: "Get current open positions across all instrument types (MARGIN, SWAP, FUTURES, OPTION). Use swap_get_positions for SWAP/FUTURES-only queries when the swap module is loaded. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["MARGIN", "SWAP", "FUTURES", "OPTION"]
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          posId: {
            type: "string"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/positions",
          compactObject({
            instType: readString(args, "instType"),
            instId: readString(args, "instId"),
            posId: readString(args, "posId")
          }),
          privateRateLimit("account_get_positions", 10)
        );
        return normalize(response);
      }
    },
    {
      name: "account_get_bills_archive",
      module: "account",
      description: "Get archived account ledger (bills older than 7 days, up to 3 months). Use account_get_bills for recent 7-day records. Default 20 records, max 100. Private endpoint. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["SPOT", "MARGIN", "SWAP", "FUTURES", "OPTION"]
          },
          ccy: {
            type: "string",
            description: "e.g. USDT"
          },
          mgnMode: {
            type: "string",
            enum: ["isolated", "cross"]
          },
          type: {
            type: "string",
            description: "1=transfer,2=trade,3=delivery,4=auto convert,5=liquidation,6=margin transfer,7=interest,8=funding fee,9=adl,10=clawback,11=sys convert,12=strategy transfer,13=ddh"
          },
          after: {
            type: "string",
            description: "Pagination: before this bill ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this bill ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 20)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/bills-archive",
          compactObject({
            instType: readString(args, "instType"),
            ccy: readString(args, "ccy"),
            mgnMode: readString(args, "mgnMode"),
            type: readString(args, "type"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? 20
          }),
          privateRateLimit("account_get_bills_archive", 6)
        );
        return normalize(response);
      }
    },
    {
      name: "account_set_position_mode",
      module: "account",
      description: "Switch between net position mode and long/short hedge mode. net: one position per instrument (default for most accounts). long_short_mode: separate long and short positions. [CAUTION] Requires no open positions or pending orders. Private endpoint. Rate limit: 5 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          posMode: {
            type: "string",
            enum: ["long_short_mode", "net_mode"],
            description: "long_short_mode=hedge; net_mode=one-way"
          }
        },
        required: ["posMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/account/set-position-mode",
          { posMode: requireString(args, "posMode") },
          privateRateLimit("account_set_position_mode", 5)
        );
        return normalize(response);
      }
    }
  ];
}
function normalize2(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerAlgoTradeTools() {
  return [
    {
      name: "swap_place_algo_order",
      module: "swap",
      description: "Place a SWAP/FUTURES take-profit or stop-loss algo order. [CAUTION] Executes real trades. Use ordType='conditional' for a single TP, single SL, or combined TP+SL on one order. Use ordType='oco' (one-cancels-other) to place TP and SL simultaneously \u2014 whichever triggers first cancels the other. Set tpOrdPx='-1' or slOrdPx='-1' to execute the closing leg as a market order. Private endpoint. Rate limit: 20 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated"],
            description: "cross|isolated margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"],
            description: "sell=close long, buy=close short"
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "net=one-way (default); long/short=hedge mode"
          },
          ordType: {
            type: "string",
            enum: ["conditional", "oco"],
            description: "conditional=single TP/SL or both; oco=TP+SL pair (first trigger cancels other)"
          },
          sz: {
            type: "string",
            description: "Contracts to close"
          },
          tpTriggerPx: {
            type: "string",
            description: "TP trigger price"
          },
          tpOrdPx: {
            type: "string",
            description: "TP order price; -1=market"
          },
          tpTriggerPxType: {
            type: "string",
            enum: ["last", "index", "mark"],
            description: "last(default)|index|mark"
          },
          slTriggerPx: {
            type: "string",
            description: "SL trigger price"
          },
          slOrdPx: {
            type: "string",
            description: "SL order price; -1=market (recommended)"
          },
          slTriggerPxType: {
            type: "string",
            enum: ["last", "index", "mark"],
            description: "last(default)|index|mark"
          },
          reduceOnly: {
            type: "boolean",
            description: "Ensure order only reduces position"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          }
        },
        required: ["instId", "tdMode", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = args.reduceOnly;
        const response = await context.client.privatePost(
          "/api/v5/trade/order-algo",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            posSide: readString(args, "posSide"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            tpTriggerPx: readString(args, "tpTriggerPx"),
            tpOrdPx: readString(args, "tpOrdPx"),
            tpTriggerPxType: readString(args, "tpTriggerPxType"),
            slTriggerPx: readString(args, "slTriggerPx"),
            slOrdPx: readString(args, "slOrdPx"),
            slTriggerPxType: readString(args, "slTriggerPxType"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("swap_place_algo_order", 20)
        );
        return normalize2(response);
      }
    },
    {
      name: "swap_place_move_stop_order",
      module: "swap",
      description: "Place a SWAP/FUTURES trailing stop order (move_order_stop). [CAUTION] Executes real trades. The order tracks the market price and triggers when the price reverses by the callback amount. Specify either callbackRatio (e.g. '0.01' for 1%) or callbackSpread (fixed price distance), not both. Optionally set activePx so tracking only starts once the market reaches that price. Private endpoint. Rate limit: 20 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated"],
            description: "cross|isolated margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"],
            description: "sell=close long, buy=close short"
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "net=one-way (default); long/short=hedge mode"
          },
          sz: {
            type: "string",
            description: "Contracts"
          },
          callbackRatio: {
            type: "string",
            description: "Callback ratio (e.g. '0.01'=1%); provide either ratio or spread"
          },
          callbackSpread: {
            type: "string",
            description: "Callback spread in price units; provide either ratio or spread"
          },
          activePx: {
            type: "string",
            description: "Activation price; tracking starts after market reaches this level"
          },
          reduceOnly: {
            type: "boolean",
            description: "Ensure order only reduces position"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          }
        },
        required: ["instId", "tdMode", "side", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = args.reduceOnly;
        const response = await context.client.privatePost(
          "/api/v5/trade/order-algo",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            posSide: readString(args, "posSide"),
            ordType: "move_order_stop",
            sz: requireString(args, "sz"),
            callbackRatio: readString(args, "callbackRatio"),
            callbackSpread: readString(args, "callbackSpread"),
            activePx: readString(args, "activePx"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("swap_place_move_stop_order", 20)
        );
        return normalize2(response);
      }
    },
    {
      name: "swap_cancel_algo_orders",
      module: "swap",
      description: "Cancel one or more pending SWAP/FUTURES algo orders (TP/SL). Accepts a list of {algoId, instId} objects. Private endpoint. Rate limit: 20 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "List of algo orders to cancel. Each item: {algoId, instId}.",
            items: {
              type: "object",
              properties: {
                algoId: {
                  type: "string",
                  description: "Algo order ID"
                },
                instId: {
                  type: "string",
                  description: "e.g. BTC-USDT-SWAP"
                }
              },
              required: ["algoId", "instId"]
            }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-algos",
          orders,
          privateRateLimit("swap_cancel_algo_orders", 20)
        );
        return normalize2(response);
      }
    },
    {
      name: "swap_get_algo_orders",
      module: "swap",
      description: "Query pending or completed SWAP/FUTURES algo orders (TP/SL, OCO, trailing stop). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "history"],
            description: "pending=active (default); history=completed"
          },
          ordType: {
            type: "string",
            enum: ["conditional", "oco", "move_order_stop"],
            description: "Filter by type; omit for all"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          algoId: {
            type: "string",
            description: "Filter by algo order ID"
          },
          after: {
            type: "string",
            description: "Pagination: before this algo ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this algo ID"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          },
          state: {
            type: "string",
            enum: ["effective", "canceled", "order_failed"],
            description: "Required when status=history. effective=triggered, canceled, order_failed. Defaults to effective."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "pending";
        const isHistory = status === "history";
        const path4 = isHistory ? "/api/v5/trade/orders-algo-history" : "/api/v5/trade/orders-algo-pending";
        const ordType = readString(args, "ordType");
        const state = isHistory ? readString(args, "state") ?? "effective" : void 0;
        const baseParams = compactObject({
          instType: "SWAP",
          instId: readString(args, "instId"),
          algoId: readString(args, "algoId"),
          after: readString(args, "after"),
          before: readString(args, "before"),
          limit: readNumber(args, "limit"),
          state
        });
        if (ordType) {
          const response = await context.client.privateGet(
            path4,
            { ...baseParams, ordType },
            privateRateLimit("swap_get_algo_orders", 20)
          );
          return normalize2(response);
        }
        const [r1, r2, r3] = await Promise.all([
          context.client.privateGet(path4, { ...baseParams, ordType: "conditional" }, privateRateLimit("swap_get_algo_orders", 20)),
          context.client.privateGet(path4, { ...baseParams, ordType: "oco" }, privateRateLimit("swap_get_algo_orders", 20)),
          context.client.privateGet(path4, { ...baseParams, ordType: "move_order_stop" }, privateRateLimit("swap_get_algo_orders", 20))
        ]);
        const merged = [
          ...r1.data ?? [],
          ...r2.data ?? [],
          ...r3.data ?? []
        ];
        return { endpoint: r1.endpoint, requestTime: r1.requestTime, data: merged };
      }
    }
  ];
}
var DEFAULT_LOG_DIR = path.join(os.homedir(), ".okx", "logs");
function getLogPaths(logDir, days = 7) {
  const paths = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    paths.push(path.join(logDir, `trade-${yyyy}-${mm}-${dd}.log`));
  }
  return paths;
}
function readEntries(logDir) {
  const entries = [];
  for (const filePath of getLogPaths(logDir)) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        entries.push(JSON.parse(trimmed));
      } catch {
      }
    }
  }
  return entries;
}
function registerAuditTools() {
  return [
    {
      name: "trade_get_history",
      module: "account",
      description: "Query local audit log of tool calls made through this MCP server. Returns recent operations with timestamps, duration, params, and results. Use to review what trades or queries were executed in this session or past sessions.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max results (default 20)"
          },
          tool: {
            type: "string",
            description: "e.g. swap_place_order"
          },
          level: {
            type: "string",
            enum: ["INFO", "WARN", "ERROR", "DEBUG"]
          },
          since: {
            type: "string",
            description: "ISO 8601 timestamp lower bound"
          }
        }
      },
      handler: async (rawArgs) => {
        const args = asRecord(rawArgs);
        const limit = Math.min(readNumber(args, "limit") ?? 20, 100);
        const toolFilter = readString(args, "tool");
        const levelFilter = readString(args, "level")?.toUpperCase();
        const since = readString(args, "since");
        const sinceTime = since ? new Date(since).getTime() : void 0;
        let entries = readEntries(DEFAULT_LOG_DIR);
        if (toolFilter) {
          entries = entries.filter((e) => e.tool === toolFilter);
        }
        if (levelFilter) {
          entries = entries.filter((e) => e.level === levelFilter);
        }
        if (sinceTime !== void 0) {
          entries = entries.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);
        }
        entries.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        entries = entries.slice(0, limit);
        return { entries, total: entries.length };
      }
    }
  ];
}
function normalize3(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function normalizeWrite(response) {
  const data = response.data;
  if (Array.isArray(data) && data.length > 0) {
    const failed = data.filter(
      (item) => item !== null && typeof item === "object" && "sCode" in item && item["sCode"] !== "0"
    );
    if (failed.length > 0) {
      const messages2 = failed.map(
        (item) => `[${item["sCode"]}] ${item["sMsg"] ?? "Operation failed"}`
      );
      throw new OkxApiError(messages2.join("; "), {
        code: String(failed[0]["sCode"] ?? ""),
        endpoint: response.endpoint
      });
    }
  }
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data
  };
}
function registerGridTools() {
  return [
    {
      name: "grid_get_orders",
      module: "bot.grid",
      description: "Query grid trading bot list. Use status='active' for running bots, status='history' for completed/stopped bots. Covers Spot Grid, Contract Grid, and Moon Grid. Private endpoint. Rate limit: 20 req/2s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          algoOrdType: {
            type: "string",
            enum: ["grid", "contract_grid", "moon_grid"],
            description: "grid=Spot, contract_grid=Contract, moon_grid=Moon"
          },
          status: {
            type: "string",
            enum: ["active", "history"],
            description: "active=running (default); history=stopped"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          algoId: {
            type: "string"
          },
          after: {
            type: "string",
            description: "Pagination: before this algo ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this algo ID"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        },
        required: ["algoOrdType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const algoOrdType = requireString(args, "algoOrdType");
        const status = readString(args, "status") ?? "active";
        const path4 = status === "history" ? "/api/v5/tradingBot/grid/orders-algo-history" : "/api/v5/tradingBot/grid/orders-algo-pending";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            algoOrdType,
            instId: readString(args, "instId"),
            algoId: readString(args, "algoId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("grid_get_orders", 20)
        );
        return normalize3(response);
      }
    },
    {
      name: "grid_get_order_details",
      module: "bot.grid",
      description: "Query details of a single grid trading bot by its algo ID. Returns configuration, current status, PnL, and position info. Private endpoint. Rate limit: 20 req/2s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          algoOrdType: {
            type: "string",
            enum: ["grid", "contract_grid", "moon_grid"],
            description: "grid=Spot, contract_grid=Contract, moon_grid=Moon"
          },
          algoId: {
            type: "string"
          }
        },
        required: ["algoOrdType", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/tradingBot/grid/orders-algo-details",
          {
            algoOrdType: requireString(args, "algoOrdType"),
            algoId: requireString(args, "algoId")
          },
          privateRateLimit("grid_get_order_details", 20)
        );
        return normalize3(response);
      }
    },
    {
      name: "grid_get_sub_orders",
      module: "bot.grid",
      description: "Query individual sub-orders (grid trades) generated by a grid bot. Use type='filled' for executed trades, type='live' for pending orders. Private endpoint. Rate limit: 20 req/2s per UID.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          algoOrdType: {
            type: "string",
            enum: ["grid", "contract_grid", "moon_grid"],
            description: "grid=Spot, contract_grid=Contract, moon_grid=Moon"
          },
          algoId: {
            type: "string"
          },
          type: {
            type: "string",
            enum: ["filled", "live"],
            description: "filled=executed trades (default); live=pending orders"
          },
          groupId: {
            type: "string"
          },
          after: {
            type: "string",
            description: "Pagination: before this order ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this order ID"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        },
        required: ["algoOrdType", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/tradingBot/grid/sub-orders",
          compactObject({
            algoOrdType: requireString(args, "algoOrdType"),
            algoId: requireString(args, "algoId"),
            type: readString(args, "type") ?? "filled",
            groupId: readString(args, "groupId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("grid_get_sub_orders", 20)
        );
        return normalize3(response);
      }
    },
    {
      name: "grid_create_order",
      module: "bot.grid",
      description: "Create a new grid trading bot. [CAUTION] Executes real trades and locks funds. Supports Spot Grid ('grid') and Contract Grid ('contract_grid'). For spot grid, provide quoteSz (invest in quote currency) or baseSz (invest in base currency). For contract grids, provide direction, lever, and sz (number of contracts). Private endpoint. Rate limit: 20 req/2s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          algoOrdType: {
            type: "string",
            enum: ["grid", "contract_grid"],
            description: "grid=Spot, contract_grid=Contract"
          },
          maxPx: {
            type: "string",
            description: "Upper price boundary"
          },
          minPx: {
            type: "string",
            description: "Lower price boundary"
          },
          gridNum: {
            type: "string",
            description: "Grid levels (e.g. '10')"
          },
          runType: {
            type: "string",
            enum: ["1", "2"],
            description: "1=arithmetic (default); 2=geometric"
          },
          quoteSz: {
            type: "string",
            description: "Spot grid: invest in quote (e.g. USDT). Provide quoteSz or baseSz."
          },
          baseSz: {
            type: "string",
            description: "Spot grid: invest in base (e.g. BTC). Provide quoteSz or baseSz."
          },
          direction: {
            type: "string",
            enum: ["long", "short", "neutral"],
            description: "Required for contract_grid"
          },
          lever: {
            type: "string",
            description: "Leverage (e.g. '5'). Required for contract_grid."
          },
          sz: {
            type: "string",
            description: "Contracts to invest. Required for contract_grid."
          },
          basePos: {
            type: "boolean",
            description: "Whether to open a base position for contract grid. Ignored for neutral direction and spot grid. Default: true"
          }
        },
        required: ["instId", "algoOrdType", "maxPx", "minPx", "gridNum"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const algoOrdType = requireString(args, "algoOrdType");
        const body = compactObject({
          instId: requireString(args, "instId"),
          algoOrdType,
          maxPx: requireString(args, "maxPx"),
          minPx: requireString(args, "minPx"),
          gridNum: requireString(args, "gridNum"),
          runType: readString(args, "runType"),
          quoteSz: readString(args, "quoteSz"),
          baseSz: readString(args, "baseSz"),
          direction: readString(args, "direction"),
          lever: readString(args, "lever"),
          sz: readString(args, "sz")
        });
        if (algoOrdType === "contract_grid") {
          body.triggerParams = [{ triggerAction: "start", triggerStrategy: "instant" }];
          body.basePos = readBoolean(args, "basePos") ?? true;
        }
        const response = await context.client.privatePost(
          "/api/v5/tradingBot/grid/order-algo",
          body,
          privateRateLimit("grid_create_order", 20)
        );
        return normalizeWrite(response);
      }
    },
    {
      name: "grid_stop_order",
      module: "bot.grid",
      description: "Stop a running grid trading bot. [CAUTION] This will close or cancel the bot's orders. For contract grids, stopType controls whether open positions are closed ('1') or only orders are cancelled ('2'). Private endpoint. Rate limit: 20 req/2s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          algoId: {
            type: "string"
          },
          algoOrdType: {
            type: "string",
            enum: ["grid", "contract_grid", "moon_grid"],
            description: "grid=Spot, contract_grid=Contract, moon_grid=Moon"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          stopType: {
            type: "string",
            enum: ["1", "2", "3", "5", "6"],
            description: "1=stop+sell/close all; 2=stop+keep assets (default); 3=close at limit; 5=partial close; 6=stop without selling (smart arb)"
          }
        },
        required: ["algoId", "algoOrdType", "instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/tradingBot/grid/stop-order-algo",
          [compactObject({
            algoId: requireString(args, "algoId"),
            algoOrdType: requireString(args, "algoOrdType"),
            instId: requireString(args, "instId"),
            stopType: readString(args, "stopType") ?? "2"
          })],
          privateRateLimit("grid_stop_order", 20)
        );
        return normalizeWrite(response);
      }
    }
  ];
}
var BASE = "/api/v5/tradingBot/dca";
function normalize4(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function normalizeWrite2(response) {
  const data = response.data;
  if (Array.isArray(data) && data.length > 0) {
    const failed = data.filter(
      (item) => item !== null && typeof item === "object" && "sCode" in item && item["sCode"] !== "0"
    );
    if (failed.length > 0) {
      const messages2 = failed.map(
        (item) => `[${item["sCode"]}] ${item["sMsg"] ?? "Operation failed"}`
      );
      throw new OkxApiError(messages2.join("; "), {
        code: String(failed[0]["sCode"] ?? ""),
        endpoint: response.endpoint
      });
    }
  }
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data
  };
}
function registerDcaTools() {
  return [
    {
      name: "dca_create_order",
      module: "bot.dca",
      description: "Create a DCA bot order. type='spot': Spot DCA (Martingale on spot, no leverage). Required: instId, initOrdAmt, safetyOrdAmt, maxSafetyOrds, pxSteps, pxStepsMult, volMult, tpPct, triggerType. type='contract': Contract DCA (Martingale with leverage on futures/swaps). Required: instId, lever, side, initOrdAmt, safetyOrdAmt, maxSafetyOrds, pxSteps, pxStepsMult, volMult, tpPct. [CAUTION] Executes real trades. Private endpoint. Rate limit: 20 req/2s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["spot", "contract"],
            description: "spot=Spot DCA (Martingale, no leverage); contract=Contract DCA (Martingale with leverage)"
          },
          instId: { type: "string", description: "e.g. BTC-USDT (spot) or BTC-USDT-SWAP (contract)" },
          // Shared spot/contract params
          initOrdAmt: { type: "string", description: "Initial order amount (USDT)" },
          safetyOrdAmt: { type: "string", description: "Safety order amount (USDT)" },
          maxSafetyOrds: { type: "string", description: "Max number of safety orders, e.g. '3'" },
          pxSteps: { type: "string", description: "Price drop % per safety order, e.g. '0.03' = 3%" },
          pxStepsMult: { type: "string", description: "Price step multiplier, e.g. '1.2'" },
          volMult: { type: "string", description: "Safety order size multiplier, e.g. '1.5'" },
          tpPct: { type: "string", description: "Take-profit ratio, e.g. '0.03' = 3%" },
          slPct: { type: "string", description: "Stop-loss ratio, e.g. '0.05' = 5% (optional)" },
          reserveFunds: { type: "string", enum: ["true", "false"], description: "Reserve full assets upfront (default: false)" },
          // Spot-only params
          triggerType: { type: "string", enum: ["1", "2"], description: "[spot] Trigger type: 1=instant, 2=RSI signal" },
          direction: { type: "string", enum: ["long"], description: "[spot] Strategy direction, only 'long' supported" },
          // Contract-only params
          lever: { type: "string", description: "[contract] Leverage multiplier, e.g. '3'" },
          side: { type: "string", enum: ["buy", "sell"], description: "[contract] buy=long, sell=short" }
        },
        required: ["type", "instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = requireString(args, "type");
        const instId = requireString(args, "instId");
        if (type === "contract") {
          const response2 = await context.client.privatePost(
            `${BASE}/create`,
            compactObject({
              instId,
              algoOrdType: "contract_dca",
              lever: requireString(args, "lever"),
              side: requireString(args, "side"),
              direction: readString(args, "direction") ?? "long",
              initOrdAmt: requireString(args, "initOrdAmt"),
              safetyOrdAmt: requireString(args, "safetyOrdAmt"),
              maxSafetyOrds: requireString(args, "maxSafetyOrds"),
              pxSteps: requireString(args, "pxSteps"),
              pxStepsMult: requireString(args, "pxStepsMult"),
              volMult: requireString(args, "volMult"),
              tpPct: requireString(args, "tpPct"),
              reserveFunds: readString(args, "reserveFunds") ?? "false",
              triggerParams: [{ triggerAction: "start", triggerStrategy: "instant" }]
            }),
            privateRateLimit("dca_create_order", 20)
          );
          return normalizeWrite2(response2);
        }
        const response = await context.client.privatePost(
          `${BASE}/order-algo`,
          compactObject({
            instId,
            direction: readString(args, "direction") ?? "long",
            triggerType: requireString(args, "triggerType"),
            initOrdAmt: requireString(args, "initOrdAmt"),
            reserveFunds: readString(args, "reserveFunds") ?? "false",
            safetyOrdAmt: requireString(args, "safetyOrdAmt"),
            maxSafetyOrds: requireString(args, "maxSafetyOrds"),
            pxSteps: requireString(args, "pxSteps"),
            pxStepsMult: requireString(args, "pxStepsMult"),
            volMult: requireString(args, "volMult"),
            tpPct: requireString(args, "tpPct"),
            slPct: readString(args, "slPct")
          }),
          privateRateLimit("dca_create_order", 20)
        );
        return normalizeWrite2(response);
      }
    },
    {
      name: "dca_stop_order",
      module: "bot.dca",
      description: "Stop a running DCA bot. Set type='spot' or type='contract'. [CAUTION] This will stop the bot. Private endpoint. Rate limit: 20 req/2s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["spot", "contract"],
            description: "spot or contract"
          },
          algoId: { type: "string" },
          instId: { type: "string", description: "Instrument ID, e.g. BTC-USDT (spot) or BTC-USDT-SWAP (contract)" },
          stopType: {
            type: "string",
            enum: ["1", "2"],
            description: "1=sell base currency and get quote (default); 2=keep base currency"
          }
        },
        required: ["type", "algoId", "instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = requireString(args, "type");
        const algoId = requireString(args, "algoId");
        const instId = requireString(args, "instId");
        const stopType = readString(args, "stopType") ?? "1";
        if (type === "contract") {
          const response2 = await context.client.privatePost(
            `${BASE}/stop`,
            { algoId, instId, algoOrdType: "contract_dca", stopType },
            privateRateLimit("dca_stop_order", 20)
          );
          return normalizeWrite2(response2);
        }
        const response = await context.client.privatePost(
          `${BASE}/stop-order-algo`,
          [{ algoId, instId, algoOrdType: "spot_dca", stopType }],
          privateRateLimit("dca_stop_order", 20)
        );
        return normalizeWrite2(response);
      }
    },
    {
      name: "dca_get_orders",
      module: "bot.dca",
      description: "Query DCA bot orders. Set type='spot' or type='contract'. Use status='active' for running bots, status='history' for completed/stopped. Private endpoint. Rate limit: 20 req/2s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["spot", "contract"],
            description: "spot or contract"
          },
          status: {
            type: "string",
            enum: ["active", "history"],
            description: "active=running (default); history=stopped"
          },
          algoId: { type: "string" },
          after: { type: "string", description: "Pagination: before this algo ID" },
          before: { type: "string", description: "Pagination: after this algo ID" },
          limit: { type: "number", description: "Max results (default 100)" }
        },
        required: ["type"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = requireString(args, "type");
        const status = readString(args, "status") ?? "active";
        if (type === "contract") {
          const path5 = status === "history" ? `${BASE}/history-list` : `${BASE}/ongoing-list`;
          const response2 = await context.client.privateGet(
            path5,
            compactObject({
              algoOrdType: "contract_dca",
              algoId: readString(args, "algoId"),
              after: readString(args, "after"),
              before: readString(args, "before"),
              limit: readNumber(args, "limit")
            }),
            privateRateLimit("dca_get_orders", 20)
          );
          return normalize4(response2);
        }
        const path4 = status === "history" ? `${BASE}/orders-algo-history` : `${BASE}/orders-algo-pending`;
        const response = await context.client.privateGet(
          path4,
          compactObject({
            algoId: readString(args, "algoId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("dca_get_orders", 20)
        );
        return normalize4(response);
      }
    },
    {
      name: "dca_get_order_details",
      module: "bot.dca",
      description: "Query details of a single DCA bot by algo ID. Set type='spot' or type='contract'. For contract, returns current position details. Private endpoint. Rate limit: 20 req/2s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["spot", "contract"],
            description: "spot or contract"
          },
          algoId: { type: "string" }
        },
        required: ["type", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = requireString(args, "type");
        const algoId = requireString(args, "algoId");
        if (type === "contract") {
          const response2 = await context.client.privateGet(
            `${BASE}/position-details`,
            { algoId, algoOrdType: "contract_dca" },
            privateRateLimit("dca_get_order_details", 20)
          );
          return normalize4(response2);
        }
        const response = await context.client.privateGet(
          `${BASE}/orders-algo-details`,
          { algoId },
          privateRateLimit("dca_get_order_details", 20)
        );
        return normalize4(response);
      }
    },
    {
      name: "dca_get_sub_orders",
      module: "bot.dca",
      description: "Query sub-orders or cycles of a DCA bot. Set type='spot' or type='contract'. Spot: use subOrdType='filled' for filled orders, subOrdType='live' for pending orders (required for spot). Contract: returns cycle list when cycleId is omitted; returns orders within a specific cycle when cycleId is provided. Private endpoint. Rate limit: 20 req/2s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["spot", "contract"],
            description: "spot or contract"
          },
          algoId: { type: "string" },
          subOrdType: {
            type: "string",
            enum: ["filled", "live"],
            description: "[spot] Sub-order type: filled=completed orders, live=pending orders (required for spot)"
          },
          cycleId: { type: "string", description: "[contract] Cycle ID; omit to list all cycles" },
          after: { type: "string", description: "Pagination: before this order ID" },
          before: { type: "string", description: "Pagination: after this order ID" },
          limit: { type: "number", description: "Max results (default 100)" }
        },
        required: ["type", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const type = requireString(args, "type");
        const algoId = requireString(args, "algoId");
        const cycleId = readString(args, "cycleId");
        if (type === "contract") {
          if (cycleId) {
            const response3 = await context.client.privateGet(
              `${BASE}/orders`,
              compactObject({
                algoId,
                algoOrdType: "contract_dca",
                cycleId,
                after: readString(args, "after"),
                before: readString(args, "before"),
                limit: readNumber(args, "limit")
              }),
              privateRateLimit("dca_get_sub_orders", 20)
            );
            return normalize4(response3);
          }
          const response2 = await context.client.privateGet(
            `${BASE}/cycle-list`,
            compactObject({
              algoId,
              algoOrdType: "contract_dca",
              after: readString(args, "after"),
              before: readString(args, "before"),
              limit: readNumber(args, "limit")
            }),
            privateRateLimit("dca_get_sub_orders", 20)
          );
          return normalize4(response2);
        }
        const subOrdType = readString(args, "subOrdType") ?? "filled";
        const response = await context.client.privateGet(
          `${BASE}/sub-orders`,
          compactObject({
            algoId,
            type: subOrdType,
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("dca_get_sub_orders", 20)
        );
        return normalize4(response);
      }
    }
  ];
}
function registerBotTools() {
  return [
    ...registerGridTools(),
    ...registerDcaTools()
  ];
}
function normalize5(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerEarnTools() {
  return [
    {
      name: "earn_get_savings_balance",
      module: "earn",
      description: "Get Simple Earn (savings/flexible earn) balance. Returns current holdings for all currencies or a specific one. Private endpoint. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT or BTC. Omit for all."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/finance/savings/balance",
          compactObject({ ccy: readString(args, "ccy") }),
          privateRateLimit("earn_get_savings_balance", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_savings_purchase",
      module: "earn",
      description: "Purchase Simple Earn (savings/flexible earn). [CAUTION] Moves real funds into earn product. Not supported in demo/simulated trading mode. Private endpoint. Rate limit: 6 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "Currency to purchase, e.g. USDT"
          },
          amt: {
            type: "string",
            description: "Purchase amount"
          },
          rate: {
            type: "string",
            description: "Lending rate. Annual rate in decimal, e.g. 0.01 = 1%. Defaults to 0.01 (1%, minimum rate, easiest to match)."
          }
        },
        required: ["ccy", "amt"]
      },
      handler: async (rawArgs, context) => {
        assertNotDemo(context.config, "earn_savings_purchase");
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/finance/savings/purchase-redempt",
          compactObject({
            ccy: requireString(args, "ccy"),
            amt: requireString(args, "amt"),
            side: "purchase",
            rate: readString(args, "rate") ?? "0.01"
          }),
          privateRateLimit("earn_savings_purchase", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_savings_redeem",
      module: "earn",
      description: "Redeem Simple Earn (savings/flexible earn). [CAUTION] Withdraws funds from earn product. Not supported in demo/simulated trading mode. Private endpoint. Rate limit: 6 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "Currency to redeem, e.g. USDT"
          },
          amt: {
            type: "string",
            description: "Redemption amount"
          }
        },
        required: ["ccy", "amt"]
      },
      handler: async (rawArgs, context) => {
        assertNotDemo(context.config, "earn_savings_redeem");
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/finance/savings/purchase-redempt",
          compactObject({
            ccy: requireString(args, "ccy"),
            amt: requireString(args, "amt"),
            side: "redempt"
          }),
          privateRateLimit("earn_savings_redeem", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_set_lending_rate",
      module: "earn",
      description: "Set lending rate for Simple Earn. [CAUTION] Changes your lending rate preference. Not supported in demo/simulated trading mode. Private endpoint. Rate limit: 6 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "Currency, e.g. USDT"
          },
          rate: {
            type: "string",
            description: "Lending rate. Annual rate in decimal, e.g. 0.01 = 1%"
          }
        },
        required: ["ccy", "rate"]
      },
      handler: async (rawArgs, context) => {
        assertNotDemo(context.config, "earn_set_lending_rate");
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/finance/savings/set-lending-rate",
          {
            ccy: requireString(args, "ccy"),
            rate: requireString(args, "rate")
          },
          privateRateLimit("earn_set_lending_rate", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_get_lending_history",
      module: "earn",
      description: "Get lending history for Simple Earn. Returns lending records with details like amount, rate, and earnings. Private endpoint. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT. Omit for all."
          },
          after: {
            type: "string",
            description: "Pagination: before this record ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this record ID"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/finance/savings/lending-history",
          compactObject({
            ccy: readString(args, "ccy"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("earn_get_lending_history", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_get_lending_rate_summary",
      module: "earn",
      description: "Get market lending rate summary for Simple Earn. Public endpoint (no API key required). Returns current lending rates, estimated APY, and available amounts. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT. Omit for all."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/finance/savings/lending-rate-summary",
          compactObject({ ccy: readString(args, "ccy") }),
          publicRateLimit("earn_get_lending_rate_summary", 6)
        );
        return normalize5(response);
      }
    },
    {
      name: "earn_get_lending_rate_history",
      module: "earn",
      description: "Get historical lending rates for Simple Earn. Public endpoint (no API key required). Returns past lending rate data for trend analysis. Rate limit: 6 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          ccy: {
            type: "string",
            description: "e.g. USDT. Omit for all."
          },
          after: {
            type: "string",
            description: "Pagination: before this timestamp (ms)"
          },
          before: {
            type: "string",
            description: "Pagination: after this timestamp (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/finance/savings/lending-rate-history",
          compactObject({
            ccy: readString(args, "ccy"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          publicRateLimit("earn_get_lending_rate_history", 6)
        );
        return normalize5(response);
      }
    }
  ];
}
var FUTURES_INST_TYPES = ["FUTURES", "SWAP"];
function normalize6(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerFuturesTools() {
  return [
    {
      name: "futures_place_order",
      module: "futures",
      description: "Place a FUTURES delivery contract order (e.g. instId: BTC-USDT-240329). Optionally attach TP/SL via tpTriggerPx/slTriggerPx. [CAUTION] Executes real trades. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-240329"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated"],
            description: "cross|isolated margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"],
            description: "one-way: buy=open long, sell=open short (use reduceOnly=true to close); hedge: combined with posSide"
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "net=one-way mode (default); long/short=hedge mode only"
          },
          ordType: {
            type: "string",
            enum: ["market", "limit", "post_only", "fok", "ioc"],
            description: "market(no px)|limit(px req)|post_only(maker)|fok(all-or-cancel)|ioc(partial fill)"
          },
          sz: {
            type: "string",
            description: "Contracts"
          },
          px: {
            type: "string",
            description: "Required for limit/post_only/fok/ioc"
          },
          reduceOnly: {
            type: "boolean",
            description: "Close/reduce only, no new position (one-way mode)"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          },
          tag: {
            type: "string"
          },
          tpTriggerPx: {
            type: "string",
            description: "TP trigger price; places TP at tpOrdPx"
          },
          tpOrdPx: {
            type: "string",
            description: "TP order price; -1=market"
          },
          slTriggerPx: {
            type: "string",
            description: "SL trigger price; places SL at slOrdPx"
          },
          slOrdPx: {
            type: "string",
            description: "SL order price; -1=market"
          }
        },
        required: ["instId", "tdMode", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = args.reduceOnly;
        const tpTriggerPx = readString(args, "tpTriggerPx");
        const tpOrdPx = readString(args, "tpOrdPx");
        const slTriggerPx = readString(args, "slTriggerPx");
        const slOrdPx = readString(args, "slOrdPx");
        const algoEntry = compactObject({ tpTriggerPx, tpOrdPx, slTriggerPx, slOrdPx });
        const attachAlgoOrds = Object.keys(algoEntry).length > 0 ? [algoEntry] : void 0;
        const response = await context.client.privatePost(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            posSide: readString(args, "posSide"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            px: readString(args, "px"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(args, "clOrdId"),
            tag: readString(args, "tag"),
            attachAlgoOrds
          }),
          privateRateLimit("futures_place_order", 60)
        );
        return normalize6(response);
      }
    },
    {
      name: "futures_cancel_order",
      module: "futures",
      description: "Cancel an unfilled FUTURES delivery order. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-240329"
          },
          ordId: {
            type: "string"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("futures_cancel_order", 60)
        );
        return normalize6(response);
      }
    },
    {
      name: "futures_get_order",
      module: "futures",
      description: "Get details of a single FUTURES delivery order by ordId or clOrdId. Private endpoint. Rate limit: 60 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-240329"
          },
          ordId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          },
          clOrdId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("futures_get_order", 60)
        );
        return normalize6(response);
      }
    },
    {
      name: "futures_get_orders",
      module: "futures",
      description: "Query FUTURES open orders, history (last 7 days), or archive (up to 3 months). Private. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "history", "archive"],
            description: "open=active, history=7d, archive=3mo"
          },
          instType: {
            type: "string",
            enum: [...FUTURES_INST_TYPES],
            description: "FUTURES (default) or SWAP"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-240329"
          },
          ordType: {
            type: "string",
            description: "Order type filter"
          },
          state: {
            type: "string",
            description: "canceled|filled"
          },
          after: {
            type: "string",
            description: "Pagination: before this order ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this order ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "open";
        const instType = readString(args, "instType") ?? "FUTURES";
        assertEnum(instType, "instType", FUTURES_INST_TYPES);
        const path4 = status === "archive" ? "/api/v5/trade/orders-history-archive" : status === "history" ? "/api/v5/trade/orders-history" : "/api/v5/trade/orders-pending";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType,
            instId: readString(args, "instId"),
            ordType: readString(args, "ordType"),
            state: readString(args, "state"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("futures_get_orders", 20)
        );
        return normalize6(response);
      }
    },
    {
      name: "futures_get_positions",
      module: "futures",
      description: "Get current FUTURES delivery contract positions. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: [...FUTURES_INST_TYPES],
            description: "FUTURES (default) or SWAP"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-240329"
          },
          posId: {
            type: "string"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const instType = readString(args, "instType") ?? "FUTURES";
        assertEnum(instType, "instType", FUTURES_INST_TYPES);
        const response = await context.client.privateGet(
          "/api/v5/account/positions",
          compactObject({
            instType,
            instId: readString(args, "instId"),
            posId: readString(args, "posId")
          }),
          privateRateLimit("futures_get_positions", 10)
        );
        return normalize6(response);
      }
    },
    {
      name: "futures_get_fills",
      module: "futures",
      description: "Get FUTURES fill details. archive=false: last 3 days. archive=true: up to 3 months. Private. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          archive: {
            type: "boolean",
            description: "true=up to 3 months; false=last 3 days (default)"
          },
          instType: {
            type: "string",
            enum: [...FUTURES_INST_TYPES],
            description: "FUTURES (default) or SWAP"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordId: {
            type: "string",
            description: "Order ID filter"
          },
          after: {
            type: "string",
            description: "Pagination: before this bill ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this bill ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100 or 20 for archive)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const archive = readBoolean(args, "archive") ?? false;
        const instType = readString(args, "instType") ?? "FUTURES";
        assertEnum(instType, "instType", FUTURES_INST_TYPES);
        const path4 = archive ? "/api/v5/trade/fills-history" : "/api/v5/trade/fills";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType,
            instId: readString(args, "instId"),
            ordId: readString(args, "ordId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? (archive ? 20 : void 0)
          }),
          privateRateLimit("futures_get_fills", 20)
        );
        return normalize6(response);
      }
    }
  ];
}
function normalize7(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerMarketTools() {
  return [
    {
      name: "market_get_ticker",
      module: "market",
      description: "Get ticker data for a single instrument. Public endpoint, no authentication required. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT, BTC-USDT-SWAP"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/market/ticker",
          { instId: requireString(args, "instId") },
          publicRateLimit("market_get_ticker", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_tickers",
      module: "market",
      description: "Get ticker data for all instruments of a given type. Public endpoint, no authentication required. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: [...OKX_INST_TYPES]
          },
          uly: {
            type: "string",
            description: "Underlying, e.g. BTC-USD. Required for OPTION"
          },
          instFamily: {
            type: "string",
            description: "e.g. BTC-USD"
          }
        },
        required: ["instType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/market/tickers",
          compactObject({
            instType: requireString(args, "instType"),
            uly: readString(args, "uly"),
            instFamily: readString(args, "instFamily")
          }),
          publicRateLimit("market_get_tickers", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_orderbook",
      module: "market",
      description: "Get the order book (bids/asks) for an instrument. Public endpoint, no authentication required. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          sz: {
            type: "number",
            description: "Depth per side, default 1, max 400"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/market/books",
          compactObject({
            instId: requireString(args, "instId"),
            sz: readNumber(args, "sz")
          }),
          publicRateLimit("market_get_orderbook", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_candles",
      module: "market",
      description: "Get candlestick (OHLCV) data for an instrument. history=false (default): recent candles up to 1440 bars. history=true: older historical data beyond the recent window. Public endpoint, no authentication required. Rate limit: 40 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          bar: {
            type: "string",
            enum: [...OKX_CANDLE_BARS],
            description: "Default 1m"
          },
          after: {
            type: "string",
            description: "Pagination: before this timestamp (ms)"
          },
          before: {
            type: "string",
            description: "Pagination: after this timestamp (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          },
          history: {
            type: "boolean",
            description: "true=older historical data beyond recent window"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const isHistory = readBoolean(args, "history") ?? false;
        const path4 = isHistory ? "/api/v5/market/history-candles" : "/api/v5/market/candles";
        const response = await context.client.publicGet(
          path4,
          compactObject({
            instId: requireString(args, "instId"),
            bar: readString(args, "bar"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          publicRateLimit("market_get_candles", 40)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_instruments",
      module: "market",
      description: "Get tradable instruments for a given type. Returns contract specs: min order size, lot size, tick size, contract value, settlement currency, listing/expiry time. Essential before placing orders. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: [...OKX_INST_TYPES]
          },
          instId: {
            type: "string",
            description: "Filter by ID, e.g. BTC-USDT-SWAP"
          },
          uly: {
            type: "string",
            description: "Required for OPTION, e.g. BTC-USD"
          },
          instFamily: {
            type: "string",
            description: "e.g. BTC-USD"
          }
        },
        required: ["instType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/instruments",
          compactObject({
            instType: requireString(args, "instType"),
            instId: readString(args, "instId"),
            uly: readString(args, "uly"),
            instFamily: readString(args, "instFamily")
          }),
          publicRateLimit("market_get_instruments", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_funding_rate",
      module: "market",
      description: "Get funding rate for a SWAP instrument. history=false (default): current rate and estimated next rate + settlement time. history=true: historical rates, default 20 records, max 100. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "SWAP instrument, e.g. BTC-USDT-SWAP"
          },
          history: {
            type: "boolean",
            description: "true=fetch historical rates"
          },
          after: {
            type: "string",
            description: "Pagination (history): before this timestamp (ms)"
          },
          before: {
            type: "string",
            description: "Pagination (history): after this timestamp (ms)"
          },
          limit: {
            type: "number",
            description: "History records (default 20, max 100)"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const isHistory = readBoolean(args, "history") ?? false;
        if (isHistory) {
          const response2 = await context.client.publicGet(
            "/api/v5/public/funding-rate-history",
            compactObject({
              instId: requireString(args, "instId"),
              after: readString(args, "after"),
              before: readString(args, "before"),
              limit: readNumber(args, "limit") ?? 20
            }),
            publicRateLimit("market_get_funding_rate", 20)
          );
          return normalize7(response2);
        }
        const response = await context.client.publicGet(
          "/api/v5/public/funding-rate",
          { instId: requireString(args, "instId") },
          publicRateLimit("market_get_funding_rate", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_mark_price",
      module: "market",
      description: "Get mark price for SWAP, FUTURES, or MARGIN instruments. Mark price is used for liquidation calculations and unrealized PnL. Public endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["MARGIN", "SWAP", "FUTURES", "OPTION"]
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          uly: {
            type: "string",
            description: "e.g. BTC-USD"
          },
          instFamily: {
            type: "string"
          }
        },
        required: ["instType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/mark-price",
          compactObject({
            instType: requireString(args, "instType"),
            instId: readString(args, "instId"),
            uly: readString(args, "uly"),
            instFamily: readString(args, "instFamily")
          }),
          publicRateLimit("market_get_mark_price", 10)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_trades",
      module: "market",
      description: "Get recent trades for an instrument. Default 20 records, max 500. Public endpoint, no authentication required. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          limit: {
            type: "number",
            description: "Default 20, max 500"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/market/trades",
          compactObject({
            instId: requireString(args, "instId"),
            limit: readNumber(args, "limit") ?? 20
          }),
          publicRateLimit("market_get_trades", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_index_ticker",
      module: "market",
      description: "Get index ticker data (e.g. BTC-USD, ETH-USD index prices). Index prices are used for mark price calculation and are independent of any single exchange. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USD. Omit for all indices"
          },
          quoteCcy: {
            type: "string",
            description: "e.g. USD or USDT"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/market/index-tickers",
          compactObject({
            instId: readString(args, "instId"),
            quoteCcy: readString(args, "quoteCcy")
          }),
          publicRateLimit("market_get_index_ticker", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_index_candles",
      module: "market",
      description: "Get candlestick data for an index (e.g. BTC-USD index). history=false (default): recent candles up to 1440 bars. history=true: older historical data beyond the recent window. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "Index ID, e.g. BTC-USD"
          },
          bar: {
            type: "string",
            enum: [...OKX_CANDLE_BARS],
            description: "Default 1m"
          },
          after: {
            type: "string",
            description: "Pagination: before this timestamp (ms)"
          },
          before: {
            type: "string",
            description: "Pagination: after this timestamp (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          },
          history: {
            type: "boolean",
            description: "true=older historical data"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const isHistory = readBoolean(args, "history") ?? false;
        const path4 = isHistory ? "/api/v5/market/history-index-candles" : "/api/v5/market/index-candles";
        const response = await context.client.publicGet(
          path4,
          compactObject({
            instId: requireString(args, "instId"),
            bar: readString(args, "bar"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            limit: readNumber(args, "limit")
          }),
          publicRateLimit("market_get_index_candles", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_price_limit",
      module: "market",
      description: "Get the current price limit (upper and lower bands) for a SWAP or FUTURES instrument. Orders placed outside these limits will be rejected by OKX. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "SWAP or FUTURES ID, e.g. BTC-USDT-SWAP"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/price-limit",
          { instId: requireString(args, "instId") },
          publicRateLimit("market_get_price_limit", 20)
        );
        return normalize7(response);
      }
    },
    {
      name: "market_get_open_interest",
      module: "market",
      description: "Get open interest for SWAP, FUTURES, or OPTION instruments. Useful for gauging market sentiment and positioning. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: ["SWAP", "FUTURES", "OPTION"]
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          uly: {
            type: "string",
            description: "e.g. BTC-USD"
          },
          instFamily: {
            type: "string"
          }
        },
        required: ["instType"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/open-interest",
          compactObject({
            instType: requireString(args, "instType"),
            instId: readString(args, "instId"),
            uly: readString(args, "uly"),
            instFamily: readString(args, "instFamily")
          }),
          publicRateLimit("market_get_open_interest", 20)
        );
        return normalize7(response);
      }
    }
  ];
}
function normalize8(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerOptionTools() {
  return [
    {
      name: "option_place_order",
      module: "option",
      description: "Place an OPTION order (buy/sell call or put). instId format: {uly}-{expiry}-{strike}-{C|P}, e.g. BTC-USD-241227-50000-C. tdMode: cash (buyer) or cross/isolated (seller). [CAUTION] Executes real trades. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USD-241227-50000-C (call) or BTC-USD-241227-50000-P (put)"
          },
          tdMode: {
            type: "string",
            enum: ["cash", "cross", "isolated"],
            description: "cash=buyer full premium; cross/isolated=seller margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"]
          },
          ordType: {
            type: "string",
            enum: ["market", "limit", "post_only", "fok", "ioc"],
            description: "market(no px)|limit(px req)|post_only(maker)|fok|ioc"
          },
          sz: {
            type: "string",
            description: "Number of contracts"
          },
          px: {
            type: "string",
            description: "Required for limit/post_only/fok/ioc"
          },
          reduceOnly: {
            type: "boolean",
            description: "Reduce/close only"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          },
          tag: {
            type: "string"
          }
        },
        required: ["instId", "tdMode", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = args.reduceOnly;
        const response = await context.client.privatePost(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            px: readString(args, "px"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(args, "clOrdId"),
            tag: readString(args, "tag")
          }),
          privateRateLimit("option_place_order", 60)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_cancel_order",
      module: "option",
      description: "Cancel an unfilled OPTION order. Provide ordId or clOrdId. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "e.g. BTC-USD-241227-50000-C" },
          ordId: { type: "string" },
          clOrdId: { type: "string" }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("option_cancel_order", 60)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_batch_cancel",
      module: "option",
      description: "[CAUTION] Batch cancel up to 20 OPTION orders. Each item: {instId, ordId?, clOrdId?}. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array (max 20): {instId, ordId?, clOrdId?}",
            items: { type: "object" }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-batch-orders",
          orders,
          privateRateLimit("option_batch_cancel", 60)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_amend_order",
      module: "option",
      description: "Amend an unfilled OPTION order (price and/or size). Provide ordId or clOrdId. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "e.g. BTC-USD-241227-50000-C" },
          ordId: { type: "string" },
          clOrdId: { type: "string" },
          newSz: { type: "string", description: "New quantity (contracts)" },
          newPx: { type: "string", description: "New price" }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId"),
            newSz: readString(args, "newSz"),
            newPx: readString(args, "newPx")
          }),
          privateRateLimit("option_amend_order", 60)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_order",
      module: "option",
      description: "Get details of a single OPTION order by ordId or clOrdId. Private endpoint. Rate limit: 60 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "e.g. BTC-USD-241227-50000-C" },
          ordId: { type: "string", description: "Provide ordId or clOrdId" },
          clOrdId: { type: "string", description: "Provide ordId or clOrdId" }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("option_get_order", 60)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_orders",
      module: "option",
      description: "List OPTION orders. status: live=pending (default), history=7d, archive=3mo. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["live", "history", "archive"],
            description: "live=pending (default), history=7d, archive=3mo"
          },
          uly: { type: "string", description: "Underlying filter, e.g. BTC-USD" },
          instId: { type: "string", description: "Instrument filter" },
          ordType: { type: "string", description: "Order type filter" },
          state: { type: "string", description: "canceled|filled" },
          after: { type: "string", description: "Pagination: before this order ID" },
          before: { type: "string", description: "Pagination: after this order ID" },
          begin: { type: "string", description: "Start time (ms)" },
          end: { type: "string", description: "End time (ms)" },
          limit: { type: "number", description: "Max results (default 100)" }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "live";
        const path4 = status === "archive" ? "/api/v5/trade/orders-history-archive" : status === "history" ? "/api/v5/trade/orders-history" : "/api/v5/trade/orders-pending";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType: "OPTION",
            uly: readString(args, "uly"),
            instId: readString(args, "instId"),
            ordType: readString(args, "ordType"),
            state: readString(args, "state"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("option_get_orders", 20)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_positions",
      module: "option",
      description: "Get current OPTION positions including Greeks (delta, gamma, theta, vega). Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "Filter by specific contract" },
          uly: { type: "string", description: "Filter by underlying, e.g. BTC-USD" }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/positions",
          compactObject({
            instType: "OPTION",
            instId: readString(args, "instId"),
            uly: readString(args, "uly")
          }),
          privateRateLimit("option_get_positions", 10)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_fills",
      module: "option",
      description: "Get OPTION fill history. archive=false: last 3 days (default). archive=true: up to 3 months. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          archive: {
            type: "boolean",
            description: "true=up to 3 months; false=last 3 days (default)"
          },
          instId: { type: "string", description: "Instrument filter" },
          ordId: { type: "string", description: "Order ID filter" },
          after: { type: "string", description: "Pagination: before this bill ID" },
          before: { type: "string", description: "Pagination: after this bill ID" },
          begin: { type: "string", description: "Start time (ms)" },
          end: { type: "string", description: "End time (ms)" },
          limit: { type: "number", description: "Max results" }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const archive = readBoolean(args, "archive") ?? false;
        const path4 = archive ? "/api/v5/trade/fills-history" : "/api/v5/trade/fills";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType: "OPTION",
            instId: readString(args, "instId"),
            ordId: readString(args, "ordId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? (archive ? 20 : void 0)
          }),
          privateRateLimit("option_get_fills", 20)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_instruments",
      module: "option",
      description: "List available OPTION contracts for a given underlying (option chain). Use to find valid instIds before placing orders. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          uly: {
            type: "string",
            description: "Underlying, e.g. BTC-USD or ETH-USD"
          },
          expTime: {
            type: "string",
            description: "Filter by expiry date, e.g. 241227"
          }
        },
        required: ["uly"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/instruments",
          compactObject({
            instType: "OPTION",
            uly: requireString(args, "uly"),
            expTime: readString(args, "expTime")
          }),
          privateRateLimit("option_get_instruments", 20)
        );
        return normalize8(response);
      }
    },
    {
      name: "option_get_greeks",
      module: "option",
      description: "Get implied volatility and Greeks (delta, gamma, theta, vega) for OPTION contracts by underlying. Public endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          uly: {
            type: "string",
            description: "Underlying, e.g. BTC-USD or ETH-USD"
          },
          expTime: {
            type: "string",
            description: "Filter by expiry date, e.g. 241227"
          }
        },
        required: ["uly"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.publicGet(
          "/api/v5/public/opt-summary",
          compactObject({
            uly: requireString(args, "uly"),
            expTime: readString(args, "expTime")
          }),
          privateRateLimit("option_get_greeks", 20)
        );
        return normalize8(response);
      }
    }
  ];
}
function normalize9(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerSpotTradeTools() {
  return [
    {
      name: "spot_place_order",
      module: "spot",
      description: "Place a spot order. Optionally attach take-profit/stop-loss via tpTriggerPx/slTriggerPx (assembled into attachAlgoOrds automatically). [CAUTION] Executes real trades. Private endpoint. Rate limit: 60 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          tdMode: {
            type: "string",
            enum: ["cash", "cross", "isolated"],
            description: "cash=regular spot; cross/isolated=margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"]
          },
          ordType: {
            type: "string",
            enum: ["market", "limit", "post_only", "fok", "ioc"],
            description: "market(no px)|limit(px req)|post_only(maker)|fok(all-or-cancel)|ioc(partial fill)"
          },
          sz: {
            type: "string",
            description: "Buy market: quote amount; all others: base amount"
          },
          px: {
            type: "string",
            description: "Required for limit/post_only/fok/ioc"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          },
          tag: {
            type: "string"
          },
          tpTriggerPx: {
            type: "string",
            description: "TP trigger price; places TP at tpOrdPx"
          },
          tpOrdPx: {
            type: "string",
            description: "TP order price; -1=market"
          },
          slTriggerPx: {
            type: "string",
            description: "SL trigger price; places SL at slOrdPx"
          },
          slOrdPx: {
            type: "string",
            description: "SL order price; -1=market"
          }
        },
        required: ["instId", "tdMode", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const tpTriggerPx = readString(args, "tpTriggerPx");
        const tpOrdPx = readString(args, "tpOrdPx");
        const slTriggerPx = readString(args, "slTriggerPx");
        const slOrdPx = readString(args, "slOrdPx");
        const algoEntry = compactObject({ tpTriggerPx, tpOrdPx, slTriggerPx, slOrdPx });
        const attachAlgoOrds = Object.keys(algoEntry).length > 0 ? [algoEntry] : void 0;
        const response = await context.client.privatePost(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            px: readString(args, "px"),
            clOrdId: readString(args, "clOrdId"),
            tag: readString(args, "tag"),
            attachAlgoOrds
          }),
          privateRateLimit("spot_place_order", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_cancel_order",
      module: "spot",
      description: "Cancel an unfilled spot order by order ID or client order ID. Private endpoint. Rate limit: 60 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          ordId: {
            type: "string"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("spot_cancel_order", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_amend_order",
      module: "spot",
      description: "Amend an unfilled spot order (modify price or size). Private endpoint. Rate limit: 60 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          ordId: {
            type: "string"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID"
          },
          newSz: {
            type: "string"
          },
          newPx: {
            type: "string"
          },
          newClOrdId: {
            type: "string",
            description: "New client order ID after amendment"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId"),
            newSz: readString(args, "newSz"),
            newPx: readString(args, "newPx"),
            newClOrdId: readString(args, "newClOrdId")
          }),
          privateRateLimit("spot_amend_order", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_get_orders",
      module: "spot",
      description: "Query spot open orders, order history (last 7 days), or order archive (up to 3 months). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "history", "archive"],
            description: "open=active, history=7d, archive=3mo"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordType: {
            type: "string",
            description: "Order type filter"
          },
          state: {
            type: "string",
            description: "canceled|filled"
          },
          after: {
            type: "string",
            description: "Pagination: before this order ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this order ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "open";
        const path4 = status === "archive" ? "/api/v5/trade/orders-history-archive" : status === "history" ? "/api/v5/trade/orders-history" : "/api/v5/trade/orders-pending";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType: "SPOT",
            instId: readString(args, "instId"),
            ordType: readString(args, "ordType"),
            state: readString(args, "state"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("spot_get_orders", 20)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_place_algo_order",
      module: "spot",
      description: "Place a spot algo order with take-profit and/or stop-loss. [CAUTION] Executes real trades. Private endpoint. Rate limit: 20 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          tdMode: {
            type: "string",
            enum: ["cash", "cross", "isolated"],
            description: "cash=non-margin spot (default); cross/isolated=margin mode"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"]
          },
          ordType: {
            type: "string",
            enum: ["conditional", "oco"],
            description: "conditional=single TP/SL; oco=TP+SL pair (one-cancels-other)"
          },
          sz: {
            type: "string",
            description: "Quantity in base currency"
          },
          tpTriggerPx: {
            type: "string",
            description: "TP trigger price"
          },
          tpOrdPx: {
            type: "string",
            description: "TP order price; -1=market"
          },
          slTriggerPx: {
            type: "string",
            description: "SL trigger price"
          },
          slOrdPx: {
            type: "string",
            description: "SL order price; -1=market"
          }
        },
        required: ["instId", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/order-algo",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: readString(args, "tdMode") ?? "cash",
            side: requireString(args, "side"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            tpTriggerPx: readString(args, "tpTriggerPx"),
            tpOrdPx: readString(args, "tpOrdPx"),
            slTriggerPx: readString(args, "slTriggerPx"),
            slOrdPx: readString(args, "slOrdPx")
          }),
          privateRateLimit("spot_place_algo_order", 20)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_amend_algo_order",
      module: "spot",
      description: "Amend a pending spot algo order (modify TP/SL prices or size). Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "e.g. BTC-USDT" },
          algoId: { type: "string", description: "Algo order ID" },
          newSz: { type: "string" },
          newTpTriggerPx: { type: "string", description: "New TP trigger price" },
          newTpOrdPx: { type: "string", description: "New TP order price; -1=market" },
          newSlTriggerPx: { type: "string", description: "New SL trigger price" },
          newSlOrdPx: { type: "string", description: "New SL order price; -1=market" }
        },
        required: ["instId", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-algos",
          compactObject({
            instId: requireString(args, "instId"),
            algoId: requireString(args, "algoId"),
            newSz: readString(args, "newSz"),
            newTpTriggerPx: readString(args, "newTpTriggerPx"),
            newTpOrdPx: readString(args, "newTpOrdPx"),
            newSlTriggerPx: readString(args, "newSlTriggerPx"),
            newSlOrdPx: readString(args, "newSlOrdPx")
          }),
          privateRateLimit("spot_amend_algo_order", 20)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_cancel_algo_order",
      module: "spot",
      description: "Cancel a spot algo order (TP/SL). Private endpoint. Rate limit: 20 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          algoId: {
            type: "string",
            description: "Algo order ID"
          }
        },
        required: ["instId", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-algos",
          [
            {
              instId: requireString(args, "instId"),
              algoId: requireString(args, "algoId")
            }
          ],
          privateRateLimit("spot_cancel_algo_order", 20)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_get_algo_orders",
      module: "spot",
      description: "Query spot algo orders (TP/SL) \u2014 pending or history. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "history"],
            description: "pending=active (default); history=completed"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordType: {
            type: "string",
            enum: ["conditional", "oco"],
            description: "Filter by type; omit for all"
          },
          after: {
            type: "string",
            description: "Pagination: before this algo ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this algo ID"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          },
          state: {
            type: "string",
            enum: ["effective", "canceled", "order_failed"],
            description: "Required when status=history. effective=triggered, canceled, order_failed. Defaults to effective."
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "pending";
        const isHistory = status === "history";
        const path4 = isHistory ? "/api/v5/trade/orders-algo-history" : "/api/v5/trade/orders-algo-pending";
        const ordType = readString(args, "ordType");
        const state = isHistory ? readString(args, "state") ?? "effective" : void 0;
        const baseParams = compactObject({
          instType: "SPOT",
          instId: readString(args, "instId"),
          after: readString(args, "after"),
          before: readString(args, "before"),
          limit: readNumber(args, "limit"),
          state
        });
        if (ordType) {
          const response = await context.client.privateGet(
            path4,
            { ...baseParams, ordType },
            privateRateLimit("spot_get_algo_orders", 20)
          );
          return normalize9(response);
        }
        const [r1, r2] = await Promise.all([
          context.client.privateGet(path4, { ...baseParams, ordType: "conditional" }, privateRateLimit("spot_get_algo_orders", 20)),
          context.client.privateGet(path4, { ...baseParams, ordType: "oco" }, privateRateLimit("spot_get_algo_orders", 20))
        ]);
        const merged = [
          ...r1.data ?? [],
          ...r2.data ?? []
        ];
        return { endpoint: r1.endpoint, requestTime: r1.requestTime, data: merged };
      }
    },
    {
      name: "spot_get_fills",
      module: "spot",
      description: "Get spot transaction fill details. archive=false (default): last 3 days. archive=true: up to 3 months, default limit 20. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          archive: {
            type: "boolean",
            description: "true=up to 3 months; false=last 3 days (default)"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordId: {
            type: "string",
            description: "Order ID filter"
          },
          after: {
            type: "string",
            description: "Pagination: before this bill ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this bill ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100 or 20 for archive)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const archive = readBoolean(args, "archive") ?? false;
        const path4 = archive ? "/api/v5/trade/fills-history" : "/api/v5/trade/fills";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType: "SPOT",
            instId: readString(args, "instId"),
            ordId: readString(args, "ordId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? (archive ? 20 : void 0)
          }),
          privateRateLimit("spot_get_fills", 20)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_batch_orders",
      module: "spot",
      description: "[CAUTION] Batch place/cancel/amend up to 20 spot orders in one request. Use action='place'/'cancel'/'amend'. Private. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["place", "cancel", "amend"],
            description: "place|cancel|amend"
          },
          orders: {
            type: "array",
            description: "Array (max 20). place: {instId,side,ordType,sz,tdMode?,px?,clOrdId?,tpTriggerPx?,tpOrdPx?,slTriggerPx?,slOrdPx?} (tdMode defaults to cash for non-margin accounts; use cross for unified/margin accounts). cancel: {instId,ordId|clOrdId}. amend: {instId,ordId|clOrdId,newSz?,newPx?}.",
            items: {
              type: "object"
            }
          }
        },
        required: ["action", "orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", ["place", "cancel", "amend"]);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const endpointMap = {
          place: "/api/v5/trade/batch-orders",
          cancel: "/api/v5/trade/cancel-batch-orders",
          amend: "/api/v5/trade/amend-batch-orders"
        };
        const body = action === "place" ? orders.map((order) => {
          const o = asRecord(order);
          const tpTriggerPx = readString(o, "tpTriggerPx");
          const tpOrdPx = readString(o, "tpOrdPx");
          const slTriggerPx = readString(o, "slTriggerPx");
          const slOrdPx = readString(o, "slOrdPx");
          const algoEntry = compactObject({ tpTriggerPx, tpOrdPx, slTriggerPx, slOrdPx });
          const attachAlgoOrds = Object.keys(algoEntry).length > 0 ? [algoEntry] : void 0;
          return compactObject({
            instId: requireString(o, "instId"),
            tdMode: readString(o, "tdMode") ?? "cash",
            side: requireString(o, "side"),
            ordType: requireString(o, "ordType"),
            sz: requireString(o, "sz"),
            px: readString(o, "px"),
            clOrdId: readString(o, "clOrdId"),
            attachAlgoOrds
          });
        }) : orders;
        const response = await context.client.privatePost(
          endpointMap[action],
          body,
          privateRateLimit("spot_batch_orders", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_get_order",
      module: "spot",
      description: "Get details of a single spot order by order ID or client order ID. Private endpoint. Rate limit: 60 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT"
          },
          ordId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          },
          clOrdId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("spot_get_order", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_batch_amend",
      module: "spot",
      description: "[CAUTION] Batch amend up to 20 unfilled spot orders in one request. Modify price and/or size per order. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array (max 20): {instId, ordId?, clOrdId?, newSz?, newPx?}",
            items: { type: "object" }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-batch-orders",
          orders,
          privateRateLimit("spot_batch_amend", 60)
        );
        return normalize9(response);
      }
    },
    {
      name: "spot_batch_cancel",
      module: "spot",
      description: "[CAUTION] Batch cancel up to 20 spot orders in one request. Provide instId plus ordId or clOrdId for each order. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array (max 20): {instId, ordId?, clOrdId?}",
            items: { type: "object" }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-batch-orders",
          orders,
          privateRateLimit("spot_batch_cancel", 60)
        );
        return normalize9(response);
      }
    }
  ];
}
var SWAP_INST_TYPES = ["SWAP", "FUTURES"];
function normalize10(response) {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}
function registerSwapTradeTools() {
  return [
    {
      name: "swap_place_order",
      module: "swap",
      description: "Place a SWAP or FUTURES perpetual/delivery contract order. Optionally attach take-profit/stop-loss via tpTriggerPx/slTriggerPx (assembled into attachAlgoOrds automatically). [CAUTION] Executes real trades. Private endpoint. Rate limit: 60 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP (perp) or BTC-USD-240329 (delivery)"
          },
          tdMode: {
            type: "string",
            enum: ["cross", "isolated"],
            description: "cross|isolated margin"
          },
          side: {
            type: "string",
            enum: ["buy", "sell"],
            description: "one-way: buy=open long, sell=open short (use reduceOnly=true to close); hedge: combined with posSide"
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "net=one-way mode (default for most accounts); long/short=hedge mode only. Error 'posSide not valid' \u2192 use net"
          },
          ordType: {
            type: "string",
            enum: ["market", "limit", "post_only", "fok", "ioc"],
            description: "market(no px)|limit(px req)|post_only(maker)|fok(all-or-cancel)|ioc(partial fill)"
          },
          sz: {
            type: "string",
            description: "Contracts (e.g. '1'; BTC-USDT-SWAP: 1ct=0.01 BTC)"
          },
          px: {
            type: "string",
            description: "Required for limit/post_only/fok/ioc"
          },
          reduceOnly: {
            type: "boolean",
            description: "Close/reduce only, no new position (one-way mode)"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID (max 32 chars)"
          },
          tag: {
            type: "string"
          },
          tpTriggerPx: {
            type: "string",
            description: "TP trigger price; places TP at tpOrdPx"
          },
          tpOrdPx: {
            type: "string",
            description: "TP order price; -1=market"
          },
          slTriggerPx: {
            type: "string",
            description: "SL trigger price; places SL at slOrdPx"
          },
          slOrdPx: {
            type: "string",
            description: "SL order price; -1=market"
          }
        },
        required: ["instId", "tdMode", "side", "ordType", "sz"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const reduceOnly = args.reduceOnly;
        const tpTriggerPx = readString(args, "tpTriggerPx");
        const tpOrdPx = readString(args, "tpOrdPx");
        const slTriggerPx = readString(args, "slTriggerPx");
        const slOrdPx = readString(args, "slOrdPx");
        const algoEntry = compactObject({ tpTriggerPx, tpOrdPx, slTriggerPx, slOrdPx });
        const attachAlgoOrds = Object.keys(algoEntry).length > 0 ? [algoEntry] : void 0;
        const response = await context.client.privatePost(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            tdMode: requireString(args, "tdMode"),
            side: requireString(args, "side"),
            posSide: readString(args, "posSide"),
            ordType: requireString(args, "ordType"),
            sz: requireString(args, "sz"),
            px: readString(args, "px"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(args, "clOrdId"),
            tag: readString(args, "tag"),
            attachAlgoOrds
          }),
          privateRateLimit("swap_place_order", 60)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_cancel_order",
      module: "swap",
      description: "Cancel an unfilled SWAP or FUTURES order. Private endpoint. Rate limit: 60 req/s per UID.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          ordId: {
            type: "string"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("swap_cancel_order", 60)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_get_orders",
      module: "swap",
      description: "Query SWAP or FUTURES open orders, order history (last 7 days), or order archive (up to 3 months). Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "history", "archive"],
            description: "open=active, history=7d, archive=3mo"
          },
          instType: {
            type: "string",
            enum: [...SWAP_INST_TYPES],
            description: "SWAP (default) or FUTURES"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordType: {
            type: "string",
            description: "Order type filter"
          },
          state: {
            type: "string",
            description: "canceled|filled"
          },
          after: {
            type: "string",
            description: "Pagination: before this order ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this order ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const status = readString(args, "status") ?? "open";
        const instType = readString(args, "instType") ?? "SWAP";
        assertEnum(instType, "instType", SWAP_INST_TYPES);
        const path4 = status === "archive" ? "/api/v5/trade/orders-history-archive" : status === "history" ? "/api/v5/trade/orders-history" : "/api/v5/trade/orders-pending";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType,
            instId: readString(args, "instId"),
            ordType: readString(args, "ordType"),
            state: readString(args, "state"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit")
          }),
          privateRateLimit("swap_get_orders", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_get_positions",
      module: "swap",
      description: "Get current SWAP or FUTURES positions. Private endpoint. Rate limit: 10 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instType: {
            type: "string",
            enum: [...SWAP_INST_TYPES],
            description: "SWAP (default) or FUTURES"
          },
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          posId: {
            type: "string"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const instType = readString(args, "instType") ?? "SWAP";
        assertEnum(instType, "instType", SWAP_INST_TYPES);
        const response = await context.client.privateGet(
          "/api/v5/account/positions",
          compactObject({
            instType,
            instId: readString(args, "instId"),
            posId: readString(args, "posId")
          }),
          privateRateLimit("swap_get_positions", 10)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_set_leverage",
      module: "swap",
      description: "Set leverage for a SWAP or FUTURES instrument or position. [CAUTION] Changes risk parameters. Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          lever: {
            type: "string",
            description: "Leverage, e.g. '10'"
          },
          mgnMode: {
            type: "string",
            enum: ["cross", "isolated"]
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "Required for isolated margin in hedge mode"
          }
        },
        required: ["instId", "lever", "mgnMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/account/set-leverage",
          compactObject({
            instId: requireString(args, "instId"),
            lever: requireString(args, "lever"),
            mgnMode: requireString(args, "mgnMode"),
            posSide: readString(args, "posSide")
          }),
          privateRateLimit("swap_set_leverage", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_amend_algo_order",
      module: "swap",
      description: "Amend a pending SWAP/FUTURES algo order (modify TP/SL prices or size). Private endpoint. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: { type: "string", description: "e.g. BTC-USDT-SWAP" },
          algoId: { type: "string", description: "Algo order ID" },
          newSz: { type: "string", description: "New quantity (contracts)" },
          newTpTriggerPx: { type: "string", description: "New TP trigger price" },
          newTpOrdPx: { type: "string", description: "New TP order price; -1=market" },
          newSlTriggerPx: { type: "string", description: "New SL trigger price" },
          newSlOrdPx: { type: "string", description: "New SL order price; -1=market" }
        },
        required: ["instId", "algoId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-algos",
          compactObject({
            instId: requireString(args, "instId"),
            algoId: requireString(args, "algoId"),
            newSz: readString(args, "newSz"),
            newTpTriggerPx: readString(args, "newTpTriggerPx"),
            newTpOrdPx: readString(args, "newTpOrdPx"),
            newSlTriggerPx: readString(args, "newSlTriggerPx"),
            newSlOrdPx: readString(args, "newSlOrdPx")
          }),
          privateRateLimit("swap_amend_algo_order", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_get_fills",
      module: "swap",
      description: "Get SWAP or FUTURES transaction fill details. archive=false (default): last 3 days. archive=true: up to 3 months, default limit 20. Private endpoint. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          archive: {
            type: "boolean",
            description: "true=up to 3 months; false=last 3 days (default)"
          },
          instType: {
            type: "string",
            enum: [...SWAP_INST_TYPES],
            description: "SWAP (default) or FUTURES"
          },
          instId: {
            type: "string",
            description: "Instrument ID filter"
          },
          ordId: {
            type: "string",
            description: "Order ID filter"
          },
          after: {
            type: "string",
            description: "Pagination: before this bill ID"
          },
          before: {
            type: "string",
            description: "Pagination: after this bill ID"
          },
          begin: {
            type: "string",
            description: "Start time (ms)"
          },
          end: {
            type: "string",
            description: "End time (ms)"
          },
          limit: {
            type: "number",
            description: "Max results (default 100 or 20 for archive)"
          }
        }
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const archive = readBoolean(args, "archive") ?? false;
        const instType = readString(args, "instType") ?? "SWAP";
        assertEnum(instType, "instType", SWAP_INST_TYPES);
        const path4 = archive ? "/api/v5/trade/fills-history" : "/api/v5/trade/fills";
        const response = await context.client.privateGet(
          path4,
          compactObject({
            instType,
            instId: readString(args, "instId"),
            ordId: readString(args, "ordId"),
            after: readString(args, "after"),
            before: readString(args, "before"),
            begin: readString(args, "begin"),
            end: readString(args, "end"),
            limit: readNumber(args, "limit") ?? (archive ? 20 : void 0)
          }),
          privateRateLimit("swap_get_fills", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_get_order",
      module: "swap",
      description: "Get details of a single SWAP or FUTURES order by order ID or client order ID. Private endpoint. Rate limit: 60 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          ordId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          },
          clOrdId: {
            type: "string",
            description: "Provide ordId or clOrdId"
          }
        },
        required: ["instId"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/trade/order",
          compactObject({
            instId: requireString(args, "instId"),
            ordId: readString(args, "ordId"),
            clOrdId: readString(args, "clOrdId")
          }),
          privateRateLimit("swap_get_order", 60)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_close_position",
      module: "swap",
      description: "[CAUTION] Close an entire SWAP/FUTURES position at market. Simpler than swap_place_order with reduceOnly when closing the full position. Private. Rate limit: 20 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          mgnMode: {
            type: "string",
            enum: ["cross", "isolated"]
          },
          posSide: {
            type: "string",
            enum: ["long", "short", "net"],
            description: "long/short=hedge mode; omit for one-way (net)"
          },
          autoCxl: {
            type: "boolean",
            description: "Cancel pending orders for this instrument on close"
          },
          clOrdId: {
            type: "string",
            description: "Client order ID for close order"
          },
          tag: {
            type: "string"
          }
        },
        required: ["instId", "mgnMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const autoCxl = args.autoCxl;
        const response = await context.client.privatePost(
          "/api/v5/trade/close-position",
          compactObject({
            instId: requireString(args, "instId"),
            mgnMode: requireString(args, "mgnMode"),
            posSide: readString(args, "posSide"),
            autoCxl: typeof autoCxl === "boolean" ? String(autoCxl) : void 0,
            clOrdId: readString(args, "clOrdId"),
            tag: readString(args, "tag")
          }),
          privateRateLimit("swap_close_position", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_batch_orders",
      module: "swap",
      description: "[CAUTION] Batch place/cancel/amend up to 20 SWAP/FUTURES orders in one request. Use action='place'/'cancel'/'amend'. Private. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["place", "cancel", "amend"]
          },
          orders: {
            type: "array",
            description: "Array (max 20). place: {instId,tdMode,side,ordType,sz,px?,posSide?,reduceOnly?,clOrdId?,tpTriggerPx?,tpOrdPx?,slTriggerPx?,slOrdPx?}. cancel: {instId,ordId|clOrdId}. amend: {instId,ordId|clOrdId,newSz?,newPx?}.",
            items: {
              type: "object"
            }
          }
        },
        required: ["action", "orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const action = requireString(args, "action");
        assertEnum(action, "action", ["place", "cancel", "amend"]);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const endpointMap = {
          place: "/api/v5/trade/batch-orders",
          cancel: "/api/v5/trade/cancel-batch-orders",
          amend: "/api/v5/trade/amend-batch-orders"
        };
        const body = action === "place" ? orders.map((order) => {
          const o = asRecord(order);
          const tpTriggerPx = readString(o, "tpTriggerPx");
          const tpOrdPx = readString(o, "tpOrdPx");
          const slTriggerPx = readString(o, "slTriggerPx");
          const slOrdPx = readString(o, "slOrdPx");
          const algoEntry = compactObject({ tpTriggerPx, tpOrdPx, slTriggerPx, slOrdPx });
          const attachAlgoOrds = Object.keys(algoEntry).length > 0 ? [algoEntry] : void 0;
          const reduceOnly = o.reduceOnly;
          return compactObject({
            instId: requireString(o, "instId"),
            tdMode: requireString(o, "tdMode"),
            side: requireString(o, "side"),
            ordType: requireString(o, "ordType"),
            sz: requireString(o, "sz"),
            px: readString(o, "px"),
            posSide: readString(o, "posSide"),
            reduceOnly: typeof reduceOnly === "boolean" ? String(reduceOnly) : void 0,
            clOrdId: readString(o, "clOrdId"),
            attachAlgoOrds
          });
        }) : orders;
        const response = await context.client.privatePost(
          endpointMap[action],
          body,
          privateRateLimit("swap_batch_orders", 60)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_get_leverage",
      module: "swap",
      description: "Get current leverage for a SWAP/FUTURES instrument. Call before swap_place_order to verify leverage. Private. Rate limit: 20 req/s.",
      isWrite: false,
      inputSchema: {
        type: "object",
        properties: {
          instId: {
            type: "string",
            description: "e.g. BTC-USDT-SWAP"
          },
          mgnMode: {
            type: "string",
            enum: ["cross", "isolated"]
          }
        },
        required: ["instId", "mgnMode"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const response = await context.client.privateGet(
          "/api/v5/account/leverage-info",
          compactObject({
            instId: requireString(args, "instId"),
            mgnMode: requireString(args, "mgnMode")
          }),
          privateRateLimit("swap_get_leverage", 20)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_batch_amend",
      module: "swap",
      description: "[CAUTION] Batch amend up to 20 unfilled SWAP/FUTURES orders in one request. Modify price and/or size per order. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array (max 20): {instId, ordId?, clOrdId?, newSz?, newPx?}",
            items: { type: "object" }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/amend-batch-orders",
          orders,
          privateRateLimit("swap_batch_amend", 60)
        );
        return normalize10(response);
      }
    },
    {
      name: "swap_batch_cancel",
      module: "swap",
      description: "[CAUTION] Batch cancel up to 20 SWAP/FUTURES orders in one request. Provide instId plus ordId or clOrdId for each order. Private endpoint. Rate limit: 60 req/s.",
      isWrite: true,
      inputSchema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            description: "Array (max 20): {instId, ordId?, clOrdId?}",
            items: { type: "object" }
          }
        },
        required: ["orders"]
      },
      handler: async (rawArgs, context) => {
        const args = asRecord(rawArgs);
        const orders = args.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error("orders must be a non-empty array.");
        }
        const response = await context.client.privatePost(
          "/api/v5/trade/cancel-batch-orders",
          orders,
          privateRateLimit("swap_batch_cancel", 60)
        );
        return normalize10(response);
      }
    }
  ];
}
function allToolSpecs() {
  return [
    ...registerMarketTools(),
    ...registerSpotTradeTools(),
    ...registerSwapTradeTools(),
    ...registerFuturesTools(),
    ...registerOptionTools(),
    ...registerAlgoTradeTools(),
    ...registerAccountTools(),
    ...registerBotTools(),
    ...registerAuditTools(),
    ...registerEarnTools()
  ];
}
function createToolRunner(client, config) {
  const fullConfig = {
    ...config,
    modules: [...MODULES],
    readOnly: false
  };
  const tools = allToolSpecs();
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  return async (toolName, args) => {
    const tool = toolMap.get(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);
    const result = await tool.handler(args, { config: fullConfig, client });
    return result;
  };
}
function configFilePath() {
  return join(homedir(), ".okx", "config.toml");
}
function readFullConfig() {
  const path4 = configFilePath();
  if (!existsSync(path4)) return { profiles: {} };
  const raw = readFileSync(path4, "utf-8");
  return parse(raw);
}
function readTomlProfile(profileName) {
  const config = readFullConfig();
  const name = profileName ?? config.default_profile ?? "default";
  return config.profiles?.[name] ?? {};
}
function writeFullConfig(config) {
  const path4 = configFilePath();
  const dir = dirname(path4);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path4, stringify(config), "utf-8");
}
var BASE_MODULES = MODULES.filter(
  (m) => !BOT_SUB_MODULE_IDS.includes(m)
);
function parseModuleList(rawModules) {
  if (!rawModules || rawModules.trim().length === 0) {
    return [...DEFAULT_MODULES];
  }
  const trimmed = rawModules.trim().toLowerCase();
  if (trimmed === "all") {
    return [...BASE_MODULES, ...BOT_SUB_MODULE_IDS];
  }
  const requested = trimmed.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
  if (requested.length === 0) {
    return [...DEFAULT_MODULES];
  }
  const deduped = /* @__PURE__ */ new Set();
  for (const moduleId of requested) {
    if (moduleId === "bot") {
      for (const sub of BOT_DEFAULT_SUB_MODULES) deduped.add(sub);
      continue;
    }
    if (moduleId === "bot.all") {
      for (const sub of BOT_SUB_MODULE_IDS) deduped.add(sub);
      continue;
    }
    if (!MODULES.includes(moduleId)) {
      throw new ConfigError(
        `Unknown module "${moduleId}".`,
        `Use one of: ${MODULES.join(", ")}, "bot", "bot.all", or "all".`
      );
    }
    deduped.add(moduleId);
  }
  return Array.from(deduped);
}
function loadConfig(cli) {
  const toml = readTomlProfile(cli.profile);
  const apiKey = process.env.OKX_API_KEY?.trim() ?? toml.api_key;
  const secretKey = process.env.OKX_SECRET_KEY?.trim() ?? toml.secret_key;
  const passphrase = process.env.OKX_PASSPHRASE?.trim() ?? toml.passphrase;
  const hasAuth = Boolean(apiKey && secretKey && passphrase);
  const partialAuth = Boolean(apiKey) || Boolean(secretKey) || Boolean(passphrase);
  if (partialAuth && !hasAuth) {
    throw new ConfigError(
      "Partial API credentials detected.",
      "Set OKX_API_KEY, OKX_SECRET_KEY and OKX_PASSPHRASE together (env vars or config.toml profile)."
    );
  }
  const demo = cli.demo || process.env.OKX_DEMO === "1" || process.env.OKX_DEMO === "true" || (toml.demo ?? false);
  const rawSite = cli.site?.trim() ?? process.env.OKX_SITE?.trim() ?? toml.site ?? "global";
  if (!SITE_IDS.includes(rawSite)) {
    throw new ConfigError(
      `Unknown site "${rawSite}".`,
      `Use one of: ${SITE_IDS.join(", ")}.`
    );
  }
  const site = rawSite;
  const rawBaseUrl = process.env.OKX_API_BASE_URL?.trim() ?? toml.base_url ?? OKX_SITES[site].apiBaseUrl;
  if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
    throw new ConfigError(
      `Invalid base URL "${rawBaseUrl}".`,
      "OKX_API_BASE_URL must start with http:// or https://"
    );
  }
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const rawTimeout = process.env.OKX_TIMEOUT_MS ? Number(process.env.OKX_TIMEOUT_MS) : toml.timeout_ms ?? 15e3;
  if (!Number.isFinite(rawTimeout) || rawTimeout <= 0) {
    throw new ConfigError(
      `Invalid timeout value "${rawTimeout}".`,
      "Set OKX_TIMEOUT_MS as a positive integer in milliseconds."
    );
  }
  return {
    apiKey,
    secretKey,
    passphrase,
    hasAuth,
    baseUrl,
    timeoutMs: Math.floor(rawTimeout),
    modules: parseModuleList(cli.modules),
    readOnly: cli.readOnly,
    demo,
    site,
    userAgent: cli.userAgent
  };
}
var CACHE_FILE = join2(homedir2(), ".okx", "update-check.json");
var CHECK_INTERVAL_MS = 24 * 60 * 60 * 1e3;
function readCache() {
  try {
    if (existsSync2(CACHE_FILE)) {
      return JSON.parse(readFileSync2(CACHE_FILE, "utf-8"));
    }
  } catch {
  }
  return {};
}
function writeCache(cache) {
  try {
    mkdirSync2(join2(homedir2(), ".okx"), { recursive: true });
    writeFileSync2(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
  }
}
function isNewerVersion(current, latest) {
  const parse2 = (v) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10));
  const [cMaj, cMin, cPat] = parse2(current);
  const [lMaj, lMin, lPat] = parse2(latest);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}
async function fetchLatestVersion(packageName) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3e3);
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}
function refreshCacheInBackground(packageName) {
  fetchLatestVersion(packageName).then((latest) => {
    if (!latest) return;
    const cache = readCache();
    cache[packageName] = { latestVersion: latest, checkedAt: Date.now() };
    writeCache(cache);
  }).catch(() => {
  });
}
function checkForUpdates(packageName, currentVersion) {
  const cache = readCache();
  const entry = cache[packageName];
  if (entry && isNewerVersion(currentVersion, entry.latestVersion)) {
    process.stderr.write(
      `
Update available for ${packageName}: ${currentVersion} \u2192 ${entry.latestVersion}
Run: npm install -g ${packageName}

`
    );
  }
  if (!entry || Date.now() - entry.checkedAt > CHECK_INTERVAL_MS) {
    refreshCacheInBackground(packageName);
  }
}
var CLIENT_NAMES = {
  "claude-desktop": "Claude Desktop",
  cursor: "Cursor",
  windsurf: "Windsurf",
  vscode: "VS Code",
  "claude-code": "Claude Code CLI"
};
var SUPPORTED_CLIENTS = Object.keys(CLIENT_NAMES);
function appData() {
  return process.env.APPDATA ?? path3.join(os3.homedir(), "AppData", "Roaming");
}
var CLAUDE_CONFIG_FILE = "claude_desktop_config.json";
function findMsStoreClaudePath() {
  const localAppData = process.env.LOCALAPPDATA ?? path3.join(os3.homedir(), "AppData", "Local");
  const packagesDir = path3.join(localAppData, "Packages");
  try {
    const entries = fs3.readdirSync(packagesDir);
    const claudePkg = entries.find((e) => e.startsWith("Claude_"));
    if (claudePkg) {
      const configPath = path3.join(
        packagesDir,
        claudePkg,
        "LocalCache",
        "Roaming",
        "Claude",
        CLAUDE_CONFIG_FILE
      );
      if (fs3.existsSync(configPath) || fs3.existsSync(path3.dirname(configPath))) {
        return configPath;
      }
    }
  } catch {
  }
  return null;
}
function getConfigPath(client) {
  const home = os3.homedir();
  const platform = process.platform;
  switch (client) {
    case "claude-desktop":
      if (platform === "win32") {
        return findMsStoreClaudePath() ?? path3.join(appData(), "Claude", CLAUDE_CONFIG_FILE);
      }
      if (platform === "darwin") {
        return path3.join(home, "Library", "Application Support", "Claude", CLAUDE_CONFIG_FILE);
      }
      return path3.join(process.env.XDG_CONFIG_HOME ?? path3.join(home, ".config"), "Claude", CLAUDE_CONFIG_FILE);
    case "cursor":
      return path3.join(home, ".cursor", "mcp.json");
    case "windsurf":
      return path3.join(home, ".codeium", "windsurf", "mcp_config.json");
    case "vscode":
      return path3.join(process.cwd(), ".mcp.json");
    case "claude-code":
      return null;
  }
}
var NPX_PACKAGE = "@okx_ai/okx-trade-mcp";
function buildEntry(client, args) {
  if (client === "vscode") {
    return { type: "stdio", command: "okx-trade-mcp", args };
  }
  return { command: "npx", args: ["-y", NPX_PACKAGE, ...args] };
}
function buildArgs(options) {
  const args = [];
  if (options.profile) args.push("--profile", options.profile);
  args.push("--modules", options.modules ?? "all");
  return args;
}
function mergeJsonConfig(configPath, serverName, entry) {
  const dir = path3.dirname(configPath);
  if (!fs3.existsSync(dir)) fs3.mkdirSync(dir, { recursive: true });
  let data = {};
  if (fs3.existsSync(configPath)) {
    const raw = fs3.readFileSync(configPath, "utf-8");
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse existing config at ${configPath}`);
    }
    const backupPath = configPath + ".bak";
    fs3.copyFileSync(configPath, backupPath);
    process.stdout.write(`  Backup \u2192 ${backupPath}
`);
  }
  if (typeof data.mcpServers !== "object" || data.mcpServers === null) {
    data.mcpServers = {};
  }
  data.mcpServers[serverName] = entry;
  fs3.writeFileSync(configPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
function printSetupUsage() {
  process.stdout.write(
    `Usage: okx-trade-mcp setup --client <client> [--profile <name>] [--modules <list>]

Clients:
` + SUPPORTED_CLIENTS.map((id) => `  ${id.padEnd(16)} ${CLIENT_NAMES[id]}`).join("\n") + `

Options:
  --profile <name>   Profile from ${configFilePath()} (default: uses default_profile)
  --modules <list>   Comma-separated modules or "all" (default: all)
`
  );
}
function runSetup(options) {
  const { client } = options;
  const name = CLIENT_NAMES[client];
  const args = buildArgs(options);
  const serverName = options.profile ? `okx-trade-mcp-${options.profile}` : "okx-trade-mcp";
  if (client === "claude-code") {
    const claudeArgs = [
      "mcp",
      "add",
      "--transport",
      "stdio",
      serverName,
      "--",
      "okx-trade-mcp",
      ...args
    ];
    process.stdout.write(`Running: claude ${claudeArgs.join(" ")}
`);
    execFileSync("claude", claudeArgs, { stdio: "inherit" });
    process.stdout.write(`\u2713 Configured ${name}
`);
    return;
  }
  const configPath = getConfigPath(client);
  if (!configPath) {
    throw new Error(`${name} is not supported on this platform`);
  }
  const entry = buildEntry(client, args);
  mergeJsonConfig(configPath, serverName, entry);
  process.stdout.write(
    `\u2713 Configured ${name}
  ${configPath}
  Server args: ${args.join(" ")}
`
  );
  if (client !== "vscode") {
    process.stdout.write(`  Restart ${name} to apply changes.
`);
  }
}

// src/config/loader.ts
function loadProfileConfig(opts) {
  return loadConfig({
    profile: opts.profile,
    modules: opts.modules,
    readOnly: opts.readOnly ?? false,
    demo: opts.demo ?? false,
    site: opts.site,
    userAgent: opts.userAgent
  });
}

// src/commands/client-setup.ts
import * as fs2 from "fs";
var DETECTABLE_CLIENTS = ["claude-desktop", "cursor", "windsurf"];
function cmdSetupClient(options) {
  runSetup(options);
}
function cmdSetupClients() {
  const detected = [];
  for (const id of DETECTABLE_CLIENTS) {
    const p = getConfigPath(id);
    if (p && fs2.existsSync(p)) {
      detected.push({ id, path: p });
    }
  }
  if (detected.length > 0) {
    process.stdout.write(`Detected clients:
`);
    for (const { id, path: path4 } of detected) {
      process.stdout.write(`  ${id.padEnd(16)} ${path4}
`);
    }
    process.stdout.write(`
`);
  }
  printSetupUsage();
}

// src/help.ts
var HELP_TREE = {
  market: {
    description: "Market data (ticker, orderbook, candles, trades)",
    commands: {
      ticker: {
        usage: "okx market ticker <instId>",
        description: "Get latest ticker data for an instrument"
      },
      tickers: {
        usage: "okx market tickers <instType>",
        description: "Get all tickers for an instrument type (SPOT|SWAP|FUTURES|OPTION)"
      },
      orderbook: {
        usage: "okx market orderbook <instId> [--sz <n>]",
        description: "Get order book depth for an instrument"
      },
      candles: {
        usage: "okx market candles <instId> [--bar <bar>] [--limit <n>]",
        description: "Get candlestick (OHLCV) data"
      },
      instruments: {
        usage: "okx market instruments --instType <type> [--instId <id>]",
        description: "List tradable instruments of a given type"
      },
      "funding-rate": {
        usage: "okx market funding-rate <instId> [--history] [--limit <n>]",
        description: "Get current or historical funding rate for perpetual swaps"
      },
      "mark-price": {
        usage: "okx market mark-price --instType <MARGIN|SWAP|FUTURES|OPTION> [--instId <id>]",
        description: "Get mark price for instruments"
      },
      trades: {
        usage: "okx market trades <instId> [--limit <n>]",
        description: "Get recent trades for an instrument"
      },
      "index-ticker": {
        usage: "okx market index-ticker [--instId <id>] [--quoteCcy <ccy>]",
        description: "Get index ticker data"
      },
      "index-candles": {
        usage: "okx market index-candles <instId> [--bar <bar>] [--limit <n>] [--history]",
        description: "Get index candlestick data"
      },
      "price-limit": {
        usage: "okx market price-limit <instId>",
        description: "Get price limit for an instrument"
      },
      "open-interest": {
        usage: "okx market open-interest --instType <SWAP|FUTURES|OPTION> [--instId <id>]",
        description: "Get open interest for instruments"
      }
    }
  },
  account: {
    description: "Account balance, positions, bills, and configuration",
    commands: {
      balance: {
        usage: "okx account balance [<ccy>]",
        description: "Get trading account balance"
      },
      "asset-balance": {
        usage: "okx account asset-balance [--ccy <ccy>]",
        description: "Get funding account asset balance"
      },
      positions: {
        usage: "okx account positions [--instType <type>] [--instId <id>]",
        description: "Get current open positions"
      },
      "positions-history": {
        usage: "okx account positions-history [--instType <type>] [--instId <id>] [--limit <n>]",
        description: "Get historical positions"
      },
      bills: {
        usage: "okx account bills [--instType <type>] [--ccy <ccy>] [--limit <n>] [--archive]",
        description: "Get account bill history"
      },
      fees: {
        usage: "okx account fees --instType <type> [--instId <id>]",
        description: "Get trading fee rates"
      },
      config: {
        usage: "okx account config",
        description: "Get account configuration"
      },
      "set-position-mode": {
        usage: "okx account set-position-mode --posMode <long_short_mode|net_mode>",
        description: "Set position mode (long/short or net)"
      },
      "max-size": {
        usage: "okx account max-size --instId <id> --tdMode <cross|isolated> [--px <price>]",
        description: "Get maximum order size for an instrument"
      },
      "max-avail-size": {
        usage: "okx account max-avail-size --instId <id> --tdMode <cross|isolated|cash>",
        description: "Get maximum available tradable amount"
      },
      "max-withdrawal": {
        usage: "okx account max-withdrawal [--ccy <ccy>]",
        description: "Get maximum withdrawable amount"
      },
      transfer: {
        usage: "okx account transfer --ccy <ccy> --amt <n> --from <acct> --to <acct> [--transferType <0|1|2|3>]",
        description: "Transfer funds between accounts"
      },
      audit: {
        usage: "okx account audit [--tool <name>] [--since <ISO-date>] [--limit <n>]",
        description: "Audit account activity and tool call history"
      }
    }
  },
  spot: {
    description: "Spot trading (orders, algo orders)",
    commands: {
      orders: {
        usage: "okx spot orders [--instId <id>] [--history]",
        description: "List open or historical spot orders"
      },
      get: {
        usage: "okx spot get --instId <id> --ordId <id>",
        description: "Get details of a specific spot order"
      },
      fills: {
        usage: "okx spot fills [--instId <id>] [--ordId <id>]",
        description: "Get trade fill history for spot orders"
      },
      place: {
        usage: "okx spot place --instId <id> --side <buy|sell> --ordType <type> --sz <n> [--px <price>] [--tdMode <cash|cross|isolated>]",
        description: "Place a new spot order"
      },
      amend: {
        usage: "okx spot amend --instId <id> --ordId <id> [--newSz <n>] [--newPx <price>]",
        description: "Amend a pending spot order"
      },
      cancel: {
        usage: "okx spot cancel <instId> --ordId <id>",
        description: "Cancel a pending spot order"
      },
      batch: {
        usage: "okx spot batch --action <place|amend|cancel> --orders '<json>'",
        description: "Batch place, amend, or cancel spot orders"
      }
    },
    subgroups: {
      algo: {
        description: "Spot algo orders (conditional, OCO, take-profit/stop-loss)",
        commands: {
          orders: {
            usage: "okx spot algo orders [--instId <id>] [--history] [--ordType <conditional|oco>]",
            description: "List spot algo orders"
          },
          place: {
            usage: "okx spot algo place --instId <id> --side <buy|sell> --sz <n> [--ordType <conditional|oco>]\n                    [--tpTriggerPx <price>] [--tpOrdPx <price|-1>]\n                    [--slTriggerPx <price>] [--slOrdPx <price|-1>] [--tdMode <cash|cross|isolated>]",
            description: "Place a spot algo order (take-profit/stop-loss)"
          },
          amend: {
            usage: "okx spot algo amend --instId <id> --algoId <id> [--newSz <n>]\n                    [--newTpTriggerPx <price>] [--newTpOrdPx <price|-1>]\n                    [--newSlTriggerPx <price>] [--newSlOrdPx <price|-1>]",
            description: "Amend a pending spot algo order"
          },
          cancel: {
            usage: "okx spot algo cancel --instId <id> --algoId <id>",
            description: "Cancel a pending spot algo order"
          }
        }
      }
    }
  },
  swap: {
    description: "Perpetual swap trading (orders, algo orders)",
    commands: {
      positions: {
        usage: "okx swap positions [<instId>]",
        description: "Get current perpetual swap positions"
      },
      orders: {
        usage: "okx swap orders [--instId <id>] [--history] [--archive]",
        description: "List open or historical swap orders"
      },
      get: {
        usage: "okx swap get --instId <id> --ordId <id>",
        description: "Get details of a specific swap order"
      },
      fills: {
        usage: "okx swap fills [--instId <id>] [--ordId <id>] [--archive]",
        description: "Get trade fill history for swap orders"
      },
      place: {
        usage: "okx swap place --instId <id> --side <buy|sell> --ordType <type> --sz <n> [--posSide <side>] [--px <price>] [--tdMode <cross|isolated>]",
        description: "Place a new perpetual swap order"
      },
      cancel: {
        usage: "okx swap cancel <instId> --ordId <id>",
        description: "Cancel a pending swap order"
      },
      amend: {
        usage: "okx swap amend --instId <id> --ordId <id> [--newSz <n>] [--newPx <price>]",
        description: "Amend a pending swap order"
      },
      close: {
        usage: "okx swap close --instId <id> --mgnMode <cross|isolated> [--posSide <net|long|short>] [--autoCxl]",
        description: "Close a swap position"
      },
      leverage: {
        usage: "okx swap leverage --instId <id> --lever <n> --mgnMode <cross|isolated> [--posSide <side>]",
        description: "Set leverage for a swap instrument"
      },
      "get-leverage": {
        usage: "okx swap get-leverage --instId <id> --mgnMode <cross|isolated>",
        description: "Get current leverage setting for a swap instrument"
      },
      batch: {
        usage: "okx swap batch --action <place|amend|cancel> --orders '<json>'",
        description: "Batch place, amend, or cancel swap orders"
      }
    },
    subgroups: {
      algo: {
        description: "Perpetual swap algo orders (trailing stop, conditional, OCO)",
        commands: {
          orders: {
            usage: "okx swap algo orders [--instId <id>] [--history] [--ordType <conditional|oco>]",
            description: "List swap algo orders"
          },
          trail: {
            usage: "okx swap algo trail --instId <id> --side <buy|sell> --sz <n> --callbackRatio <ratio>\n                   [--activePx <price>] [--posSide <net|long|short>] [--tdMode <cross|isolated>] [--reduceOnly]",
            description: "Place a trailing stop algo order for perpetual swap"
          },
          place: {
            usage: "okx swap algo place --instId <id> --side <buy|sell> --sz <n> [--ordType <conditional|oco>]\n                   [--tpTriggerPx <price>] [--tpOrdPx <price|-1>]\n                   [--slTriggerPx <price>] [--slOrdPx <price|-1>]\n                   [--posSide <net|long|short>] [--tdMode <cross|isolated>] [--reduceOnly]",
            description: "Place a swap algo order (take-profit/stop-loss)"
          },
          amend: {
            usage: "okx swap algo amend --instId <id> --algoId <id> [--newSz <n>]\n                   [--newTpTriggerPx <price>] [--newTpOrdPx <price|-1>]\n                   [--newSlTriggerPx <price>] [--newSlOrdPx <price|-1>]",
            description: "Amend a pending swap algo order"
          },
          cancel: {
            usage: "okx swap algo cancel --instId <id> --algoId <id>",
            description: "Cancel a pending swap algo order"
          }
        }
      }
    }
  },
  futures: {
    description: "Futures trading (orders, positions)",
    commands: {
      orders: {
        usage: "okx futures orders [--instId <id>] [--history] [--archive]",
        description: "List open or historical futures orders"
      },
      positions: {
        usage: "okx futures positions [--instId <id>]",
        description: "Get current futures positions"
      },
      fills: {
        usage: "okx futures fills [--instId <id>] [--ordId <id>] [--archive]",
        description: "Get trade fill history for futures orders"
      },
      place: {
        usage: "okx futures place --instId <id> --side <buy|sell> --ordType <type> --sz <n>\n                 [--tdMode <cross|isolated>] [--posSide <net|long|short>] [--px <price>] [--reduceOnly]",
        description: "Place a new futures order"
      },
      cancel: {
        usage: "okx futures cancel <instId> --ordId <id>",
        description: "Cancel a pending futures order"
      },
      get: {
        usage: "okx futures get --instId <id> --ordId <id>",
        description: "Get details of a specific futures order"
      }
    }
  },
  option: {
    description: "Options trading (orders, positions, greeks)",
    commands: {
      orders: {
        usage: "okx option orders [--instId <id>] [--uly <uly>] [--history] [--archive]",
        description: "List open or historical option orders"
      },
      get: {
        usage: "okx option get --instId <id> [--ordId <id>] [--clOrdId <id>]",
        description: "Get details of a specific option order"
      },
      positions: {
        usage: "okx option positions [--instId <id>] [--uly <uly>]",
        description: "Get current option positions"
      },
      fills: {
        usage: "okx option fills [--instId <id>] [--ordId <id>] [--archive]",
        description: "Get trade fill history for option orders"
      },
      instruments: {
        usage: "okx option instruments --uly <uly> [--expTime <date>]",
        description: "List tradable option instruments for an underlying"
      },
      greeks: {
        usage: "okx option greeks --uly <uly> [--expTime <date>]",
        description: "Get option greeks (delta, gamma, theta, vega)"
      },
      place: {
        usage: "okx option place --instId <id> --tdMode <cash|cross|isolated> --side <buy|sell> --ordType <type> --sz <n>\n               [--px <price>] [--reduceOnly] [--clOrdId <id>]",
        description: "Place a new option order"
      },
      cancel: {
        usage: "okx option cancel --instId <id> [--ordId <id>] [--clOrdId <id>]",
        description: "Cancel a pending option order"
      },
      amend: {
        usage: "okx option amend --instId <id> [--ordId <id>] [--clOrdId <id>] [--newSz <n>] [--newPx <price>]",
        description: "Amend a pending option order"
      },
      "batch-cancel": {
        usage: "okx option batch-cancel --orders '<json>'",
        description: "Batch cancel option orders"
      }
    }
  },
  bot: {
    description: "Trading bot strategies (grid, dca)",
    subgroups: {
      grid: {
        description: "Grid trading bot \u2014 create, monitor, and stop grid orders",
        commands: {
          orders: {
            usage: "okx bot grid orders --algoOrdType <grid|contract_grid|moon_grid> [--instId <id>] [--algoId <id>] [--history]",
            description: "List active or historical grid bot orders"
          },
          details: {
            usage: "okx bot grid details --algoOrdType <type> --algoId <id>",
            description: "Get details of a specific grid bot order"
          },
          "sub-orders": {
            usage: "okx bot grid sub-orders --algoOrdType <type> --algoId <id> [--live]",
            description: "List sub-orders of a grid bot (filled or live)"
          },
          create: {
            usage: "okx bot grid create --instId <id> --algoOrdType <grid|contract_grid> --maxPx <px> --minPx <px> --gridNum <n>\n                   [--runType <1|2>] [--quoteSz <n>] [--baseSz <n>]\n                   [--direction <long|short|neutral>] [--lever <n>] [--sz <n>] [--basePos] [--no-basePos]",
            description: "Create a new grid bot order (contract grid opens base position by default)"
          },
          stop: {
            usage: "okx bot grid stop --algoId <id> --algoOrdType <type> --instId <id> [--stopType <1|2|3|5|6>]",
            description: "Stop a running grid bot order"
          }
        }
      },
      dca: {
        description: "DCA (Dollar Cost Averaging) bot \u2014 automated recurring buys",
        commands: {
          orders: {
            usage: "okx bot dca orders [--type <spot|contract>] [--history]",
            description: "List active or historical DCA bot orders"
          },
          details: {
            usage: "okx bot dca details [--type <spot|contract>] --algoId <id>",
            description: "Get details of a specific DCA bot order"
          },
          "sub-orders": {
            usage: "okx bot dca sub-orders [--type <spot|contract>] --algoId <id> [--live] [--cycleId <id>]",
            description: "List sub-orders of a DCA bot"
          },
          create: {
            usage: "okx bot dca create --instId <id> --initOrdAmt <n> --safetyOrdAmt <n> --maxSafetyOrds <n>\n                 --pxSteps <n> --pxStepsMult <n> --volMult <n> --tpPct <n> [--slPct <n>]\n                 [--type <spot|contract>] [--triggerType <1|2>] [--lever <n>] [--side <buy|sell>]\n                 [--reserveFunds <true|false>]",
            description: "Create a new DCA bot order"
          },
          stop: {
            usage: "okx bot dca stop [--type <spot|contract>] --algoId <id> --instId <id> [--stopType <1|2>]",
            description: "Stop a running DCA bot order"
          }
        }
      }
    }
  },
  config: {
    description: "Manage CLI configuration profiles",
    commands: {
      init: {
        usage: "okx config init [--lang zh]",
        description: "Initialize a new configuration profile interactively"
      },
      show: {
        usage: "okx config show",
        description: `Show current configuration (file: ${configFilePath()})`
      },
      set: {
        usage: "okx config set <key> <value>",
        description: "Set a configuration value"
      },
      "setup-clients": {
        usage: "okx config setup-clients",
        description: "Set up MCP client integrations (Cursor, Windsurf, etc.)"
      }
    }
  },
  setup: {
    description: "Set up client integrations (Cursor, Windsurf, Claude, etc.)",
    usage: `okx setup --client <${SUPPORTED_CLIENTS.join("|")}> [--profile <name>] [--modules <list>]`
  }
};
function printGlobalHelp() {
  const lines = [
    "",
    `Usage: okx [--profile <name>] [--demo] [--json] <module> <action> [args...]`,
    "",
    "Global Options:",
    `  --profile <name>   Use a named profile from ${configFilePath()}`,
    "  --demo             Use simulated trading (demo) mode",
    "  --json             Output raw JSON",
    "  --version, -v      Show version",
    "  --help             Show this help",
    "",
    "Modules:"
  ];
  const colWidth = 12;
  for (const [name, group] of Object.entries(HELP_TREE)) {
    lines.push(`  ${name.padEnd(colWidth)}${group.description}`);
  }
  lines.push("", 'Run "okx <module> --help" for module details.', "");
  process.stdout.write(lines.join("\n"));
}
function printModuleHelp(moduleName) {
  const group = HELP_TREE[moduleName];
  if (!group) {
    process.stderr.write(`Unknown module: ${moduleName}
`);
    process.exitCode = 1;
    return;
  }
  const hasSubgroups = group.subgroups && Object.keys(group.subgroups).length > 0;
  const hasCommands = group.commands && Object.keys(group.commands).length > 0;
  const lines = [""];
  if (hasSubgroups && !hasCommands) {
    const subgroupNames = Object.keys(group.subgroups);
    lines.push(`Usage: okx ${moduleName} <strategy> <action> [args...]`);
    lines.push("", `${group.description}.`, "");
    lines.push("Strategies:");
    const colWidth = Math.max(...subgroupNames.map((n) => n.length)) + 4;
    for (const [sgName, sg] of Object.entries(group.subgroups)) {
      lines.push(`  ${sgName.padEnd(colWidth)}${sg.description}`);
    }
    lines.push("", `Run "okx ${moduleName} <strategy> --help" for details.`);
  } else if (hasSubgroups && hasCommands) {
    lines.push(`Usage: okx ${moduleName} <action> [args...]`);
    lines.push("", `${group.description}.`, "", "Commands:");
    printCommandList(lines, group.commands);
    lines.push("", "Subgroups:");
    const subgroupEntries = Object.entries(group.subgroups);
    const colWidth = Math.max(...subgroupEntries.map(([n]) => n.length)) + 4;
    for (const [sgName, sg] of subgroupEntries) {
      lines.push(`  ${sgName.padEnd(colWidth)}${sg.description}`);
    }
    lines.push("", `Run "okx ${moduleName} <subgroup> --help" for subgroup details.`);
  } else if (hasCommands) {
    lines.push(`Usage: okx ${moduleName} <action> [args...]`);
    lines.push("", `${group.description}.`, "", "Commands:");
    printCommandList(lines, group.commands);
  } else if (group.usage) {
    lines.push(`Usage: ${group.usage}`);
    lines.push("", `${group.description}.`);
    if (group.commands) {
      lines.push("");
      for (const cmd of Object.values(group.commands)) {
        lines.push(`  ${cmd.description}`);
        lines.push(`  Usage: ${cmd.usage}`);
      }
    }
  }
  lines.push("");
  process.stdout.write(lines.join("\n"));
}
function printSubgroupHelp(moduleName, subgroupName) {
  const group = HELP_TREE[moduleName];
  if (!group) {
    process.stderr.write(`Unknown module: ${moduleName}
`);
    process.exitCode = 1;
    return;
  }
  const subgroup = group.subgroups?.[subgroupName];
  if (!subgroup) {
    process.stderr.write(`Unknown subgroup: ${moduleName} ${subgroupName}
`);
    process.exitCode = 1;
    return;
  }
  const lines = [
    "",
    `Usage: okx ${moduleName} ${subgroupName} <action> [args...]`,
    "",
    `${subgroup.description}.`,
    "",
    "Commands:"
  ];
  if (subgroup.commands) {
    printCommandList(lines, subgroup.commands);
  }
  lines.push("");
  process.stdout.write(lines.join("\n"));
}
function printCommandList(lines, commands) {
  const names = Object.keys(commands);
  const colWidth = Math.max(...names.map((n) => n.length)) + 4;
  for (const [name, cmd] of Object.entries(commands)) {
    lines.push(`  ${name.padEnd(colWidth)}${cmd.description}`);
    const usageLines = cmd.usage.split("\n");
    lines.push(`  ${" ".repeat(colWidth)}Usage: ${usageLines[0]}`);
    for (const extra of usageLines.slice(1)) {
      lines.push(`  ${" ".repeat(colWidth)}       ${extra.trimStart()}`);
    }
    lines.push("");
  }
}
function printHelp(...path4) {
  const [moduleName, subgroupName] = path4;
  if (!moduleName) {
    printGlobalHelp();
  } else if (!subgroupName) {
    printModuleHelp(moduleName);
  } else {
    printSubgroupHelp(moduleName, subgroupName);
  }
}

// src/parser.ts
import { parseArgs } from "util";
var CLI_OPTIONS = {
  profile: { type: "string" },
  demo: { type: "boolean", default: false },
  json: { type: "boolean", default: false },
  help: { type: "boolean", default: false },
  version: { type: "boolean", short: "v", default: false },
  // setup command
  client: { type: "string" },
  modules: { type: "string" },
  // market candles
  bar: { type: "string" },
  limit: { type: "string" },
  sz: { type: "string" },
  // orders
  instId: { type: "string" },
  history: { type: "boolean", default: false },
  ordId: { type: "string" },
  // trade
  side: { type: "string" },
  ordType: { type: "string" },
  px: { type: "string" },
  posSide: { type: "string" },
  tdMode: { type: "string" },
  // leverage
  lever: { type: "string" },
  mgnMode: { type: "string" },
  // algo orders
  tpTriggerPx: { type: "string" },
  tpOrdPx: { type: "string" },
  slTriggerPx: { type: "string" },
  slOrdPx: { type: "string" },
  algoId: { type: "string" },
  reduceOnly: { type: "boolean", default: false },
  // algo amend
  newSz: { type: "string" },
  newTpTriggerPx: { type: "string" },
  newTpOrdPx: { type: "string" },
  newSlTriggerPx: { type: "string" },
  newSlOrdPx: { type: "string" },
  // trailing stop
  callbackRatio: { type: "string" },
  callbackSpread: { type: "string" },
  activePx: { type: "string" },
  // grid bot
  algoOrdType: { type: "string" },
  gridNum: { type: "string" },
  maxPx: { type: "string" },
  minPx: { type: "string" },
  runType: { type: "string" },
  quoteSz: { type: "string" },
  baseSz: { type: "string" },
  direction: { type: "string" },
  basePos: { type: "boolean", default: true },
  stopType: { type: "string" },
  live: { type: "boolean", default: false },
  // market extras
  instType: { type: "string" },
  quoteCcy: { type: "string" },
  // account extras
  archive: { type: "boolean", default: false },
  posMode: { type: "string" },
  ccy: { type: "string" },
  from: { type: "string" },
  to: { type: "string" },
  transferType: { type: "string" },
  subAcct: { type: "string" },
  amt: { type: "string" },
  // swap/order extras
  autoCxl: { type: "boolean", default: false },
  clOrdId: { type: "string" },
  newPx: { type: "string" },
  // dca bot
  type: { type: "string" },
  initOrdAmt: { type: "string" },
  safetyOrdAmt: { type: "string" },
  maxSafetyOrds: { type: "string" },
  pxSteps: { type: "string" },
  pxStepsMult: { type: "string" },
  volMult: { type: "string" },
  tpPct: { type: "string" },
  slPct: { type: "string" },
  reserveFunds: { type: "string" },
  triggerType: { type: "string" },
  cycleId: { type: "string" },
  // i18n
  lang: { type: "string" },
  // option
  uly: { type: "string" },
  expTime: { type: "string" },
  // batch
  action: { type: "string" },
  orders: { type: "string" },
  // earn
  rate: { type: "string" },
  // audit
  since: { type: "string" },
  tool: { type: "string" },
  // config profile
  force: { type: "boolean", default: false }
};
function parseCli(argv) {
  const negated = /* @__PURE__ */ new Set();
  const filtered = argv.filter((arg) => {
    if (arg.startsWith("--no-")) {
      const key = arg.slice(5);
      if (key in CLI_OPTIONS && CLI_OPTIONS[key].type === "boolean") {
        negated.add(key);
        return false;
      }
    }
    return true;
  });
  const { values, positionals } = parseArgs({
    args: filtered,
    options: CLI_OPTIONS,
    allowPositionals: true
  });
  for (const key of negated) {
    values[key] = false;
  }
  return { values, positionals };
}

// src/formatter.ts
function printJson(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}
function printTable(rows) {
  if (rows.length === 0) {
    process.stdout.write("(no data)\n");
    return;
  }
  const keys = Object.keys(rows[0]);
  const widths = keys.map(
    (k) => Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length))
  );
  const header = keys.map((k, i) => k.padEnd(widths[i])).join("  ");
  const divider = widths.map((w) => "-".repeat(w)).join("  ");
  process.stdout.write(header + "\n" + divider + "\n");
  for (const row of rows) {
    process.stdout.write(
      keys.map((k, i) => String(row[k] ?? "").padEnd(widths[i])).join("  ") + "\n"
    );
  }
}
function printKv(obj, indent = 0) {
  const pad = " ".repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      process.stdout.write(`${pad}${k}:
`);
      printKv(v, indent + 2);
    } else {
      process.stdout.write(`${pad}${k.padEnd(20 - indent)}  ${v}
`);
    }
  }
}

// src/commands/market.ts
function getData(result) {
  return result.data;
}
async function cmdMarketInstruments(run, opts) {
  const result = await run("market_get_instruments", { instType: opts.instType, instId: opts.instId });
  const items = getData(result);
  if (opts.json) return printJson(items);
  printTable(
    (items ?? []).slice(0, 50).map((t) => ({
      instId: t["instId"],
      ctVal: t["ctVal"],
      lotSz: t["lotSz"],
      minSz: t["minSz"],
      tickSz: t["tickSz"],
      state: t["state"]
    }))
  );
}
async function cmdMarketFundingRate(run, instId, opts) {
  const result = await run("market_get_funding_rate", { instId, history: opts.history, limit: opts.limit });
  const items = getData(result);
  if (opts.json) return printJson(items);
  if (opts.history) {
    printTable(
      (items ?? []).map((r) => ({
        instId: r["instId"],
        fundingRate: r["fundingRate"],
        realizedRate: r["realizedRate"],
        fundingTime: new Date(Number(r["fundingTime"])).toLocaleString()
      }))
    );
  } else {
    const r = items?.[0];
    if (!r) {
      process.stdout.write("No data\n");
      return;
    }
    printKv({
      instId: r["instId"],
      fundingRate: r["fundingRate"],
      nextFundingRate: r["nextFundingRate"],
      fundingTime: new Date(Number(r["fundingTime"])).toLocaleString(),
      nextFundingTime: new Date(Number(r["nextFundingTime"])).toLocaleString()
    });
  }
}
async function cmdMarketMarkPrice(run, opts) {
  const result = await run("market_get_mark_price", { instType: opts.instType, instId: opts.instId });
  const items = getData(result);
  if (opts.json) return printJson(items);
  printTable(
    (items ?? []).map((r) => ({
      instId: r["instId"],
      instType: r["instType"],
      markPx: r["markPx"],
      ts: new Date(Number(r["ts"])).toLocaleString()
    }))
  );
}
async function cmdMarketTrades(run, instId, opts) {
  const result = await run("market_get_trades", { instId, limit: opts.limit });
  const items = getData(result);
  if (opts.json) return printJson(items);
  printTable(
    (items ?? []).map((t) => ({
      tradeId: t["tradeId"],
      px: t["px"],
      sz: t["sz"],
      side: t["side"],
      ts: new Date(Number(t["ts"])).toLocaleString()
    }))
  );
}
async function cmdMarketIndexTicker(run, opts) {
  const result = await run("market_get_index_ticker", { instId: opts.instId, quoteCcy: opts.quoteCcy });
  const items = getData(result);
  if (opts.json) return printJson(items);
  printTable(
    (items ?? []).map((t) => ({
      instId: t["instId"],
      idxPx: t["idxPx"],
      high24h: t["high24h"],
      low24h: t["low24h"],
      ts: new Date(Number(t["ts"])).toLocaleString()
    }))
  );
}
async function cmdMarketIndexCandles(run, instId, opts) {
  const result = await run("market_get_index_candles", { instId, bar: opts.bar, limit: opts.limit, history: opts.history });
  const candles = getData(result);
  if (opts.json) return printJson(candles);
  printTable(
    (candles ?? []).map(([ts, o, h, l, c]) => ({
      time: new Date(Number(ts)).toLocaleString(),
      open: o,
      high: h,
      low: l,
      close: c
    }))
  );
}
async function cmdMarketPriceLimit(run, instId, json) {
  const result = await run("market_get_price_limit", { instId });
  const items = getData(result);
  if (json) return printJson(items);
  const r = items?.[0];
  if (!r) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    instId: r["instId"],
    buyLmt: r["buyLmt"],
    sellLmt: r["sellLmt"],
    ts: new Date(Number(r["ts"])).toLocaleString()
  });
}
async function cmdMarketOpenInterest(run, opts) {
  const result = await run("market_get_open_interest", { instType: opts.instType, instId: opts.instId });
  const items = getData(result);
  if (opts.json) return printJson(items);
  printTable(
    (items ?? []).map((r) => ({
      instId: r["instId"],
      oi: r["oi"],
      oiCcy: r["oiCcy"],
      ts: new Date(Number(r["ts"])).toLocaleString()
    }))
  );
}
async function cmdMarketTicker(run, instId, json) {
  const result = await run("market_get_ticker", { instId });
  const items = getData(result);
  if (json) return printJson(items);
  if (!items?.length) {
    process.stdout.write("No data\n");
    return;
  }
  const t = items[0];
  printKv({
    instId: t["instId"],
    last: t["last"],
    "24h change %": t["sodUtc8"],
    "24h high": t["high24h"],
    "24h low": t["low24h"],
    "24h vol": t["vol24h"],
    time: new Date(Number(t["ts"])).toLocaleString()
  });
}
async function cmdMarketTickers(run, instType, json) {
  const result = await run("market_get_tickers", { instType });
  const items = getData(result);
  if (json) return printJson(items);
  printTable(
    (items ?? []).map((t) => ({
      instId: t["instId"],
      last: t["last"],
      "24h high": t["high24h"],
      "24h low": t["low24h"],
      "24h vol": t["vol24h"]
    }))
  );
}
async function cmdMarketOrderbook(run, instId, sz, json) {
  const result = await run("market_get_orderbook", { instId, sz });
  const data = getData(result);
  if (json) return printJson(data);
  const book = data[0];
  if (!book) {
    process.stdout.write("No data\n");
    return;
  }
  const asks = book["asks"].slice(0, 5);
  const bids = book["bids"].slice(0, 5);
  process.stdout.write("Asks (price / size):\n");
  for (const [p, s] of asks.reverse()) process.stdout.write(`  ${p.padStart(16)}  ${s}
`);
  process.stdout.write("Bids (price / size):\n");
  for (const [p, s] of bids) process.stdout.write(`  ${p.padStart(16)}  ${s}
`);
}
async function cmdMarketCandles(run, instId, opts) {
  const result = await run("market_get_candles", { instId, bar: opts.bar, limit: opts.limit });
  const candles = getData(result);
  if (opts.json) return printJson(candles);
  printTable(
    (candles ?? []).map(([ts, o, h, l, c, vol]) => ({
      time: new Date(Number(ts)).toLocaleString(),
      open: o,
      high: h,
      low: l,
      close: c,
      vol
    }))
  );
}

// src/commands/account.ts
import * as fs4 from "fs";
import * as path2 from "path";
import * as os2 from "os";
function getData2(result) {
  return result.data;
}
async function cmdAccountBalance(run, ccy, json) {
  const result = await run("account_get_balance", { ccy });
  const data = getData2(result);
  if (json) return printJson(data);
  const details = data?.[0]?.["details"] ?? [];
  printTable(
    details.filter((d) => Number(d["eq"]) > 0).map((d) => ({
      currency: d["ccy"],
      equity: d["eq"],
      available: d["availEq"],
      frozen: d["frozenBal"]
    }))
  );
}
async function cmdAccountAssetBalance(run, ccy, json) {
  const result = await run("account_get_asset_balance", { ccy });
  const data = getData2(result);
  if (json) return printJson(data);
  printTable(
    (data ?? []).filter((r) => Number(r["bal"]) > 0).map((r) => ({
      ccy: r["ccy"],
      bal: r["bal"],
      availBal: r["availBal"],
      frozenBal: r["frozenBal"]
    }))
  );
}
async function cmdAccountPositions(run, opts) {
  const result = await run("account_get_positions", { instType: opts.instType, instId: opts.instId });
  const positions = getData2(result);
  if (opts.json) return printJson(positions);
  const open = (positions ?? []).filter((p) => Number(p["pos"]) !== 0);
  if (!open.length) {
    process.stdout.write("No open positions\n");
    return;
  }
  printTable(
    open.map((p) => ({
      instId: p["instId"],
      instType: p["instType"],
      side: p["posSide"],
      pos: p["pos"],
      avgPx: p["avgPx"],
      upl: p["upl"],
      lever: p["lever"]
    }))
  );
}
async function cmdAccountBills(run, opts) {
  const toolName = opts.archive ? "account_get_bills_archive" : "account_get_bills";
  const result = await run(toolName, { instType: opts.instType, ccy: opts.ccy, limit: opts.limit });
  const bills = getData2(result);
  if (opts.json) return printJson(bills);
  printTable(
    (bills ?? []).map((b) => ({
      billId: b["billId"],
      instId: b["instId"],
      type: b["type"],
      ccy: b["ccy"],
      balChg: b["balChg"],
      bal: b["bal"],
      ts: new Date(Number(b["ts"])).toLocaleString()
    }))
  );
}
async function cmdAccountFees(run, opts) {
  const result = await run("account_get_trade_fee", { instType: opts.instType, instId: opts.instId });
  const data = getData2(result);
  if (opts.json) return printJson(data);
  const fee = data?.[0];
  if (!fee) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    level: fee["level"],
    maker: fee["maker"],
    taker: fee["taker"],
    makerU: fee["makerU"],
    takerU: fee["takerU"],
    ts: new Date(Number(fee["ts"])).toLocaleString()
  });
}
async function cmdAccountConfig(run, json) {
  const result = await run("account_get_config", {});
  const data = getData2(result);
  if (json) return printJson(data);
  const cfg = data?.[0];
  if (!cfg) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    uid: cfg["uid"],
    acctLv: cfg["acctLv"],
    posMode: cfg["posMode"],
    autoLoan: cfg["autoLoan"],
    greeksType: cfg["greeksType"],
    level: cfg["level"],
    levelTmp: cfg["levelTmp"]
  });
}
async function cmdAccountSetPositionMode(run, posMode, json) {
  const result = await run("account_set_position_mode", { posMode });
  const data = getData2(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Position mode set: ${r?.["posMode"]}
`);
}
async function cmdAccountMaxSize(run, opts) {
  const result = await run("account_get_max_size", { instId: opts.instId, tdMode: opts.tdMode, px: opts.px });
  const data = getData2(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  if (!r) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({ instId: r["instId"], maxBuy: r["maxBuy"], maxSell: r["maxSell"] });
}
async function cmdAccountMaxAvailSize(run, opts) {
  const result = await run("account_get_max_avail_size", { instId: opts.instId, tdMode: opts.tdMode });
  const data = getData2(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  if (!r) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({ instId: r["instId"], availBuy: r["availBuy"], availSell: r["availSell"] });
}
async function cmdAccountMaxWithdrawal(run, ccy, json) {
  const result = await run("account_get_max_withdrawal", { ccy });
  const data = getData2(result);
  if (json) return printJson(data);
  printTable(
    (data ?? []).map((r) => ({
      ccy: r["ccy"],
      maxWd: r["maxWd"],
      maxWdEx: r["maxWdEx"]
    }))
  );
}
async function cmdAccountPositionsHistory(run, opts) {
  const result = await run("account_get_positions_history", { instType: opts.instType, instId: opts.instId, limit: opts.limit });
  const data = getData2(result);
  if (opts.json) return printJson(data);
  printTable(
    (data ?? []).map((p) => ({
      instId: p["instId"],
      direction: p["direction"],
      openAvgPx: p["openAvgPx"],
      closeAvgPx: p["closeAvgPx"],
      realizedPnl: p["realizedPnl"],
      uTime: new Date(Number(p["uTime"])).toLocaleString()
    }))
  );
}
async function cmdAccountTransfer(run, opts) {
  const result = await run("account_transfer", {
    ccy: opts.ccy,
    amt: opts.amt,
    from: opts.from,
    to: opts.to,
    type: opts.transferType,
    subAcct: opts.subAcct
  });
  const data = getData2(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Transfer: ${r?.["transId"]} (${r?.["ccy"]} ${r?.["amt"]})
`);
}
function readAuditLogs(logDir, days = 7) {
  const entries = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const filePath = path2.join(logDir, `trade-${yyyy}-${mm}-${dd}.log`);
    let content;
    try {
      content = fs4.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        entries.push(JSON.parse(trimmed));
      } catch {
      }
    }
  }
  return entries;
}
function cmdAccountAudit(opts) {
  const logDir = path2.join(os2.homedir(), ".okx", "logs");
  const limit = Math.min(Number(opts.limit) || 20, 100);
  let entries = readAuditLogs(logDir);
  if (opts.tool) entries = entries.filter((e) => e.tool === opts.tool);
  if (opts.since) {
    const sinceTime = new Date(opts.since).getTime();
    entries = entries.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);
  }
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  entries = entries.slice(0, limit);
  if (opts.json) return printJson(entries);
  if (!entries.length) {
    process.stdout.write("No audit log entries\n");
    return;
  }
  printTable(
    entries.map((e) => ({
      timestamp: e.timestamp,
      tool: e.tool,
      level: e.level,
      duration: e.durationMs != null ? `${e.durationMs}ms` : "-",
      status: e.error ? "ERROR" : "OK"
    }))
  );
}

// src/commands/spot.ts
function getData3(result) {
  return result.data;
}
async function cmdSpotOrders(run, opts) {
  const result = await run("spot_get_orders", { instId: opts.instId, status: opts.status });
  const orders = getData3(result);
  if (opts.json) return printJson(orders);
  printTable(
    (orders ?? []).map((o) => ({
      ordId: o["ordId"],
      instId: o["instId"],
      side: o["side"],
      type: o["ordType"],
      price: o["px"],
      size: o["sz"],
      filled: o["fillSz"],
      state: o["state"]
    }))
  );
}
async function cmdSpotPlace(run, opts) {
  const result = await run("spot_place_order", {
    instId: opts.instId,
    tdMode: opts.tdMode ?? "cash",
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    px: opts.px
  });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(`Order placed: ${order?.["ordId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`);
}
async function cmdSpotCancel(run, instId, ordId, json) {
  const result = await run("spot_cancel_order", { instId, ordId });
  const data = getData3(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Cancelled: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdSpotAlgoPlace(run, opts) {
  const result = await run("spot_place_algo_order", {
    instId: opts.instId,
    tdMode: opts.tdMode ?? "cash",
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    tpTriggerPx: opts.tpTriggerPx,
    tpOrdPx: opts.tpOrdPx,
    slTriggerPx: opts.slTriggerPx,
    slOrdPx: opts.slOrdPx
  });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(
    `Algo order placed: ${order?.["algoId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`
  );
}
async function cmdSpotAlgoAmend(run, opts) {
  const result = await run("spot_amend_algo_order", {
    instId: opts.instId,
    algoId: opts.algoId,
    newSz: opts.newSz,
    newTpTriggerPx: opts.newTpTriggerPx,
    newTpOrdPx: opts.newTpOrdPx,
    newSlTriggerPx: opts.newSlTriggerPx,
    newSlOrdPx: opts.newSlOrdPx
  });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Algo order amended: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdSpotAlgoCancel(run, instId, algoId, json) {
  const result = await run("spot_cancel_algo_order", { instId, algoId });
  const data = getData3(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Algo order cancelled: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdSpotGet(run, opts) {
  const result = await run("spot_get_order", { instId: opts.instId, ordId: opts.ordId, clOrdId: opts.clOrdId });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  const o = data?.[0];
  if (!o) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    ordId: o["ordId"],
    instId: o["instId"],
    side: o["side"],
    ordType: o["ordType"],
    px: o["px"],
    sz: o["sz"],
    fillSz: o["fillSz"],
    avgPx: o["avgPx"],
    state: o["state"],
    cTime: new Date(Number(o["cTime"])).toLocaleString()
  });
}
async function cmdSpotAmend(run, opts) {
  const result = await run("spot_amend_order", {
    instId: opts.instId,
    ordId: opts.ordId,
    clOrdId: opts.clOrdId,
    newSz: opts.newSz,
    newPx: opts.newPx
  });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Order amended: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdSpotAlgoOrders(run, opts) {
  const result = await run("spot_get_algo_orders", {
    instId: opts.instId,
    status: opts.status,
    ordType: opts.ordType
  });
  const orders = getData3(result);
  if (opts.json) return printJson(orders);
  if (!(orders ?? []).length) {
    process.stdout.write("No algo orders\n");
    return;
  }
  printTable(
    orders.map((o) => ({
      algoId: o["algoId"],
      instId: o["instId"],
      type: o["ordType"],
      side: o["side"],
      sz: o["sz"],
      tpTrigger: o["tpTriggerPx"],
      slTrigger: o["slTriggerPx"],
      state: o["state"]
    }))
  );
}
async function cmdSpotFills(run, opts) {
  const result = await run("spot_get_fills", { instId: opts.instId, ordId: opts.ordId });
  const fills = getData3(result);
  if (opts.json) return printJson(fills);
  printTable(
    (fills ?? []).map((f) => ({
      instId: f["instId"],
      side: f["side"],
      fillPx: f["fillPx"],
      fillSz: f["fillSz"],
      fee: f["fee"],
      ts: new Date(Number(f["ts"])).toLocaleString()
    }))
  );
}
async function cmdSpotBatch(run, opts) {
  let parsed;
  try {
    parsed = JSON.parse(opts.orders);
  } catch {
    process.stderr.write("Error: --orders must be a valid JSON array\n");
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    process.stderr.write("Error: --orders must be a non-empty JSON array\n");
    process.exitCode = 1;
    return;
  }
  const toolMap = {
    place: "spot_batch_orders",
    amend: "spot_batch_amend",
    cancel: "spot_batch_cancel"
  };
  const tool = toolMap[opts.action];
  if (!tool) {
    process.stderr.write(`Error: --action must be one of: place, amend, cancel
`);
    process.exitCode = 1;
    return;
  }
  const result = await run(tool, tool === "spot_batch_orders" ? { action: opts.action, orders: parsed } : { orders: parsed });
  const data = getData3(result);
  if (opts.json) return printJson(data);
  for (const r of data ?? []) {
    process.stdout.write(`${r["ordId"] ?? r["clOrdId"] ?? "?"}: ${r["sCode"] === "0" ? "OK" : r["sMsg"]}
`);
  }
}

// src/commands/swap.ts
function getData4(result) {
  return result.data;
}
async function cmdSwapPositions(run, instId, json) {
  const result = await run("swap_get_positions", { instId });
  const positions = getData4(result);
  if (json) return printJson(positions);
  const open = (positions ?? []).filter((p) => Number(p["pos"]) !== 0);
  if (!open.length) {
    process.stdout.write("No open positions\n");
    return;
  }
  printTable(
    open.map((p) => ({
      instId: p["instId"],
      side: p["posSide"],
      size: p["pos"],
      avgPx: p["avgPx"],
      upl: p["upl"],
      uplRatio: p["uplRatio"],
      lever: p["lever"]
    }))
  );
}
async function cmdSwapOrders(run, opts) {
  const result = await run("swap_get_orders", { instId: opts.instId, status: opts.status });
  const orders = getData4(result);
  if (opts.json) return printJson(orders);
  printTable(
    (orders ?? []).map((o) => ({
      ordId: o["ordId"],
      instId: o["instId"],
      side: o["side"],
      posSide: o["posSide"],
      type: o["ordType"],
      price: o["px"],
      size: o["sz"],
      state: o["state"]
    }))
  );
}
async function cmdSwapPlace(run, opts) {
  const result = await run("swap_place_order", {
    instId: opts.instId,
    tdMode: opts.tdMode,
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    posSide: opts.posSide,
    px: opts.px
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(`Order placed: ${order?.["ordId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`);
}
async function cmdSwapCancel(run, instId, ordId, json) {
  const result = await run("swap_cancel_order", { instId, ordId });
  const data = getData4(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Cancelled: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdSwapAlgoPlace(run, opts) {
  const result = await run("swap_place_algo_order", {
    instId: opts.instId,
    tdMode: opts.tdMode,
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    posSide: opts.posSide,
    tpTriggerPx: opts.tpTriggerPx,
    tpOrdPx: opts.tpOrdPx,
    slTriggerPx: opts.slTriggerPx,
    slOrdPx: opts.slOrdPx,
    reduceOnly: opts.reduceOnly
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(
    `Algo order placed: ${order?.["algoId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`
  );
}
async function cmdSwapAlgoAmend(run, opts) {
  const result = await run("swap_amend_algo_order", {
    instId: opts.instId,
    algoId: opts.algoId,
    newSz: opts.newSz,
    newTpTriggerPx: opts.newTpTriggerPx,
    newTpOrdPx: opts.newTpOrdPx,
    newSlTriggerPx: opts.newSlTriggerPx,
    newSlOrdPx: opts.newSlOrdPx
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Algo order amended: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdSwapAlgoTrailPlace(run, opts) {
  const result = await run("swap_place_move_stop_order", {
    instId: opts.instId,
    tdMode: opts.tdMode,
    side: opts.side,
    sz: opts.sz,
    callbackRatio: opts.callbackRatio,
    callbackSpread: opts.callbackSpread,
    activePx: opts.activePx,
    posSide: opts.posSide,
    reduceOnly: opts.reduceOnly
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(
    `Trailing stop placed: ${order?.["algoId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`
  );
}
async function cmdSwapAlgoCancel(run, instId, algoId, json) {
  const result = await run("swap_cancel_algo_orders", { instId, algoId });
  const data = getData4(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Algo order cancelled: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdSwapAlgoOrders(run, opts) {
  const result = await run("swap_get_algo_orders", {
    instId: opts.instId,
    status: opts.status,
    ordType: opts.ordType
  });
  const orders = getData4(result);
  if (opts.json) return printJson(orders);
  if (!(orders ?? []).length) {
    process.stdout.write("No algo orders\n");
    return;
  }
  printTable(
    orders.map((o) => ({
      algoId: o["algoId"],
      instId: o["instId"],
      type: o["ordType"],
      side: o["side"],
      sz: o["sz"],
      tpTrigger: o["tpTriggerPx"],
      slTrigger: o["slTriggerPx"],
      state: o["state"]
    }))
  );
}
async function cmdSwapFills(run, opts) {
  const result = await run("swap_get_fills", { instId: opts.instId, ordId: opts.ordId, archive: opts.archive });
  const fills = getData4(result);
  if (opts.json) return printJson(fills);
  printTable(
    (fills ?? []).map((f) => ({
      instId: f["instId"],
      side: f["side"],
      fillPx: f["fillPx"],
      fillSz: f["fillSz"],
      fee: f["fee"],
      ts: new Date(Number(f["ts"])).toLocaleString()
    }))
  );
}
async function cmdSwapGet(run, opts) {
  const result = await run("swap_get_order", { instId: opts.instId, ordId: opts.ordId, clOrdId: opts.clOrdId });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const o = data?.[0];
  if (!o) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    ordId: o["ordId"],
    instId: o["instId"],
    side: o["side"],
    posSide: o["posSide"],
    ordType: o["ordType"],
    px: o["px"],
    sz: o["sz"],
    fillSz: o["fillSz"],
    avgPx: o["avgPx"],
    state: o["state"],
    cTime: new Date(Number(o["cTime"])).toLocaleString()
  });
}
async function cmdSwapClose(run, opts) {
  const result = await run("swap_close_position", {
    instId: opts.instId,
    mgnMode: opts.mgnMode,
    posSide: opts.posSide,
    autoCxl: opts.autoCxl
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Position closed: ${r?.["instId"]} ${r?.["posSide"] ?? ""}
`);
}
async function cmdSwapGetLeverage(run, opts) {
  const result = await run("swap_get_leverage", { instId: opts.instId, mgnMode: opts.mgnMode });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  printTable(
    (data ?? []).map((r) => ({
      instId: r["instId"],
      mgnMode: r["mgnMode"],
      posSide: r["posSide"],
      lever: r["lever"]
    }))
  );
}
async function cmdSwapAmend(run, opts) {
  const result = await run("spot_amend_order", {
    instId: opts.instId,
    ordId: opts.ordId,
    clOrdId: opts.clOrdId,
    newSz: opts.newSz,
    newPx: opts.newPx
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Order amended: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdSwapSetLeverage(run, opts) {
  const result = await run("swap_set_leverage", {
    instId: opts.instId,
    lever: opts.lever,
    mgnMode: opts.mgnMode,
    posSide: opts.posSide
  });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Leverage set: ${r?.["lever"]}x ${r?.["instId"]}
`);
}
async function cmdSwapBatch(run, opts) {
  let parsed;
  try {
    parsed = JSON.parse(opts.orders);
  } catch {
    process.stderr.write("Error: --orders must be a valid JSON array\n");
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    process.stderr.write("Error: --orders must be a non-empty JSON array\n");
    process.exitCode = 1;
    return;
  }
  const toolMap = {
    place: "swap_batch_orders",
    amend: "swap_batch_amend",
    cancel: "swap_batch_cancel"
  };
  const tool = toolMap[opts.action];
  if (!tool) {
    process.stderr.write(`Error: --action must be one of: place, amend, cancel
`);
    process.exitCode = 1;
    return;
  }
  const result = await run(tool, tool === "swap_batch_orders" ? { action: opts.action, orders: parsed } : { orders: parsed });
  const data = getData4(result);
  if (opts.json) return printJson(data);
  for (const r of data ?? []) {
    process.stdout.write(`${r["ordId"] ?? r["clOrdId"] ?? "?"}: ${r["sCode"] === "0" ? "OK" : r["sMsg"]}
`);
  }
}

// src/commands/futures.ts
function getData5(result) {
  return result.data;
}
async function cmdFuturesOrders(run, opts) {
  const result = await run("futures_get_orders", { instId: opts.instId, status: opts.status });
  const orders = getData5(result);
  if (opts.json) return printJson(orders);
  printTable(
    (orders ?? []).map((o) => ({
      ordId: o["ordId"],
      instId: o["instId"],
      side: o["side"],
      posSide: o["posSide"],
      type: o["ordType"],
      price: o["px"],
      size: o["sz"],
      state: o["state"]
    }))
  );
}
async function cmdFuturesPositions(run, instId, json) {
  const result = await run("futures_get_positions", { instId });
  const positions = getData5(result);
  if (json) return printJson(positions);
  const open = (positions ?? []).filter((p) => Number(p["pos"]) !== 0);
  if (!open.length) {
    process.stdout.write("No open positions\n");
    return;
  }
  printTable(
    open.map((p) => ({
      instId: p["instId"],
      side: p["posSide"],
      pos: p["pos"],
      avgPx: p["avgPx"],
      upl: p["upl"],
      lever: p["lever"]
    }))
  );
}
async function cmdFuturesFills(run, opts) {
  const result = await run("futures_get_fills", { instId: opts.instId, ordId: opts.ordId, archive: opts.archive });
  const fills = getData5(result);
  if (opts.json) return printJson(fills);
  printTable(
    (fills ?? []).map((f) => ({
      instId: f["instId"],
      side: f["side"],
      fillPx: f["fillPx"],
      fillSz: f["fillSz"],
      fee: f["fee"],
      ts: new Date(Number(f["ts"])).toLocaleString()
    }))
  );
}
async function cmdFuturesPlace(run, opts) {
  const result = await run("futures_place_order", {
    instId: opts.instId,
    tdMode: opts.tdMode,
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    posSide: opts.posSide,
    px: opts.px,
    reduceOnly: opts.reduceOnly
  });
  const data = getData5(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(`Order placed: ${order?.["ordId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`);
}
async function cmdFuturesCancel(run, instId, ordId, json) {
  const result = await run("futures_cancel_order", { instId, ordId });
  const data = getData5(result);
  if (json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Cancelled: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdFuturesGet(run, opts) {
  const result = await run("futures_get_order", { instId: opts.instId, ordId: opts.ordId });
  const data = getData5(result);
  if (opts.json) return printJson(data);
  const o = data?.[0];
  if (!o) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    ordId: o["ordId"],
    instId: o["instId"],
    side: o["side"],
    posSide: o["posSide"],
    ordType: o["ordType"],
    px: o["px"],
    sz: o["sz"],
    fillSz: o["fillSz"],
    avgPx: o["avgPx"],
    state: o["state"],
    cTime: new Date(Number(o["cTime"])).toLocaleString()
  });
}

// src/commands/option.ts
function getData6(result) {
  return result.data;
}
async function cmdOptionOrders(run, opts) {
  const result = await run("option_get_orders", {
    instId: opts.instId,
    uly: opts.uly,
    status: opts.status
  });
  const orders = getData6(result);
  if (opts.json) return printJson(orders);
  printTable(
    (orders ?? []).map((o) => ({
      ordId: o["ordId"],
      instId: o["instId"],
      side: o["side"],
      ordType: o["ordType"],
      px: o["px"],
      sz: o["sz"],
      state: o["state"]
    }))
  );
}
async function cmdOptionGet(run, opts) {
  const result = await run("option_get_order", {
    instId: opts.instId,
    ordId: opts.ordId,
    clOrdId: opts.clOrdId
  });
  const data = getData6(result);
  if (opts.json) return printJson(data);
  const o = data?.[0];
  if (!o) {
    process.stdout.write("No data\n");
    return;
  }
  printKv({
    ordId: o["ordId"],
    instId: o["instId"],
    side: o["side"],
    ordType: o["ordType"],
    px: o["px"],
    sz: o["sz"],
    fillSz: o["fillSz"],
    avgPx: o["avgPx"],
    state: o["state"],
    cTime: new Date(Number(o["cTime"])).toLocaleString()
  });
}
async function cmdOptionPositions(run, opts) {
  const result = await run("option_get_positions", {
    instId: opts.instId,
    uly: opts.uly
  });
  const positions = getData6(result);
  if (opts.json) return printJson(positions);
  const open = (positions ?? []).filter((p) => Number(p["pos"]) !== 0);
  if (!open.length) {
    process.stdout.write("No open positions\n");
    return;
  }
  printTable(
    open.map((p) => ({
      instId: p["instId"],
      posSide: p["posSide"],
      pos: p["pos"],
      avgPx: p["avgPx"],
      upl: p["upl"],
      delta: p["deltaPA"],
      gamma: p["gammaPA"],
      theta: p["thetaPA"],
      vega: p["vegaPA"]
    }))
  );
}
async function cmdOptionFills(run, opts) {
  const result = await run("option_get_fills", {
    instId: opts.instId,
    ordId: opts.ordId,
    archive: opts.archive
  });
  const fills = getData6(result);
  if (opts.json) return printJson(fills);
  printTable(
    (fills ?? []).map((f) => ({
      instId: f["instId"],
      side: f["side"],
      fillPx: f["fillPx"],
      fillSz: f["fillSz"],
      fee: f["fee"],
      ts: new Date(Number(f["ts"])).toLocaleString()
    }))
  );
}
async function cmdOptionInstruments(run, opts) {
  const result = await run("option_get_instruments", {
    uly: opts.uly,
    expTime: opts.expTime
  });
  const instruments = getData6(result);
  if (opts.json) return printJson(instruments);
  printTable(
    (instruments ?? []).map((i) => ({
      instId: i["instId"],
      uly: i["uly"],
      expTime: i["expTime"],
      stk: i["stk"],
      optType: i["optType"],
      state: i["state"]
    }))
  );
}
async function cmdOptionGreeks(run, opts) {
  const result = await run("option_get_greeks", {
    uly: opts.uly,
    expTime: opts.expTime
  });
  const greeks = getData6(result);
  if (opts.json) return printJson(greeks);
  printTable(
    (greeks ?? []).map((g) => ({
      instId: g["instId"],
      delta: g["deltaBS"],
      gamma: g["gammaBS"],
      theta: g["thetaBS"],
      vega: g["vegaBS"],
      iv: g["markVol"],
      markPx: g["markPx"]
    }))
  );
}
async function cmdOptionPlace(run, opts) {
  const result = await run("option_place_order", {
    instId: opts.instId,
    tdMode: opts.tdMode,
    side: opts.side,
    ordType: opts.ordType,
    sz: opts.sz,
    px: opts.px,
    reduceOnly: opts.reduceOnly,
    clOrdId: opts.clOrdId
  });
  const data = getData6(result);
  if (opts.json) return printJson(data);
  const order = data?.[0];
  process.stdout.write(`Order placed: ${order?.["ordId"]} (${order?.["sCode"] === "0" ? "OK" : order?.["sMsg"]})
`);
}
async function cmdOptionCancel(run, opts) {
  const result = await run("option_cancel_order", {
    instId: opts.instId,
    ordId: opts.ordId,
    clOrdId: opts.clOrdId
  });
  const data = getData6(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Cancelled: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdOptionAmend(run, opts) {
  const result = await run("option_amend_order", {
    instId: opts.instId,
    ordId: opts.ordId,
    clOrdId: opts.clOrdId,
    newSz: opts.newSz,
    newPx: opts.newPx
  });
  const data = getData6(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Amended: ${r?.["ordId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`);
}
async function cmdOptionBatchCancel(run, opts) {
  let parsed;
  try {
    parsed = JSON.parse(opts.orders);
  } catch {
    process.stderr.write("Error: --orders must be a valid JSON array\n");
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    process.stderr.write("Error: --orders must be a non-empty JSON array\n");
    process.exitCode = 1;
    return;
  }
  const result = await run("option_batch_cancel", { orders: parsed });
  const data = getData6(result);
  if (opts.json) return printJson(data);
  for (const r of data ?? []) {
    process.stdout.write(`${r["ordId"]}: ${r["sCode"] === "0" ? "OK" : r["sMsg"]}
`);
  }
}

// src/config/toml.ts
function writeCliConfig(config) {
  writeFullConfig(config);
}

// src/commands/config.ts
import { createInterface } from "readline";
import { spawnSync } from "child_process";
var messages = {
  en: {
    title: "OKX Trade CLI \u2014 Configuration Wizard",
    selectSite: "Select site:",
    sitePrompt: "Site (1/2/3, default: 1): ",
    demoPrompt: "Use demo trading? (Y/n) ",
    hintDemo: "The page will redirect to demo trading API management",
    hintLive: "The page will redirect to live trading API management",
    createApiKey: (url) => `
Go to ${url} to create an API Key (trade permission required)
`,
    hint: (h) => `Tip: ${h}

`,
    profilePrompt: (name) => `Profile name (default: ${name}): `,
    profileExists: (name) => `Profile "${name}" already exists. Overwrite? (y/N) `,
    cancelled: "Cancelled.",
    emptyApiKey: "Error: API Key cannot be empty",
    emptySecretKey: "Error: Secret Key cannot be empty",
    emptyPassphrase: "Error: Passphrase cannot be empty",
    demoSelected: "Demo trading mode selected. Switch to live anytime via okx config set.",
    saved: (p) => `
Config saved to ${p}
`,
    defaultProfile: (name) => `Default profile set to: ${name}
`,
    usage: "Usage: okx account balance\n",
    writeFailed: (msg) => `Failed to write config: ${msg}
`,
    permissionDenied: (p) => `Permission denied. Check read/write access for ${p} and its parent directory.
`,
    manualWrite: (p) => `Please manually write the following to ${p}:

`
  },
  zh: {
    title: "OKX Trade CLI \u2014 \u914D\u7F6E\u5411\u5BFC",
    selectSite: "\u8BF7\u9009\u62E9\u7AD9\u70B9:",
    sitePrompt: "\u7AD9\u70B9 (1/2/3, \u9ED8\u8BA4: 1): ",
    demoPrompt: "\u4F7F\u7528\u6A21\u62DF\u76D8\uFF1F(Y/n) ",
    hintDemo: "\u9875\u9762\u4F1A\u81EA\u52A8\u8DF3\u8F6C\u5230\u6A21\u62DF\u76D8 API \u7BA1\u7406",
    hintLive: "\u9875\u9762\u4F1A\u81EA\u52A8\u8DF3\u8F6C\u5230\u5B9E\u76D8 API \u7BA1\u7406",
    createApiKey: (url) => `
\u8BF7\u524D\u5F80 ${url} \u521B\u5EFA API Key\uFF08\u9700\u8981 trade \u6743\u9650\uFF09
`,
    hint: (h) => `\u63D0\u793A\uFF1A${h}

`,
    profilePrompt: (name) => `Profile \u540D\u79F0 (\u9ED8\u8BA4: ${name}): `,
    profileExists: (name) => `Profile "${name}" \u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6\uFF1F(y/N) `,
    cancelled: "\u5DF2\u53D6\u6D88\u3002",
    emptyApiKey: "\u9519\u8BEF: API Key \u4E0D\u80FD\u4E3A\u7A7A",
    emptySecretKey: "\u9519\u8BEF: Secret Key \u4E0D\u80FD\u4E3A\u7A7A",
    emptyPassphrase: "\u9519\u8BEF: Passphrase \u4E0D\u80FD\u4E3A\u7A7A",
    demoSelected: "\u5DF2\u9009\u62E9\u6A21\u62DF\u76D8\u6A21\u5F0F\uFF0C\u53EF\u968F\u65F6\u901A\u8FC7 okx config set \u5207\u6362\u4E3A\u5B9E\u76D8\u3002",
    saved: (p) => `
\u914D\u7F6E\u5DF2\u4FDD\u5B58\u5230 ${p}
`,
    defaultProfile: (name) => `\u5DF2\u8BBE\u4E3A\u9ED8\u8BA4 profile: ${name}
`,
    usage: "\u4F7F\u7528\u65B9\u5F0F: okx account balance\n",
    writeFailed: (msg) => `\u5199\u5165\u914D\u7F6E\u6587\u4EF6\u5931\u8D25: ${msg}
`,
    permissionDenied: (p) => `\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u68C0\u67E5 ${p} \u53CA\u5176\u7236\u76EE\u5F55\u7684\u8BFB\u5199\u6743\u9650\u3002
`,
    manualWrite: (p) => `\u8BF7\u624B\u52A8\u5C06\u4EE5\u4E0B\u5185\u5BB9\u5199\u5165 ${p}:

`
  }
};
function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}
function cmdConfigShow(json) {
  const config = readFullConfig();
  if (json) return printJson(config);
  process.stdout.write(`Config: ${configFilePath()}

`);
  process.stdout.write(`default_profile: ${config.default_profile ?? "(not set)"}

`);
  for (const [name, profile] of Object.entries(config.profiles)) {
    process.stdout.write(`[${name}]
`);
    printKv({
      api_key: profile.api_key ? maskSecret(profile.api_key) : "(not set)",
      demo: profile.demo ?? false,
      base_url: profile.base_url ?? "(default)"
    }, 2);
    process.stdout.write("\n");
  }
}
function cmdConfigSet(key, value) {
  const config = readFullConfig();
  if (key === "default_profile") {
    config.default_profile = value;
    writeCliConfig(config);
    process.stdout.write(`default_profile set to "${value}"
`);
  } else {
    process.stderr.write(`Unknown config key: ${key}
`);
    process.exitCode = 1;
  }
}
function parseSiteKey(raw) {
  const lower = raw.toLowerCase();
  if (lower === "eea" || raw === "2") return "eea";
  if (lower === "us" || raw === "3") return "us";
  if (lower === "global" || raw === "1") return "global";
  return "global";
}
function inferSiteFromBaseUrl(baseUrl) {
  if (!baseUrl) return "global";
  for (const id of SITE_IDS) {
    const site = OKX_SITES[id];
    if (baseUrl === site.apiBaseUrl || baseUrl === site.webUrl) return id;
  }
  return "global";
}
function maskSecret(value) {
  if (!value || value.length < 4) return "****";
  return "***" + value.slice(-4);
}
function buildApiUrl(siteKey, demo) {
  const query = demo ? "?go-demo-trading=1" : "?go-live-trading=1";
  return `${OKX_SITES[siteKey].webUrl}/account/my-api${query}`;
}
function buildProfileEntry(siteKey, apiKey, secretKey, passphrase, demo) {
  const entry = { api_key: apiKey, secret_key: secretKey, passphrase, demo };
  if (siteKey !== "global") {
    entry.base_url = OKX_SITES[siteKey].webUrl;
  }
  return entry;
}
async function cmdConfigInit(lang = "en") {
  const t = messages[lang];
  process.stdout.write(`${t.title}

`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write(`${t.selectSite}
`);
    process.stdout.write("  1) Global (www.okx.com)  [default]\n");
    process.stdout.write("  2) EEA   (my.okx.com)\n");
    process.stdout.write("  3) US    (app.okx.com)\n");
    const siteRaw = (await prompt(rl, t.sitePrompt)).trim();
    const siteKey = parseSiteKey(siteRaw);
    const demoRaw = (await prompt(rl, t.demoPrompt)).trim().toLowerCase();
    const demo = demoRaw !== "n";
    const apiUrl = buildApiUrl(siteKey, demo);
    const hintText = demo ? t.hintDemo : t.hintLive;
    process.stdout.write(t.createApiKey(apiUrl));
    process.stdout.write(t.hint(hintText));
    try {
      const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      spawnSync(opener, [apiUrl], { stdio: "ignore", shell: process.platform === "win32" });
    } catch {
    }
    const defaultProfileName = demo ? "okx-demo" : "okx-prod";
    const profileNameRaw = await prompt(rl, t.profilePrompt(defaultProfileName));
    const profileName = profileNameRaw.trim() || defaultProfileName;
    const config = readFullConfig();
    if (config.profiles[profileName]) {
      const overwrite = (await prompt(rl, t.profileExists(profileName))).trim().toLowerCase();
      if (overwrite !== "y") {
        process.stdout.write(`${t.cancelled}
`);
        return;
      }
    }
    const apiKey = (await prompt(rl, "API Key: ")).trim();
    if (!apiKey) {
      process.stderr.write(`${t.emptyApiKey}
`);
      process.exitCode = 1;
      return;
    }
    const secretKey = (await prompt(rl, "Secret Key: ")).trim();
    if (!secretKey) {
      process.stderr.write(`${t.emptySecretKey}
`);
      process.exitCode = 1;
      return;
    }
    const passphrase = (await prompt(rl, "Passphrase: ")).trim();
    if (!passphrase) {
      process.stderr.write(`${t.emptyPassphrase}
`);
      process.exitCode = 1;
      return;
    }
    if (demo) {
      process.stdout.write(`${t.demoSelected}
`);
    }
    const profileEntry = buildProfileEntry(siteKey, apiKey, secretKey, passphrase, demo);
    config.profiles[profileName] = profileEntry;
    if (!config.default_profile || config.default_profile !== profileName) {
      config.default_profile = profileName;
    }
    const configPath = configFilePath();
    try {
      writeCliConfig(config);
      process.stdout.write(t.saved(configPath));
      process.stdout.write(t.defaultProfile(profileName));
      process.stdout.write(t.usage);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isPermission = err instanceof Error && "code" in err && (err.code === "EACCES" || err.code === "EPERM");
      process.stderr.write(t.writeFailed(message));
      if (isPermission) {
        process.stderr.write(t.permissionDenied(configPath));
      }
      process.stderr.write(t.manualWrite(configPath));
      process.stdout.write(stringify(config) + "\n");
      process.exitCode = 1;
    }
  } finally {
    rl.close();
  }
}
function cmdConfigAddProfile(kvPairs, force) {
  const params = {};
  for (const pair of kvPairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1);
    params[key.toUpperCase()] = value;
  }
  const ak = params["AK"];
  const sk = params["SK"];
  const pp = params["PP"];
  const missing = [];
  if (!ak) missing.push("AK");
  if (!sk) missing.push("SK");
  if (!pp) missing.push("PP");
  if (missing.length > 0) {
    process.stderr.write(`Error: missing required parameter(s): ${missing.join(", ")}
`);
    process.stderr.write("Usage: okx config add-profile AK=<key> SK=<secret> PP=<passphrase> [site=global|eea|us] [demo=true|false] [name=<name>] [--force]\n");
    process.exitCode = 1;
    return;
  }
  const siteKey = parseSiteKey(params["SITE"] ?? "");
  const demo = params["DEMO"] !== void 0 ? params["DEMO"].toLowerCase() !== "false" : true;
  const defaultName = demo ? "demo" : "live";
  const profileName = params["NAME"] ?? defaultName;
  const config = readFullConfig();
  if (config.profiles[profileName] && !force) {
    process.stderr.write(`Error: profile "${profileName}" already exists. Use --force to overwrite.
`);
    process.exitCode = 1;
    return;
  }
  const entry = buildProfileEntry(siteKey, ak, sk, pp, demo);
  entry.site = siteKey;
  config.profiles[profileName] = entry;
  config.default_profile = profileName;
  writeCliConfig(config);
  process.stdout.write(`Profile "${profileName}" saved to ${configFilePath()}
`);
  process.stdout.write(`Default profile set to: ${profileName}
`);
}
function cmdConfigListProfile() {
  const config = readFullConfig();
  const entries = Object.entries(config.profiles);
  if (entries.length === 0) {
    process.stdout.write("No profiles found. Run: okx config add-profile AK=<key> SK=<secret> PP=<passphrase>\n");
    return;
  }
  process.stdout.write(`Config: ${configFilePath()}

`);
  for (const [name, profile] of entries) {
    const isDefault = name === config.default_profile;
    const marker = isDefault ? " *" : "";
    const site = profile.site ?? inferSiteFromBaseUrl(profile.base_url);
    const mode = profile.demo !== false ? "demo (\u6A21\u62DF\u76D8)" : "live (\u5B9E\u76D8)";
    process.stdout.write(`[${name}]${marker}
`);
    process.stdout.write(`  api_key:    ${maskSecret(profile.api_key)}
`);
    process.stdout.write(`  secret_key: ${maskSecret(profile.secret_key)}
`);
    process.stdout.write(`  passphrase: ${maskSecret(profile.passphrase)}
`);
    process.stdout.write(`  site:       ${site}
`);
    process.stdout.write(`  mode:       ${mode}
`);
    process.stdout.write("\n");
  }
}
function cmdConfigUse(profileName) {
  if (!profileName) {
    process.stderr.write("Error: profile name is required.\nUsage: okx config use <profile-name>\n");
    process.exitCode = 1;
    return;
  }
  const config = readFullConfig();
  const available = Object.keys(config.profiles);
  if (!config.profiles[profileName]) {
    process.stderr.write(`Error: profile "${profileName}" does not exist.
`);
    if (available.length > 0) {
      process.stderr.write(`Available profiles: ${available.join(", ")}
`);
    } else {
      process.stderr.write("No profiles configured. Run: okx config add-profile AK=<key> SK=<secret> PP=<passphrase>\n");
    }
    process.exitCode = 1;
    return;
  }
  config.default_profile = profileName;
  writeCliConfig(config);
  process.stdout.write(`Default profile set to: "${profileName}"
`);
}

// src/commands/earn.ts
function getData7(result) {
  return result.data;
}
async function cmdEarnSavingsBalance(run, ccy, json) {
  const result = await run("earn_get_savings_balance", { ccy });
  const data = getData7(result);
  if (json) return printJson(data);
  if (!data?.length) {
    process.stdout.write("No savings balance\n");
    return;
  }
  printTable(
    data.map((r) => ({
      ccy: r["ccy"],
      amt: r["amt"],
      earnings: r["earnings"],
      rate: r["rate"],
      loanAmt: r["loanAmt"],
      pendingAmt: r["pendingAmt"]
    }))
  );
}
async function cmdEarnSavingsPurchase(run, opts) {
  const result = await run("earn_savings_purchase", {
    ccy: opts.ccy,
    amt: opts.amt,
    rate: opts.rate
  });
  const data = getData7(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  if (!r) {
    process.stdout.write("No response data\n");
    return;
  }
  printKv({
    ccy: r["ccy"],
    amt: r["amt"],
    side: r["side"],
    rate: r["rate"]
  });
}
async function cmdEarnSavingsRedeem(run, opts) {
  const result = await run("earn_savings_redeem", {
    ccy: opts.ccy,
    amt: opts.amt
  });
  const data = getData7(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  if (!r) {
    process.stdout.write("No response data\n");
    return;
  }
  printKv({
    ccy: r["ccy"],
    amt: r["amt"],
    side: r["side"]
  });
}
async function cmdEarnSetLendingRate(run, opts) {
  const result = await run("earn_set_lending_rate", {
    ccy: opts.ccy,
    rate: opts.rate
  });
  const data = getData7(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(`Lending rate set: ${r?.["ccy"]} \u2192 ${r?.["rate"]}
`);
}
async function cmdEarnLendingHistory(run, opts) {
  const result = await run("earn_get_lending_history", {
    ccy: opts.ccy,
    limit: opts.limit
  });
  const data = getData7(result);
  if (opts.json) return printJson(data);
  if (!data?.length) {
    process.stdout.write("No lending history\n");
    return;
  }
  printTable(
    data.map((r) => ({
      ccy: r["ccy"],
      amt: r["amt"],
      earnings: r["earnings"],
      rate: r["rate"],
      ts: new Date(Number(r["ts"])).toLocaleString()
    }))
  );
}
async function cmdEarnLendingRateSummary(run, ccy, json) {
  const result = await run("earn_get_lending_rate_summary", { ccy });
  const data = getData7(result);
  if (json) return printJson(data);
  if (!data?.length) {
    process.stdout.write("No rate summary data\n");
    return;
  }
  printTable(
    data.map((r) => ({
      ccy: r["ccy"],
      avgRate: r["avgRate"],
      estRate: r["estRate"],
      avgAmt: r["avgAmt"]
    }))
  );
}
async function cmdEarnLendingRateHistory(run, opts) {
  const result = await run("earn_get_lending_rate_history", {
    ccy: opts.ccy,
    limit: opts.limit
  });
  const data = getData7(result);
  if (opts.json) return printJson(data);
  if (!data?.length) {
    process.stdout.write("No rate history data\n");
    return;
  }
  printTable(
    data.map((r) => ({
      ccy: r["ccy"],
      lendingRate: r["lendingRate"],
      minRate: r["rate"],
      ts: new Date(Number(r["ts"])).toLocaleString()
    }))
  );
}

// src/commands/bot.ts
function getData8(result) {
  return result.data;
}
async function cmdGridOrders(run, opts) {
  const result = await run("grid_get_orders", {
    algoOrdType: opts.algoOrdType,
    instId: opts.instId,
    algoId: opts.algoId,
    status: opts.status
  });
  const orders = getData8(result) ?? [];
  if (opts.json) return printJson(orders);
  if (!orders.length) {
    process.stdout.write("No grid bots\n");
    return;
  }
  printTable(
    orders.map((o) => ({
      algoId: o["algoId"],
      instId: o["instId"],
      type: o["algoOrdType"],
      state: o["state"],
      pnl: o["pnlRatio"],
      gridNum: o["gridNum"],
      maxPx: o["maxPx"],
      minPx: o["minPx"],
      createdAt: new Date(Number(o["cTime"])).toLocaleString()
    }))
  );
}
async function cmdGridDetails(run, opts) {
  const result = await run("grid_get_order_details", {
    algoOrdType: opts.algoOrdType,
    algoId: opts.algoId
  });
  const detail = (getData8(result) ?? [])[0];
  if (!detail) {
    process.stdout.write("Bot not found\n");
    return;
  }
  if (opts.json) return printJson(detail);
  printKv({
    algoId: detail["algoId"],
    instId: detail["instId"],
    type: detail["algoOrdType"],
    state: detail["state"],
    maxPx: detail["maxPx"],
    minPx: detail["minPx"],
    gridNum: detail["gridNum"],
    runType: detail["runType"] === "1" ? "arithmetic" : "geometric",
    pnl: detail["pnl"],
    pnlRatio: detail["pnlRatio"],
    investAmt: detail["investAmt"],
    totalAnnRate: detail["totalAnnRate"],
    createdAt: new Date(Number(detail["cTime"])).toLocaleString()
  });
}
async function cmdGridSubOrders(run, opts) {
  const result = await run("grid_get_sub_orders", {
    algoOrdType: opts.algoOrdType,
    algoId: opts.algoId,
    type: opts.type
  });
  const orders = getData8(result) ?? [];
  if (opts.json) return printJson(orders);
  if (!orders.length) {
    process.stdout.write("No sub-orders\n");
    return;
  }
  printTable(
    orders.map((o) => ({
      ordId: o["ordId"],
      side: o["side"],
      px: o["px"],
      sz: o["sz"],
      fillPx: o["fillPx"],
      fillSz: o["fillSz"],
      state: o["state"],
      fee: o["fee"]
    }))
  );
}
async function cmdGridCreate(run, opts) {
  const result = await run("grid_create_order", {
    instId: opts.instId,
    algoOrdType: opts.algoOrdType,
    maxPx: opts.maxPx,
    minPx: opts.minPx,
    gridNum: opts.gridNum,
    runType: opts.runType,
    quoteSz: opts.quoteSz,
    baseSz: opts.baseSz,
    direction: opts.direction,
    lever: opts.lever,
    sz: opts.sz,
    basePos: opts.basePos
  });
  const data = getData8(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Grid bot created: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdGridStop(run, opts) {
  const result = await run("grid_stop_order", {
    algoId: opts.algoId,
    algoOrdType: opts.algoOrdType,
    instId: opts.instId,
    stopType: opts.stopType
  });
  const data = getData8(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `Grid bot stopped: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdDcaCreate(run, opts) {
  const result = await run("dca_create_order", {
    type: opts.type,
    instId: opts.instId,
    initOrdAmt: opts.initOrdAmt,
    safetyOrdAmt: opts.safetyOrdAmt,
    maxSafetyOrds: opts.maxSafetyOrds,
    pxSteps: opts.pxSteps,
    pxStepsMult: opts.pxStepsMult,
    volMult: opts.volMult,
    tpPct: opts.tpPct,
    slPct: opts.slPct,
    reserveFunds: opts.reserveFunds,
    triggerType: opts.triggerType,
    direction: opts.direction,
    lever: opts.lever,
    side: opts.side
  });
  const data = getData8(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `DCA bot created: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdDcaStop(run, opts) {
  const result = await run("dca_stop_order", {
    type: opts.type,
    algoId: opts.algoId,
    instId: opts.instId,
    stopType: opts.stopType
  });
  const data = getData8(result);
  if (opts.json) return printJson(data);
  const r = data?.[0];
  process.stdout.write(
    `DCA bot stopped: ${r?.["algoId"]} (${r?.["sCode"] === "0" ? "OK" : r?.["sMsg"]})
`
  );
}
async function cmdDcaOrders(run, opts) {
  const result = await run("dca_get_orders", {
    type: opts.type,
    status: opts.history ? "history" : "active"
  });
  const orders = getData8(result) ?? [];
  if (opts.json) return printJson(orders);
  if (!orders.length) {
    process.stdout.write("No DCA bots\n");
    return;
  }
  printTable(
    orders.map((o) => ({
      algoId: o["algoId"],
      instId: o["instId"],
      state: o["state"],
      pnl: o["pnl"],
      pnlRatio: o["pnlRatio"],
      createdAt: new Date(Number(o["cTime"])).toLocaleString()
    }))
  );
}
async function cmdDcaDetails(run, opts) {
  const result = await run("dca_get_order_details", {
    type: opts.type,
    algoId: opts.algoId
  });
  const detail = (getData8(result) ?? [])[0];
  if (!detail) {
    process.stdout.write("DCA bot not found\n");
    return;
  }
  if (opts.json) return printJson(detail);
  if (opts.type === "contract") {
    printKv({
      algoId: detail["algoId"],
      instId: detail["instId"],
      sz: detail["sz"],
      avgPx: detail["avgPx"],
      initPx: detail["initPx"],
      tpPx: detail["tpPx"],
      slPx: detail["slPx"] || "-",
      upl: detail["upl"],
      fee: detail["fee"],
      fundingFee: detail["fundingFee"],
      curCycleId: detail["curCycleId"],
      fillSafetyOrds: detail["fillSafetyOrds"],
      createdAt: new Date(Number(detail["startTime"])).toLocaleString()
    });
  } else {
    printKv({
      algoId: detail["algoId"],
      instId: detail["instId"],
      state: detail["state"],
      initOrdAmt: detail["initOrdAmt"],
      safetyOrdAmt: detail["safetyOrdAmt"],
      maxSafetyOrds: detail["maxSafetyOrds"],
      tpPct: detail["tpPct"],
      slPct: detail["slPct"],
      pnl: detail["pnl"],
      pnlRatio: detail["pnlRatio"],
      createdAt: new Date(Number(detail["cTime"])).toLocaleString()
    });
  }
}
async function cmdDcaSubOrders(run, opts) {
  const result = await run("dca_get_sub_orders", {
    type: opts.type,
    algoId: opts.algoId,
    subOrdType: opts.type === "contract" ? void 0 : opts.live ? "live" : "filled",
    cycleId: opts.type === "contract" ? opts.cycleId : void 0
  });
  const orders = getData8(result) ?? [];
  if (opts.json) return printJson(orders);
  if (!orders.length) {
    process.stdout.write("No sub-orders\n");
    return;
  }
  if (opts.type === "contract") {
    printTable(
      orders.map((o) => ({
        cycleId: o["cycleId"],
        status: o["cycleStatus"],
        current: o["currentCycle"] ? "yes" : "",
        avgPx: o["avgPx"],
        tpPx: o["tpPx"],
        realizedPnl: o["realizedPnl"],
        fee: o["fee"],
        startTime: o["startTime"] ? new Date(Number(o["startTime"])).toLocaleString() : ""
      }))
    );
  } else {
    printTable(
      orders.map((o) => ({
        ordId: o["ordId"],
        side: o["side"],
        px: o["px"],
        sz: o["sz"],
        fillPx: o["fillPx"],
        fillSz: o["fillSz"],
        state: o["state"],
        fee: o["fee"]
      }))
    );
  }
}

// src/index.ts
var _require = createRequire(import.meta.url);
var CLI_VERSION = _require("../package.json").version;
var GIT_HASH = true ? "668c530" : "dev";
function handleConfigCommand(action, rest, json, lang, force) {
  if (action === "init")
    return cmdConfigInit(lang === "zh" ? "zh" : "en");
  if (action === "show") return cmdConfigShow(json);
  if (action === "set") return cmdConfigSet(rest[0], rest[1]);
  if (action === "setup-clients") return cmdSetupClients();
  if (action === "add-profile")
    return cmdConfigAddProfile(rest, force ?? false);
  if (action === "list-profile") return cmdConfigListProfile();
  if (action === "use") return cmdConfigUse(rest[0]);
  process.stderr.write(`Unknown config command: ${action}
`);
  process.exitCode = 1;
}
function handleSetupCommand(v) {
  if (!v.client) {
    printSetupUsage();
    return;
  }
  if (!SUPPORTED_CLIENTS.includes(v.client)) {
    process.stderr.write(
      `Unknown client: "${v.client}"
Supported: ${SUPPORTED_CLIENTS.join(", ")}
`
    );
    process.exitCode = 1;
    return;
  }
  cmdSetupClient({
    client: v.client,
    profile: v.profile,
    modules: v.modules
  });
}
function handleMarketPublicCommand(run, action, rest, v, json) {
  if (action === "ticker") return cmdMarketTicker(run, rest[0], json);
  if (action === "tickers") return cmdMarketTickers(run, rest[0], json);
  if (action === "instruments")
    return cmdMarketInstruments(run, {
      instType: v.instType,
      instId: v.instId,
      json
    });
  if (action === "mark-price")
    return cmdMarketMarkPrice(run, {
      instType: v.instType,
      instId: v.instId,
      json
    });
  if (action === "index-ticker")
    return cmdMarketIndexTicker(run, {
      instId: v.instId,
      quoteCcy: v.quoteCcy,
      json
    });
  if (action === "price-limit") return cmdMarketPriceLimit(run, rest[0], json);
  if (action === "open-interest")
    return cmdMarketOpenInterest(run, {
      instType: v.instType,
      instId: v.instId,
      json
    });
}
function handleMarketDataCommand(run, action, rest, v, json) {
  const limit = v.limit !== void 0 ? Number(v.limit) : void 0;
  if (action === "orderbook")
    return cmdMarketOrderbook(
      run,
      rest[0],
      v.sz !== void 0 ? Number(v.sz) : void 0,
      json
    );
  if (action === "candles")
    return cmdMarketCandles(run, rest[0], { bar: v.bar, limit, json });
  if (action === "funding-rate")
    return cmdMarketFundingRate(run, rest[0], {
      history: v.history ?? false,
      limit,
      json
    });
  if (action === "trades")
    return cmdMarketTrades(run, rest[0], { limit, json });
  if (action === "index-candles")
    return cmdMarketIndexCandles(run, rest[0], {
      bar: v.bar,
      limit,
      history: v.history ?? false,
      json
    });
}
function handleMarketCommand(run, action, rest, v, json) {
  return handleMarketPublicCommand(run, action, rest, v, json) ?? handleMarketDataCommand(run, action, rest, v, json);
}
function handleAccountWriteCommand(run, action, v, json) {
  if (action === "set-position-mode")
    return cmdAccountSetPositionMode(run, v.posMode, json);
  if (action === "max-size")
    return cmdAccountMaxSize(run, {
      instId: v.instId,
      tdMode: v.tdMode,
      px: v.px,
      json
    });
  if (action === "max-avail-size")
    return cmdAccountMaxAvailSize(run, {
      instId: v.instId,
      tdMode: v.tdMode,
      json
    });
  if (action === "max-withdrawal")
    return cmdAccountMaxWithdrawal(run, v.ccy, json);
  if (action === "transfer")
    return cmdAccountTransfer(run, {
      ccy: v.ccy,
      amt: v.amt,
      from: v.from,
      to: v.to,
      transferType: v.transferType,
      subAcct: v.subAcct,
      json
    });
}
function handleAccountCommand(run, action, rest, v, json) {
  if (action === "audit")
    return cmdAccountAudit({
      limit: v.limit,
      tool: v.tool,
      since: v.since,
      json
    });
  const limit = v.limit !== void 0 ? Number(v.limit) : void 0;
  if (action === "balance") return cmdAccountBalance(run, rest[0], json);
  if (action === "asset-balance")
    return cmdAccountAssetBalance(run, v.ccy, json);
  if (action === "positions")
    return cmdAccountPositions(run, {
      instType: v.instType,
      instId: v.instId,
      json
    });
  if (action === "positions-history")
    return cmdAccountPositionsHistory(run, {
      instType: v.instType,
      instId: v.instId,
      limit,
      json
    });
  if (action === "bills")
    return cmdAccountBills(run, {
      archive: v.archive ?? false,
      instType: v.instType,
      ccy: v.ccy,
      limit,
      json
    });
  if (action === "fees")
    return cmdAccountFees(run, {
      instType: v.instType,
      instId: v.instId,
      json
    });
  if (action === "config") return cmdAccountConfig(run, json);
  return handleAccountWriteCommand(run, action, v, json);
}
function handleSpotAlgoCommand(run, subAction, v, json) {
  if (subAction === "place")
    return cmdSpotAlgoPlace(run, {
      instId: v.instId,
      tdMode: v.tdMode,
      side: v.side,
      ordType: v.ordType ?? "conditional",
      sz: v.sz,
      tpTriggerPx: v.tpTriggerPx,
      tpOrdPx: v.tpOrdPx,
      slTriggerPx: v.slTriggerPx,
      slOrdPx: v.slOrdPx,
      json
    });
  if (subAction === "amend")
    return cmdSpotAlgoAmend(run, {
      instId: v.instId,
      algoId: v.algoId,
      newSz: v.newSz,
      newTpTriggerPx: v.newTpTriggerPx,
      newTpOrdPx: v.newTpOrdPx,
      newSlTriggerPx: v.newSlTriggerPx,
      newSlOrdPx: v.newSlOrdPx,
      json
    });
  if (subAction === "cancel")
    return cmdSpotAlgoCancel(run, v.instId, v.algoId, json);
  if (subAction === "orders")
    return cmdSpotAlgoOrders(run, {
      instId: v.instId,
      status: v.history ? "history" : "pending",
      ordType: v.ordType,
      json
    });
}
function handleSpotCommand(run, action, rest, v, json) {
  if (action === "orders")
    return cmdSpotOrders(run, {
      instId: v.instId,
      status: v.history ? "history" : "open",
      json
    });
  if (action === "get")
    return cmdSpotGet(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      json
    });
  if (action === "fills")
    return cmdSpotFills(run, { instId: v.instId, ordId: v.ordId, json });
  if (action === "amend")
    return cmdSpotAmend(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      newSz: v.newSz,
      newPx: v.newPx,
      json
    });
  if (action === "place")
    return cmdSpotPlace(run, {
      instId: v.instId,
      tdMode: v.tdMode,
      side: v.side,
      ordType: v.ordType,
      sz: v.sz,
      px: v.px,
      json
    });
  if (action === "cancel") return cmdSpotCancel(run, rest[0], v.ordId, json);
  if (action === "algo") return handleSpotAlgoCommand(run, rest[0], v, json);
  if (action === "batch")
    return cmdSpotBatch(run, { action: v.action, orders: v.orders, json });
}
function handleSwapAlgoCommand(run, subAction, v, json) {
  if (subAction === "trail")
    return cmdSwapAlgoTrailPlace(run, {
      instId: v.instId,
      side: v.side,
      sz: v.sz,
      callbackRatio: v.callbackRatio,
      callbackSpread: v.callbackSpread,
      activePx: v.activePx,
      posSide: v.posSide,
      tdMode: v.tdMode ?? "cross",
      reduceOnly: v.reduceOnly,
      json
    });
  if (subAction === "place")
    return cmdSwapAlgoPlace(run, {
      instId: v.instId,
      side: v.side,
      ordType: v.ordType ?? "conditional",
      sz: v.sz,
      posSide: v.posSide,
      tdMode: v.tdMode ?? "cross",
      tpTriggerPx: v.tpTriggerPx,
      tpOrdPx: v.tpOrdPx,
      slTriggerPx: v.slTriggerPx,
      slOrdPx: v.slOrdPx,
      reduceOnly: v.reduceOnly,
      json
    });
  if (subAction === "amend")
    return cmdSwapAlgoAmend(run, {
      instId: v.instId,
      algoId: v.algoId,
      newSz: v.newSz,
      newTpTriggerPx: v.newTpTriggerPx,
      newTpOrdPx: v.newTpOrdPx,
      newSlTriggerPx: v.newSlTriggerPx,
      newSlOrdPx: v.newSlOrdPx,
      json
    });
  if (subAction === "cancel")
    return cmdSwapAlgoCancel(run, v.instId, v.algoId, json);
  if (subAction === "orders")
    return cmdSwapAlgoOrders(run, {
      instId: v.instId,
      status: v.history ? "history" : "pending",
      ordType: v.ordType,
      json
    });
}
function handleSwapCommand(run, action, rest, v, json) {
  if (action === "positions")
    return cmdSwapPositions(run, rest[0] ?? v.instId, json);
  if (action === "orders")
    return cmdSwapOrders(run, {
      instId: v.instId,
      status: v.history ? "history" : "open",
      json
    });
  if (action === "get")
    return cmdSwapGet(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      json
    });
  if (action === "fills")
    return cmdSwapFills(run, {
      instId: v.instId,
      ordId: v.ordId,
      archive: v.archive ?? false,
      json
    });
  if (action === "close")
    return cmdSwapClose(run, {
      instId: v.instId,
      mgnMode: v.mgnMode,
      posSide: v.posSide,
      autoCxl: v.autoCxl,
      json
    });
  if (action === "get-leverage")
    return cmdSwapGetLeverage(run, {
      instId: v.instId,
      mgnMode: v.mgnMode,
      json
    });
  if (action === "place")
    return cmdSwapPlace(run, {
      instId: v.instId,
      side: v.side,
      ordType: v.ordType,
      sz: v.sz,
      posSide: v.posSide,
      px: v.px,
      tdMode: v.tdMode ?? "cross",
      json
    });
  if (action === "cancel") return cmdSwapCancel(run, rest[0], v.ordId, json);
  if (action === "amend")
    return cmdSwapAmend(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      newSz: v.newSz,
      newPx: v.newPx,
      json
    });
  if (action === "leverage")
    return cmdSwapSetLeverage(run, {
      instId: v.instId,
      lever: v.lever,
      mgnMode: v.mgnMode,
      posSide: v.posSide,
      json
    });
  if (action === "algo") return handleSwapAlgoCommand(run, rest[0], v, json);
  if (action === "batch")
    return cmdSwapBatch(run, { action: v.action, orders: v.orders, json });
}
function handleOptionCommand(run, action, _rest, v, json) {
  if (action === "orders") {
    let status = "live";
    if (v.archive) status = "archive";
    else if (v.history) status = "history";
    return cmdOptionOrders(run, { instId: v.instId, uly: v.uly, status, json });
  }
  if (action === "get")
    return cmdOptionGet(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      json
    });
  if (action === "positions")
    return cmdOptionPositions(run, { instId: v.instId, uly: v.uly, json });
  if (action === "fills")
    return cmdOptionFills(run, {
      instId: v.instId,
      ordId: v.ordId,
      archive: v.archive ?? false,
      json
    });
  if (action === "instruments")
    return cmdOptionInstruments(run, { uly: v.uly, expTime: v.expTime, json });
  if (action === "greeks")
    return cmdOptionGreeks(run, { uly: v.uly, expTime: v.expTime, json });
  if (action === "place")
    return cmdOptionPlace(run, {
      instId: v.instId,
      tdMode: v.tdMode,
      side: v.side,
      ordType: v.ordType,
      sz: v.sz,
      px: v.px,
      reduceOnly: v.reduceOnly,
      clOrdId: v.clOrdId,
      json
    });
  if (action === "cancel")
    return cmdOptionCancel(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      json
    });
  if (action === "amend")
    return cmdOptionAmend(run, {
      instId: v.instId,
      ordId: v.ordId,
      clOrdId: v.clOrdId,
      newSz: v.newSz,
      newPx: v.newPx,
      json
    });
  if (action === "batch-cancel")
    return cmdOptionBatchCancel(run, { orders: v.orders, json });
}
function handleFuturesCommand(run, action, rest, v, json) {
  if (action === "orders") {
    let status = "open";
    if (v.archive) status = "archive";
    else if (v.history) status = "history";
    return cmdFuturesOrders(run, { instId: v.instId, status, json });
  }
  if (action === "positions") return cmdFuturesPositions(run, v.instId, json);
  if (action === "fills")
    return cmdFuturesFills(run, {
      instId: v.instId,
      ordId: v.ordId,
      archive: v.archive ?? false,
      json
    });
  if (action === "place")
    return cmdFuturesPlace(run, {
      instId: v.instId,
      side: v.side,
      ordType: v.ordType,
      sz: v.sz,
      tdMode: v.tdMode ?? "cross",
      posSide: v.posSide,
      px: v.px,
      reduceOnly: v.reduceOnly,
      json
    });
  if (action === "cancel")
    return cmdFuturesCancel(run, rest[0] ?? v.instId, v.ordId, json);
  if (action === "get")
    return cmdFuturesGet(run, {
      instId: rest[0] ?? v.instId,
      ordId: v.ordId,
      json
    });
}
function handleBotGridCommand(run, v, rest, json) {
  const subAction = rest[0];
  if (subAction === "orders")
    return cmdGridOrders(run, {
      algoOrdType: v.algoOrdType,
      instId: v.instId,
      algoId: v.algoId,
      status: v.history ? "history" : "active",
      json
    });
  if (subAction === "details")
    return cmdGridDetails(run, {
      algoOrdType: v.algoOrdType,
      algoId: v.algoId,
      json
    });
  if (subAction === "sub-orders")
    return cmdGridSubOrders(run, {
      algoOrdType: v.algoOrdType,
      algoId: v.algoId,
      type: v.live ? "live" : "filled",
      json
    });
  if (subAction === "create")
    return cmdGridCreate(run, {
      instId: v.instId,
      algoOrdType: v.algoOrdType,
      maxPx: v.maxPx,
      minPx: v.minPx,
      gridNum: v.gridNum,
      runType: v.runType,
      quoteSz: v.quoteSz,
      baseSz: v.baseSz,
      direction: v.direction,
      lever: v.lever,
      sz: v.sz,
      basePos: v.basePos,
      json
    });
  if (subAction === "stop")
    return cmdGridStop(run, {
      algoId: v.algoId,
      algoOrdType: v.algoOrdType,
      instId: v.instId,
      stopType: v.stopType,
      json
    });
}
function handleBotDcaCommand(run, subAction, v, json) {
  const type = v.type ?? "spot";
  if (subAction === "orders")
    return cmdDcaOrders(run, { type, history: v.history ?? false, json });
  if (subAction === "details")
    return cmdDcaDetails(run, { type, algoId: v.algoId, json });
  if (subAction === "sub-orders")
    return cmdDcaSubOrders(run, {
      type,
      algoId: v.algoId,
      live: v.live ?? false,
      cycleId: v.cycleId,
      json
    });
  if (subAction === "create")
    return cmdDcaCreate(run, {
      type,
      instId: v.instId,
      initOrdAmt: v.initOrdAmt,
      safetyOrdAmt: v.safetyOrdAmt,
      maxSafetyOrds: v.maxSafetyOrds,
      pxSteps: v.pxSteps,
      pxStepsMult: v.pxStepsMult,
      volMult: v.volMult,
      tpPct: v.tpPct,
      slPct: v.slPct,
      reserveFunds: v.reserveFunds,
      triggerType: v.triggerType,
      direction: v.direction,
      lever: v.lever,
      side: v.side,
      json
    });
  if (subAction === "stop")
    return cmdDcaStop(run, {
      type,
      algoId: v.algoId,
      instId: v.instId,
      stopType: v.stopType,
      json
    });
}
function handleBotCommand(run, action, rest, v, json) {
  if (action === "grid") return handleBotGridCommand(run, v, rest, json);
  if (action === "dca") return handleBotDcaCommand(run, rest[0], v, json);
}
function handleEarnCommand(run, action, rest, v, json) {
  const limit = v.limit !== void 0 ? Number(v.limit) : void 0;
  if (action === "balance")
    return cmdEarnSavingsBalance(run, rest[0] ?? v.ccy, json);
  if (action === "purchase")
    return cmdEarnSavingsPurchase(run, {
      ccy: v.ccy,
      amt: v.amt,
      rate: v.rate,
      json
    });
  if (action === "redeem")
    return cmdEarnSavingsRedeem(run, { ccy: v.ccy, amt: v.amt, json });
  if (action === "set-rate")
    return cmdEarnSetLendingRate(run, { ccy: v.ccy, rate: v.rate, json });
  if (action === "lending-history")
    return cmdEarnLendingHistory(run, { ccy: v.ccy, limit, json });
  if (action === "rate-summary")
    return cmdEarnLendingRateSummary(run, rest[0] ?? v.ccy, json);
  if (action === "rate-history")
    return cmdEarnLendingRateHistory(run, { ccy: v.ccy, limit, json });
  process.stderr.write(`Unknown earn command: ${action}
`);
  process.exitCode = 1;
}
async function main() {
  checkForUpdates("@okx_ai/okx-trade-cli", CLI_VERSION);
  const { values, positionals } = parseCli(process.argv.slice(2));
  if (values.version) {
    process.stdout.write(`${CLI_VERSION} (${GIT_HASH})
`);
    return;
  }
  if (values.help || positionals.length === 0) {
    const [module2, subgroup] = positionals;
    if (!module2) {
      printHelp();
    } else if (!subgroup) {
      printHelp(module2);
    } else {
      printHelp(module2, subgroup);
    }
    return;
  }
  const [module, action, ...rest] = positionals;
  const v = values;
  const json = v.json ?? false;
  if (module === "config")
    return handleConfigCommand(action, rest, json, v.lang, v.force);
  if (module === "setup") return handleSetupCommand(v);
  const config = loadProfileConfig({
    profile: v.profile,
    demo: v.demo,
    userAgent: `okx-trade-cli/${CLI_VERSION}`
  });
  const client = new OkxRestClient(config);
  const run = createToolRunner(client, config);
  if (module === "market")
    return handleMarketCommand(run, action, rest, v, json);
  if (module === "account")
    return handleAccountCommand(run, action, rest, v, json);
  if (module === "spot") return handleSpotCommand(run, action, rest, v, json);
  if (module === "swap") return handleSwapCommand(run, action, rest, v, json);
  if (module === "futures")
    return handleFuturesCommand(run, action, rest, v, json);
  if (module === "option")
    return handleOptionCommand(run, action, rest, v, json);
  if (module === "bot") return handleBotCommand(run, action, rest, v, json);
  if (module === "earn") return handleEarnCommand(run, action, rest, v, json);
  process.stderr.write(`Unknown command: ${module} ${action ?? ""}
`);
  process.exitCode = 1;
}
main().catch((error) => {
  const payload = toToolErrorPayload(error);
  process.stderr.write(`Error: ${payload.message}
`);
  if (payload.traceId) process.stderr.write(`TraceId: ${payload.traceId}
`);
  if (payload.suggestion) process.stderr.write(`Hint: ${payload.suggestion}
`);
  process.stderr.write(`Version: @okx_ai/okx-trade-cli@${CLI_VERSION}
`);
  process.exitCode = 1;
});
export {
  handleAccountWriteCommand,
  handleBotCommand,
  handleBotDcaCommand,
  handleBotGridCommand,
  handleConfigCommand,
  handleMarketCommand,
  handleMarketDataCommand,
  handleMarketPublicCommand,
  handleSetupCommand,
  handleSwapCommand,
  printHelp
};
/*! Bundled license information:

smol-toml/dist/error.js:
smol-toml/dist/util.js:
smol-toml/dist/date.js:
smol-toml/dist/primitive.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
//# sourceMappingURL=index.js.map