// Vitest setup file - configure test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/student_companion_test';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
process.env.CLAUDE_HAIKU_MODEL = 'claude-3-5-haiku-20241022';
process.env.CLAUDE_SONNET_MODEL = 'claude-3-5-sonnet-20241022';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.OTP_EXPIRY_MINUTES = '10';
process.env.BACKEND_PORT = '5000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.SCHEDULER_TIMEZONE = 'Asia/Kolkata';
