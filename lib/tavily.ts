let currentKeyIndex = 0;

export function getTavilyApiKey() {
  const keysEnv = process.env.TAVILY_API_KEYS || '';
  const keys = keysEnv.split(',').map((k) => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No TAVILY_API_KEYS found in environment variables.');
  }

  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}
