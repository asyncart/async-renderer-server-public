import os from 'os';
import path from 'path';
import Jimp from 'jimp';
import redis from './redis.js';
import EventEmitter from 'events';

import { Worker } from 'bullmq';
import { ENV_NAME, __DEV__ } from '../constants/constants.js';
import logger from '../lib/logger/logger.js';

// https://github.com/jimp-dev/jimp/issues/915#issuecomment-967163466
const cachedJpegDecoder = Jimp.decoders['image/jpeg'];
Jimp.decoders['image/jpeg'] = data => {
  const userOpts = { maxMemoryUsageInMB: 1024 };
  return cachedJpegDecoder(data, userOpts);
};

const concurrency = os.cpus().length;
const maxEventListeners = concurrency > 10 ? concurrency + 1 : 10;

// Required to avoid warning on 10+ threads CPU (e.g. dev's machine)
EventEmitter.setMaxListeners(maxEventListeners);

const processorFilePath = path.resolve('./server/worker.js');
const worker = new Worker('renderRequests', processorFilePath, {
  connection: redis,
  concurrency: __DEV__ ? 1 : concurrency,
});

logger.info(`Renderer process started in ${ENV_NAME}`);
