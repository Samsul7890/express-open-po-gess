import Joi from "joi"

export const createOpenPOSchema = Joi.object({
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  cut_off: Joi.number().min(0).required(),
  always_ready: Joi.boolean().default(false),
  fk_product_id: Joi.number().required(),
})

export const updateOpenPOSchema = Joi.object({
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  cut_off: Joi.number().min(0),
  always_ready: Joi.boolean(),
})
