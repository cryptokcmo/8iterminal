import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5050";

const bootText = `SYSTEM-8i TERMINAL v1.0
(C) 1981 BYTEWARE SYSTEMS
READY.

> load 8i
LOADING...
SUCCESS.`;

export default function App() {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState("ASK 8i ANYTHING.");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [typedBoot, setTypedBoot] = useState("");
  const [bootDone, setBootDone] = useState(false);
  const [xConnected, setXConnected] = useState(false);
  const [xUser, setXUser] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let index = 0;

    const typer = setInterval(() => {
      setTypedBoot(bootText.slice(0, index));

      if (index >= bootText.length) {
        clearInterval(typer);
        setTimeout(() => setBootDone(true), 500);
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
        setDisplayedAnswer(answer.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 18);

    return () => clearInterval(typeInterval);
  }, [answer]);

  useEffect(() => {
    checkXConnection();
  }, []);

  async function checkXConnection() {
    try {
      const res = await fetch(`${API_URL}/auth/x/me`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.loggedIn) {
        setXConnected(true);
        setXUser(data.user?.data || null);
      } else {
        setXConnected(false);
        setXUser(null);
      }
    } catch {
      setXConnected(false);
      setXUser(null);
    }
  }

  async function connectX() {
    try {
      const res = await fetch(`${API_URL}/auth/x/login`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("X connection failed.");
    }
  }

  async function askEightI(e) {
    e.preventDefault();

    if (!question.trim()) return;

    const currentQuestion = question;

    setLastQuestion(currentQuestion);
    setLoading(true);
    setAnswer("LOADING GROK SIGNAL...");

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
        }),
      });

      const data = await res.json();

      setAnswer(data.answer || "NO SIGNAL DETECTED.");
    } catch {
      setAnswer("CONNECTION FAILED. CHECK TERMINAL.");
    }

    setLoading(false);
    setQuestion("");
  }

  async function shareToX() {
    if (!xConnected) {
      connectX();
      return;
    }

    setPosting(true);

    const text = `I asked 8i: "${lastQuestion || "Will I succeed?"}"

8i replied: "${answer}"

#8iTerminal`;

    try {
      const res = await fetch(`${API_URL}/api/post-to-x`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Posted to X.");
      } else {
        alert("Post failed. Reconnect X and try again.");
      }
    } catch {
      alert("Post failed. Check server.");
    }

    setPosting(false);
  }

  return (
    <main className="terminal-page">
      <section className="terminal-window">
        <div className="scanlines"></div>

        <pre className="terminal-header">
          {typedBoot}
          {!bootDone && <span className="typing-cursor">█</span>}
        </pre>

        {bootDone && (
          <div className="main-content">
            <div className="eight-ball">
              <div
                className="eight-ball-inner"
                aria-label="8i terminal ball"
              ></div>
            </div>

            <form onSubmit={askEightI} className="ask-form">
              <label>&gt; ASK 8i ANYTHING</label>

              <input
                type="text"
                value={question}
                disabled={loading}
                placeholder="Will I succeed?"
                autoComplete="off"
                onChange={(e) => setQuestion(e.target.value)}
              />

              <button type="submit" disabled={loading || !question.trim()}>
                {loading ? "THINKING..." : "ASK"}
              </button>
            </form>

            <section className="answer-box">
              <p>8i RESPONSE:</p>

              <h2>
                {displayedAnswer}

                {displayedAnswer.length > 0 &&
                  displayedAnswer.length < answer.length && (
                    <span className="typing-cursor">█</span>
                  )}
              </h2>
            </section>

            {xConnected && xUser && (
              <p className="x-status">
                X CONNECTED: @{xUser.username}
              </p>
            )}

            <button
              className="share-btn"
              onClick={shareToX}
              disabled={posting}
            >
              {posting
                ? "POSTING..."
                : xConnected
                ? "SHARE ON X"
                : "CONNECT X"}
            </button>
          </div>
        )}

        <p className="cursor">&gt; _</p>
      </section>
    </main>
  );
}