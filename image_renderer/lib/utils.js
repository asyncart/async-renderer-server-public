import fs from 'fs/promises';
import { bucket } from '../../lib/common/gcloudUtils.js';

export const loadLocalFile = async uri => fs.readFile(`./tmp/images/${uri}`);

export const loadCloudFile = async (uri, loadSmallerImage = false) => {
  const file = `${loadSmallerImage ? 'ipfs-2k' : 'ipfs'}/${uri}`;
  const buffer = await bucket.file(file).download();
  return buffer[0];
};
