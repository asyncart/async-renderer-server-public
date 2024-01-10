import axios from 'axios';
import crypto from 'crypto';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { bucket } from '../../lib/common/gcloudUtils.js';
import { fsExists } from '../../lib/common/utils.js';

export const loadLocalFile = uri => `./tmp/classic-music-example/${uri}`;

export const loadCloudFile = async (uri, outputDir) => {
  const destination = `${outputDir}/${uri}`;
  await bucket.file(`ipfs-audio/${uri}`).download({ destination });
  return destination;
};

export const loadWebFile = async (url, outputDir) => {
  // we're loading a URL, so turn it into a random file name:
  const cachedAudioBuffersFolder = `${outputDir}/cachedAudioBuffers`;
  const urlHash = crypto.createHash('sha256').update(url).digest('hex');

  const destination = `${cachedAudioBuffersFolder}/${urlHash}`;
  const wasDestinationCached = await fsExists(destination);

  if (wasDestinationCached) return destination;

  await fs.mkdir(cachedAudioBuffersFolder, { recursive: true });
  const writer = createWriteStream(destination);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(destination));
    writer.on('error', reject);
  });
};
