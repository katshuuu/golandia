import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import brandLogo from '../../../8c8693f6-d925-4da1-9848-66491718ece0/images/10_118.svg';

export default function AuthPage() {
  const { signIn, signUp, sendPasswordResetEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      targetRef.current = { x, y };
    };

    const onMouseLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    const tick = () => {
      cursorRef.current.x += (targetRef.current.x - cursorRef.current.x) * 0.08;
      cursorRef.current.y += (targetRef.current.y - cursorRef.current.y) * 0.08;
      setCursor({ ...cursorRef.current });
      frameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseLeave);
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseLeave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await sendPasswordResetEmail(email);
      if (error) setError(error);
      else {
        setSuccess(
          'Если такой аккаунт есть, мы отправили на почту ссылку для сброса пароля. Открой письмо и перейди по ссылке.',
        );
      }
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSuccess('Аккаунт создан! Теперь войди с теми же данными.');
    }
    setLoading(false);
  }

  return (
    <div
      className="auth-scene min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-4 relative overflow-hidden transition-colors"
      style={
        {
          '--mx': cursor.x.toFixed(4),
          '--my': cursor.y.toFixed(4),
        } as React.CSSProperties
      }
    >
      <div
        className={`auth-3d-layer ${mode === 'register' ? 'is-register' : ''}`}
        aria-hidden="true"
      >
        <div className="auth-orb auth-orb--a" />
        <div className="auth-orb auth-orb--b" />
        <div className="auth-orb auth-orb--c" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-white flex items-center justify-center shadow-lg shadow-cyan-500/25 p-2">
              <img src={brandLogo} alt="Goландия" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight font-['NAURYZREDKEDS']">Goландия</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Учи Go с AI-помощником</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl transition-colors">
          {mode !== 'forgot' ? (
            <div className="flex gap-1 p-1 bg-[var(--bg-app)] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'register'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Регистрация
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center">Сброс пароля</h2>
              <p className="text-xs text-[var(--text-muted)] text-center mt-1">
                Укажи email — пришлём ссылку для нового пароля
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="gopher@example.com"
                  autoComplete="email"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm text-[var(--text-secondary)]">Пароль</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-xs text-cyan-400/90 hover:text-cyan-300 transition-colors"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="минимум 6 символов"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-emerald-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#0D1117] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'forgot' ? (
                <>Отправить ссылку на почту</>
              ) : (
                <>
                  {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <p className="text-center text-sm">
                <button
                  type="button"
                  className="text-cyan-400/90 hover:text-cyan-300 transition-colors"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                >
                  ← Вернуться ко входу
                </button>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-6">
          Go — один из самых востребованных языков в IT в 2026
        </p>
      </div>
    </div>
  );
}
