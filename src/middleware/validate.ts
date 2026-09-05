import { Request, Response, NextFunction } from "express"
import Joi from "joi"
import { sendError } from "../utils/response"

type ValidateTarget = "body" | "params" | "query"

export const validate =
  (schema: Joi.ObjectSchema, target: ValidateTarget = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((d) => d.message)
      sendError(res, "Validation Error", 422, errors)
      return
    }

    req[target] = value
    next()
  }
