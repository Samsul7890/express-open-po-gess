export interface User {
  pk_user_id: string
  name: string
  email?: string
  phone_number?: string
  role: string
  google_id?: string
  password?: string
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'google_id'>
  token: string
}
