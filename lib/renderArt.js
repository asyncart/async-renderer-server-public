// @ts-check
import {
  V2_CONTRACT_ADDRESS,
  CLOUDINARY_URL_PREFIX,
} from '../constants/constants.js';
import {
  uploadAudio,
  checkFileExists,
  getPublicURLforFilePath,
} from './common/gcloudUtils.js';
import { doesFileExist } from './common/utils.js';

import fs from 'fs/promises';
import crypto from 'crypto';
import logger from '../lib/logger/logger.js';
import cloudinary from './common/cloudinary.js';
import image_renderer from '../image_renderer/lib/render.js';
import audio_renderer from '../audio_renderer/lib/render.js';
import Jimp from 'jimp';

async function renderArtImage(
  tokenId,
  blockNum,
  controlTokensMap,
  cloudinaryPublicId
) {
  const renderedImage = await image_renderer.renderFromChain(
    tokenId,
    blockNum,
    controlTokensMap
  );

  const finalImageBase64 = await renderedImage.getBase64Async(Jimp.AUTO);
  const cloudinaryResult = await cloudinary.uploader.upload(finalImageBase64, {
    public_id: cloudinaryPublicId,
    invalidate: true,
  });

  return cloudinaryResult.secure_url;
}

async function renderArtAudio(tokenId, slug, imageRenderKey, controlTokensMap) {
  logger.info({ slug, imageRenderKey }, 'Rendering classic art audio');

  const filePath = `audio/${slug}/${imageRenderKey}`;
  const targetAudioUrl = getPublicURLforFilePath(filePath);

  const wasAudioPreviouslyRendered = await checkFileExists(filePath);
  if (wasAudioPreviouslyRendered) return targetAudioUrl;

  const audioFilePath = await audio_renderer.renderFromChain(
    tokenId,
    controlTokensMap
  );

  const audioFileBuffer = await fs.readFile(audioFilePath);
  await fs.rm(audioFilePath, { recursive: true });

  return uploadAudio(audioFileBuffer, filePath, 'audio/mpeg');
}

async function renderArt(blockNum, tokenId, txHash, force = false) {
  logger.info({ tokenId, blockNum, txHash }, 'Rendering classic art');

  const slug = `${V2_CONTRACT_ADDRESS}-${tokenId}`;

  // This looks at the blockchain values we'll be rendering.
  const peekedRenderValues = await image_renderer.peekAtRenderValues(
    tokenId,
    blockNum
  );
  // get the raw image key (e.g. 1_3_4_34_43_34_32)
  const imageRenderKeyRaw = peekedRenderValues.tokens.renderValues.join('_');

  // hash the image key to keep it within a certain length (otherwise it can get too long to use on cloudinary)
  const imageRenderKey = crypto
    .createHash('md5')
    .update(imageRenderKeyRaw)
    .digest('hex');

  const cloudinaryPublicId = `renders/${slug}/${imageRenderKey}`;
  const cloudinaryTargetURL = `${CLOUDINARY_URL_PREFIX}${cloudinaryPublicId}`;

  // If we're force-rendering, don't check if the file exists
  const wasImagePreviouslyRendered = force
    ? false
    : await doesFileExist(`${cloudinaryTargetURL}.jpg`);

  logger.info(`wasImagePreviouslyRendered: ${wasImagePreviouslyRendered}`);

  const shouldRenderAudio = 'audio-layout' in peekedRenderValues.json;

  const audioUrl = shouldRenderAudio
    ? await renderArtAudio(
        tokenId,
        slug,
        imageRenderKey,
        peekedRenderValues.tokens.cache
      )
    : null;

  const imageUrl = wasImagePreviouslyRendered
    ? cloudinaryTargetURL
    : await renderArtImage(
        tokenId,
        blockNum,
        // set this so that the renderer can use them if we end up rendering the image fresh (no need to double pull values)
        peekedRenderValues.tokens.cache,
        cloudinaryPublicId
      );

  return { audioUrl, imageUrl };
}

export default renderArt;
