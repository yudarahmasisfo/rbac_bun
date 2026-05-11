import Joi from "joi";

export const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9_]+$/)
      .min(3)
      .max(30)
      .required()
      .messages({
        "string.empty": "Username tidak boleh kosong.",
        "string.min": "Username minimal harus 3 karakter.",
        "string.pattern.base":
          "Username hanya boleh berisi huruf, angka, dan underscore (_).",
        "any.required": "Username wajib diisi.",
      }),
    name: Joi.string()
      .pattern(/^[a-zA-Z\s]+$/)
      .min(3)
      .max(50)
      .required()
      .messages({
        "string.empty": "Nama lengkap tidak boleh kosong.",
        "string.pattern.base":
          "Nama lengkap hanya boleh berisi huruf dan spasi.",
        "any.required": "Nama lengkap wajib diisi.",
      }),
    email: Joi.string().email().required().messages({
      "string.email": "Format email tidak valid.",
      "string.empty": "Email tidak boleh kosong.",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password minimal harus 8 karakter.",
      "string.empty": "Password wajib diisi.",
    }),
    roleIds: Joi.array()
      .items(
        Joi.string().uuid().messages({
          "string.guid":
            "ID Role '{#value}' tidak valid. Pastikan formatnya benar.",
          "string.base": "ID Role harus berupa teks.",
        }),
      )
      .min(1)
      .required()
      .messages({
        "array.min": "User minimal harus memiliki 1 Role.",
        "array.base": "Daftar Role (roleIds) harus berupa Array.",
        "any.required": "Akses Role wajib ditentukan.",
      }),
  }),

  update: Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9_]+$/)
      .min(3)
      .max(30)
      .optional()
      .messages({
        "string.empty": "Username tidak boleh kosong jika disertakan.",
        "string.min": "Username minimal harus 3 karakter.",
        "string.pattern.base":
          "Username hanya boleh berisi huruf, angka, dan underscore (_).",
      }),
    name: Joi.string()
      .pattern(/^[a-zA-Z0-9\s]+$/)
      .min(3)
      .max(50)
      .optional()
      .messages({
        "string.empty": "Nama lengkap tidak boleh kosong jika disertakan.",
        "string.pattern.base":
          "Nama lengkap hanya boleh berisi huruf, angka, dan spasi.",
      }),
    email: Joi.string().email().optional().messages({
      "string.email": "Format email tidak valid.",
    }),
    password: Joi.string().min(8).optional().messages({
      "string.min": "Password minimal harus 8 karakter.",
    }),
    roleIds: Joi.array()
      .items(
        Joi.string().uuid().messages({
          "string.guid": "ID Role '{#value}' tidak valid.",
        }),
      )
      .min(1)
      .optional()
      .messages({
        "array.min": "Minimal harus ada 1 Role jika ingin memperbarui role.",
      }),
  }),

  login: Joi.object({
    username: Joi.string().required().messages({
      "string.empty": "Username masih kosong, tolong diisi.",
      "any.required": "Username wajib diisi."
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password masih kosong, tolong diisi.",
      "any.required": "Password wajib diisi."
    })
  }),

};
