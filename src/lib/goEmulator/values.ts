/**
 * Представление значений Go в локальной песочнице (подмножество).
 */

export type TypeKind = 'int' | 'float' | 'string' | 'bool' | 'rune' | 'nil' | 'slice' | 'array' | 'struct' | 'map' | 'func' | 'pkg' | 'nsfn';

export interface ValueBase {
  t: TypeKind;
}

export interface VNil extends ValueBase {
  t: 'nil';
}

export interface VBool extends ValueBase {
  t: 'bool';
  v: boolean;
}

export interface VInt extends ValueBase {
  t: 'int';
  v: bigint;
}

export interface VFloat extends ValueBase {
  t: 'float';
  v: number;
}

export interface VString extends ValueBase {
  t: 'string';
  v: string;
}

export interface VRune extends ValueBase {
  t: 'rune';
  v: number;
}

export interface VSlice extends ValueBase {
  t: 'slice';
  elem: TypeKind;
  elts: Value[];
}

export interface VArray extends ValueBase {
  t: 'array';
  elts: Value[];
}

export interface VStruct extends ValueBase {
  t: 'struct';
  name: string;
  /** порядок полей как в Go — для {X:1, Y:2} и %#v */
  fieldOrder: string[];
  fields: Map<string, Value>;
}

export interface VMap extends ValueBase {
  t: 'map';
  keyT: TypeKind;
  valT: TypeKind;
  entries: Map<string, Value>;
}

export interface VFunc extends ValueBase {
  t: 'func';
  name: string;
}

/** Имя пакета в выражении (fmt, math) */
export interface VPkg extends ValueBase {
  t: 'pkg';
  p: string;
}

/** Метод пакета до вызова: fmt.Println */
export interface VNsFn extends ValueBase {
  t: 'nsfn';
  p: string;
  f: string;
}

export type Value = VNil | VBool | VInt | VFloat | VString | VRune | VSlice | VArray | VStruct | VMap | VFunc | VPkg | VNsFn;

export const NIL: VNil = { t: 'nil' };

export function isTruthy(v: Value): boolean {
  if (v.t === 'nil') return false;
  if (v.t === 'bool') return v.v;
  if (v.t === 'int') return v.v !== 0n;
  if (v.t === 'float') return v.v !== 0;
  if (v.t === 'string') return v.v.length > 0;
  return true;
}

export function valueTypeString(v: Value): string {
  switch (v.t) {
    case 'int':
      return 'int';
    case 'float':
      return 'float64';
    case 'string':
      return 'string';
    case 'bool':
      return 'bool';
    case 'rune':
      return 'rune';
    case 'nil':
      return 'nil';
    case 'slice':
      return '[]' + (v as VSlice).elem;
    case 'array':
      return 'array';
    case 'struct':
      return (v as VStruct).name || 'struct';
    case 'map':
      return 'map';
    case 'func':
      return 'func';
    case 'pkg':
      return 'package ' + (v as VPkg).p;
    case 'nsfn':
      return (v as VNsFn).f;
    default:
      return 'unknown';
  }
}

export function asInterface(v: Value): { value: Value; goType: string } {
  return { value: v, goType: valueTypeString(v) };
}
