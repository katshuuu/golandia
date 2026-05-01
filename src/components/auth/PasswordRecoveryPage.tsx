import { FormEvent, useState } from 'react';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import brandLogo from '../../../8c8693f6-d925-4da1-9848-66491718ece0/images/10_118.svg';

const MIN_LEN = 6;

export default function PasswordRecoveryPage() {
  const { updatePasswordAfterRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LEN) {
      setError(`Пароль должен быть не короче ${MIN_LEN} символов`);
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const { error: err } = await updatePasswordAfterRecovery(password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="auth-scene min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Пароль обновлён</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Теперь можно пользоваться платформой с новым паролем.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-scene min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-white flex items-center justify-center shadow-lg shadow-cyan-500/25 p-2">
              <img src={brandLogo} alt="Goландия" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight font-['NAURYZREDKEDS']">
              Новый пароль
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            Придумай новый пароль для входа после подтверждения почты.
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Новый пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_LEN}
                  autoComplete="new-password"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Повтор пароля</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={MIN_LEN}
                  autoComplete="new-password"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#0D1117] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Сохранить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
