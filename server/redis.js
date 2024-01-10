import Redis from 'ioredis';
import { REDIS_DB_URL } from '../constants/constants.js';

// maxRetriesPerRequest: null required by BullMQ
const redis = new Redis(REDIS_DB_URL, { maxRetriesPerRequest: null });

export default redis;
