/**
 * Lectura de variables de entorno obligatorias. Las credenciales de BD
 * NUNCA van hardcodeadas en el código (el repo es público): deben venir
 * del .env — ver .env.example.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}: configúrala en .env`);
  }
  return value;
}
