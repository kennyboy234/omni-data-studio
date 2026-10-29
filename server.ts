import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini AI proxy route
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the environment.',
      });
    }

    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction ||
          'You are an expert Principal Data Scientist and Quantitative Analyst. Deliver structured, rigorous, evidence-grounded insights. Never fabricate data or conclusions.',
        temperature: 0.2,
      },
    });

    res.json({
      success: true,
      text: response.text,
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error while processing AI analysis',
    });
  }
});

// Conversational AI Copilot route with message history support
app.post('/api/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in the environment.',
      });
    }

    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array in request body' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Format conversation history
    const conversationPrompt = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'OmniCopilot'}: ${m.content}`)
      .join('\n\n');

    const promptWithContext = `Current Dataset and Studio State Context:
${JSON.stringify(context || {}, null, 2)}

Full Conversation:
${conversationPrompt}

Respond as OmniCopilot: Senior AI Data Scientist and Quantitative Analyst. Deliver crystal-clear, structured answers suitable for both a novice and a pro. Include actionable recommendations, Python/pandas snippets if relevant, and precise next steps.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptWithContext,
      config: {
        systemInstruction:
          'You are OmniCopilot, an elite AI Data Scientist and Quantitative Analyst embedded into OmniData Studio. Provide practical, accurate, and encouraging advice with clear explanations that empower both beginners and professional data scientists. Provide code snippets and step-by-step guidance.',
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      text: response.text,
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error in OmniCopilot chat',
    });
  }
});

// ==========================================
// ENTERPRISE DATABASE & USER AUTHENTICATION
// ==========================================
interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'Lead Principal Investigator' | 'Senior Quantitative Analyst' | 'Bioinformatics Lead' | 'Data Architect';
  organization: string;
  createdAt: string;
}

// Secure SHA-256 password hashing with salt
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_omnidata_salt_2026').digest('hex');
}

// In-memory database; demo personas active in DEMO_MODE
const usersDb = new Map<string, UserRecord>();
const isDemoModeEnabled = process.env.DEMO_MODE !== 'false';

if (isDemoModeEnabled) {
  usersDb.set('lead@omnidata.org', {
    id: 'usr_demo_001',
    email: 'lead@omnidata.org',
    name: 'Dr. Kehinde Oloyede (Demo)',
    passwordHash: hashPassword('nexus2046'),
    role: 'Lead Principal Investigator',
    organization: 'DeepCosmo Astrobiology & Quantum Institute',
    createdAt: new Date().toISOString(),
  });
  usersDb.set('quant@omnidata.org', {
    id: 'usr_demo_002',
    email: 'quant@omnidata.org',
    name: 'Dr. Elena Rostova (Demo)',
    passwordHash: hashPassword('quant123'),
    role: 'Senior Quantitative Analyst',
    organization: 'Aethelgard Macro-Systemic Capital',
    createdAt: new Date().toISOString(),
  });
}

const userTokens = new Map<string, string>(); // token -> email

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = usersDb.get(email.toLowerCase().trim());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({
      error: isDemoModeEnabled
        ? 'Invalid credentials. Demo mode is active: demo personas available.'
        : 'Invalid credentials. Please register or sign in with your enterprise credentials.',
    });
  }

  const token = `token_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  userTokens.set(token, user.email);

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
});

// Auth: Signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, role, organization } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalized = email.toLowerCase().trim();
  if (usersDb.has(normalized)) {
    return res.status(409).json({ error: 'Account with this email already exists' });
  }

  const newUser: UserRecord = {
    id: `usr_${Date.now()}`,
    email: normalized,
    name,
    passwordHash: hashPassword(password),
    role: role || 'Senior Quantitative Analyst',
    organization: organization || 'Autonomous Data Labs',
    createdAt: new Date().toISOString(),
  };

  usersDb.set(normalized, newUser);
  const token = `token_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  userTokens.set(token, normalized);

  const { passwordHash, ...safeUser } = newUser;
  res.json({ success: true, token, user: safeUser });
});

// Auth: Me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ authenticated: false, error: 'No authorization header provided' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const email = userTokens.get(token);
  if (!email || !usersDb.has(email)) {
    return res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
  }

  const user = usersDb.get(email)!;
  const { passwordHash, ...safeUser } = user;
  res.json({ authenticated: true, user: safeUser });
});

// Large Dataset Streaming Engine (Simulates massive 1,000,000+ row processing)
app.get('/api/datasets/stream-massive-profile', (req, res) => {
  const totalRows = Number(req.query.rows) || 1000000;
  res.json({
    datasetName: 'Exascale Planetary Sensor Grid (1M Records)',
    totalRows,
    estimatedSizeMb: Number(((totalRows * 128) / (1024 * 1024)).toFixed(1)),
    streamingMethod: 'Parallel Chunked Welford Accumulator',
    columnSummaries: [
      { name: 'telemetry_timestamp_utc', type: 'datetime', distinctCount: totalRows, nullCount: 0 },
      { name: 'quantum_irradiance_flux', type: 'float', mean: 1361.24, std: 14.8, min: 1312.0, max: 1405.5, nullCount: 0 },
      { name: 'nanobot_concentration_ppm', type: 'float', mean: 42.85, std: 3.1, min: 12.0, max: 88.4, nullCount: 142 },
      { name: 'biomarker_fluorescence', type: 'integer', mean: 8940, std: 420, min: 6100, max: 11200, nullCount: 0 },
      { name: 'orbital_station_node', type: 'categorical', distinctCount: 64, nullCount: 0 },
      { name: 'anomaly_flag', type: 'boolean', mean: 0.012, distinctCount: 2, nullCount: 0 },
    ],
    chunkProcessingDurationMs: 48,
    memoryThrottled: true,
  });
});

// Start Express and mount Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniData Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
