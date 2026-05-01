/**
 * Как go fmt: Print/Println, Printf/Sprintf и директивы.
 * Тип: при несовпадении — %!verb(T=v) (как в Go).
 */
import { type Value, valueTypeString, type VStruct, type VInt, type VFloat, type VSlice, NIL, type VBool, type VMap } from './values';

const verbs = 'bdceEfgGosqxXcmpvUtw';

function simpleAddr(_v: Value): string {
  return (0x1a2b3c4d + Math.imul(33, 0) | 0)
    .toString(16)
    .padStart(8, '0');
}

export interface FmtState {
  sharp?: boolean;
  plus?: boolean;
  minus?: boolean;
  space?: boolean;
  zero?: boolean;
  width: number;
  /** -1 = не задана */
  prec: number;
  widthFromArg?: boolean;
  precFromArg?: boolean;
}

function wrongType(verb: string, v: Value): string {
  return `%!${verb}(${valueTypeString(v)}=${defaultFmt(v)})`;
}

export function defaultFmt(v: Value): string {
  if (v.t === 'nil') return '<nil>';
  if (v.t === 'bool') return v.v ? 'true' : 'false';
  if (v.t === 'int') return v.v.toString();
  if (v.t === 'float') {
    const n = (v as VFloat).v;
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      if (Number.isNaN(n)) return 'NaN';
      if (n < 0) return '-Inf';
      return '+Inf';
    }
    return n.toString();
  }
  if (v.t === 'string') return v.v;
  if (v.t === 'rune') return String.fromCharCode(v.v);
  if (v.t === 'struct') {
    const s = v as VStruct;
    if (!s.name) {
      return `{${s.fieldOrder.map((n) => n + ':' + defaultFmt(s.fields.get(n) ?? NIL)).join(' ')}}`;
    }
    return `${s.name}{${s.fieldOrder.map((n) => defaultFmt(s.fields.get(n) ?? NIL)).join(' ')}}`;
  }
  if (v.t === 'slice') {
    const sl = v as VSlice;
    return `[${sl.elts.map(defaultFmt).join(' ')}]`;
  }
  if (v.t === 'array') {
    return `[${(v as { elts: Value[] }).elts.map(defaultFmt).join(' ')}]`;
  }
  if (v.t === 'map') {
    return emitMapString(v as VMap);
  }
  if (v.t === 'func') {
    return `0x${simpleAddr(v)}`;
  }
  if (v.t === 'pkg') {
    return `<package ${(v as { p: string }).p}>`;
  }
  if (v.t === 'nsfn') {
    return `${(v as { p: string; f: string }).p}.${(v as { f: string }).f}`;
  }
  return '<?>';
}

function emitMapString(m: VMap): string {
  if (m.entries.size === 0) return 'map[]';
  const parts: string[] = [];
  m.entries.forEach((val, k) => {
    parts.push(`${k}:${defaultFmt(val)}`);
  });
  return `map[${parts.join(' ')}]`;
}

function intForVerb(v: Value, verb: string): { ok: true; n: bigint } | { ok: false; s: string } {
  if (v.t === 'int') return { ok: true, n: (v as VInt).v };
  if (v.t === 'rune') return { ok: true, n: BigInt((v as { v: number }).v) };
  if (v.t === 'bool') return { ok: true, n: (v as VBool).v ? 1n : 0n };
  if (v.t === 'float') {
    const x = (v as VFloat).v;
    if (!Number.isFinite(x) || Number.isNaN(x)) return { ok: false, s: wrongType(verb, v) };
    return { ok: true, n: BigInt(Math.trunc(x)) };
  }
  if (v.t === 'string') {
    const t = (v as { v: string }).v.trim();
    if (/^-?\d+$/.test(t)) {
      try {
        return { ok: true, n: BigInt(t) };
      } catch {
        return { ok: false, s: wrongType(verb, v) };
      }
    }
  }
  return { ok: false, s: wrongType(verb, v) };
}

function floatForVerb(v: Value, verb: string): { ok: true; f: number } | { ok: false; s: string } {
  if (v.t === 'float') return { ok: true, f: (v as VFloat).v };
  if (v.t === 'int') return { ok: true, f: Number((v as VInt).v) };
  if (v.t === 'rune') return { ok: true, f: (v as { v: number }).v };
  if (v.t === 'bool') return { ok: true, f: (v as VBool).v ? 1 : 0 };
  return { ok: false, s: wrongType(verb, v) };
}

function strForVerb(v: Value, verb: string): { ok: true; s: string } | { ok: false; s: string } {
  if (v.t === 'string') return { ok: true, s: (v as { v: string }).v };
  if (v.t === 'int' && verb === 's') {
    // rare: rune as
    return { ok: true, s: (v as VInt).v.toString() };
  }
  return { ok: false, s: wrongType(verb, v) };
}

function padString(s: string, width: number, leftAlign: boolean, zero: boolean, stringMode: boolean): string {
  if (width <= 0 || s.length >= width) return s;
  const need = width - s.length;
  const ch = stringMode || leftAlign || !zero ? ' ' : '0';
  if (leftAlign) return s + ' '.repeat(need);
  return ch.repeat(need) + s;
}

/**
 * formatOne: один аргумент с известной verb (один символ, сохраняем регистр e/E, g/G, x/X).
 */
export function formatOne(
  v: Value,
  rawVerb: string,
  st: FmtState,
  goTypeForT: (v: Value) => string = valueTypeString,
): string {
  const vLower = rawVerb.toLowerCase();
  const w = st.width;
  const prec = st.prec;
  const isSharp = !!st.sharp;
  const left = !!st.minus;
  const useZero = !!st.zero;

  if (vLower === 'T') {
    return padString(goTypeForT(v), w, left, false, true);
  }

  if (vLower === 'p') {
    if (v.t === 'slice' && isSharp) {
      return padString('[]int', w, left, false, true);
    }
    const p = '0x' + simpleAddr(v);
    return padString(p, w, left, useZero && !left, false);
  }

  if (vLower === 'e' || vLower === 'E') {
    const f = floatForVerb(v, rawVerb);
    if (!f.ok) return f.s;
    const p = prec >= 0 ? prec : 6;
    const x = f.f;
    if (!Number.isFinite(x)) {
      if (Number.isNaN(x)) return 'NaN';
      if (x < 0) return '-Inf';
      return '+Inf';
    }
    const s = x.toExponential(p);
    if (rawVerb === 'E') {
      return padString(s.toUpperCase().replace('E', 'E'), w, left, false, true);
    }
    return padString(s, w, left, false, true);
  }

  if (vLower === 'f' || (vLower === 'g' || vLower === 'G') && (prec < 0 || prec > 0)) {
    const f = floatForVerb(v, 'f');
    if (!f.ok) {
      if (vLower === 'g' || vLower === 'G') {
        // %g tries float then int? Go: general format
        const i2 = intForVerb(v, 'd');
        if (i2.ok) {
          return padString(i2.n.toString(), w, left, useZero, false);
        }
      }
      return f.s;
    }
    const p = prec >= 0 ? prec : 6;
    if (vLower === 'f') {
      return padString(
        f.f.toFixed(p),
        w,
        left,
        useZero && !left,
        true,
      );
    }
    // %g: trim trailing zeros
    let s = f.f.toPrecision(prec >= 0 ? Math.min(17, p + 1) : 6);
    if (rawVerb === 'G') {
      s = s.toUpperCase();
    }
    return padString(s, w, left, false, true);
  }

  if (vLower === 'd' || vLower === 'b' || vLower === 'o' || vLower === 'O' || vLower === 'x' || vLower === 'X' || vLower === 'U') {
    if (vLower === 'U') {
      if (v.t !== 'rune' && v.t !== 'int') return wrongType(rawVerb, v);
      const code = v.t === 'rune' ? v.v : Number((v as VInt).v);
      if (code < 0 || code > 0x10ffff) return 'U+????';
      return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
    }
    const ir = intForVerb(v, rawVerb);
    if (!ir.ok) return ir.s;
    const n = ir.n;
    if (n < 0n && (vLower === 'o' || vLower === 'b' || vLower === 'x' || vLower === 'X')) {
      // Go prints large unsigned for negative in hex with format as uint64 — упрощение
    }
    if (vLower === 'd') {
      const u = n < 0n ? -n : n;
      const body = (n < 0n ? '-' : st.plus ? '+' : st.space ? ' ' : '') + u.toString();
      return padString(body, w, left, useZero, false);
    }
    const uabs = n < 0n ? (1n << 64n) + n : n;
    const base = vLower === 'b' ? 2 : vLower === 'o' || vLower === 'O' ? 8 : 16;
    let t = (uabs < 0n ? uabs + (1n << 64n) : n < 0n ? -n : n).toString(base);
    if (vLower === 'x' || vLower === 'X') {
      if (isSharp) t = '0x' + t;
      if (vLower === 'X') t = t.toUpperCase();
    }
    if (vLower === 'o' && isSharp) t = '0' + t;
    if (n < 0n && (vLower === 'x' || vLower === 'X')) t = t; // 64bit wrap — skip full emulate
    return padString(t, w, left, useZero, false);
  }

  if (vLower === 'c') {
    const code =
      v.t === 'rune' ? (v as { v: number }).v : v.t === 'int' ? Number((v as VInt).v) : -1;
    if (code < 0) return wrongType('c', v);
    return String.fromCodePoint(code);
  }

  if (vLower === 's' || vLower === 'q') {
    const sr = v.t === 'string' ? { ok: true as const, s: (v as { v: string }).v } : strForVerb(v, 's');
    if (!sr.ok) {
      if (vLower === 'q') {
        if (v.t === 'int' || v.t === 'rune') {
          const ch =
            v.t === 'rune'
              ? (v as { v: number }).v
              : Number((v as VInt).v) & 0xffffffff;
          return goQuoteRune(ch);
        }
        return formatOne(v, 's', st, goTypeForT);
      }
      return (sr as { ok: false; s: string }).s;
    }
    if (vLower === 'q') {
      return padString(goDoubleQuote(sr.s), w, left, false, true);
    }
    return padString(sr.s, w, left, useZero, true);
  }

  if (vLower === 'v') {
    if (st.sharp) {
      // %#v
      if (v.t === 'struct') {
        const s = v as VStruct;
        if (s.name) {
          return `${s.name}{${s.fieldOrder.map((fn) => defaultFmt(s.fields.get(fn) ?? NIL)).join(', ')}}`;
        }
        return `{${s.fieldOrder.map((fn) => `${fn}:${defaultFmt(s.fields.get(fn) ?? NIL)}`).join(' ')}}`;
      }
      if (v.t === 'string') {
        return goDoubleQuote((v as { v: string }).v);
      }
    }
    if (st.plus && v.t === 'struct') {
      const s = v as VStruct;
      return `${s.name}{${s.fieldOrder.map((n) => `${n}:${defaultFmt(s.fields.get(n) ?? NIL)}`).join(' ')}}`;
    }
    return padString(defaultFmt(v), w, left, false, true);
  }

  return defaultFmt(v);
}

function goDoubleQuote(s: string): string {
  return `"${escapeGoString(s)}"`;
}

function goQuoteRune(r: number): string {
  if (r === 39) return `'\\''`;
  if (r < 0x20 || r > 0x10ffff) return `'\U${r.toString(16).padStart(8, '0')}'`;
  if (r === 92) return `'\\\\'`;
  if (r === 34) return `'"'`;
  return `'${String.fromCodePoint(r)}'`;
}

function escapeGoString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r');
}

/**
 * parsePrintf: возвращает строку или строку с ошибкой (как "missing arg").
 */
export function goPrintf(
  format: string,
  args: Value[],
  goType: (v: Value) => string = valueTypeString,
): { ok: true; s: string } | { ok: false; err: string } {
  let out = '';
  let argIdx = 0;
  let i = 0;
  const n = format.length;
  const nextArg = (): Value | { err: string } => {
    if (argIdx >= args.length) return { err: 'not enough args for format string' };
    return args[argIdx++];
  };

  while (i < n) {
    if (format[i] !== '%') {
      out += format[i];
      i += 1;
      continue;
    }
    if (i + 1 < n && format[i + 1] === '%') {
      out += '%';
      i += 2;
      continue;
    }
    // directive
    i += 1;
    if (i >= n) return { ok: false, err: 'incomplete format at end' };
    const st: FmtState = { width: 0, prec: -1 };
    for (; i < n; i += 1) {
      const c = format[i];
      if (c === '#') st.sharp = true;
      else if (c === '+') st.plus = true;
      else if (c === '-') st.minus = true;
      else if (c === ' ') st.space = true;
      else if (c === '0') st.zero = true;
      else break;
    }
    if (i < n && format[i] === '*') {
      st.widthFromArg = true;
      i += 1;
    } else {
      let w = 0;
      let had = false;
      while (i < n && format[i] >= '0' && format[i] <= '9') {
        had = true;
        w = w * 10 + (format.charCodeAt(i) - 48);
        i += 1;
      }
      if (had) st.width = w;
    }
    if (i < n && format[i] === '.') {
      i += 1;
      if (i < n && format[i] === '*') {
        st.precFromArg = true;
        i += 1;
      } else {
        let p = 0;
        let had = false;
        while (i < n && format[i] >= '0' && format[i] <= '9') {
          had = true;
          p = p * 10 + (format.charCodeAt(i) - 48);
          i += 1;
        }
        st.prec = had ? p : 0;
      }
    }
    if (i >= n) return { ok: false, err: 'missing verb in format' };
    const verb = format[i];
    i += 1;
    if (verbs.indexOf(verb) < 0) {
      return { ok: false, err: `invalid verb ${verb} in format` };
    }
    if (st.widthFromArg) {
      const a = nextArg();
      if (typeof a === 'object' && 'err' in a) return { ok: false, err: a.err };
      if (a.t === 'int') st.width = Number((a as VInt).v);
      else st.width = 0;
    }
    if (st.precFromArg) {
      const a = nextArg();
      if (typeof a === 'object' && 'err' in a) return { ok: false, err: a.err };
      st.prec = a.t === 'int' ? Number((a as VInt).v) : -1;
    }
    const av = nextArg();
    if (typeof av === 'object' && 'err' in av) return { ok: false, err: av.err };
    out += formatOne(av, verb, st, goType);
  }
  if (argIdx < args.length) {
    return { ok: false, err: 'too many arguments for format string' };
  }
  return { ok: true, s: out };
}

export function goPrint(args: Value[], lineBreak: boolean, sepSpace: boolean): string {
  const parts = args.map((v) => defaultFmt(v));
  const mid = sepSpace ? parts.join(' ') : parts.join('');
  return lineBreak ? mid + '\n' : mid;
}
