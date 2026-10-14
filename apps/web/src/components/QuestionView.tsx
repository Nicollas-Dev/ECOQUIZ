import type { PublicQuestion, QuestionReveal, RoomSnapshot } from "@ecoquiz/shared";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn, optionClass } from "../lib/ui";
import { TimerBar } from "./TimerBar";

export function QuestionView({
  snapshot,
  selectedOptionId,
  onSelect,
  readonly = false
}: {
  snapshot: RoomSnapshot;
  selectedOptionId?: string | null;
  onSelect?: (optionId: string) => void;
  readonly?: boolean;
}) {
  const question = snapshot.currentQuestion;

  if (!question) {
    return null;
  }

  const showReveal = snapshot.status === "reveal" && snapshot.reveal;

  return (
    <section className="rounded-lg border border-eco-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-eco-700">
            Pergunta {snapshot.questionIndex + 1} de {snapshot.questionCount} · {question.ods}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-eco-950 sm:text-3xl">{question.prompt}</h1>
        </div>
        <div className="min-w-44 rounded-lg bg-eco-50 p-3 text-sm font-bold text-eco-700">
          {snapshot.status === "question" ? `${snapshot.answeredCount}/${snapshot.activeParticipantCount} responderam` : "Resultado"}
        </div>
      </div>

      {snapshot.status === "question" && (
        <div className="mt-5">
          <TimerBar endsAt={snapshot.questionEndsAt} serverNow={snapshot.serverNow} durationSeconds={question.timeLimit} />
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const selected = selectedOptionId === option.id;
          const correct = showReveal ? snapshot.reveal?.correctOptionId === option.id : false;
          const wrongSelection = showReveal && selected && !correct;

          return (
            <button
              key={option.id}
              type="button"
              disabled={readonly || snapshot.status !== "question" || Boolean(selectedOptionId)}
              onClick={() => onSelect?.(option.id)}
              className={cn(
                "min-h-24 rounded-lg border-2 bg-[var(--answer-bg)] p-4 text-left text-[var(--answer-text)] transition",
                "border-[var(--answer-border)] disabled:cursor-default",
                optionClass(option.label),
                selected && "ring-4 ring-eco-200",
                correct && "ring-4 ring-eco-500",
                wrongSelection && "opacity-70 ring-4 ring-[#D6604D]"
              )}
            >
              <span className="flex items-start gap-3">
                <strong className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">
                  {option.label}
                </strong>
                <span className="grid gap-2">
                  <span className="font-bold leading-snug">{option.text}</span>
                  {showReveal && (
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-normal">
                      {correct && (
                        <>
                          <CheckCircle2 size={15} /> Correta
                        </>
                      )}
                      {wrongSelection && (
                        <>
                          <XCircle size={15} /> Sua escolha
                        </>
                      )}
                      {!correct && !wrongSelection && <Circle size={15} />}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {showReveal && <RevealBlock question={question} reveal={snapshot.reveal!} />}
    </section>
  );
}

function RevealBlock({ question, reveal }: { question: PublicQuestion; reveal: QuestionReveal }) {
  const maxCount = Math.max(1, ...reveal.answerStats.map((stat) => stat.count));

  return (
    <div className="mt-6 grid gap-5 rounded-lg bg-eco-50 p-4">
      <div>
        <h2 className="font-black text-eco-950">Explicação</h2>
        <p className="mt-2 text-sm leading-6 text-eco-700">{reveal.explanation}</p>
      </div>
      <div className="grid gap-2">
        {reveal.answerStats.map((stat) => {
          const option = question.options.find((item) => item.id === stat.optionId);
          const width = `${Math.max(8, (stat.count / maxCount) * 100)}%`;

          return (
            <div key={stat.optionId} className="grid gap-1">
              <div className="flex items-center justify-between text-xs font-bold text-eco-700">
                <span>
                  {stat.label} {option?.text}
                </span>
                <span>{stat.count}</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div className="h-full rounded-full bg-eco-500" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
