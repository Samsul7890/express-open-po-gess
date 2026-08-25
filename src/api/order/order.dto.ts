import Joi from "joi"

const orderItemSchema = Joi.object({
  pk_po_id: Joi.string().required(),
  requested_date: Joi.date().iso().required(),
  qty: Joi.number().min(1).required(),
  notes: Joi.string().allow(null, ""),
  additional_ids: Joi.array().items(Joi.number()).default([]),
})

export const createOrderSchema = Joi.alternatives().try(
  Joi.array().items(orderItemSchema).min(1),
  orderItemSchema
)

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid("incoming", "confirm", "cancel", "done").required(),
})

export const updateOrderSchema = Joi.object({
  qty: Joi.number().min(1).optional(),
  notes: Joi.string().allow(null, "").optional(),
  requested_date: Joi.date().iso().optional(),
  status: Joi.string().valid("incoming", "confirm", "cancel", "done").optional(),
  additional_ids: Joi.array().items(Joi.number()).optional(),
  deleted_additional_ids: Joi.array().items(Joi.number()).optional(),
})
