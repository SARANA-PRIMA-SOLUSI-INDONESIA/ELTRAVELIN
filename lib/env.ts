// Environment variable utilities with DEV/PROD separation
// Usage: getEnv("DATABASE_URL") -> returns DATABASE_URL_DEV or DATABASE_URL_PROD based on NODE_ENV

export const isProd = () => process.env.NODE_ENV === "production";

export function getEnv(key: string): string | undefined {
  const envKey = isProd() ? `${key}_PROD` : `${key}_DEV`;
  return process.env[envKey] || process.env[key];
}

export function getEnvOrThrow(key: string): string {
  const value = getEnv(key);
  if (!value) {
    const envKey = isProd() ? `${key}_PROD` : `${key}_DEV`;
    throw new Error(
      `Environment variable "${envKey}" or "${key}" is not set.`
    );
  }
  return value;
}

// Common environment variables with defaults
export const getAppUrl = () => getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
export const getDatabaseUrl = () => getEnvOrThrow("DATABASE_URL");
