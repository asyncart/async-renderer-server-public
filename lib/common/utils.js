// @ts-check
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';

export const getQueryStr = object =>
  Object.keys(object)
    .filter(key => Boolean(object[key]))
    .sort()
    .map(key => `${key}=${encodeURIComponent(object[key])}`)
    .join('&');

export const getRandomString = length =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .substring(0, length);

// ESM can't load JSON files yet (as of Node.js v18)
// filePath has to start from project root
export const loadJSONFile = filePath => {
  const require = createRequire(import.meta.url);
  return require(path.resolve(filePath));
};

export const doesFileExist = async url => {
  try {
    // Only download the head instead of the entire file
    const response = await axios.head(url);
    return response.status === 200;
  } catch (err) {
    return false;
  }
};

export const fsExists = async path => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
};

export const saveFfmpeg = (command, fileOutputPath) =>
  new Promise((resolve, reject) => {
    command.on('error', reject).on('end', resolve).save(fileOutputPath);
  });
