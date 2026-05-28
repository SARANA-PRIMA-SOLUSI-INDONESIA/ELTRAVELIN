// Environment variable utilities with DEV/PROD separation
// Usage: getEnv("DATABASE_URL") -> returns DATABASE_URL_DEV or DATABASE_URL_PROD based on NODE_ENV

// Check if we're in build/SSG phase
const isBuildPhase = () => {
  return process.env.NEXT_PHASE === 'phase-production-build' || 
         process.env.NEXT_PHASE === 'phase-export' ||
         process.env.NEXT_PRIVATE_WORKER === '1';
};

export const isProd = () => process.env.NODE_ENV === "production";

export function getEnv(key: string): string | undefined {
  const envKey = isProd() ? `${key}_PROD` : `${key}_DEV`;
  return process.env[envKey] || process.env[key];
}

export function getEnvOrThrow(key: string): string {
  const value = getEnv(key);
  if (!value) {
    const envKey = isProd() ? `${key}_PROD` : `${key}_DEV`;
    // During build, return empty string to avoid crashing
    // Runtime will catch missing env properly
    if (isBuildPhase()) {
      console.warn(`[BUILD] Environment variable "${envKey}" or "${key}" is not set.`);
      return '';
    }
    throw new Error(
      `Environment variable "${envKey}" or "${key}" is not set.`
    );
  }
  return value;
}

// Common environment variables with defaults
export const getAppUrl = () => getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
export const getDatabaseUrl = () => getEnvOrThrow("DATABASE_URL");
