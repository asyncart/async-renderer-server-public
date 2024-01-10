const NODE_ENV = process.env.NODE_ENV || 'development';
export const __DEV__ = NODE_ENV === 'development';
export const ENV_NAME = process.env.ENV_NAME;
export const SERVER_BASE = process.env.SERVER_BASE;
export const REDIS_DB_URL = process.env.REDIS_DB_URL;
export const RENDERER_AUTH_SECRET = process.env.RENDERER_AUTH_SECRET;
export const JSON_RPC_PROVIDER = process.env.JSON_RPC_PROVIDER;
export const V1_CONTRACT_ADDRESS = process.env.V1_CONTRACT_ADDRESS;
export const V2_CONTRACT_ADDRESS = process.env.V2_CONTRACT_ADDRESS;
export const CLOUDINARY_URL_PREFIX =
  'https://res.cloudinary.com/asynchronous-art-inc/image/upload/';
export const DISCORD_ERRORS_WEBHOOK = process.env.DISCORD_ERRORS_WEBHOOK;
