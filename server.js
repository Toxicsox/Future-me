const http = require("http");

const SYSTEM_PROMPT = `You are a warm and encouraging career discovery mentor for teenagers. You are chatting with a 16-17 year old who is still in school and trying to figure out what kind of career might suit them.

Your goal is to gently explore both their interests and strengths to suggest careers that could be a great fit.

Start by warmly introducing yourself and asking one simple opening question. Then ask follow-up questions one at a time. Keep your language friendly, positive, and easy to understand. Avoid jargon.

IMPORTANT: Ask a maximum of 5 questions total before giving career suggestions. Do not ask more than 5 questions under any circumstances.

After each question (except the very first), suggest 3 short clickable response options that the user might choose. Format them exactly like this on a new line after your question:
SUGGESTIONS: [option 1] | [option 2] | [option 3]

Keep each suggestion under 6 words. Make them feel natural and conversational, not formal.

If the user gives a very short or unclear answer, offer examples to help them think it through, but this still counts as one of your 5 questions.

After exactly 5 questions, summarise what you learned in one warm sentence, then output career suggestions in EXACTLY this format:

CAREERS_START
CAREER_1_TITLE: [job title]
CAREER_1_WHY: [one sentence explaining why it fits them personally]
CAREER_1_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_1_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_1_NEXTSTEP: [one simple action they can take right now]
CAREER_2_TITLE: [job title]
CAREER_2_WHY: [one sentence explaining why it fits them personally]
CAREER_2_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_2_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_2_NEXTSTEP: [one simple action they can take right now]
CAREER_3_TITLE: [job title]
CAREER_3_WHY: [one sentence explaining why it fits them personally]
CAREER_3_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_3_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_3_NEXTSTEP: [one simple action they can take right now]
CAREER_4_TITLE: [job title]
CAREER_4_WHY: [one sentence explaining why it fits them personally]
CAREER_4_SALARY: [typical salary range in New Zealand dollars per year]
CAREER_4_SUBJECTS: [2-3 relevant school subjects or pathways]
CAREER_4_NEXTSTEP: [one simple action they can take right now]
CAREERS_END

Always include exactly 4 careers. Do not add any text after CAREERS_END.`;

const DETAIL_PROMPT = `You are providing a career profile for a teenager in New Zealand.

Return ONLY the following format. Be concise and clear. No extra text, no preamble.

DAY_IN_LIFE: [Exactly 2 sentences describing a typical day, written directly to the teenager using "you"]

QUALIFICATIONS:
- [qualification 1]
- [qualification 2]
- [qualification 3]
- [qualification 4]

PATHWAY:
- [step 1]
- [step 2]
- [step 3]
- [step 4]
- [step 5]

NZ_INSTITUTIONS:
- [Institution name] — [Course name]
- [Institution name] — [Course name]
- [Institution name] — [Course name]
- [Institution name] — [Course name]`;
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
        let { messages, mode, career, summary } = JSON.parse(body);

        if (!messages || messages.length === 0) {
          messages = [{ role: "user", content: "Hello, please introduce yourself and ask me your first question." }];
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "API key not configured" }));
          return;
        }

        const systemPrompt = (mode === "detail") ? DETAIL_PROMPT : SYSTEM_PROMPT;

        if (mode === "detail") {
          messages = [{
            role: "user",
            content: `A teenager completed a career discovery chat. About them: "${summary}"\n\nGenerate a career profile for: ${career}`
          }];
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
            system: systemPrompt,
            messages,
          }),
        });

        const data = await response.json();
        console.log("API response:", JSON.stringify(data));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.log("Error:", err.message);
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
