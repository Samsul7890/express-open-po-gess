import { Request, Response, NextFunction } from "express"
import { sendError } from "../utils/response"

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Unauthorized", 401,["User is not authenticated"])
    }

    if (req.user.role !== role) {
      return sendError(res, "Forbidden",403, [`User must have the '${role}' role to access this resource`])
    }

    next()
  }
}
