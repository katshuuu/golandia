import { goPrintf, goPrint } from './fmtprint';
import { NIL, type Value, type VString, type VInt, type VFloat, type VBool, type VSlice, type VRune } from './values';
import { evalExpr, type EvalCtx } from './exprEval';
import { stripAllComments, extractFunctionBody } from './stripAndExtract';
import { splitBlockStatements } from './blockSplit';

const MAX_STEPS = 2_000_000;

class RTE {
  env = new Map<string, Value>();
  imports = new Set<string>();
  structOrder = new Map<string, string[]>();
  out: string[] = [];
  step = 0;
  bInc() {
    this.step += 1;
    if (this.step > MAX_STEPS) {
      throw new Error('timeout: слишком много шагов (как бесконечный цикл)');
    }
  }
  ctx(line: number): EvalCtx {
    return {
      line,
      get: (id) => {
        const v = this.env.get(id);
        if (v === undefined) {
          throw new Error(`undefined: ${id} (${line})`);
        }
        return v;
      },
      hasImport: (p) => this.imports.has(p),
      structFields: (t) => this.structOrder.get(t),
      pkg: (p, m, args) => this.callPkg(p, m, args, line),
    };
  }
  callPkg(p: 'fmt' | 'math', m: string, args: Value[], line: number): Value {
    if (p === 'fmt') {
      if (m === 'Sprintf') {
        if (args.length < 1 || args[0].t !== 'string') {
          throw new Error(`Sprintf: первый аргумент — string (${line})`);
        }
        const r = goPrintf((args[0] as VString).v, args.slice(1), undefined);
        if (!r.ok) {
          throw new Error(r.err);
        }
        return { t: 'string', v: r.s } as VString;
      }
      if (m === 'Print') {
        this.out.push(goPrint(args, false, false));
        return NIL;
      }
      if (m === 'Println') {
        this.out.push(goPrint(args, true, true));
        return NIL;
      }
      if (m === 'Printf') {
        if (args.length < 1 || args[0].t !== 'string') {
          throw new Error(`Printf: первый аргумент — string (${line})`);
        }
        const r = goPrintf((args[0] as VString).v, args.slice(1), undefined);
        if (!r.ok) {
          throw new Error(r.err);
        }
        this.out.push(r.s);
        return NIL;
      }
    }
    if (p === 'math') {
      if (m === 'Sqrt' && args.length === 1) {
        return { t: 'float', v: Math.sqrt(f64(args[0])) } as VFloat;
      }
      if (m === 'Sin' && args.length === 1) {
        return { t: 'float', v: Math.sin(f64(args[0])) } as VFloat;
      }
      if (m === 'Cos' && args.length === 1) {
        return { t: 'float', v: Math.cos(f64(args[0])) } as VFloat;
      }
    }
    throw new Error(`вызов ${p}.${m} не реализован (${line})`);
  }
}
function f64(v: Value): number {
  if (v.t === 'float') {
    return (v as VFloat).v;
  }
  if (v.t === 'int') {
    return Number((v as VInt).v);
  }
  if (v.t === 'rune') {
    return (v as VRune).v;
  }
  return 0;
}

function parseImportsAndStructs(full: string, rt: RTE) {
  for (const m of full.matchAll(/import\s+"([^"]+)"/g)) {
    rt.imports.add(m[1]);
  }
  for (const b of full.matchAll(/import\s*\(([\s\S]*?)\)/g)) {
    for (const n of b[1].matchAll(/"([^"]+)"/g)) {
      rt.imports.add(n[1]);
    }
  }
  for (const t of full.matchAll(/type\s+(\w+)\s+struct\s*\{([^}]*)\}/g)) {
    const fields: string[] = [];
    for (const line of t[2].split('\n')) {
      const a = line.trim();
      if (!a || a.startsWith('//')) {
        continue;
      }
      const w = a.split(/\s+/)[0];
      if (w && w !== '}' && w !== '{' && /^[A-Za-z_]/.test(w)) {
        fields.push(w);
      }
    }
    if (t[1]) {
      rt.structOrder.set(t[1], fields);
    }
  }
}

function findTop(s0: string, needle: string): number {
  let p = 0;
  let b = 0;
  let st = 0;
  for (let i = 0; i < s0.length; i += 1) {
    const c = s0[i];
    if (st === 0 && c === '"') {
      st = 1;
      continue;
    }
    if (st === 1) {
      if (c === '"') {
        st = 0;
      } else if (c === '\\') {
        i += 1;
      }
      continue;
    }
    if (st === 0 && c === '`') {
      st = 2;
      continue;
    }
    if (st === 2) {
      if (c === '`') {
        st = 0;
      }
      continue;
    }
    if (c === '(') {
      p += 1;
    } else if (c === ')') {
      p -= 1;
    } else if (c === '{') {
      b += 1;
    } else if (c === '}') {
      b -= 1;
    }
    if (p === 0 && b === 0 && s0.slice(i, i + needle.length) === needle) {
      return i;
    }
  }
  return -1;
}

function findAssignEq(s0: string): number {
  let p = 0;
  let b = 0;
  let st = 0;
  for (let i = 0; i < s0.length; i += 1) {
    const c = s0[i];
    if (st === 0 && c === '"') {
      st = 1;
      continue;
    }
    if (st === 1) {
      if (c === '"') {
        st = 0;
      } else if (c === '\\') {
        i += 1;
      }
      continue;
    }
    if (st === 0 && c === '`') {
      st = 2;
      continue;
    }
    if (st === 2) {
      if (c === '`') {
        st = 0;
      }
      continue;
    }
    if (c === '(') {
      p += 1;
    } else if (c === ')') {
      p -= 1;
    } else if (c === '{') {
      b += 1;
    } else if (c === '}') {
      b -= 1;
    }
    if (p === 0 && b === 0 && c === '=') {
      if (s0[i + 1] === '=') {
        i += 1;
        continue;
      }
      if (s0[i - 1] === '!' || s0[i - 1] === '<' || s0[i - 1] === '>' || s0[i - 1] === '=') {
        continue;
      }
      if (s0[i - 1] === ':') {
        continue;
      }
      return i;
    }
  }
  return -1;
}

function readBal(s0: string, open: number): { inner: string; end: number } {
  if (s0[open] !== '{') {
    throw new Error('readBal');
  }
  let d = 0;
  for (let j = open; j < s0.length; j += 1) {
    if (s0[j] === '{') {
      d += 1;
    } else if (s0[j] === '}') {
      d -= 1;
      if (d === 0) {
        return { inner: s0.slice(open + 1, j), end: j + 1 };
      }
    }
  }
  throw new Error('не сбалансированы { }');
}

function splitTopComma(s0: string): string[] {
  if (!s0.includes(',')) {
    return [s0];
  }
  const o: string[] = [];
  let c = 0;
  let st = 0;
  const n = s0.length;
  let a = 0;
  for (let i = 0; i < n; i += 1) {
    const c0 = s0[i];
    if (st === 0 && c0 === '"') {
      st = 1;
      continue;
    }
    if (st === 1) {
      if (c0 === '"') {
        st = 0;
      } else if (c0 === '\\') {
        i += 1;
      }
      continue;
    }
    if (c0 === '(') {
      c += 1;
    }
    if (c0 === ')') {
      c -= 1;
    }
    if (c0 === ',' && c === 0) {
      o.push(s0.slice(a, i).trim());
      a = i + 1;
    }
  }
  o.push(s0.slice(a).trim());
  return o;
}

function truthy(v: Value): boolean {
  if (v.t === 'bool') {
    return (v as VBool).v;
  }
  if (v.t === 'int') {
    return (v as VInt).v !== 0n;
  }
  if (v.t === 'string') {
    return (v as VString).v.length > 0;
  }
  if (v.t === 'nil') {
    return false;
  }
  return true;
}

function execShort(t0: string, rt: RTE, li: number): void {
  const p = findTop(t0, ':=');
  if (p < 0) {
    return;
  }
  const l = t0.slice(0, p).trim();
  const r = t0.slice(p + 2).trim();
  const ids = splitTopComma(l);
  const rh = splitTopComma(r);
  if (ids.length !== rh.length) {
    throw new Error(`:= количество слева/справа (${li})`);
  }
  for (let g = 0; g < ids.length; g += 1) {
    rt.env.set(ids[g], evalExpr(rh[g], rt.ctx(li)));
  }
}

function runIf(t0: string, rt: RTE, li: number): void {
  const t = t0.trim();
  if (!t.startsWith('if ')) {
    return;
  }
  let j = 3;
  while (j < t.length && /\s/.test(t[j]!)) {
    j += 1;
  }
  let p = 0;
  let st = 0;
  for (let i = j; i < t.length; i += 1) {
    const c = t[i]!;
    if (st === 0 && c === '"') {
      st = 1;
      continue;
    }
    if (st === 1) {
      if (c === '"') {
        st = 0;
      } else if (c === '\\') {
        i += 1;
      }
      continue;
    }
    if (st === 0 && c === '(') {
      p += 1;
    } else if (st === 0 && c === ')') {
      p -= 1;
    } else if (st === 0 && c === '{' && p === 0) {
      const cond = t.slice(j, i).trim();
      const bl = readBal(t, i);
      let k = t.slice(bl.end).trim();
      if (truthy(evalExpr(cond, rt.ctx(li)))) {
        runBlock(bl.inner, rt, li);
      } else if (k.startsWith('else')) {
        k = k.slice(4).trim();
        if (k.startsWith('if')) {
          runIf(k, rt, li);
        } else if (k.startsWith('{')) {
          const b2 = readBal(k, 0);
          runBlock(b2.inner, rt, li);
        }
      }
      return;
    }
  }
  throw new Error('if: нет {');
}

function runFor(t0: string, rt: RTE, li: number): void {
  const t = t0.trim();
  const a = t.slice(3).trim();
  if (a.startsWith('{')) {
    const b = readBal(t, t.indexOf('{'));
    for (;;) {
      rt.bInc();
      runBlock(b.inner, rt, li);
    }
  }
  const pbr = t.indexOf('{');
  if (pbr < 0) {
    throw new Error('for: нет {');
  }
  const head = t.slice(3, pbr).trim();
  const b = readBal(t, pbr);
  if (head.includes(' range ')) {
    const ri = head.indexOf(' range ');
    const pre = head.slice(0, ri).trim();
    const xs = head.slice(ri + 6).trim();
    const xv = evalExpr(xs, rt.ctx(li));
    const keyPart = pre.split(',');
    const u = (keyPart[0] || '_').trim();
    const v2 = keyPart[1] ? keyPart[1]!.trim() : null;
    if (xv.t === 'string') {
      const s = (xv as VString).v;
      for (let w = 0; w < s.length; w += 1) {
        rt.bInc();
        if (v2) {
          rt.env.set(v2, { t: 'int', v: BigInt(w) } as VInt);
        }
        rt.env.set(u, { t: 'rune', v: s.codePointAt(w) || 0 } as VRune);
        runBlock(b.inner, rt, li);
      }
    } else if (xv.t === 'slice') {
      const e = (xv as VSlice).elts;
      for (let w = 0; w < e.length; w += 1) {
        rt.bInc();
        if (v2) {
          rt.env.set(v2, { t: 'int', v: BigInt(w) } as VInt);
        }
        rt.env.set(u, e[w]!);
        runBlock(b.inner, rt, li);
      }
    } else {
      throw new Error('range: string или срез');
    }
    return;
  }
  if (!head.includes(';')) {
    const c = head.trim();
    for (;;) {
      rt.bInc();
      if (!truthy(evalExpr(c, rt.ctx(li)))) {
        break;
      }
      runBlock(b.inner, rt, li);
    }
    return;
  }
  const parts = head.split(';').map((x) => x.trim());
  if (parts.length < 1) {
    return;
  }
  if (parts[0] && findTop(parts[0]!, ':=') >= 0) {
    execShort(parts[0]!, rt, li);
  } else if (parts[0]) {
    evalExpr(parts[0]!, rt.ctx(li));
  }
  for (let n = 0; n < 200_000; n += 1) {
    rt.bInc();
    if (!parts[1] || !truthy(evalExpr(parts[1]!, rt.ctx(li)))) {
      break;
    }
    runBlock(b.inner, rt, li);
    if (parts[2] && /\+\+/.test(parts[2]!)) {
      const m = /^\s*(\w+)\s*\+\+\s*$/.exec(parts[2]!);
      if (m && m[1]) {
        const u = m[1];
        const c = (rt.env.get(u) as VInt).v;
        rt.env.set(u, { t: 'int', v: c + 1n } as VInt);
        continue;
      }
    } else if (parts[2]) {
      evalExpr(parts[2]!, rt.ctx(li));
    }
  }
}

function runBlock(body: string, rt: RTE, li: number): void {
  for (const s of splitBlockStatements(body)) {
    const t0 = s.trim();
    if (!t0) {
      continue;
    }
    if (t0 === 'continue' || t0 === 'break') {
      return;
    }
    if (t0.startsWith('go ')) {
      throw new Error('go: не поддерживается');
    }
    if (t0.startsWith('defer ')) {
      throw new Error('defer: не поддерживается');
    }
    if (t0.startsWith('for ')) {
      runFor(t0, rt, li);
      continue;
    }
    if (t0.startsWith('if ')) {
      runIf(t0, rt, li);
      continue;
    }
    if (t0.startsWith('return ')) {
      const r = t0.slice(6).trim();
      if (r) {
        evalExpr(r, rt.ctx(li));
      }
      return;
    }
    if (findTop(t0, ':=') >= 0) {
      execShort(t0, rt, li);
      continue;
    }
    const eqi = findAssignEq(t0);
    if (eqi > 0) {
      const left = t0.slice(0, eqi).trim();
      const right = t0.slice(eqi + 1).trim();
      rt.env.set(left, evalExpr(right, rt.ctx(li)));
      continue;
    }
    evalExpr(t0, rt.ctx(li));
  }
}

export function runGoProgram(source: string): { ok: boolean; stdout: string; stderr: string } {
  try {
    const full = stripAllComments(source);
    if (!/\bpackage\s+main\b/.test(full)) {
      return { ok: false, stdout: '', stderr: 'ожидается package main' };
    }
    if (!/\bfunc\s+main\s*\(/.test(full)) {
      return { ok: false, stdout: '', stderr: 'ожидается func main()' };
    }
    if (/\bselect\s*\{/.test(full)) {
      return { ok: false, stdout: '', stderr: 'select не поддерживается в песочнице' };
    }
    if (/make\s*\(\s*chan/.test(full)) {
      return { ok: false, stdout: '', stderr: 'chan не поддерживается в песочнице' };
    }
    const ext = extractFunctionBody(full, 'main');
    if ('err' in ext) {
      return { ok: false, stdout: '', stderr: ext.err };
    }
    const rt = new RTE();
    parseImportsAndStructs(full, rt);
    runBlock(ext.body, rt, 1);
    return { ok: true, stdout: rt.out.join(''), stderr: '' };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { ok: false, stdout: '', stderr: m };
  }
}
