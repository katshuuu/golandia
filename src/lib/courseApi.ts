import { BackendLesson, CourseManifest, TaskCheck } from './types';
import localManifest from '../../lessons/course_manifest.json';
import { runGoProgram } from './goEmulator/miniRun';

interface LessonsModuleFile {
  lessons: BackendLesson[];
}

const lessonModules = import.meta.glob<LessonsModuleFile>('../../lessons/module_*.json', {
  import: 'default',
});
const localLessonsById: Record<string, BackendLesson> = {};
let lessonsCacheReady = false;

async function ensureLessonsCache() {
  if (lessonsCacheReady) return;
  const loadedModules = await Promise.all(
    Object.values(lessonModules).map((loadModule) => loadModule())
  );

  loadedModules.forEach((moduleFile) => {
    moduleFile.lessons.forEach((lesson) => {
      localLessonsById[lesson.id] = lesson;
    });
  });
  lessonsCacheReady = true;
}

export async function fetchManifest(): Promise<CourseManifest> {
  return localManifest as CourseManifest;
}

export async function fetchBackendLesson(id: string): Promise<BackendLesson> {
  await ensureLessonsCache();
  const lesson = localLessonsById[id];
  if (!lesson) {
    throw new Error(`Не удалось загрузить урок: ${id}`);
  }
  return lesson;
}

export async function runBackendSandbox(code: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return runGoProgram(code);
}

export async function checkBackendTask(stdout: string, code: string, check: TaskCheck): Promise<{ ok: boolean; reason: string }> {
  const output = stdout.trim();

  if (check.type === 'output') {
    const expected = check.expected.trim();
    const ok = output === expected;
    return { ok, reason: ok ? 'ok' : `Ожидался вывод: ${expected}` };
  }

  if (check.type === 'contains') {
    const missing = check.contains.filter((needle) => !output.includes(needle));
    return {
      ok: missing.length === 0,
      reason: missing.length === 0 ? 'ok' : `Не найдено в выводе: ${missing.join(', ')}`,
    };
  }

  if (check.type === 'regex') {
    try {
      const matcher = new RegExp(check.pattern);
      const ok = matcher.test(output);
      return { ok, reason: ok ? 'ok' : `Вывод не совпал с шаблоном: ${check.pattern}` };
    } catch {
      return { ok: false, reason: `Некорректный regex: ${check.pattern}` };
    }
  }

  if (check.type === 'combined') {
    if (check.required_code?.length) {
      const missingCode = check.required_code.filter((fragment) => !code.includes(fragment));
      if (missingCode.length > 0) {
        return { ok: false, reason: `В коде не найдены обязательные фрагменты: ${missingCode.join(', ')}` };
      }
    }

    if (check.forbidden_substr?.length) {
      const forbiddenHit = check.forbidden_substr.find((item) => code.includes(item) || output.includes(item));
      if (forbiddenHit) {
        return { ok: false, reason: `Обнаружено запрещенное выражение: ${forbiddenHit}` };
      }
    }

    if (check.expected_output !== undefined) {
      const expected = check.expected_output.trim();
      if (output !== expected) {
        return { ok: false, reason: `Ожидался вывод: ${expected}` };
      }
    }

    if (check.output_contains?.length) {
      const missing = check.output_contains.filter((needle) => !output.includes(needle));
      if (missing.length > 0) {
        return { ok: false, reason: `Не найдено в выводе: ${missing.join(', ')}` };
      }
    }

    if (check.output_regex) {
      try {
        const matcher = new RegExp(check.output_regex);
        if (!matcher.test(output)) {
          return { ok: false, reason: `Вывод не совпал с шаблоном: ${check.output_regex}` };
        }
      } catch {
        return { ok: false, reason: `Некорректный regex: ${check.output_regex}` };
      }
    }

    return { ok: true, reason: 'ok' };
  }

  const forbidden = check.forbidden_substr ?? [];
  const hit = forbidden.find((item) => code.includes(item) || output.includes(item));
  return {
    ok: !hit,
    reason: hit ? `Обнаружено запрещенное выражение: ${hit}` : 'ok',
  };
}

