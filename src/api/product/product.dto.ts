import Joi from "joi"
import { createAdditionalSchema, updateAdditionalSchema } from "../additional-product/additional-product.dto"

export const createProductSchema = Joi.object({
  product_name: Joi.string().required(),
  description: Joi.string().allow(null, ""),
  price: Joi.number().min(0).required(),
  additionals: Joi.any().optional()
})

export const updateProductSchema = Joi.object({
  // Core product fields (all optional — only update what's sent)
  product_name: Joi.string().optional(),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().min(0).optional(),

  // Gallery: JSON-stringified array of galery IDs to delete + remove file
  deleted_galery_ids: Joi.any().optional(),

  // Additionals: JSON-stringified arrays, validated against existing additional schemas
  deleted_additional_ids: Joi.any().optional(),
  add_additionals: Joi.any().optional(),    // parsed in controller, items validated as createAdditionalSchema
  update_additionals: Joi.any().optional(), // parsed in controller, items validated as updateAdditionalSchema + id
})

// Reusable item-level schemas for validating parsed arrays in the controller
export const addAdditionalItemSchema = createAdditionalSchema

export const updateAdditionalItemSchema = updateAdditionalSchema.keys({
  id: Joi.number().integer().required(),
})

