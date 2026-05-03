import logoImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/23_239.svg';
import avatarImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/34_482.svg';
import frameImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_276.svg';
import circleOuter from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_284.svg';
import circleInner from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_285.svg';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fileToAvatarJpegDataUrl } from '../lib/resizeAvatar';
import ChatPanel from '../components/chat/ChatPanel';
import { PROFILE_CHAT_LESSON_ID, PROFILE_CHAT_LESSON_TITLE } from '../lib/profileChat';

interface ProfilePageProps {
  displayName: string;
  avatarUrl: string;
  solvedCount: number;
  totalCount: number;
  goal: string;
  onSaveGoal: (goal: string) => Promise<void>;
  onSaveDisplayName: (name: string) => Promise<void>;
  onAvatarChange: (dataUrl: string) => Promise<void>;
}

export default function ProfilePage({
  displayName,
  avatarUrl,
  solvedCount,
  totalCount,
  goal,
  onSaveGoal,
  onSaveDisplayName,
  onAvatarChange,
}: ProfilePageProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  const [goalDraft, setGoalDraft] = useState(goal);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [nameSaving, setNameSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [profileChatDraft, setProfileChatDraft] = useState('');
  const [profileChatOpen, setProfileChatOpen] = useState(false);
  const [profileChatFullscreen, setProfileChatFullscreen] = useState(false);
  const [profileChatPanelKey, setProfileChatPanelKey] = useState(0);

  useEffect(() => {
    setGoalDraft(goal);
  }, [goal]);

  useEffect(() => {
    setNameDraft(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!profileChatOpen) setProfileChatFullscreen(false);
  }, [profileChatOpen]);

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    const next = nameDraft.trim();
    if (!next || next === displayName.trim() || nameSaving) return;
    setNameSaving(true);
    try {
      await onSaveDisplayName(next);
    } finally {
      setNameSaving(false);
    }
  }

  async function handleAvatarPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarSaving(true);
    try {
      const dataUrl = await fileToAvatarJpegDataUrl(file);
      await onAvatarChange(dataUrl);
    } catch {
      /* пользователь увидит прежнее фото */
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarSaving(true);
    try {
      await onAvatarChange('');
    } finally {
      setAvatarSaving(false);
    }
  }

  function handleOpenProfileChat(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setProfileChatPanelKey((k) => k + 1);
    setProfileChatOpen(true);
  }

  const greetingName = displayName.trim() || 'студент';

  return (
    <section className="profile-screen">
      <div className="profile-grid-outer">
        <div className="profile-grid">
        <article className="profile-card profile-greeting-card">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="profile-file-input-hidden"
            onChange={handleAvatarPick}
          />

          <div className="profile-frame-stack">
            <div className="profile-frame-hit" aria-hidden />
            <div className="profile-frame-photo-slot">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="profile-frame-photo-img" />
              ) : (
                <div className="profile-frame-photo-placeholder" aria-hidden />
              )}
              {avatarSaving && (
                <div className="profile-frame-photo-saving">
                  <Loader2 size={28} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="profile-frame-hover-overlay">
              <div className="profile-frame-hover-actions">
                <button
                  type="button"
                  className="profile-change-photo-btn"
                  disabled={avatarSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? 'Изменить фото' : 'Добавить фото'}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    className="profile-remove-photo-btn"
                    disabled={avatarSaving}
                    onClick={() => void handleRemoveAvatar()}
                  >
                    Убрать фото
                  </button>
                ) : null}
              </div>
            </div>
            <img src={frameImage} alt="Decorative frame" className="profile-frame-image" />
          </div>
          <h2 className="profile-greeting-title">Привет, {greetingName}!</h2>
          <p className="profile-greeting-subtitle">Готов показать прогресс сегодня?</p>

          <form className="profile-name-edit-form" onSubmit={handleSaveName}>
            <label htmlFor="profile-display-name" className="profile-name-edit-label">
              Как к тебе обращаться
            </label>
            <div className="profile-name-edit-row">
              <input
                id="profile-display-name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="profile-name-edit-input"
                placeholder="Имя или ник"
              />
              <button
                type="submit"
                className="profile-name-save-btn"
                disabled={
                  nameSaving ||
                  !nameDraft.trim() ||
                  nameDraft.trim() === displayName.trim()
                }
              >
                {nameSaving ? '...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </article>

        <article className="profile-card profile-progress-card">
          <h3 className="profile-progress-title">Прогресс по курсу</h3>
          <div className="profile-progress-main">
            <div>
              <div className="profile-progress-num">
                {solvedCount}/{totalCount}
              </div>
              <div className="profile-progress-label">занятий</div>
            </div>

            <div className="profile-circle-wrap">
              <img src={circleOuter} alt="" className="profile-circle-outer" />
              <img src={circleInner} alt="" className="profile-circle-inner" />
              <span className="profile-circle-percent">{progressPercent}%</span>
            </div>
          </div>
        </article>

        <article className="profile-card profile-goal-card">
          <p className="profile-goal-text">Приближение цели в твоих руках -</p>
          <p className="profile-goal-text">помни, что ты хочешь</p>
          <form
            className="profile-goal-form"
            onSubmit={(event) => {
              event.preventDefault();
              const nextGoal = goalDraft.trim();
              if (!nextGoal) return;
              void onSaveGoal(nextGoal);
            }}
          >
            <input
              value={goalDraft}
              onChange={(event) => setGoalDraft(event.target.value)}
              placeholder="Укажи свою цель"
              className="profile-goal-input"
            />
            <button type="submit" className="profile-goal-save-btn">
              сохранить
            </button>
          </form>
          <div className="profile-goal-mascot" aria-hidden />
        </article>

        <article className="profile-card profile-questions-card">
          <div className="profile-questions-header">
            <img src={logoImage} alt="Logo" className="profile-logo-small" />
            <img src={avatarImage} alt="Avatar" className="profile-avatar-small" />
          </div>
          <h3 className="profile-questions-title">Есть вопросы? Задавай!</h3>
          <p className="profile-questions-subtitle">Кусаться не буду, честно</p>
          <div className="profile-chat-bubble" aria-hidden />
          <form className="profile-question-form" onSubmit={handleOpenProfileChat}>
            <input
              value={profileChatDraft}
              onChange={(event) => setProfileChatDraft(event.target.value)}
              placeholder="Непонятен один момент..."
              className="profile-question-input"
            />
            <button type="submit" className="profile-question-send-btn" disabled={!user}>
              Открыть чат
            </button>
          </form>
        </article>
      </div>
      </div>

      {profileChatOpen && user && (
        <div
          className={`fixed z-[100] flex flex-col overflow-hidden bg-[var(--bg-surface)] ${
            profileChatFullscreen
              ? 'inset-0 h-[100dvh] w-full max-h-none rounded-none border-0 shadow-none'
              : 'right-4 bottom-4 max-sm:right-3 max-sm:bottom-3 h-[452px] max-h-[calc(100dvh-5.75rem)] w-[352px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[var(--border-color)] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]'
          }`}
          role="dialog"
          aria-label="Чат с AI-помощником"
          aria-modal={profileChatFullscreen ? 'true' : undefined}
        >
          <ChatPanel
            key={profileChatPanelKey}
            lessonId={PROFILE_CHAT_LESSON_ID}
            lessonTitle={PROFILE_CHAT_LESSON_TITLE}
            userCode=""
            lastOutput=""
            initialInput={profileChatDraft}
            welcomeMessage="Привет! Открылась страница профиля — отвечу на вопросы по курсу и обучению."
            inputPlaceholder="Непонятен один момент..."
            fullscreen={profileChatFullscreen}
            onToggleFullscreen={() => setProfileChatFullscreen((v) => !v)}
            onClose={() => setProfileChatOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
