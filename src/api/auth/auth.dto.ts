import Joi from "joi"

export const registerSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("seller", "customer").required(),
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
})

export type RegisterDto = {
  phoneNumber: string
  password: string
  role: string
  name: string
  email?: string
}

export const loginSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  password: Joi.string().required(),
})

export type LoginDto = {
  phoneNumber: string
  password: string
}

export const updateSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
})

export type UpdateDto = {
  phoneNumber: string
  name: string
  email?: string
}

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
})

export type ChangePasswordDto = {
  oldPassword: string
  newPassword: string
}
