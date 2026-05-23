import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "8i-terminal-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.get("/", (req, res) => {
  res.send("8i SERVER ONLINE");
});

app.get("/api/test", (req, res) => {
  res.json({
    online: true,

    hasKey:
      !!process.env.XAI_API_KEY,

    model:
      process.env.XAI_MODEL,

    xClient:
      !!process.env.X_CLIENT_ID,
  });
});

app.get("/auth/x/login", (req, res) => {

  const scope =
    "tweet.read tweet.write users.read offline.access";

  const authUrl =
`https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.X_CALLBACK_URL)}&scope=${encodeURIComponent(scope)}&state=8iterminal&code_challenge=challenge&code_challenge_method=plain`;

  res.json({
    url: authUrl,
  });
});

app.get("/auth/x/callback", async (req, res) => {

  const code = req.query.code;

  if (!code) {
    return res
      .status(400)
      .send("NO AUTH CODE.");
  }

  try {

    const tokenRes = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          code,

          grant_type:
            "authorization_code",

          client_id:
            process.env.X_CLIENT_ID,

          redirect_uri:
            process.env.X_CALLBACK_URL,

          code_verifier:
            "challenge",
        }),
      }
    );

    const tokenData =
      await tokenRes.json();

    req.session.xToken =
      tokenData.access_token;

    res.redirect(
      process.env.FRONTEND_URL
    );

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "X AUTH FAILED."
    );
  }
});

app.get("/auth/x/me", async (req, res) => {

  if (!req.session.xToken) {
    return res.json({
      loggedIn: false,
    });
  }

  try {

    const userRes = await fetch(
      "https://api.twitter.com/2/users/me",
      {
        headers: {
          Authorization:
            `Bearer ${req.session.xToken}`,
        },
      }
    );

    const userData =
      await userRes.json();

    res.json({
      loggedIn: true,
      user: userData,
    });

  } catch (err) {

    console.log(err);

    res.json({
      loggedIn: false,
    });
  }
});

app.post("/api/post-to-x", async (req, res) => {

  if (!req.session.xToken) {
    return res.status(401).json({
      success: false,
      message:
        "USER NOT CONNECTED TO X.",
    });
  }

  try {

    const { text } = req.body;

    const postRes = await fetch(
      "https://api.twitter.com/2/tweets",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${req.session.xToken}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          text,
        }),
      }
    );

    const postData =
      await postRes.json();

    if (!postRes.ok) {
      return res.status(500).json({
        success: false,
        error: postData,
      });
    }

    res.json({
      success: true,
      data: postData,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message:
        "FAILED TO POST TO X.",
    });
  }
});

app.post("/api/ask", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        answer:
          "ERROR: NO QUESTION DETECTED.",
      });
    }

    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({
        answer:
          "ERROR: XAI_API_KEY MISSING.",
      });
    }

    const grokRes = await fetch(
      "https://api.x.ai/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.XAI_API_KEY}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model:
            process.env.XAI_MODEL ||
            "grok-4",

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

    const data =
      await grokRes.json();

    console.log(data);

    if (!grokRes.ok) {
      return res.status(
        grokRes.status
      ).json({
        answer:
          data?.error?.message ||
          data?.message ||
          "GROK API FAILURE.",
      });
    }

    const aiText =
      data?.output?.[0]
        ?.content?.[0]?.text ||
      "NO RESPONSE FROM GROK.";

    res.json({
      answer: aiText,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      answer:
        "SYSTEM FAILURE. CHECK SERVER TERMINAL.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {

  console.log(`
==================================
      8i TERMINAL ONLINE
      PORT: ${PORT}
==================================
  `);

});