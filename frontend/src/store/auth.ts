export interface AuthUser {
  email: string;
  name: string;
  createdAt: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

const USERS_KEY = "go_tutor_users_v1";
const SESSION_KEY = "go_tutor_session_v1";

const DEMO_EMAIL = "demo@gotutor.local";
const DEMO_PASSWORD = "demo12345";

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedDemoUser() {
  const users = readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === DEMO_EMAIL);
  if (exists) return;
  users.push({
    email: DEMO_EMAIL,
    name: "Demo User",
    password: DEMO_PASSWORD,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export function getDemoCredentials() {
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

export function getCurrentUser(): AuthUser | null {
  seedDemoUser();
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as { email?: string };
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === (session.email || "").toLowerCase());
    return user ? toPublicUser(user) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function login(email: string, password: string): { ok: true; user: AuthUser } | { ok: false; error: string } {
  seedDemoUser();
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) {
    return { ok: false, error: "Неверный email или пароль." };
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
  return { ok: true, user: toPublicUser(user) };
}

export function register(name: string, email: string, password: string): { ok: true; user: AuthUser } | { ok: false; error: string } {
  seedDemoUser();
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (normalizedName.length < 2) {
    return { ok: false, error: "Имя должно содержать минимум 2 символа." };
  }
  if (!normalizedEmail.includes("@")) {
    return { ok: false, error: "Введите корректный email." };
  }
  if (normalizedPassword.length < 6) {
    return { ok: false, error: "Пароль должен содержать минимум 6 символов." };
  }

  const users = readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return { ok: false, error: "Пользователь с таким email уже зарегистрирован." };
  }

  const created: StoredUser = {
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(created);
  writeUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: created.email }));
  return { ok: true, user: toPublicUser(created) };
}
