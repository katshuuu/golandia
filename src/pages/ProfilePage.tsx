import logoImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/23_239.svg';
import avatarImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/34_482.svg';
import frameImage from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_276.svg';
import circleOuter from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_284.svg';
import circleInner from '../../1bee0090-5ba4-4c1e-b874-05ea44aad00b/images/25_285.svg';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  userName: string;
  solvedCount: number;
  totalCount: number;
  goal: string;
  onSaveGoal: (goal: string) => Promise<void>;
}

export default function ProfilePage({ userName, solvedCount, totalCount, goal, onSaveGoal }: ProfilePageProps) {
  const { session } = useAuth();
  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  const [goalDraft, setGoalDraft] = useState(goal);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  useEffect(() => {
    setGoalDraft(goal);
  }, [goal]);

  async function handleAskTutor(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || !session || loadingReply) return;

    const message = question.trim();
    setQuestion('');
    setLoadingReply(true);
    setReply('');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-tutor`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message,
          lessonTitle: 'Личный кабинет',
          history: [],
        }),
      });

      const data = await res.json();
      setReply(data.reply || 'Пока не получилось получить ответ. Попробуй ещё раз.');
    } catch {
      setReply('Не удалось подключиться к AI-репетитору. Проверь соединение и повтори попытку.');
    } finally {
      setLoadingReply(false);
    }
  }

  return (
    <section className="profile-screen">
      <div className="profile-grid">
        <article className="profile-card profile-greeting-card">
          <img src={frameImage} alt="Decorative frame" className="profile-frame-image" />
          <h2 className="profile-greeting-title">Привет, {userName}!</h2>
          <p className="profile-greeting-subtitle">Готов показать прогресс сегодня?</p>
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
          <form className="profile-question-form" onSubmit={handleAskTutor}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Непонятен один момент..."
              className="profile-question-input"
            />
            <button
              type="submit"
              className="profile-question-send-btn"
              disabled={!question.trim() || loadingReply || !session}
            >
              {loadingReply ? '...' : 'отправить'}
            </button>
          </form>
          {reply && <div className="profile-tutor-reply">{reply}</div>}
        </article>
      </div>
    </section>
  );
}
