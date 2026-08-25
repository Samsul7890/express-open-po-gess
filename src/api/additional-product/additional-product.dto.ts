import Joi from "joi"

export const createAdditionalSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0).required(),
})

export const updateAdditionalSchema = Joi.object({
  name: Joi.string(),
  price: Joi.number().min(0),
})
