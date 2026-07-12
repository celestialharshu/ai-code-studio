import 'dotenv/config';

/**
 * All environment access happens here, once, at startup.
 * Nothing else in the codebase touches process.env — so if a variable is
 * missing you find out immediately, not halfway through a request.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`\n[config] Missing required env var: ${name}`);
    console.error('[config] Copy server/.env.example to server/.env and fill it in.\n');
    process.exit(1);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  groqApiKey: required('GROQ_API_KEY'),
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqBaseUrl: 'https://api.groq.com/openai/v1',

  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  rateLimit: {
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20,
  },
};
