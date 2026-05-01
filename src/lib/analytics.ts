type LearningEventType =
  | 'lesson_opened'
  | 'solution_progress_updated'
  | 'achievements_opened';

interface LearningEventPayload {
  userId: string;
  type: LearningEventType;
  meta?: Record<string, string | number | boolean | null>;
}

interface LearningAnalyticsStore {
  totalLessonsOpened: number;
  totalAchievementsOpens: number;
  lastSolvedCount: number;
  events: Array<LearningEventPayload & { at: string }>;
}

const STORE_KEY = (userId: string) => `go_tutor_learning_analytics_v1_${userId}`;

function readStore(userId: string): LearningAnalyticsStore {
  try {
    const raw = localStorage.getItem(STORE_KEY(userId));
    if (!raw) {
      return { totalLessonsOpened: 0, totalAchievementsOpens: 0, lastSolvedCount: 0, events: [] };
    }
    const parsed = JSON.parse(raw) as LearningAnalyticsStore;
    return {
      totalLessonsOpened: Number(parsed.totalLessonsOpened || 0),
      totalAchievementsOpens: Number(parsed.totalAchievementsOpens || 0),
      lastSolvedCount: Number(parsed.lastSolvedCount || 0),
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { totalLessonsOpened: 0, totalAchievementsOpens: 0, lastSolvedCount: 0, events: [] };
  }
}

function writeStore(userId: string, store: LearningAnalyticsStore) {
  try {
    localStorage.setItem(STORE_KEY(userId), JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function trackLearningEvent(payload: LearningEventPayload) {
  const store = readStore(payload.userId);
  if (payload.type === 'lesson_opened') {
    store.totalLessonsOpened += 1;
  }
  if (payload.type === 'achievements_opened') {
    store.totalAchievementsOpens += 1;
  }
  if (payload.type === 'solution_progress_updated' && typeof payload.meta?.solvedCount === 'number') {
    store.lastSolvedCount = payload.meta.solvedCount;
  }
  store.events.unshift({ ...payload, at: new Date().toISOString() });
  store.events = store.events.slice(0, 200);
  writeStore(payload.userId, store);
}

