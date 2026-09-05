import { Router, Request, Response } from "express"
import passport from "../../config/passport"
import { signToken } from "../../utils/jwt"
import { sendSuccess, sendError } from "../../utils/response"
import { authenticate } from "../../middleware/auth"
import { authController } from "../auth/auth.controller"

const router = Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *               - role
 *               - name
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [seller, user]
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", authController.register.bind(authController))

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login.bind(authController))

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (clears cookie)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", authController.logout.bind(authController))

/**
 * @swagger
 * /api/auth/updateUser:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - name
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/updateUser", authenticate, authController.updateUser.bind(authController))

/**
 * @swagger
 * /api/auth/changePassword:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid old password or validation error
 *       401:
 *         description: Unauthorized
 */
router.put("/changePassword", authenticate, authController.changePassword.bind(authController))

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
)

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback — issues JWT
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Returns JWT token
 *       401:
 *         description: Authentication failed
 */
router.get(
  "/google/callback",
  (req: Request, res: Response, next: any) => {
    passport.authenticate("google", { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error("[Google OAuth Error]", err)
        return next(err)
      }
      if (!user) {
        console.error("[Google OAuth Warning] No user returned:", info)
        return res.status(401).json({ success: false, message: info?.message || "Google authentication failed" })
      }
      req.user = user
      return next()
    })(req, res, next)
  },
  authController.googleCallback.bind(authController)
)

/**
 * @swagger
 * /api/auth/failure:
 *   get:
 *     summary: OAuth failure fallback
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get("/failure", (_req: Request, res: Response) => {
  sendError(res, "Google authentication failed", 401)
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns authenticated user info
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, (req: Request, res: Response) => {
  sendSuccess(res, req.user, "Authenticated user")
})

export default router
