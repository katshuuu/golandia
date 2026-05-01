import {
  NIL,
  type Value,
  type VInt,
  type VFloat,
  type VString,
  type VBool,
  type VRune,
  type VSlice,
  type VStruct,
  type VMap,
  type VPkg,
  type VNsFn,
} from './values';

export type EvalCtx = {
  line: number;
  get: (id: string) => Value;
  hasImport: (p: string) => boolean;
  structFields: (t: string) => string[] | undefined;
  callUser?: (name: string, args: Value[]) => Value;
  /** fmt: Print/Println/Printf; Sprintf → string. math: Sqrt, … */
  pkg: (p: 'fmt' | 'math', m: string, args: Value[]) => Value;
};

function isTrue(v: Value): boolean {
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

function toBoolV(b: boolean): VBool {
  return { t: 'bool', v: b } as VBool;
}

class P {
  s: string;
  i = 0;
  c: EvalCtx;
  li = 1;
  co = 1;
  constructor(src: string, c: EvalCtx) {
    this.s = src.trim();
    this.c = c;
  }
  fail(m: string): never {
    throw new Error(`${m} (${this.c.line + this.li - 1}:${this.co})`);
  }
  w() {
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
        if (c === '\n') {
          this.li += 1;
          this.co = 1;
        } else {
          this.co += 1;
        }
        this.i += 1;
      } else {
        return;
      }
    }
  }
  ch() {
    return this.i < this.s.length ? this.s[this.i] : '';
  }
  eat(ch: string) {
    this.w();
    if (this.ch() !== ch) {
      this.fail('ожидается «' + ch + '»');
    }
    this.i += 1;
    this.co += 1;
  }
  or(): Value {
    let a = this.an();
    for (;;) {
      this.w();
      if (this.s.slice(this.i, this.i + 2) !== '||') {
        return a;
      }
      this.i += 2;
      this.co += 2;
      const b = this.an();
      a = toBoolV(isTrue(a) || isTrue(b));
    }
  }
  an(): Value {
    let a = this.eq();
    for (;;) {
      this.w();
      if (this.s.slice(this.i, this.i + 2) !== '&&') {
        return a;
      }
      this.i += 2;
      this.co += 2;
      const b = this.eq();
      a = toBoolV(isTrue(a) && isTrue(b));
    }
  }
  eq(): Value {
    let a = this.rel();
    for (;;) {
      this.w();
      if (this.s.slice(this.i, this.i + 2) === '==' || this.s.slice(this.i, this.i + 2) === '!=') {
        const o = this.s.slice(this.i, this.i + 2);
        this.i += 2;
        this.co += 2;
        a = this.cmp2(a, o, this.rel());
        continue;
      }
      return a;
    }
  }
  rel(): Value {
    let a = this.ad();
    for (;;) {
      this.w();
      if (this.s.slice(this.i, this.i + 2) === '<=' || this.s.slice(this.i, this.i + 2) === '>=') {
        const o = this.s.slice(this.i, this.i + 2);
        this.i += 2;
        this.co += 2;
        a = this.cmp2(a, o, this.ad());
        continue;
      }
      const c = this.ch();
      if (c === '<' && this.s[this.i + 1] !== '<') {
        this.i += 1;
        this.co += 1;
        a = this.cmp2(a, '<', this.ad());
        continue;
      }
      if (c === '>' && this.s[this.i + 1] !== '>') {
        this.i += 1;
        this.co += 1;
        a = this.cmp2(a, '>', this.ad());
        continue;
      }
      return a;
    }
  }
  ad(): Value {
    let a = this.ml();
    for (;;) {
      this.w();
      const c = this.ch();
      if (c !== '+' && c !== '-') {
        return a;
      }
      this.i += 1;
      this.co += 1;
      a = this.add2(a, c, this.ml());
    }
  }
  ml(): Value {
    let a = this.un();
    for (;;) {
      this.w();
      const c = this.ch();
      if (c !== '*' && c !== '/' && c !== '%') {
        return a;
      }
      this.i += 1;
      this.co += 1;
      a = this.mul2(a, c, this.un());
    }
  }
  un(): Value {
    this.w();
    if (this.ch() === '!' && this.s[this.i + 1] !== '=') {
      this.i += 1;
      this.co += 1;
      return toBoolV(!isTrue(this.un()));
    }
    if (this.ch() === '-' || this.ch() === '+') {
      const o = this.ch();
      this.i += 1;
      this.co += 1;
      const a = this.un();
      if (o === '+') {
        return a;
      }
      if (a.t === 'int') {
        return { t: 'int', v: -(a as VInt).v } as VInt;
      }
      if (a.t === 'float') {
        return { t: 'float', v: -(a as VFloat).v } as VFloat;
      }
      this.fail('унарный -');
    }
    return this.po();
  }
  po(): Value {
    let a = this.pr();
    for (;;) {
      this.w();
      if (this.ch() === '.') {
        this.i += 1;
        this.co += 1;
        const name = this.id();
        if (a.t === 'pkg' && (a as VPkg).p === 'fmt') {
          a = { t: 'nsfn', p: 'fmt', f: name } as VNsFn;
          continue;
        }
        if (a.t === 'pkg' && (a as VPkg).p === 'math') {
          if (name === 'Pi') {
            a = { t: 'float', v: Math.PI } as VFloat;
            continue;
          }
          a = { t: 'nsfn', p: 'math', f: name } as VNsFn;
          continue;
        }
        a = this.fld(a, name);
        continue;
      }
      if (this.ch() === '(') {
        a = this.callV(a);
        continue;
      }
      if (this.ch() === '[') {
        this.i += 1;
        this.co += 1;
        const b = this.or();
        this.w();
        if (this.ch() === ':') {
          this.i += 1;
          this.co += 1;
          let hi: Value | null = null;
          if (this.ch() !== ']') {
            hi = this.or();
          }
          this.eat(']');
          a = this.sliceV(a, b, hi);
        } else {
          this.eat(']');
          a = this.idxV(a, b);
        }
        continue;
      }
      return a;
    }
  }
  fld(b: Value, f: string): Value {
    if (b.t === 'struct') {
      return (b as VStruct).fields.get(f) ?? NIL;
    }
    this.fail('.' + f);
  }
  callV(fv: Value): Value {
    this.eat('(');
    const ar: Value[] = [];
    this.w();
    if (this.ch() !== ')') {
      for (;;) {
        ar.push(this.or());
        this.w();
        if (this.ch() === ',') {
          this.i += 1;
          this.co += 1;
          continue;
        }
        break;
      }
    }
    this.eat(')');
    if (fv.t === 'nsfn') {
      const p = (fv as VNsFn).p as 'fmt' | 'math';
      const f = (fv as VNsFn).f;
      return this.c.pkg(p, f, ar);
    }
    this.fail('вызов не пакетный (ожидался пакет.функция)');
  }
  idxV(b: Value, k: Value): Value {
    if (b.t === 'string' && k.t === 'int') {
      const i = Number((k as VInt).v);
      const t = (b as VString).v;
      if (i < 0 || i >= t.length) {
        throw new Error(`panic: runtime error: index out of range [${i}] with length ${t.length} (${this.c.line})`);
      }
      return { t: 'rune', v: t.codePointAt(i) || 0 } as VRune;
    }
    if (b.t === 'slice' && k.t === 'int') {
      const i = Number((k as VInt).v);
      const e = (b as VSlice).elts;
      if (i < 0 || i >= e.length) {
        throw new Error(`panic: runtime error: index out of range [${i}] with length ${e.length} (${this.c.line})`);
      }
      return e[i];
    }
    if (b.t === 'map' && k.t === 'string') {
      return (b as VMap).entries.get((k as VString).v) ?? NIL;
    }
    this.fail('index');
  }
  sliceV(b: Value, lo: Value, hi: Value | null): Value {
    if (b.t === 'string') {
      const s = (b as VString).v;
      const l = lo.t === 'int' ? Number((lo as VInt).v) : 0;
      const h = hi == null || hi.t === 'nil' ? s.length : hi.t === 'int' ? Number((hi as VInt).v) : 0;
      return { t: 'string', v: s.slice(l, h) } as VString;
    }
    if (b.t === 'slice') {
      const l = (b as VSlice).elts;
      const a = lo.t === 'int' ? Number((lo as VInt).v) : 0;
      const b2 = hi == null || hi.t === 'nil' ? l.length : hi.t === 'int' ? Number((hi as VInt).v) : 0;
      return { t: 'slice', elem: (b as VSlice).elem, elts: l.slice(a, b2) } as VSlice;
    }
    this.fail('s[lo:hi]');
  }
  pr(): Value {
    this.w();
    if (this.ch() === '"') {
      return { t: 'string', v: this.st() } as VString;
    }
    if (this.ch() === "'") {
      return { t: 'rune', v: this.ru() } as VRune;
    }
    if (this.ch() === '(') {
      this.eat('(');
      const v = this.or();
      this.eat(')');
      return v;
    }
    if (this.ch() === '[') {
      this.i += 1;
      this.co += 1;
      this.eat(']');
      this.id();
      this.eat('{');
      const el: Value[] = this.elts();
      this.eat('}');
      return { t: 'slice', elem: 'int', elts: el } as VSlice;
    }
    if (this.ch() >= '0' && this.ch() <= '9' || (this.ch() === '.' && /[0-9]/.test(this.s[this.i + 1] || ''))) {
      return this.num();
    }
    if (this.s.slice(this.i, this.i + 4) === 'true') {
      this.i += 4;
      this.co += 4;
      return { t: 'bool', v: true } as VBool;
    }
    if (this.s.slice(this.i, this.i + 5) === 'false') {
      this.i += 5;
      this.co += 5;
      return { t: 'bool', v: false } as VBool;
    }
    if (this.s.slice(this.i, this.i + 3) === 'nil') {
      this.i += 3;
      this.co += 3;
      return NIL;
    }
    const id0 = this.id();
    this.w();
    if (this.ch() === '{') {
      return this.composite(id0);
    }
    if (this.ch() === '(') {
      if (id0 === 'len') {
        return this.b1('len');
      }
      if (id0 === 'cap') {
        return this.b1('cap');
      }
      if (id0 === 'make') {
        return this.mak();
      }
      if (id0 === 'new') {
        this.eat('(');
        const t = this.id();
        this.eat(')');
        return this.new0(t);
      }
      if (id0 === 'append') {
        this.eat('(');
        const a = this.or();
        this.w();
        const r: Value[] = [a];
        while (this.ch() === ',') {
          this.i += 1;
          this.co += 1;
          r.push(this.or());
          this.w();
        }
        this.eat(')');
        if (a.t !== 'slice' || r.length < 2) {
          this.fail('append');
        }
        return {
          t: 'slice',
          elem: (a as VSlice).elem,
          elts: (a as VSlice).elts.concat(r.slice(1)),
        } as VSlice;
      }
      if (id0 === 'int' || id0 === 'int64' || id0 === 'float64' || id0 === 'string') {
        this.eat('(');
        const a = this.or();
        this.eat(')');
        return this.cvt(id0, a);
      }
      if (this.c.callUser) {
        this.eat('(');
        const r: Value[] = [];
        if (this.ch() !== ')') {
          for (;;) {
            r.push(this.or());
            this.w();
            if (this.ch() === ',') {
              this.i += 1;
              this.co += 1;
              continue;
            }
            break;
          }
        }
        this.eat(')');
        return this.c.callUser(id0, r);
      }
      this.fail(`вызов ${id0}(…): функция не найдена в песочнице`);
    }
    if (this.c.hasImport('fmt') && id0 === 'fmt') {
      return { t: 'pkg', p: 'fmt' } as VPkg;
    }
    if (this.c.hasImport('math') && id0 === 'math') {
      return { t: 'pkg', p: 'math' } as VPkg;
    }
    return this.c.get(id0);
  }
  new0(t: string): Value {
    const o = this.c.structFields(t) || [];
    const m = new Map<string, Value>();
    const or: string[] = [];
    for (const f of o) {
      m.set(f, { t: 'int', v: 0n } as VInt);
      or.push(f);
    }
    return { t: 'struct', name: t, fieldOrder: or, fields: m } as VStruct;
  }
  composite(tn: string): Value {
    this.eat('{');
    const pos: Value[] = [];
    const named: { k: string; v: Value }[] = [];
    for (;;) {
      this.w();
      if (this.ch() === '}') {
        this.eat('}');
        break;
      }
      if (pos.length || named.length) {
        this.eat(',');
        this.w();
        if (this.ch() === '}') {
          this.eat('}');
          break;
        }
      }
      if (/[0-9.('"`(]/.test(this.ch() || '')) {
        pos.push(this.or());
        continue;
      }
      if (this.ch() === '[') {
        pos.push(this.or());
        continue;
      }
      const j0 = this.i;
      const w = this.id();
      this.w();
      if (this.ch() === ':') {
        this.eat(':');
        named.push({ k: w, v: this.or() });
      } else {
        this.i = j0;
        pos.push(this.or());
      }
    }
    const ord = this.c.structFields(tn) || [];
    const f = new Map<string, Value>();
    const ord2: string[] = [];
    if (named.length) {
      for (const { k, v } of named) {
        f.set(k, v);
        ord2.push(k);
      }
    } else {
      for (let j = 0; j < pos.length; j += 1) {
        const n = ord[j] || `_${j}`;
        f.set(n, pos[j]);
        ord2.push(n);
      }
    }
    return { t: 'struct', name: tn, fieldOrder: ord2, fields: f } as VStruct;
  }
  elts(): Value[] {
    const a: Value[] = [];
    for (;;) {
      this.w();
      if (this.ch() === '}') {
        return a;
      }
      a.push(this.or());
      this.w();
      if (this.ch() === ',') {
        this.i += 1;
        this.co += 1;
        continue;
      }
      return a;
    }
  }
  b1(what: 'len' | 'cap'): Value {
    this.eat('(');
    const a = this.or();
    this.eat(')');
    if (what === 'len') {
      if (a.t === 'string') {
        return { t: 'int', v: BigInt((a as VString).v.length) } as VInt;
      }
      if (a.t === 'slice' || a.t === 'map') {
        if (a.t === 'map') {
          return { t: 'int', v: BigInt((a as VMap).entries.size) } as VInt;
        }
        return { t: 'int', v: BigInt((a as VSlice).elts.length) } as VInt;
      }
      this.fail('len');
    }
    if (a.t === 'slice') {
      return { t: 'int', v: BigInt((a as VSlice).elts.length) } as VInt;
    }
    this.fail('cap');
  }
  mak(): Value {
    this.eat('(');
    this.w();
    if (this.s[this.i] === '[') {
      this.i += 1;
      this.co += 1;
      this.w();
      this.eat(']');
      this.id();
      this.w();
      this.eat(',');
      this.w();
      const n = this.or();
      this.w();
      if (this.ch() === ',') {
        this.i += 1;
        this.co += 1;
        this.w();
        this.or();
      }
      this.eat(')');
      const l = n.t === 'int' ? Number((n as VInt).v) : 0;
      const e: Value[] = [];
      for (let j = 0; j < l; j += 1) {
        e.push({ t: 'int', v: 0n } as VInt);
      }
      return { t: 'slice', elem: 'int', elts: e } as VSlice;
    }
    if (this.s.slice(this.i, this.i + 3) === 'map') {
      this.i += 3;
      this.co += 3;
      this.w();
      this.eat('[');
      this.id();
      this.eat(']');
      this.w();
      this.id();
      this.w();
      this.eat(')');
      return { t: 'map', keyT: 'string', valT: 'int', entries: new Map() } as VMap;
    }
    this.fail('make(…)');
  }
  cvt(k: string, a: Value): Value {
    if (k === 'int' || k === 'int64') {
      if (a.t === 'int') {
        return a;
      }
      if (a.t === 'float') {
        return { t: 'int', v: BigInt(Math.trunc((a as VFloat).v)) } as VInt;
      }
      if (a.t === 'string' && /^-?\d+$/.test((a as VString).v)) {
        return { t: 'int', v: BigInt((a as VString).v) } as VInt;
      }
      this.fail('int()');
    }
    if (k === 'float64') {
      if (a.t === 'int') {
        return { t: 'float', v: Number((a as VInt).v) } as VFloat;
      }
      if (a.t === 'float') {
        return a;
      }
      this.fail('float64()');
    }
    if (k === 'string') {
      if (a.t === 'string') {
        return a;
      }
      if (a.t === 'int') {
        return { t: 'string', v: (a as VInt).v.toString() } as VString;
      }
    }
    this.fail('convert');
  }
  id(): string {
    this.w();
    const st = this.i;
    if (!/[\p{L}_]/u.test(this.ch() || '')) {
      this.fail('идентификатор');
    }
    this.i += 1;
    while (this.i < this.s.length && /[\p{L}0-9_]/u.test(this.s[this.i])) {
      this.i += 1;
    }
    const t = this.s.slice(st, this.i);
    this.co += t.length;
    return t;
  }
  st(): string {
    this.eat('"');
    let o = '';
    while (this.ch() !== '' && this.ch() !== '"') {
      if (this.ch() === '\\') {
        this.i += 1;
        this.co += 1;
        const e = this.ch();
        if (e === 'n') {
          o += '\n';
        } else if (e === 't') {
          o += '\t';
        } else {
          o += e;
        }
        this.i += 1;
        this.co += 1;
        continue;
      }
      o += this.ch();
      this.i += 1;
      this.co += 1;
    }
    this.eat('"');
    return o;
  }
  ru(): number {
    this.eat("'");
    if (this.ch() === '\\') {
      this.i += 1;
      this.co += 1;
      const c = this.ch() === 'n' ? 10 : 32;
      this.i += 1;
      this.co += 1;
      this.eat("'");
      return c;
    }
    const p = this.s.codePointAt(this.i) || 0;
    this.i += p > 0xffff ? 2 : 1;
    this.co += 1;
    this.eat("'");
    return p;
  }
  num(): Value {
    const st = this.i;
    if (this.s[this.i] === '0' && (this.s[this.i + 1] === 'x' || this.s[this.i + 1] === 'X')) {
      this.i += 2;
      this.co += 2;
      const a = this.i;
      while (this.i < this.s.length && /[0-9a-fA-F]/.test(this.s[this.i])) {
        this.i += 1;
        this.co += 1;
      }
      return { t: 'int', v: BigInt('0x' + this.s.slice(a, this.i)) } as VInt;
    }
    let d = false;
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === '.' && !d && /[0-9]/.test(this.s[this.i + 1] || '')) {
        d = true;
        this.i += 1;
        this.co += 1;
        continue;
      }
      if (c < '0' || c > '9') {
        break;
      }
      this.i += 1;
      this.co += 1;
    }
    if (st === this.i) {
      this.fail('число');
    }
    const t = this.s.slice(st, this.i);
    if (d || /[eE]/.test(t)) {
      return { t: 'float', v: parseFloat(t) } as VFloat;
    }
    return { t: 'int', v: BigInt(t) } as VInt;
  }
  cmp2(a: Value, o: string, b: Value): VBool {
    if (o === '==') {
      return { t: 'bool', v: this.eqV(a, b) } as VBool;
    }
    if (o === '!=') {
      return { t: 'bool', v: !this.eqV(a, b) } as VBool;
    }
    if (a.t === 'string' && b.t === 'string') {
      const A = (a as VString).v;
      const B = (b as VString).v;
      let r = false;
      if (o === '<') {
        r = A < B;
      } else if (o === '<=') {
        r = A <= B;
      } else if (o === '>') {
        r = A > B;
      } else {
        r = A >= B;
      }
      return { t: 'bool', v: r } as VBool;
    }
    const ca = a.t === 'int' ? Number((a as VInt).v) : a.t === 'float' ? (a as VFloat).v : 0;
    const cb = b.t === 'int' ? Number((b as VInt).v) : b.t === 'float' ? (b as VFloat).v : 0;
    let r = false;
    if (o === '<') {
      r = ca < cb;
    } else if (o === '<=') {
      r = ca <= cb;
    } else if (o === '>') {
      r = ca > cb;
    } else {
      r = ca >= cb;
    }
    return { t: 'bool', v: r } as VBool;
  }
  add2(a: Value, o: string, b: Value): Value {
    if (o === '+' && (a.t === 'string' || b.t === 'string')) {
      return { t: 'string', v: defaultS(a) + defaultS(b) } as VString;
    }
    if (a.t === 'int' && b.t === 'int') {
      return { t: 'int', v: (a as VInt).v + (b as VInt).v } as VInt;
    }
    if (a.t === 'float' || b.t === 'float') {
      return { t: 'float', v: toF(a) + toF(b) } as VFloat;
    }
    this.fail('+');
  }
  mul2(a: Value, o: string, b: Value): Value {
    if (a.t === 'int' && b.t === 'int') {
      if (o === '%') {
        if ((b as VInt).v === 0n) {
          throw new Error(`panic: integer divide by zero (${this.c.line})`);
        }
        return { t: 'int', v: (a as VInt).v % (b as VInt).v } as VInt;
      }
      if (o === '/' && (b as VInt).v === 0n) {
        throw new Error(`panic: integer divide by zero (${this.c.line})`);
      }
      if (o === '/') {
        return { t: 'int', v: (a as VInt).v / (b as VInt).v } as VInt;
      }
      return { t: 'int', v: (a as VInt).v * (b as VInt).v } as VInt;
    }
    if (a.t === 'float' || b.t === 'float') {
      return { t: 'float', v: o === '*' ? toF(a) * toF(b) : toF(a) / toF(b) } as VFloat;
    }
    this.fail('*/%');
  }
  eqV(a: Value, b: Value): boolean {
    if (a.t !== b.t) {
      return false;
    }
    if (a.t === 'int') {
      return (a as VInt).v === (b as VInt).v;
    }
    if (a.t === 'float') {
      return (a as VFloat).v === (b as VFloat).v;
    }
    if (a.t === 'string') {
      return (a as VString).v === (b as VString).v;
    }
    if (a.t === 'bool') {
      return (a as VBool).v === (b as VBool).v;
    }
    if (a.t === 'nil') {
      return true;
    }
    return false;
  }
}

function defaultS(v: Value): string {
  if (v.t === 'string') {
    return (v as VString).v;
  }
  if (v.t === 'int') {
    return (v as VInt).v.toString();
  }
  if (v.t === 'bool') {
    return (v as VBool).v ? 'true' : 'false';
  }
  return String(v);
}
function toF(v: Value): number {
  if (v.t === 'float') {
    return (v as VFloat).v;
  }
  if (v.t === 'int') {
    return Number((v as VInt).v);
  }
  return 0;
}

export function evalExpr(src: string, c: EvalCtx): Value {
  const p = new P(src, c);
  const v = p.or();
  p.w();
  if (p.i < p.s.length) {
    p.fail('лишний текст: «' + p.s[p.i] + '»');
  }
  return v;
}
