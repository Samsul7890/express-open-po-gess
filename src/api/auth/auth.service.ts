import bcrypt from "bcrypt"
import { authData } from "./auth.data"
import { RegisterDto, LoginDto, UpdateDto } from "./auth.dto"
import { AuthResponse } from "./auth.model"
import { signToken } from "../../utils/jwt"

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const userExist = await authData.findUserByPhoneOrEmail(data.phoneNumber, data.email)
    if (userExist) {
      throw new Error("Phone number or email already in use")
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const user = await authData.createUser(data, hashedPassword)
    
    const token = signToken({ pk_user_id: user.pk_user_id, email: user.email || "", name: user.name, role: user.role })
    
    // Omit password from response just in case
    delete user.password
    
    return { user, token }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await authData.findUserByPhone(data.phoneNumber)

    if (!user) {
      throw new Error("Invalid phone number or password")
    }

    if (!user.password) {
      throw new Error("Please login with Google")
    }

    const isMatch = await bcrypt.compare(data.password, user.password)
    if (!isMatch) {
      throw new Error("Invalid phone number or password")
    }

    const token = signToken({ pk_user_id: user.pk_user_id, email: user.email || "", name: user.name, role: user.role })
    
    delete user.password

    return { user, token }
  }

  async updateProfile(userId: string, data: UpdateDto): Promise<AuthResponse> {
    const user = await authData.updateUser(userId, data)
    
    if (!user) {
      throw new Error("User not found")
    }

    // Generate a fresh token so the JWT payload contains the updated name
    const token = signToken({ 
      pk_user_id: user.pk_user_id, 
      email: user.email || "", 
      name: user.name, 
      role: user.role 
    })
    
    return { user, token }
  }
  async changePassword(userId: string, data: { oldPassword: string; newPassword: string }): Promise<void> {
    const user = await authData.findUserById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    if (!user.password) {
      throw new Error("Account uses Google authentication")
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password)
    if (!isMatch) {
      throw new Error("Invalid current password")
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10)
    await authData.updatePassword(userId, hashedNewPassword)
  }

  async handleGoogleLogin(email: string, name: string, googleId: string): Promise<AuthResponse> {
    const user = await authData.upsertGoogleUser(email, name, googleId, 'customer')
    const token = signToken({ pk_user_id: user.pk_user_id, email: user.email || "", name: user.name, role: user.role })
    delete user.password
    return { user, token }
  }
}

export const authService = new AuthService()
