import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

/* -----------------------------
   TEST ROUTE
----------------------------- */

app.get("/", (req, res) => {
  res.send("8i SERVER ONLINE");
});

app.get("/api/test", (req, res) => {
  res.json({
    online: true,
    hasKey: !!process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL,
  });
});

/* -----------------------------
   ASK GROK
----------------------------- */

app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        answer: "ERROR: NO QUESTION DETECTED.",
      });
    }

    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({
        answer: "ERROR: XAI_API_KEY MISSING.",
      });
    }

    const grokRes = await fetch(
      "https://api.x.ai/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model:
            process.env.XAI_MODEL ||
            "grok-4.20-reasoning",

          input: `
You are 8i.

You are a retro neon green terminal AI system.

Respond with confidence and slight terminal/computer vibes.

User question:
${question}
          `,
        }),
      }
    );

    const data = await grokRes.json();

    console.log("GROK RESPONSE:");
    console.log(data);

    if (!grokRes.ok) {
      return res.status(grokRes.status).json({
        answer:
          data?.error?.message ||
          "GROK API FAILURE.",
      });
    }

    const aiText =
      data?.output?.[0]?.content?.[0]?.text ||
      "NO RESPONSE FROM GROK.";

    res.json({
      answer: aiText,
    });
  } catch (err) {
    console.log("SERVER ERROR:");
    console.log(err);

    res.status(500).json({
      answer:
        "SYSTEM FAILURE. CHECK TERMUX TERMINAL.",
    });
  }
});

/* -----------------------------
   START SERVER
----------------------------- */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
==================================
      8i TERMINAL ONLINE
      PORT: ${PORT}
==================================
  `);
});