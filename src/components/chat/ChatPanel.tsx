import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, User, X, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ChatMessage } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  lessonId: string;
  lessonTitle: string;
  userCode: string;
  lastOutput: string;
  /** Текст в поле ввода при открытии (например, из черновика на странице профиля). */
  initialInput?: string;
  /** Первое сообщение к репетитору при пустой истории; по умолчанию — шаблон с названием урока. */
  welcomeMessage?: string;
  /** Плейсхолдер поля ввода внизу чата. */
  inputPlaceholder?: string;
  /** Кнопка «Закрыть» в заголовке (например, плавающее окно). */
  onClose?: () => void;
  /** Развёрнуто на весь экран. */
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function ChatPanel({
  lessonId,
  lessonTitle,
  userCode,
  lastOutput,
  initialInput,
  welcomeMessage,
  inputPlaceholder,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: Props) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** Поколение загрузки: при смене урока отбрасываем ответы устаревших запросов. */
  const loadGenRef = useRef(0);
  const initialInputAppliedRef = useRef(false);

  useEffect(() => {
    initialInputAppliedRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    const seed = initialInput?.trim();
    if (!seed || initialInputAppliedRef.current) return;
    setInput(seed);
    initialInputAppliedRef.current = true;
  }, [initialInput]);

  useEffect(() => {
    void loadMessages();
  }, [lessonId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const gen = ++loadGenRef.current;
    setMessages([]);
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (gen !== loadGenRef.current) return;

    if (data && data.length > 0) {
      setMessages(data as ChatMessage[]);
    } else {
      const openingLine =
        welcomeMessage ?? `Привет! Я только что открыл урок «${lessonTitle}».`;
      await sendToTutor(openingLine, true, gen);
    }
  }

  async function sendToTutor(text: string, isWelcome = false, expectedGen?: number) {
    if (!user) return;
    if (expectedGen !== undefined && expectedGen !== loadGenRef.current) return;

    let accessToken = session?.access_token;
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData.session?.access_token;
    }
    if (expectedGen !== undefined && expectedGen !== loadGenRef.current) return;
    if (!accessToken) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        lesson_id: lessonId,
        role: 'assistant',
        content: 'Нет активной сессии. Обнови страницу или войди снова.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      lesson_id: lessonId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    if (!isWelcome) {
      setMessages(prev => [...prev, userMsg]);
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        lesson_id: lessonId,
        role: 'user',
        content: text,
      });
    }

    const historyForApi = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-tutor`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: text,
            lessonTitle,
            userCode: userCode || undefined,
            codeOutput: lastOutput || undefined,
            history: historyForApi,
          }),
        }
      );

      if (expectedGen !== undefined && expectedGen !== loadGenRef.current) return;

      const data = await res.json();
      const replyText = data.reply || 'Что-то пошло не так. Попробуй ещё раз!';

      if (expectedGen !== undefined && expectedGen !== loadGenRef.current) return;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        lesson_id: lessonId,
        role: 'assistant',
        content: replyText,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        lesson_id: lessonId,
        role: 'assistant',
        content: replyText,
      });
    } catch {
      if (expectedGen !== undefined && expectedGen !== loadGenRef.current) return;
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        lesson_id: lessonId,
        role: 'assistant',
        content: 'Не удалось подключиться к AI. Проверь соединение и попробуй снова.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    await sendToTutor(text);
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const visibleMessages = messages.filter(m => !(m.role === 'user' && m.content.startsWith('Привет! Я только что открыл урок')));

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-surface)]">
      <div className="flex shrink-0 items-center gap-3 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-app)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 border border-cyan-500/30 flex items-center justify-center">
          <Bot size={15} className="text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Геннадий Нейронович</p>
          <p className="text-[10px] text-[var(--text-muted)]">Всегда готов помочь</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" aria-hidden />
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={fullscreen ? 'Свернуть окно чата' : 'Развернуть чат на весь экран'}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              {fullscreen ? <Minimize2 size={17} strokeWidth={2} /> : <Maximize2 size={17} strokeWidth={2} />}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть чат"
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {visibleMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot size={32} className="text-[var(--border-color)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-xs">Загружаем помощника...</p>
            </div>
          </div>
        )}

        {visibleMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-400'
                : 'bg-[var(--bg-app)] border border-[var(--border-color)]'
            }`}>
              {msg.role === 'user'
                ? <User size={12} className="text-[#0D1117]" />
                : <Bot size={12} className="text-cyan-400" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-500/15 border border-cyan-500/20 text-[var(--text-primary)] rounded-tr-sm'
                : 'bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center">
              <Bot size={12} className="text-cyan-400" />
            </div>
            <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 p-3 border-t border-[var(--border-color)]">
        <div className="flex gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl p-2 focus-within:border-cyan-500/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder ?? 'Задай вопрос...'}
            rows={1}
            className="flex-1 bg-transparent text-[var(--text-primary)] text-sm resize-none focus:outline-none placeholder-[var(--text-muted)] max-h-24 leading-5"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-sm shadow-cyan-500/25"
          >
            {sending
              ? <Loader2 size={13} className="animate-spin text-[#0D1117]" />
              : <Send size={13} className="text-[#0D1117]" />
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] text-center mt-1.5">Enter — отправить · Shift+Enter — перенос строки</p>
      </div>
    </div>
  );
}
