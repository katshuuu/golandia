/**
 * Разбить тело блока на операторы (игнор ; и \n внутри строк, (), [], {}).
 */
export function splitBlockStatements(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  const m = s.length;
  let dStr = false;
  let dRaw = false;
  let dRune = false;
  let p = 0;
  let brk = 0;
  let cbr = 0; // { внутри stmt — вложенные блоки
  const flush = () => {
    const t = cur.trim();
    if (t) {
      out.push(t);
    }
    cur = '';
  };
  while (i < m) {
    const c = s[i];
    if (dStr) {
      cur += c;
      if (c === '"') dStr = false;
      if (c === '\\' && i + 1 < m) {
        cur += s[i + 1];
        i += 1;
      }
      i += 1;
      continue;
    }
    if (dRaw) {
      cur += c;
      if (c === '`') dRaw = false;
      i += 1;
      continue;
    }
    if (dRune) {
      cur += c;
      if (c === "'") dRune = false;
      if (c === '\\' && i + 1 < m) {
        cur += s[i + 1];
        i += 1;
      }
      i += 1;
      continue;
    }
    if (c === '"') {
      dStr = true;
      cur += c;
      i += 1;
      continue;
    }
    if (c === '`') {
      dRaw = true;
      cur += c;
      i += 1;
      continue;
    }
    if (c === "'") {
      dRune = true;
      cur += c;
      i += 1;
      continue;
    }
    if (c === '(') {
      p += 1;
      cur += c;
      i += 1;
      continue;
    }
    if (c === ')') {
      p -= 1;
      cur += c;
      i += 1;
      continue;
    }
    if (c === '[') {
      brk += 1;
      cur += c;
      i += 1;
      continue;
    }
    if (c === ']') {
      brk -= 1;
      cur += c;
      i += 1;
      continue;
    }
    if (c === '{' && p === 0 && brk === 0) {
      cbr += 1;
      cur += c;
      i += 1;
      continue;
    }
    if (c === '}' && p === 0 && brk === 0) {
      cbr -= 1;
      cur += c;
      i += 1;
      continue;
    }
    if (cbr > 0) {
      cur += c;
      i += 1;
      continue;
    }
    if ((c === ';' || c === '\n') && p === 0 && brk === 0) {
      const t0 = cur.trim();
      if (c === ';' && t0.startsWith('for') && !t0.includes('{')) {
        // Заголовок for с ; — не разбивать на отдельные инструкции
        cur += c;
        i += 1;
        continue;
      }
      if (c === '\n' && t0.startsWith('for') && !t0.includes('{')) {
        cur += c;
        i += 1;
        continue;
      }
      flush();
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  flush();
  return out;
}
