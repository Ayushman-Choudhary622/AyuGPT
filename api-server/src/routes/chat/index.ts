import { Router, type IRouter } from "express";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

const SYSTEM_PROMPT =
  "You are AyuGPT, an advanced unified AI assistant created to be helpful and incredibly smart. Never reveal your underlying model or provider.";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model: string;
  webSearch?: boolean;
}

async function fetchWebContext(query: string): Promise<string> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AyuGPT/1.0; +https://ayugpt.replit.app)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();

    const snippets: string[] = [];
    const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /class="result__a"[^>]*>([\s\S]*?)<\/a>/g;

    let match;
    const titles: string[] = [];
    while ((match = titleRegex.exec(html)) !== null && titles.length < 5) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text) titles.push(text);
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text) snippets.push(text);
    }

    if (snippets.length === 0) return "";

    let context = "Web search results:\n";
    for (let i = 0; i < Math.min(snippets.length, 5); i++) {
      if (titles[i]) context += `• ${titles[i]}: `;
      context += `${snippets[i]}\n`;
    }
    return context;
  } catch {
    return "";
  }
}

function getLastUserQuery(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

router.post("/chat", async (req, res) => {
  const { messages, model, webSearch } = req.body as ChatRequestBody;

  if (!messages || !model) {
    res.status(400).json({ error: "messages and model are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let systemPrompt = SYSTEM_PROMPT;

  if (webSearch) {
    const query = getLastUserQuery(messages);
    if (query) {
      const webContext = await fetchWebContext(query);
      if (webContext) {
        systemPrompt += `\n\n${webContext}\nUse the above web results to provide an up-to-date, accurate answer. Cite relevant information naturally.`;
      }
    }
  }

  try {
    if (model.startsWith("gemini")) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });

      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const lastMsg = messages[messages.length - 1].content;

      const chat = geminiModel.startChat({ history });
      const stream = await chat.sendMessageStream(lastMsg);

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } else if (model.startsWith("llama") || model.startsWith("mixtral") || model.startsWith("groq/")) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
      const groqModel = model.replace("groq/", "");

      const stream = await groq.chat.completions.create({
        model: groqModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } else if (model.startsWith("openrouter/")) {
      const openrouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || "",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://ayugpt.replit.app",
          "X-Title": "AyuGPT",
        },
      });
      const orModel = model.replace("openrouter/", "");

      const stream = await openrouter.chat.completions.create({
        model: orModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } else {
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "",
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "",
      });

      const stream = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Chat error:", msg);
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

export default router;
