"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_PRIMARY, SA_CYAN } from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

export type PlanQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

export type PlanBlock = {
  id: string;
  kind: string;
  text?: string;
  title?: string;
  body?: string;
  word?: string;
  sub?: string;
  items?: Array<string | { n?: number; label?: string }>;
  left?: { title?: string; body?: string };
  right?: { title?: string; body?: string };
  label?: string;
  code?: string;
  html?: string;
  prompt?: string;
  options?: string[];
  correct_index?: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

export type PlanDay = {
  day: number;
  title: string;
  focus: string;
  minutes: number;
  intro?: PlanBlock[];
  teach?: PlanBlock[];
  questions: PlanQuestion[];
};

export type InteractivePlan = {
  format?: string;
  topic: string;
  xp_per_correct?: number;
  minutes_per_day?: number;
  started_at?: string;
  days: PlanDay[];
};

type Progress = {
  unlockedDay: number;
  completedDays: number[];
  xp: number;
  startedAt: string;
  lastCompletedDate?: string;
};

type Phase = "intro" | "learn" | "test";

type Props = {
  plan: InteractivePlan;
  storageKey?: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T12:00:00");
  const b = new Date(toISO + "T12:00:00");
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function loadProgress(key: string, maxDay: number, startedAt?: string): Progress {
  const fallbackStart = startedAt || todayISO();
  if (typeof window === "undefined") {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
    const p = JSON.parse(raw) as Progress;
    return {
      unlockedDay: Math.min(Math.max(1, p.unlockedDay || 1), maxDay),
      completedDays: Array.isArray(p.completedDays) ? p.completedDays : [],
      xp: Number(p.xp) || 0,
      startedAt: p.startedAt || fallbackStart,
      lastCompletedDate: p.lastCompletedDate,
    };
  } catch {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
}

function normalizePrompt(s: string): string {
  return s
    .toLowerCase()
    .replace(/[¿?¡!.,;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

/** Deduplica preguntas del plan en cliente (por si el backend viejo aún está). */
function dedupeDayQuestions(day: PlanDay, globalSeen: Set<string>): PlanQuestion[] {
  const out: PlanQuestion[] = [];
  for (const q of day.questions || []) {
    const key = normalizePrompt(q.prompt || "");
    if (!key || globalSeen.has(key)) continue;
    globalSeen.add(key);
    out.push(q);
  }
  return out;
}

function sanitizeLessonHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["div", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "p", "br", "b", "i"],
    ALLOWED_ATTR: ["class"],
  });
}

function LessonBlockView({
  block,
  onTapAnswer,
  picked,
  revealed,
}: {
  block: PlanBlock;
  onTapAnswer?: (idx: number) => void;
  picked?: number | null;
  revealed?: boolean;
}) {
  const kind = (block.kind || "card").toLowerCase();

  if (kind === "bot_say") {
    return (
      <div className="sa-duo-botrow sa-pop">
        <StudyAgentsBotAvatar size={64} color={SA_PRIMARY} state="idle" />
        <div className="sa-duo-bubble">
          <p>{block.text || block.body}</p>
        </div>
      </div>
    );
  }

  if (kind === "big_word") {
    return (
      <div className="sa-duo-bigword sa-pop">
        <span className="sa-duo-bigword__word">{block.word || block.title}</span>
        {block.sub ? <span className="sa-duo-bigword__sub">{block.sub}</span> : null}
      </div>
    );
  }

  if (kind === "chips") {
    const items = (block.items || []).map((it) => (typeof it === "string" ? it : it.label || "")).filter(Boolean);
    return (
      <div className="sa-duo-chips sa-pop">
        {items.map((item) => (
          <span key={item} className="sa-duo-chip">
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (kind === "vs") {
    return (
      <div className="sa-duo-vs sa-pop">
        <div className="sa-duo-vs__card sa-duo-vs__card--left">
          <strong>{block.left?.title || "A"}</strong>
          <p>{block.left?.body}</p>
        </div>
        <span className="sa-duo-vs__vs">VS</span>
        <div className="sa-duo-vs__card sa-duo-vs__card--right">
          <strong>{block.right?.title || "B"}</strong>
          <p>{block.right?.body}</p>
        </div>
      </div>
    );
  }

  if (kind === "steps") {
    const items = (block.items || [])
      .map((it, i) =>
        typeof it === "string"
          ? { n: i + 1, label: it }
          : { n: it.n || i + 1, label: it.label || "" },
      )
      .filter((it) => it.label);
    return (
      <div className="sa-duo-steps sa-pop">
        {items.map((it) => (
          <div key={`${it.n}-${it.label}`} className="sa-duo-step">
            <span className="sa-duo-step__n">{it.n}</span>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "code") {
    return (
      <div className="sa-duo-code sa-pop">
        {block.label ? <span className="sa-duo-code__label">{block.label}</span> : null}
        <pre>
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }

  if (kind === "html" && block.html) {
    const clean = sanitizeLessonHtml(block.html);
    return (
      <div
        className="sa-duo-html sa-pop"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  if (kind === "tap" && block.options && onTapAnswer) {
    const correct = block.correct_index ?? 0;
    return (
      <div className="sa-pop">
        <div className="sa-duo-botrow" style={{ marginBottom: "1rem" }}>
          <StudyAgentsBotAvatar size={52} color={SA_PRIMARY} state="idle" />
          <div className="sa-duo-bubble">
            <p>{block.prompt}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {block.options.map((opt, idx) => {
            let border = "2px solid rgba(15,23,42,0.12)";
            let bg = "#fff";
            if (revealed) {
              if (idx === correct) {
                border = "2px solid #22c55e";
                bg = "rgba(34,197,94,0.12)";
              } else if (idx === picked) {
                border = "2px solid #ef4444";
                bg = "rgba(239,68,68,0.1)";
              }
            }
            return (
              <button
                key={`${block.id}-${idx}`}
                type="button"
                disabled={!!revealed}
                className="sa-choice"
                style={{ border, background: bg }}
                onClick={() => onTapAnswer(idx)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // card / fallback
  return (
    <div className="sa-duo-card sa-pop">
      <div className="sa-duo-botrow">
        <StudyAgentsBotAvatar size={48} color={SA_PRIMARY} state="idle" />
        <div>
          <p className="sa-duo-card__title">{block.title || "Idea"}</p>
          <p className="sa-duo-card__body">{block.body || block.text}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lección Duolingo: INTRO → LEARN (gráfico + bot) → TEST (preguntas únicas).
 */
export default function StudyPlanSession({ plan, storageKey }: Props) {
  const key = storageKey || `sa_plan_${plan.topic}`;
  const days = plan.days || [];
  const xpEach = plan.xp_per_correct ?? 10;

  const daysPrepared = useMemo(() => {
    const seen = new Set<string>();
    return days.map((d) => ({
      ...d,
      intro: d.intro?.length
        ? d.intro
        : [
            {
              id: `${d.day}-i1`,
              kind: "bot_say",
              text: `Hoy: ${d.focus}. Poco texto, mucha práctica.`,
            },
            { id: `${d.day}-i2`, kind: "big_word", word: d.focus.slice(0, 18), sub: d.title },
          ],
      teach: d.teach?.length
        ? d.teach
        : [
            { id: `${d.day}-t1`, kind: "bot_say", text: `Lo básico de ${d.focus}` },
            {
              id: `${d.day}-t2`,
              kind: "chips",
              items: [d.focus, "práctica", "test"],
            },
          ],
      questions: dedupeDayQuestions(d, seen),
    }));
  }, [days]);

  const [progress, setProgress] = useState<Progress>(() =>
    loadProgress(key, days.length || 1, plan.started_at),
  );
  const [activeDay, setActiveDay] = useState<(typeof daysPrepared)[0] | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [bIndex, setBIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [dayXp, setDayXp] = useState(0);
  const [dayDone, setDayDone] = useState(false);
  const [celebrateXp, setCelebrateXp] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(progress));
    }
  }, [key, progress]);

  const today = todayISO();
  const calendarDay = Math.min(daysPrepared.length, daysBetween(progress.startedAt, today) + 1);
  const todayLesson =
    daysPrepared.find(
      (d) =>
        d.day === calendarDay &&
        !progress.completedDays.includes(d.day) &&
        d.day <= progress.unlockedDay,
    ) ||
    daysPrepared.find(
      (d) => !progress.completedDays.includes(d.day) && d.day <= progress.unlockedDay,
    ) ||
    null;

  const phaseBlocks =
    phase === "intro" ? activeDay?.intro || [] : phase === "learn" ? activeDay?.teach || [] : [];
  const currentBlock = phaseBlocks[bIndex];
  const currentQ = activeDay?.questions[qIndex];

  const totalSteps =
    (activeDay?.intro?.length || 0) +
    (activeDay?.teach?.length || 0) +
    (activeDay?.questions?.length || 0);
  const doneSteps =
    phase === "intro"
      ? bIndex
      : phase === "learn"
        ? (activeDay?.intro?.length || 0) + bIndex
        : (activeDay?.intro?.length || 0) + (activeDay?.teach?.length || 0) + qIndex;
  const dayProgress = totalSteps ? ((doneSteps + (revealed ? 0.4 : 0)) / totalSteps) * 100 : 0;

  const phaseLabel =
    phase === "intro" ? "Intro" : phase === "learn" ? "Aprende" : "Test del día";

  const startDay = (d: (typeof daysPrepared)[0]) => {
    if (d.day > progress.unlockedDay) return;
    if (d.day > calendarDay && !progress.completedDays.includes(d.day)) return;
    setActiveDay(d);
    setPhase("intro");
    setBIndex(0);
    setQIndex(0);
    setPicked(null);
    setRevealed(false);
    setDayXp(0);
    setDayDone(false);
  };

  const choose = (idx: number, correctIndex: number) => {
    if (revealed) return;
    setPicked(idx);
    setRevealed(true);
    if (idx === correctIndex) setDayXp((x) => x + xpEach);
  };

  const finishDay = () => {
    if (!activeDay) return;
    const already = progress.completedDays.includes(activeDay.day);
    const completed = already
      ? progress.completedDays
      : [...progress.completedDays, activeDay.day];
    const newXp = already ? progress.xp : progress.xp + dayXp;
    setCelebrateXp(newXp);
    setProgress({
      unlockedDay: Math.min(Math.max(progress.unlockedDay, activeDay.day + 1), daysPrepared.length),
      completedDays: completed,
      xp: newXp,
      startedAt: progress.startedAt,
      lastCompletedDate: today,
    });
    setDayDone(true);
  };

  const advanceBlock = () => {
    if (!activeDay) return;
    if (bIndex < phaseBlocks.length - 1) {
      setBIndex((i) => i + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }
    // fin de fase
    if (phase === "intro") {
      setPhase("learn");
      setBIndex(0);
      setPicked(null);
      setRevealed(false);
      return;
    }
    if (phase === "learn") {
      setPhase("test");
      setQIndex(0);
      setPicked(null);
      setRevealed(false);
      return;
    }
  };

  const advanceTest = () => {
    if (!activeDay) return;
    if (qIndex >= (activeDay.questions?.length || 0) - 1) {
      finishDay();
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  };

  const backToMap = () => {
    setActiveDay(null);
    setDayDone(false);
    setPicked(null);
    setRevealed(false);
    setBIndex(0);
    setQIndex(0);
    setPhase("intro");
  };

  // —— Día completado ——
  if (activeDay && dayDone) {
    return (
      <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`}>
        <div className="sa-duo-celebrate">
          <StudyAgentsBotAvatar size={72} color={SA_PRIMARY} state="idle" />
          <h3 className={spaceGrotesk.className}>¡Día {activeDay.day} listo!</h3>
          <p className="sa-duo-celebrate__xp">+{dayXp} XP</p>
          <p className="sa-duo-celebrate__sub">{activeDay.title} · Total {celebrateXp} XP</p>
          <p className="sa-duo-celebrate__hint">Vuelve mañana a este chat para la siguiente lección.</p>
        </div>
        <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%" }} onClick={backToMap}>
          Volver al camino →
        </button>
      </div>
    );
  }

  // —— Lección activa ——
  if (activeDay) {
    const isTap = phase !== "test" && currentBlock?.kind === "tap";
    const needsAnswer = isTap || phase === "test";

    return (
      <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`} key={`${phase}-${bIndex}-${qIndex}`}>
        <div className="sa-duo-top">
          <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
            ← Camino
          </button>
          <div className="sa-duo-phase">
            <span className={phase === "intro" ? "on" : ""}>1 Intro</span>
            <span className={phase === "learn" ? "on" : ""}>2 Aprende</span>
            <span className={phase === "test" ? "on" : ""}>3 Test</span>
          </div>
          <span className="sa-duo-xp">+{dayXp} XP</span>
        </div>
        <div className="sa-steps-progress">
          <span style={{ width: `${Math.max(8, dayProgress)}%` }} />
        </div>
        <p className="sa-duo-focus">
          {phaseLabel} · {activeDay.focus}
        </p>

        {phase !== "test" && currentBlock && (
          <>
            <LessonBlockView
              block={currentBlock}
              picked={picked}
              revealed={revealed}
              onTapAnswer={
                isTap
                  ? (idx) => choose(idx, currentBlock.correct_index ?? 0)
                  : undefined
              }
            />
            {isTap && revealed && (
              <div
                className={`sa-duo-feedback sa-pop ${picked === (currentBlock.correct_index ?? 0) ? "ok" : "bad"}`}
              >
                <p className="sa-duo-feedback__title">
                  {picked === (currentBlock.correct_index ?? 0) ? "¡Bien!" : "Casi"}
                </p>
                <p>
                  {picked === (currentBlock.correct_index ?? 0)
                    ? currentBlock.feedback_ok
                    : currentBlock.feedback_bad}
                </p>
                <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%", marginTop: "0.75rem" }} onClick={advanceBlock}>
                  Seguir →
                </button>
              </div>
            )}
            {!needsAnswer && (
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                style={{ width: "100%", marginTop: "1.25rem" }}
                onClick={advanceBlock}
              >
                {bIndex >= phaseBlocks.length - 1
                  ? phase === "intro"
                    ? "Empezar a aprender →"
                    : "Ir al test →"
                  : "Siguiente →"}
              </button>
            )}
          </>
        )}

        {phase === "test" && currentQ && (
          <>
            <div className="sa-duo-botrow" style={{ marginBottom: "1rem" }}>
              <StudyAgentsBotAvatar size={56} color={SA_PRIMARY} state="thinking" />
              <div className="sa-duo-bubble sa-duo-bubble--test">
                <p className="sa-duo-test-label">TEST · {qIndex + 1}/{activeDay.questions.length}</p>
                <p>{currentQ.prompt}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {currentQ.options.map((opt, idx) => {
                let border = "2px solid rgba(15,23,42,0.12)";
                let bg = "#fff";
                if (revealed) {
                  if (idx === currentQ.correct_index) {
                    border = "2px solid #22c55e";
                    bg = "rgba(34,197,94,0.12)";
                  } else if (idx === picked) {
                    border = "2px solid #ef4444";
                    bg = "rgba(239,68,68,0.1)";
                  }
                } else if (picked === idx) {
                  border = `2px solid ${SA_CYAN}`;
                  bg = "rgba(0,217,255,0.1)";
                }
                return (
                  <button
                    key={`${currentQ.id}-${idx}`}
                    type="button"
                    disabled={revealed}
                    className="sa-choice"
                    style={{ border, background: bg }}
                    onClick={() => choose(idx, currentQ.correct_index)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {revealed && (
              <div
                className={`sa-duo-feedback sa-pop ${picked === currentQ.correct_index ? "ok" : "bad"}`}
              >
                <p className="sa-duo-feedback__title">
                  {picked === currentQ.correct_index ? "¡Correcto!" : "Casi — sigue"}
                </p>
                <p>
                  {picked === currentQ.correct_index ? currentQ.feedback_ok : currentQ.feedback_bad}
                </p>
                <button
                  type="button"
                  className="sa-btn sa-btn--primary"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                  onClick={advanceTest}
                >
                  {qIndex >= activeDay.questions.length - 1 ? "Terminar día →" : "Siguiente →"}
                </button>
              </div>
            )}
          </>
        )}

        {phase === "test" && (!activeDay.questions || activeDay.questions.length === 0) && (
          <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%" }} onClick={finishDay}>
            Terminar día →
          </button>
        )}
      </div>
    );
  }

  // —— Mapa ——
  const allDone = daysPrepared.length > 0 && progress.completedDays.length >= daysPrepared.length;
  const streakHint =
    progress.completedDays.length === 0
      ? "Empieza hoy — 1 lección al día."
      : progress.lastCompletedDate === today
        ? "¡Lección de hoy hecha! Vuelve mañana."
        : `Llevas ${progress.completedDays.length} día(s). Hoy toca seguir.`;

  return (
    <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`}>
      <div className="sa-duo-maphead">
        <StudyAgentsBotAvatar size={48} color={SA_PRIMARY} state="idle" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={spaceGrotesk.className}>{plan.topic} · Diario</h3>
          <p>
            {plan.minutes_per_day || daysPrepared[0]?.minutes || 5} min/día · {streakHint}
          </p>
        </div>
        <span className="sa-duo-xp">{progress.xp} XP</span>
      </div>

      {!allDone && todayLesson && (
        <button type="button" className="sa-duo-today" onClick={() => startDay(todayLesson)}>
          <div className="sa-duo-today__bot">
            <StudyAgentsBotAvatar size={44} color={SA_PRIMARY} state="idle" />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p className="sa-duo-today__label">HOY · RECORDATORIO</p>
            <p className={spaceGrotesk.className} style={{ margin: "0.2rem 0 0", fontWeight: 800, fontSize: "1.05rem" }}>
              Día {todayLesson.day}: {todayLesson.title}
            </p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Intro → Aprende → Test · ~{todayLesson.minutes} min
            </p>
          </div>
        </button>
      )}

      {allDone && (
        <p className="sa-duo-donebanner">Curso completado. ¡Buen trabajo!</p>
      )}

      <div className="sa-duo-path">
        {daysPrepared.map((d, i) => {
          const locked =
            d.day > progress.unlockedDay ||
            (d.day > calendarDay && !progress.completedDays.includes(d.day));
          const done = progress.completedDays.includes(d.day);
          const isToday = todayLesson?.day === d.day;
          return (
            <div key={d.day} className="sa-duo-path__item">
              {i > 0 && <div className={`sa-duo-path__line ${done || d.day <= progress.unlockedDay ? "on" : ""}`} />}
              <button
                type="button"
                disabled={locked}
                onClick={() => startDay(d)}
                className={`sa-duo-node ${locked ? "locked" : ""} ${done ? "done" : ""} ${isToday ? "today" : ""}`}
              >
                <span className="sa-duo-node__icon">{done ? "✓" : locked ? "🔒" : "▶"}</span>
                <span className="sa-duo-node__text">
                  <strong>
                    Día {d.day}: {d.title}
                  </strong>
                  <small>{d.focus}</small>
                </span>
                <span className="sa-duo-node__min">{d.minutes}m</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function parseInteractivePlan(raw: string): InteractivePlan | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.days)) return null;
    if (
      data.format === "interactive_v1" ||
      data.format === "interactive_v2" ||
      data.format === "interactive_v3" ||
      data.topic
    ) {
      return data as InteractivePlan;
    }
  } catch {
    /* ignore */
  }
  return null;
}
