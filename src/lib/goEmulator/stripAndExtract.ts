/**
 * Снятие //go:build, комментариев (с сохранением строк) и поиска func main.
 */

export function stripAllComments(s0: string): string {
  const lines = s0.split('\n');
  const L: string[] = [];
  for (const ln of lines) {
    const t = ln.trim();
    if (t.startsWith('//go:build') || t.startsWith('// +build ')) {
      L.push('');
      continue;
    }
    L.push(ln);
  }
  let s = L.join('\n');
  let o = '';
  let i = 0;
  const m = s.length;
  let d = false;
  let r = false;
  let b = false;
  let line = false;
  while (i < m) {
    if (b) {
      if (s[i] === '*' && s[i + 1] === '/') {
        b = false;
        o += '  ';
        i += 2;
        continue;
      }
      o += s[i] === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }
    if (line) {
      if (s[i] === '\n') {
        line = false;
        o += '\n';
      } else o += ' ';
      i += 1;
      continue;
    }
    if (d) {
      o += s[i];
      if (s[i] === '"') d = false;
      if (s[i] === '\\' && i + 1 < m) {
        o += s[i + 1];
        i += 1;
      }
      i += 1;
      continue;
    }
    if (r) {
      o += s[i] === '\n' ? ' ' : s[i];
      if (s[i] === '`') r = false;
      i += 1;
      continue;
    }
    if (s[i] === '"') {
      o += s[i];
      d = true;
      i += 1;
      continue;
    }
    if (s[i] === '`') {
      o += s[i];
      r = true;
      i += 1;
      continue;
    }
    if (s[i] === '/' && s[i + 1] === '/') {
      o += ' ';
      line = true;
      i += 2;
      continue;
    }
    if (s[i] === '/' && s[i + 1] === '*') {
      o += ' ';
      b = true;
      i += 2;
      continue;
    }
    o += s[i];
    i += 1;
  }
  return o;
}

export function extractFunctionBody(
  full: string,
  name: string,
): { body: string; startLine: number } | { err: string } {
  const re = new RegExp(`func\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'm');
  const m0 = re.exec(full);
  if (!m0) {
    return { err: `не найдена func ${name}()` };
  }
  const open = full.indexOf('{', m0.index);
  if (open < 0) {
    return { err: 'ожидалось { у функции' };
  }
  const line = 1 + (full.slice(0, m0.index).match(/\n/g) || []).length;
  let d = 0;
  let j = open;
  while (j < full.length) {
    const c = full[j];
    if (c === '"') {
      j += 1;
      while (j < full.length && full[j] !== '"') {
        if (full[j] === '\\') {
          j += 1;
        }
        j += 1;
      }
      if (j < full.length) {
        j += 1;
      }
      continue;
    }
    if (c === '`') {
      j += 1;
      while (j < full.length && full[j] !== '`') {
        j += 1;
      }
      if (j < full.length) {
        j += 1;
      }
      continue;
    }
    if (c === "'") {
      j += 1;
      if (j < full.length && full[j] === '\\') {
        j += 2;
      } else {
        j += 1;
      }
      while (j < full.length && full[j] !== "'") {
        j += 1;
      }
      if (j < full.length) {
        j += 1;
      }
      continue;
    }
    if (c === '{') {
      d += 1;
    } else if (c === '}') {
      d -= 1;
      if (d === 0) {
        return { body: full.slice(open + 1, j), startLine: line };
      }
    }
    j += 1;
  }
  return { err: 'не сбалансированы { } в функции' };
}
