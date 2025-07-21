export interface SignInFormData {
  email: string
  password: string
}

export interface AuthError {
  message: string
}

export interface User {
  id: string
  email: string
  created_at: string
}