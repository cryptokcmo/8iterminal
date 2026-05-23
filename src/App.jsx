import React, { useEffect, useState } from "react";
import "./App.css";

const bootText = `SYSTEM-8i TERMINAL v1.0
(C) 1981 BYTEWARE SYSTEMS
READY.

> load 8ball
LOADING...
SUCCESS.`;

export default function App() {

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] =
    useState("ASK 8i ANYTHING.");

  const [displayedAnswer, setDisplayedAnswer] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [typedBoot, setTypedBoot] =
    useState("");

  const [bootDone, setBootDone] =
    useState(false);

  useEffect(() => {

    let index = 0;

    const typer = setInterval(() => {

      setTypedBoot(
        bootText.slice(0, index)
      );

      if (index >= bootText.length) {

        clearInterval(typer);

        setTimeout(() => {
          setBootDone(true);
        }, 500);
      }

      index++;

    }, 30);

    return () => clearInterval(typer);

  }, []);

  useEffect(() => {

    if (!answer) return;

    let index = 0;

    setDisplayedAnswer("");

    const typeInterval = setInterval(() => {

      if (index < answer.length) {

        setDisplayedAnswer(
          answer.slice(0, index + 1)
        );

        index++;

      } else {

        clearInterval(typeInterval);

      }

    }, 18);

    return () => clearInterval(typeInterval);

  }, [answer]);

  async function askEightI(e) {

    e.preventDefault();

    if (!question.trim()) return;

    const currentQuestion = question;

    setLoading(true);

    setAnswer("LOADING GROK SIGNAL...");

    try {

      const res = await fetch(
        "http://localhost:5050/api/ask",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: currentQuestion,
          }),
        }
      );

      const data = await res.json();

      setAnswer(
        data.answer ||
        "NO SIGNAL DETECTED."
      );

    } catch (err) {

      console.log(err);

      setAnswer(
        "CONNECTION FAILED. CHECK TERMINAL."
      );
    }

    setLoading(false);

    setQuestion("");
  }

  const shareText = encodeURIComponent(
`I asked 8i: "${question || "Will I succeed?"}"

8i replied: "${answer}"`
  );

  return (
    <main className="terminal-page">

      <section className="terminal-window">

        <div className="scanlines"></div>

        <pre className="terminal-header">

          {typedBoot}

          {!bootDone && (
            <span className="typing-cursor">
              █
            </span>
          )}

        </pre>

        {bootDone && (

          <div className="main-content">

            <div className="eight-ball">

              <div
                className="eight-ball-inner"
                aria-label="8i terminal ball"
              ></div>

            </div>

            <form
              onSubmit={askEightI}
              className="ask-form"
            >

              <label>
                &gt; ASK 8i ANYTHING
              </label>

              <input
                type="text"

                value={question}

                disabled={loading}

                placeholder="Will I succeed?"

                autoComplete="off"

                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !question.trim()
                }
              >

                {loading
                  ? "THINKING..."
                  : "ASK"}

              </button>

            </form>

            <section className="answer-box">

              <p>
                8i RESPONSE:
              </p>

              <h2>

                {displayedAnswer}

                {displayedAnswer.length > 0 &&
                  displayedAnswer.length < answer.length && (
                    <span className="typing-cursor">
                      █
                    </span>
                  )}

              </h2>

            </section>

            <a
              className="share-btn"
              href={`https://twitter.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noreferrer"
            >
              SHARE ON X
            </a>

          </div>

        )}

        <p className="cursor">
          &gt; _
        </p>

      </section>

    </main>
  );
}