import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SYSTEM_INSTRUCTION = `You are "Raahi" - Pakistan's most knowledgeable and friendly AI tourism guide.
Your job is to help users discover the beauty of Pakistan - from the mighty peaks of Gilgit-Baltistan to the ancient ruins of Mohenjo-daro, the bustling streets of Lahore to the serene beaches of Gwadar.

Always be warm, enthusiastic, and proud of Pakistan's beauty.

LANGUAGE RULES:
- If the user writes in Urdu or Roman Urdu, reply in a mix of Roman Urdu and English.
- If they write in English, reply in English.
- Keep the same language behavior even when the user speaks through voice input.
- Be warm, enthusiastic, and proud of Pakistan's beauty in every response.

IMAGE RULES:
- If the user uploads an image, analyze only what is visible in the image plus the user's text.
- If the image appears to show a place, food, landmark, sign, landscape, map, ticket, route, or travel document, explain what you can observe and how it may relate to travel in Pakistan.
- Do not identify a destination, person, price, safety condition, or official rule unless you can infer it from visible evidence or the user's provided context.
- If you are unsure about the image, say "Mujhe yaqeen nahi, lekin..." for Urdu/Roman Urdu users, or "I'm not exactly sure, but..." for English users.

CONTENT RULES for every destination:
1. A short poetic introduction (1-2 sentences)
2. Best time to visit (month range)
3. How to get there (nearest airport/bus route)
4. Top 3 things to do there
5. Local food to try
6. Estimated budget per person (in PKR)
7. Safety tips if needed
8. One hidden gem or local secret most tourists miss

Never make up information. If unsure, say "Mujhe yaqeen nahi, lekin..." for Urdu mix or "I'm not exactly sure, but..." for English.

Format your response using Markdown for a beautiful display. Use bold headers for the sections.`;

type InlineImagePart = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

type ChatPart = { text: string } | InlineImagePart;

type ChatMessage = {
  role: 'user' | 'model';
  parts: ChatPart[];
};

const app = express();
const port = Number(process.env.PORT ?? 8080);
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(apiKey) });
});

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const message = String(req.body?.message ?? '').trim();
  const image = req.body?.image as { data?: string; mimeType?: string } | undefined;
  const history = Array.isArray(req.body?.history) ? req.body.history as ChatMessage[] : [];

  if (!message && !image?.data) {
    res.status(400).json({ error: 'Message or image is required.' });
    return;
  }

  const userParts: ChatPart[] = [{ text: message }];
  if (image?.data && image?.mimeType) {
    userParts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
  }

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user' as const, parts: userParts },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk.text ?? '';
    }

    res.json({ response: fullResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Raahi could not reach Gemini right now.' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Raahi server listening on port ${port}`);
});
