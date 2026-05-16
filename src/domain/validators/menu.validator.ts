import Joi from "joi";

export const menuSchemas = {
  create: Joi.object({
    label: Joi.string().min(2).max(50).required().messages({
      "string.empty": "Label menu tidak boleh kosong.",
      "string.min": "Label minimal 2 karakter.",
      "any.required": "Label wajib diisi."
    }),
    path: Joi.string().min(1).required().messages({
      "string.empty": "Path/URL tidak boleh kosong.",
      "any.required": "Path wajib diisi."
    }),
    icon: Joi.string().allow(null, "").optional(),
    order: Joi.number().integer().min(0).required().messages({
      "number.base": "Order harus berupa angka.",
      "any.required": "Order wajib diisi."
    }),
    parentId: Joi.string().uuid().allow(null, "").optional().messages({
      "string.uuid": "Format Parent ID tidak valid (harus UUID)."
    }),
    permissionId: Joi.string().uuid().allow(null, "").optional().messages({
      "string.uuid": "Format Permission ID tidak valid (harus UUID)."
    })
  }),

  update: Joi.object({
    label: Joi.string().min(2).max(50).optional(),
    path: Joi.string().min(1).optional(),
    icon: Joi.string().allow(null, "").optional(),
    order: Joi.number().integer().min(0).optional(),
    parentId: Joi.string().uuid().allow(null, "").optional().messages({
      "string.uuid": "Format Parent ID tidak valid."
    }),
    permissionId: Joi.string().uuid().allow(null, "").optional().messages({
      "string.uuid": "Format Permission ID tidak valid."
    })
  }).min(1).messages({
    "object.min": "Minimal harus ada satu bidang yang diperbarui."
  }),

  delete: Joi.object({
    id: Joi.string().uuid().required().messages({
      "string.uuid": "ID Menu tidak valid.",
      "any.required": "ID Menu wajib disertakan."
    })
  })
};