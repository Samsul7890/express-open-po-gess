import { Request, Response } from "express"
import { authService } from "./auth.service"
import { registerSchema, loginSchema, updateSchema, changePasswordSchema } from "./auth.dto"
import { sendSuccess, sendError } from "../../utils/response"
import { env } from "../../config/env"

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { error, value } = registerSchema.validate(req.body)
      if (error) return sendError(res, error.details[0].message, 400)

      const response = await authService.register(value)
      res.cookie("token", response.token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      return sendSuccess(res, { user: response.user }, "Registration successful", 201)
    } catch (err: any) {
      if (err.message === "Phone number or email already in use") {
        return sendError(res, err.message, 400)
      }
      console.error("Register Error:", err)
      return sendError(res, "Internal server error", 500)
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body)
      if (error) return sendError(res, error.details[0].message, 400)

      const response = await authService.login(value)
      res.cookie("token", response.token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      return sendSuccess(res, { user: response.user }, "Login successful")
    } catch (err: any) {
      if (err.message === "Invalid phone number or password" || err.message === "Please login with Google") {
        return sendError(res, err.message, 401)
      }
      console.error("Login Error:", err)
      return sendError(res, "Internal server error", 500)
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { error, value } = updateSchema.validate(req.body)
      if (error) return sendError(res, error.details[0].message, 400)

      const userId = req.user?.pk_user_id
      if (!userId) return sendError(res, "Unauthorized", 401)

      const response = await authService.updateProfile(userId, value)
      
      // Set the fresh token containing the updated name in the cookie
      res.cookie("token", response.token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      
      return sendSuccess(res, { user: response.user }, "User updated successfully")
    } catch (err: any) {
      if (err.message === "User not found") {
        return sendError(res, err.message, 404)
      }
      console.error("Update User Error:", err)
      return sendError(res, "Internal server error", 500)
    }
  }
  async changePassword(req: Request, res: Response) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body)
      if (error) return sendError(res, error.details[0].message, 400)

      const userId = req.user?.pk_user_id
      if (!userId) return sendError(res, "Unauthorized", 401)

      await authService.changePassword(userId, value)
      return sendSuccess(res, null, "Password changed successfully")
    } catch (err: any) {
      if (err.message === "User not found") {
        return sendError(res, err.message, 404)
      }
      if (err.message === "Invalid current password" || err.message === "Account uses Google authentication") {
        return sendError(res, err.message, 400)
      }
      console.error("Change Password Error:", err)
      return sendError(res, "Internal server error", 500)
    }
  }

  async googleCallback(req: Request, res: Response) {
      console.log("token", req.user)

    try {
      const profile = req.user as unknown as { email: string; name: string; googleId: string }
      if (!profile || !profile.email) {
        return sendError(res, "Invalid Google profile data", 400)
      }

      const response = await authService.handleGoogleLogin(profile.email, profile.name, profile.googleId)
      console.log("token", response.token)
      res.cookie("token", response.token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.redirect(env.frontendUrl)
    } catch (err) {
      console.error("Google Callback Error:", err)
      return sendError(res, "Internal server error", 500)
    }
  }

  logout(_req: Request, res: Response) {
    res.clearCookie("token")
    return sendSuccess(res, null, "Logout successful")
  }
}

export const authController = new AuthController()
