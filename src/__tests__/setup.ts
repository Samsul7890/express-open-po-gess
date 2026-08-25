process.env.NODE_ENV = "test"
process.env.PORT = "3000"
process.env.DB_HOST = "localhost"
process.env.DB_PORT = "5432"
process.env.DB_USER = "test_user"
process.env.DB_PASSWORD = "test_password"
process.env.DB_NAME = "test_db"
process.env.JWT_SECRET = "test_jwt_secret_must_be_at_least_16_chars"
process.env.GOOGLE_CLIENT_ID = "test_client_id"
process.env.GOOGLE_CLIENT_SECRET = "test_client_secret"
process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/callback"
process.env.FRONTEND_URL = "http://localhost:5173"

jest.mock("swagger-jsdoc", () => {
  return jest.fn().mockReturnValue({})
})

