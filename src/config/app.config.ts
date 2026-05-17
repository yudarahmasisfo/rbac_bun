import Joi from "joi";

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
  JWT_SECRET: Joi.string().default("fallback"),
  JWT_EXP: Joi.string().default("1d"),
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
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    exp: envVars.JWT_EXP
  },
  swagger: {
    user: envVars.SWAGGER_USER,
    password: envVars.SWAGGER_PASSWORD
  }
};