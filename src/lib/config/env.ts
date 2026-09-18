export function requiredServerEnv(name: "DATABASE_URL" | "AUTH_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in this environment.`);
  return value;
}
