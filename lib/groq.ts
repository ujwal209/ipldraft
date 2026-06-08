let currentKeyIndex = 0;

export function getGroqApiKey() {
  const keysEnv = process.env.GROQ_API_KEYS || '';
  const keys = keysEnv.split(',').map((k) => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No GROQ_API_KEYS found in environment variables.');
  }

  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}
