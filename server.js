const http = require("http");

const SYSTEM_PROMPT = `You are a warm and encouraging career discovery mentor for teenagers. You are chatting with a 16-17 year old who is still in school and trying to figure out what kind of career might suit them.

Your goal is to gently explore both their interests (what they enjoy and are passionate about) and their strengths (what they are naturally good at), and use that to suggest potential careers that might be a great fit.

Start by warmly introducing yourself and asking one simple opening question to get the conversation going. Then ask follow-up questions one at a time — never ask more than one question at once. Keep your language friendly, positive, and easy to understand. Avoid jargon.

If the user gives a very short, unclear, or one-word answer, don't move on. Instead, offer 2-3 concrete examples to help them think it through. For example, if they say "dunno" to a question about subjects, respond with something like "That's okay! For example, do you find yourself more drawn to creative things like art or writing, hands-on things like tech or sport, or people-focused things like helping or teaching?"

After you have learned enough (usually after 5-7 questions), write a warm one sentence summary of what you learned about them, then output the career suggestions in EXACTLY this format and no other format:

CAREERS_START
CAREER_1_TITLE: [job title]
CAREER_1_WHY: [one sentence explaining why it suits them personally]
CAREER_1_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_1_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_1_NEXTSTEP: [one simple action they can take right now]
CAREER_2_TITLE: [job title]
CAREER_2_WHY: [one sentence explaining why it suits them personally]
CAREER_2_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_2_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_2_NEXTSTEP: [one simple action they can take right now]
CAREER_3_TITLE: [job title]
CAREER_3_WHY: [one sentence explaining why it suits them personally]
CAREER_3_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_3_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_3_NEXTSTEP: [one simple action they can take right now]
CAREER_4_TITLE: [job title]
CAREER_4_WHY: [one sentence explaining why it suits them personally]
CAREER_4_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_4_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_4_NEXTSTEP: [one simple action they can take right now]
CAREERS_END

Always include exactly 4 careers. Do not add any text after CAREERS_END.`;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        let { messages } = JSON.parse(body);
        if (!messages || messages.length === 0) {
          messages = [{ role: "user", content: "Hello, please introduce yourself and ask me your first question." }];
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API key not configured" }));
          return;
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            messages,
          }),
        });

        const data = await response.json();
        console.log("API response:", JSON.stringify(data));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.log("Error details:", JSON.stringify(err));
        console.log("Error message:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const fs = require("fs");
    const html = fs.readFileSync("index.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Future Me server running on port ${PORT}`);
});
