import { prisma } from "../../config/db"
import { User } from "./auth.model"
import { RegisterDto, UpdateDto } from "./auth.dto"

const mapUser = (user: any): User => ({
  pk_user_id: user.pk_user_id,
  name: user.name,
  email: user.email || undefined,
  phone_number: user.phone_number || undefined,
  role: user.role,
  google_id: user.google_id || undefined,
  password: user.password || undefined,
})

export class AuthData {
  async findUserByPhoneOrEmail(phoneNumber: string, email?: string): Promise<{ pk_user_id: string } | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone_number: phoneNumber },
          ...(email ? [{ email }] : [])
        ]
      },
      select: { pk_user_id: true }
    })
    return user
  }

  async findUserByPhone(phoneNumber: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { phone_number: phoneNumber }
    })
    return user ? mapUser(user) : null
  }

  async createUser(data: RegisterDto, hashedPassword?: string): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          phone_number: data.phoneNumber,
          password: hashedPassword || null,
          role: data.role,
          name: data.name,
          email: data.email || null
        }
      })
      return mapUser(user)
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error("Phone number or email already in use")
      }
      throw error
    }
  }

  async updateUser(userId: string, data: UpdateDto): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { pk_user_id: userId },
        data: {
          phone_number: data.phoneNumber,
          name: data.name,
          email: data.email || null
        }
      })
      return mapUser(user)
    } catch (error) {
      return null
    }
  }
  async findUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { pk_user_id: userId }
    })
    return user ? mapUser(user) : null
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { pk_user_id: userId },
        data: { password: hashedPassword }
      })
      return true
    } catch {
      return false
    }
  }

  async upsertGoogleUser(email: string, name: string, googleId: string, role: string): Promise<User> {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, google_id: googleId },
      create: {
        name,
        email,
        google_id: googleId,
        role
      }
    })
    return mapUser(user)
  }
}

export const authData = new AuthData()
