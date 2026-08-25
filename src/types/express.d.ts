import type { JwtPayload } from "@/utils/jwt"

declare global {
  namespace Express {
    // Override default Express.User with our JwtPayload type
    interface User extends JwtPayload {}
  }
}
