import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

interface EnvVars {
  DATABASE_URL: string;
  ANTHROPIC_API_KEY: string;
  CLAUDE_HAIKU_MODEL: string;
  CLAUDE_SONNET_MODEL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SENDGRID_API_KEY?: string;
  OTP_EXPIRY_MINUTES: string;
  NODE_ENV: string;
  BACKEND_PORT: string;
  FRONTEND_URL: string;
  SCHEDULER_TIMEZONE: string;
}

const envSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
  CLAUDE_HAIKU_MODEL: Joi.string().required(),
  CLAUDE_SONNET_MODEL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  SENDGRID_API_KEY: Joi.string().optional(),
  OTP_EXPIRY_MINUTES: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  BACKEND_PORT: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  SCHEDULER_TIMEZONE: Joi.string().default('Asia/Kolkata'),
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const env = value as EnvVars;

export default env;
