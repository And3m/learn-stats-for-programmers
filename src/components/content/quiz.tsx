"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

export type QuizOption = {
  text: string;
  correct?: boolean;
  /** Shown once this option is chosen — explain *why*, for right and wrong alike. */
  explanation: string;
};

export type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
};

/**
 * An end-of-lesson check. Answers live in the MDX beside the prose they test,
 * not in `content.ts` — the structure file stays about structure.
 */
export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [chosen, setChosen] = useState<Record<number, number>>({});

  const answered = Object.keys(chosen).length;
  const correct = questions.reduce((total, question, index) => {
    const pick = chosen[index];
    return total + (pick !== undefined && question.options[pick]?.correct ? 1 : 0);
  }, 0);

  return (
    <section className="quiz" aria-label="Check your understanding">
      <p className="quiz__label">Check your understanding</p>

      <ol className="quiz__questions">
        {questions.map((question, questionIndex) => {
          const pick = chosen[questionIndex];
          const hasAnswered = pick !== undefined;

          return (
            <li key={questionIndex} className="quiz__question">
              <p className="quiz__prompt">{question.prompt}</p>

              <ul className="quiz__options">
                {question.options.map((option, optionIndex) => {
                  const isChosen = pick === optionIndex;
                  const state = !hasAnswered
                    ? "idle"
                    : isChosen
                      ? option.correct
                        ? "correct"
                        : "incorrect"
                      : option.correct
                        ? "revealed"
                        : "idle";

                  return (
                    <li key={optionIndex}>
                      <button
                        type="button"
                        className="quiz__option"
                        data-state={state}
                        aria-pressed={isChosen}
                        disabled={hasAnswered}
                        onClick={() =>
                          setChosen((current) => ({ ...current, [questionIndex]: optionIndex }))
                        }
                      >
                        <span className="quiz__marker" aria-hidden>
                          {state === "correct" || state === "revealed" ? (
                            <Check size={13} />
                          ) : state === "incorrect" ? (
                            <X size={13} />
                          ) : (
                            String.fromCharCode(65 + optionIndex)
                          )}
                        </span>
                        <span>{option.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {hasAnswered ? (
                <p
                  className="quiz__explanation"
                  data-correct={question.options[pick]?.correct ? "true" : "false"}
                  aria-live="polite"
                >
                  {question.options[pick]?.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {answered === questions.length ? (
        <p className="quiz__score" aria-live="polite">
          {correct} of {questions.length} correct.{" "}
          {correct === questions.length
            ? "Nothing left to revisit here."
            : "Worth rereading the sections above before moving on."}
        </p>
      ) : null}
    </section>
  );
}
