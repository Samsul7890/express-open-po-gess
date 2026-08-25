import Joi from "joi"

export const createStoreSchema = Joi.object({
  store_name: Joi.string().required(),
  phone_number: Joi.string().allow(null, ""),
})

export const updateStoreSchema = Joi.object({
  store_name: Joi.string(),
  phone_number: Joi.string().allow(null, ""),
})
