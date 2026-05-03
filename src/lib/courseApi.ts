import { BackendLesson, CourseManifest, TaskCheck } from './types';
import localManifest from '../../lessons/course_manifest.json';
import { runGoProgram } from './goEmulator/miniRun';

interface LessonsModuleFile {
  lessons: BackendLesson[];
}

const lessonModules = import.meta.glob<LessonsModuleFile>('../../lessons/module_*.json', {
  import: 'default',
});

/** Диапазоны tour-NNN → один JSON-файл модуля (избегаем загрузки всех модулей при первом уроке). */
const TOUR_NUM_TO_MODULE_FILE: { min: number; max: number; file: string }[] = [
  { min: 1, max: 2, file: 'module_01.json' },
  { min: 3, max: 18, file: 'module_02.json' },
  { min: 19, max: 31, file: 'module_03.json' },
  { min: 32, max: 57, file: 'module_04.json' },
  { min: 58, max: 80, file: 'module_05.json' },
  { min: 81, max: 83, file: 'module_06.json' },
  { min: 84, max: 92, file: 'module_07.json' },
];

const localLessonsById: Record<string, BackendLesson> = {};
const loadedModuleFiles = new Set<string>();
let allLessonsCacheReady = false;

function moduleFileForTourLessonId(id: string): string | undefined {
  const m = /^tour-(\d+)$/.exec(id);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  const row = TOUR_NUM_TO_MODULE_FILE.find((r) => n >= r.min && n <= r.max);
  return row?.file;
}

function findModuleLoader(file: string) {
  const suffix = `lessons/${file}`;
  const directKey = `../../lessons/${file}`;
  if (lessonModules[directKey]) return lessonModules[directKey];
  const hit = Object.entries(lessonModules).find(([path]) =>
    path.replace(/\\/g, '/').endsWith(suffix)
  );
  return hit?.[1];
}

async function loadSingleModuleFile(file: string) {
  if (loadedModuleFiles.has(file)) return;
  const loader = findModuleLoader(file);
  if (!loader) {
    throw new Error(`Не найден загрузчик для ${file}`);
  }
  const moduleFile = await loader();
  moduleFile.lessons.forEach((lesson) => {
    localLessonsById[lesson.id] = lesson;
  });
  loadedModuleFiles.add(file);
}

async function ensureAllLessonsCache() {
  if (allLessonsCacheReady) return;
  await Promise.all(
    TOUR_NUM_TO_MODULE_FILE.map(({ file }) => loadSingleModuleFile(file))
  );
  allLessonsCacheReady = true;
}

async function ensureLessonInCache(id: string) {
  if (localLessonsById[id]) return;

  const file = moduleFileForTourLessonId(id);
  if (file) {
    await loadSingleModuleFile(file);
    if (localLessonsById[id]) return;
  }

  await ensureAllLessonsCache();
}

export async function fetchManifest(): Promise<CourseManifest> {
  return localManifest as CourseManifest;
}

export async function fetchBackendLesson(id: string): Promise<BackendLesson> {
  await ensureLessonInCache(id);
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

