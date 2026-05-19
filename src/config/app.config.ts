import Joi from "joi";

/**
 * Helper untuk mengubah format waktu (misal: "15m", "7d") menjadi detik (number)
 * Digunakan untuk menyinkronkan JWT Expiration dengan Cookie MaxAge
 */
function parseTimeToSeconds(timeStr: string): number {
  const value = parseInt(timeStr);
  if (isNaN(value)) return 0;

  const unit = timeStr.toLowerCase().slice(-1);
  switch (unit) {
    case 'd': return value * 86400; // 24 * 60 * 60
    case 'h': return value * 3600;  // 60 * 60
    case 'm': return value * 60;
    case 's': return value;
    default: return value; // Asumsi detik jika tidak ada unit
  }
}

/**
 * Konfigurasi Global Aplikasi
 * Pastikan SUPER_ADMIN_ROLE_ID sudah diset di file .env
 */

const envVarsSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().messages({
    "string.uri": "DATABASE_URL di .env harus berupa format URL yang valid (misal: mysql://user:pass@localhost:3306/db).",
    "any.required": "DATABASE_URL wajib dikonfigurasi di file .env"
  }),
  SUPER_ADMIN_ROLE_ID: Joi.string().uuid().required().messages({
    "string.guid": "SUPER_ADMIN_ROLE_ID di .env harus berupa format UUID yang valid.",
    "any.required": "SUPER_ADMIN_ROLE_ID tidak ditemukan di .env"
  }),
  APP_URL: Joi.string().required().messages({
    "any.required": "APP_URL wajib dikonfigurasi di file .env agar sistem dapat menentukan URL secara dinamis."
  }),
  JWT_SECRET: Joi.string().default("fallback"),
  JWT_EXP: Joi.string().default("1d"),
  REFRESH_JWT_SECRET: Joi.string().required().messages({
    "any.required": "REFRESH_JWT_SECRET wajib dikonfigurasi di file .env"
  }),
  ACCESS_TOKEN_EXPIRATION: Joi.string().default("15m"),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default("7d"),
  PORT: Joi.number().integer().min(1000).max(65535).default(3000).messages({
    "number.base": "PORT harus berupa angka.",
    "number.min": "PORT minimal adalah 1000.",
  }),
  SWAGGER_USER: Joi.string().default("admin"),
  SWAGGER_PASSWORD: Joi.string().required().messages({
    "any.required": "SWAGGER_PASSWORD wajib diisi di .env untuk mengamankan dokumentasi."
  })
}).unknown();

const { error, value: envVars } = envVarsSchema.validate(process.env);

if (error) {
  console.error("\n--- FATAL STARTUP ERROR ---");
  console.error(`❌ Konfigurasi Error: ${error.message}`);
  console.error("Aplikasi tidak dapat berjalan tanpa konfigurasi yang valid.");
  console.error("---------------------------\n");
  process.exit(1);
}

export const appConfig = {
  databaseUrl: envVars.DATABASE_URL,
  superAdminRoleId: envVars.SUPER_ADMIN_ROLE_ID,
  // Mengganti ${PORT} dengan nilai dari variabel PORT jika ada di string APP_URL
  appUrl: envVars.APP_URL.replace(
    '${PORT}', 
    envVars.PORT.toString()
  ),
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.REFRESH_JWT_SECRET,
    accessExp: envVars.ACCESS_TOKEN_EXPIRATION,
    refreshExp: envVars.REFRESH_TOKEN_EXPIRATION,
    accessMaxAge: parseTimeToSeconds(envVars.ACCESS_TOKEN_EXPIRATION),
    refreshMaxAge: parseTimeToSeconds(envVars.REFRESH_TOKEN_EXPIRATION),
    exp: envVars.JWT_EXP
  },
  swagger: {
    user: envVars.SWAGGER_USER,
    password: envVars.SWAGGER_PASSWORD
  }
};