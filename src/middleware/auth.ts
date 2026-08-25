import { Request, Response, NextFunction } from "express"
import { verifyToken } from "@/utils/jwt"
import type { JwtPayload } from "@/utils/jwt"
import { sendError } from "@/utils/response"

export type { JwtPayload }

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.token

  if (!token) {
    sendError(res, "Unauthorized: No token provided", 401)
    return
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    sendError(res, "Unauthorized: Invalid or expired token", 401)
  }
}
