import { useState, useEffect, useCallback } from 'react';
import { Play, CheckSquare, BookOpen, Code2, ChevronRight, Lightbulb, X, CheckCircle2, MessageSquare, ChevronLeft } from 'lucide-react';
import { Lesson, Solution, TaskCheck } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/lesson/MarkdownRenderer';
import CodeEditor from '../components/lesson/CodeEditor';
import OutputPanel from '../components/lesson/OutputPanel';
import ChatPanel from '../components/chat/ChatPanel';
import { checkBackendTask, fetchBackendLesson, runBackendSandbox } from '../lib/courseApi';

interface Props {
  lesson: Lesson;
  onBack: () => void;
  onSolutionUpdate: () => void;
}

interface LessonTaskView {
  id?: string;
  description: string;
  starter_code: string;
  expected_output: string;
  hint: string;
  check?: TaskCheck;
}

const STORAGE_KEY = (lessonId: string, userId: string) => `go_tutor_code_${lessonId}_${userId}`;

export default function LessonPage({ lesson, onBack, onSolutionUpdate }: Props) {
  const { user } = useAuth();
  const [task, setTask] = useState<LessonTaskView | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [theoryHtml, setTheoryHtml] = useState('');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [outputError, setOutputError] = useState('');
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'theory' | 'task'>('theory');
  const [showHint, setShowHint] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [lastOutput, setLastOutput] = useState('');

  useEffect(() => {
    loadTask();
  }, [lesson.id]);

  async function loadTask() {
    let backendTask: LessonTaskView | null = null;
    let backendTheoryHtml = '';
    try {
      const backendLesson = await fetchBackendLesson(lesson.id);
      backendTheoryHtml = backendLesson.theory_html || '';
      backendTask = {
        description: backendLesson.task.description,
        starter_code: backendLesson.task.starter_code,
        expected_output: '',
        hint: '',
        check: backendLesson.task.check,
      };
    } catch {
      backendTask = null;
      backendTheoryHtml = '';
    }

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('order_num')
      .limit(1)
      .maybeSingle();
    setTheoryHtml(backendTheoryHtml);

    const mergedTask: LessonTaskView | null = backendTask
      ? {
          ...backendTask,
          id: taskData?.id,
          expected_output: taskData?.expected_output || '',
          hint: taskData?.hint || '',
        }
      : taskData
      ? {
          id: taskData.id,
          description: taskData.description,
          starter_code: taskData.starter_code,
          expected_output: taskData.expected_output || '',
          hint: taskData.hint || '',
        }
      : null;
    setTask(mergedTask);

    const storageKey = STORAGE_KEY(lesson.id, user?.id || 'anon');
    const saved = localStorage.getItem(storageKey);

    if (user && taskData) {
      const { data: solData } = await supabase
        .from('solutions')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskData.id)
        .maybeSingle();

      setSolution(solData as Solution | null);
      setCode(saved || solData?.code || mergedTask?.starter_code || '');
    } else {
      setSolution(null);
      setCode(saved || mergedTask?.starter_code || '');
    }
  }

  const saveCodeLocally = useCallback((newCode: string) => {
    const storageKey = STORAGE_KEY(lesson.id, user?.id || 'anon');
    localStorage.setItem(storageKey, newCode);
  }, [lesson.id, user?.id]);

  function handleCodeChange(val: string) {
    setCode(val);
    saveCodeLocally(val);
  }

  async function handleRun() {
    if (running) return;
    setRunning(true);
    setOutput('');
    setOutputError('');

    try {
      const data = await runBackendSandbox(code);
      if (!data.ok || data.stderr) {
        setOutputError(data.stderr || 'Ошибка запуска');
        setLastOutput(data.stderr || 'Ошибка запуска');
      } else {
        setOutput(data.stdout || '(программа завершилась без вывода)');
        setLastOutput(data.stdout || '');
      }
    } catch {
      setOutputError('Не удалось подключиться к песочнице. Проверь соединение.');
    } finally {
      setRunning(false);
    }
  }

  async function handleCheck() {
    if (!task || checking || !user) return;
    setChecking(true);
    setOutput('');
    setOutputError('');

    try {
      const data = await runBackendSandbox(code);

      if (!data.ok || data.stderr) {
        setOutputError(data.stderr || 'Ошибка запуска');
        setLastOutput(data.stderr || 'Ошибка запуска');
        await saveSolution('failed');
        showNotification('error', 'Код содержит ошибку. Почитай описание ошибки и попробуй ещё!');
      } else {
        const programOutput = (data.stdout || '').trim();
        setOutput(programOutput);
        setLastOutput(programOutput);

        let isSolved = checkSolution(programOutput, task);
        if (task.check) {
          const checked = await checkBackendTask(programOutput, code, task.check);
          isSolved = checked.ok;
        }

        if (isSolved) {
          await saveSolution('solved');
          onSolutionUpdate();
          showNotification('success', 'Отлично! Задание выполнено! Ты крутой!');
        } else {
          await saveSolution('failed');
          showNotification('error', 'Вывод не совпадает с ожидаемым. Попробуй ещё раз!');
        }
      }
    } catch {
      showNotification('error', 'Ошибка при проверке. Попробуй ещё раз.');
    } finally {
      setChecking(false);
    }
  }

  function checkSolution(programOutput: string, t: LessonTaskView): boolean {
    const expected = t.expected_output?.trim();
    if (!expected) {
      return programOutput.length > 0 && !programOutput.toLowerCase().includes('error');
    }
    const normalizedOutput = programOutput.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expected.toLowerCase().replace(/\s+/g, ' ').trim();

    if (normalizedOutput === normalizedExpected) return true;
    if (normalizedOutput.includes(normalizedExpected)) return true;
    return false;
  }

  async function saveSolution(status: 'solved' | 'failed') {
    if (!user || !task?.id) return;
    await supabase
      .from('solutions')
      .upsert({
        user_id: user.id,
        task_id: task.id,
        code,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id' });

    const { data } = await supabase
      .from('solutions')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .maybeSingle();
    setSolution(data as Solution | null);
  }

  function showNotification(type: 'success' | 'error', text: string) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }

  return (
    <div className="flex flex-col h-full relative">
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border transition-all animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          <span className="text-sm font-medium">{notification.text}</span>
          <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Уроки</span>
        </button>
        <ChevronRight size={14} className="text-[var(--border-color)]" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[var(--text-primary)] font-semibold text-base truncate">{lesson.title}</span>
          {solution?.status === 'solved' && (
            <span className="shrink-0 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} />
              Решено
            </span>
          )}
        </div>

        <div className="flex gap-1 bg-[var(--bg-app)] rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'theory' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen size={12} />
            <span className="hidden sm:inline">Теория</span>
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'task' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Code2 size={12} />
            <span className="hidden sm:inline">Задание</span>
          </button>
        </div>

        <button
          onClick={() => setChatOpen(v => !v)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            chatOpen
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
          }`}
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">AI-помощник</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab === 'theory' ? (
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
              {theoryHtml ? (
                <div className="lesson-theory-html" dangerouslySetInnerHTML={{ __html: theoryHtml }} />
              ) : (
                <MarkdownRenderer content={lesson.content} />
              )}
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              {task && (
                <div className="px-4 pt-4 pb-3 border-b border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckSquare size={13} className="text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)] text-sm leading-relaxed">{task.description}</p>
                      {task.expected_output && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)]">Ожидаемый вывод:</span>
                          <code className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-mono">
                            {task.expected_output}
                          </code>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowHint(v => !v)}
                      className="shrink-0 flex items-center gap-1.5 text-[10px] text-yellow-400/70 hover:text-yellow-400 transition-colors border border-yellow-400/20 hover:border-yellow-400/40 px-2.5 py-1 rounded-xl"
                    >
                      <Lightbulb size={11} />
                      Подсказка
                    </button>
                  </div>
                  {showHint && task.hint && (
                    <div className="mt-3 ml-9 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                      <p className="text-yellow-400/80 text-xs leading-relaxed">{task.hint}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden border-b border-[var(--border-color)]" style={{ minHeight: 0 }}>
                  <CodeEditor
                    value={code}
                    onChange={handleCodeChange}
                    starterCode={task?.starter_code || ''}
                  />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-color)] shrink-0">
                  <button
                    onClick={handleRun}
                    disabled={running || checking}
                    className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play size={12} fill="currentColor" />
                    Запустить
                  </button>
                  <button
                    onClick={handleCheck}
                    disabled={running || checking || !user}
                    className="flex items-center gap-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckSquare size={12} />
                    Проверить
                  </button>
                  {solution?.status === 'solved' && (
                    <div className="flex items-center gap-1.5 ml-auto text-emerald-400 text-xs">
                      <CheckCircle2 size={13} />
                      <span>Задание решено!</span>
                    </div>
                  )}
                </div>

                <div className="h-40 shrink-0 overflow-hidden">
                  <OutputPanel
                    output={output}
                    error={outputError}
                    running={running || checking}
                    solved={solution?.status === 'solved'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="w-80 shrink-0 border-l border-[var(--border-color)] flex flex-col overflow-hidden">
            {user && (
              <ChatPanel
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                userCode={code}
                lastOutput={lastOutput}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
