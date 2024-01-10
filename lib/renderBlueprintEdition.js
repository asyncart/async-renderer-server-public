import fs from 'fs/promises';
import sharp from 'sharp';
import crypto from 'crypto';
import cloudinary from './common/cloudinary.js';
import audio_renderer from '../audio_renderer/lib/layered_static.js';

import logger from '../lib/logger/logger.js';
import { getRandomString, saveFfmpeg } from './common/utils.js';
import { uploadAudio, bucket } from './common/gcloudUtils.js';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import ffmpeg from './common/ffmpeg.js';
import { loadCloudFile } from '../image_renderer/lib/utils.js';

async function renderImage(layers, filePath, loadSmallerImage=false) {
  const imageBuffers = await Promise.all(
    layers.map(layer => loadCloudFile(layer.uri, loadSmallerImage))
  );

  // Refactor layer.color in Blueprint.editionLayoutForRenderer on back-end
  const blendModes = layers.map(
    layer =>
      layer.blendMode
        ?.replace('normal', 'over')
        .replace('hardlight', 'hard-light') || 'over'
  );

  return sharp(imageBuffers[0])
    .composite(
      imageBuffers.slice(1).map((imageBuffer, index) => ({
        input: imageBuffer,
        blend: blendModes[index + 1],
        premultiplied: [
          'hard-light',
          'screen',
          'lighten',
          'multiply',
          'overlay',
        ].includes(blendModes[index + 1]),
      }))
    )
    .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
    .toFile(filePath);
}

// Renders a BlueprintEdition image and audio if applicable.
async function renderBlueprintEdition(layout, slug = null, renderSmallerImage = false) {
  logger.info({ slug, layout, renderSmallerImage }, `Rendering ${renderSmallerImage ? 'small' : ''} blueprint edition`);

  const filename = slug || getRandomString(10);
  const outputFilePath = `tmp/${filename}.jpg`;

  // For audio BPs, a layer may not have an image/.uri (might just have an .audioUri)
  const visualLayers = layout.layers.filter(layer => layer.uri);
  const result = await renderImage(visualLayers, outputFilePath, renderSmallerImage);

  // We hash metadata so prerenders are unguessable
  const cloudinaryPublicIdSuffix =
    slug ||
    crypto
      .createHash('md5')
      .update(`someHardToGuessPrefix${JSON.stringify(layout)}`)
      .digest('hex');

  const cloudinaryResult = await cloudinary.uploader.upload(outputFilePath, {
    public_id: `editionRenders/${cloudinaryPublicIdSuffix}`,
    invalidate: true,
  });

  logger.info(`Blueprint edition image: ${cloudinaryResult.secure_url}`);

  const imageUrl = cloudinaryResult.secure_url;

  // If at least one layer has an audio element, render the audio and MP4
  const audioUris = layout.layers
    .filter(layer => layer.audioUri)
    .map(layer => layer.audioUri);

  if (audioUris.length === 0) {
    await fs.rm(outputFilePath);
    return { imageUrl };
  }

  // Image needs to be resized to 1024px to dramatically speed up rendering speed
  const videoImagePath = `tmp/${filename}-1024.jpg`;
  const resizedWidth = Math.ceil(1024 * (result.width / result.height));

  await sharp(outputFilePath).resize(resizedWidth, 1024).toFile(videoImagePath);

  // At this point, all audio files are uploaded to GCS /ipfs bucket
  const audioUrls = audioUris.map(
    audioUri =>
      `https://storage.googleapis.com/${bucket.name}/ipfs-audio/${audioUri}`
  );

  const commonRenderUrlsConfig = {
    audioUrls,
    masteringObject: layout.mastering,
    title: null,
    artist: null,
  };

  // Render the standard audio, and attempt rendering the HD audio (it will return null if all uploaded assets aren't WAVs)
  const [standardAudioPath, hdAudioPath] = await Promise.all([
    audio_renderer.renderUrls({
      ...commonRenderUrlsConfig,
      renderHd: false,
    }),
    null,
    // audio_renderer.renderUrls({
    //   ...commonRenderUrlsConfig,
    //   renderHd: true
    // })
  ]);

  const [standardAudioFileBuffer, hdAudioFileBuffer] = await Promise.all([
    fs.readFile(standardAudioPath),
    hdAudioPath ? fs.readFile(hdAudioPath) : null,
  ]);

  // Upload the standard-quality audio file:
  const standardAudioUrl = await uploadAudio(
    standardAudioFileBuffer,
    `audio/${filename}.mp3`,
    'audio/mpeg'
  );

  logger.info(`Blueprint edition audio: ${standardAudioUrl}`);

  // Upload the HD audio file (if we've rendered it):
  const hdAudioUrl = hdAudioPath
    ? await uploadAudio(hdAudioFileBuffer, `audio/${filename}.wav`, 'audio/wav')
    : null;

  const videoDurationInSecs = await getAudioDurationInSeconds(
    standardAudioPath
  );

  // Generate the MP4 using the standard audio URL:
  const command = ffmpeg()
    .addInput(videoImagePath)
    .loop(1)
    .addInput(standardAudioPath)
    .outputOptions(['-vf format=yuv420p', `-t ${videoDurationInSecs}`]);

  const videoFilePath = `./tmp/${filename}.mp4`;
  await saveFfmpeg(command, videoFilePath);
  const cloudinaryVideoResult = await cloudinary.uploader.upload(
    videoFilePath,
    {
      resource_type: 'video',
      public_id: `editionVideoRenders/${cloudinaryPublicIdSuffix}`,
      invalidate: true,
    }
  );

  // Get the root directory of the audio file: path = "./tmp/renders/mstrom_14123/thefile.mp3";
  const rootRendersDirectory = standardAudioPath.slice(
    0,
    standardAudioPath.lastIndexOf('/')
  );

  await Promise.all([
    fs.rm(rootRendersDirectory, { recursive: true }),
    fs.rm(videoFilePath),
    fs.rm(outputFilePath),
  ]);

  return {
    imageUrl,
    standardAudioUrl,
    hdAudioUrl,
    mergedMp4Url: cloudinaryVideoResult.secure_url,
  };
}

/*
  Render a 30-second audio clip, using the provided mastering preset.
  Upload it to GCS and return URL.
*/
async function renderAudioClip({
  audioUrls,
  masteringObject,
  timeStart,
  timeEnd,
}) {
  logger.info(
    { audioUrls, masteringObject, timeStart, timeEnd },
    'Rendering audio clip'
  );

  // Render the file and return the local filepath:
  const audioFilePath = await audio_renderer.renderAudioClip({
    audioUrls,
    masteringObject,
    timeStart,
    timeEnd,
  });

  // Upload to GCS:
  const filename = getRandomString(10);
  const audioFileBuffer = await fs.readFile(audioFilePath);

  const filePath = `audio/tmp/${filename}.mp3`;
  const audioUrl = await uploadAudio(audioFileBuffer, filePath, 'audio/mpeg');
  logger.info(`Renderer audio clip: ${audioUrl}`);

  // TODO: make a task to delete this audio, or just delete everything older than an hour each 24 hours in the audio/tmp GCS folder.

  return audioUrl;
}

export { renderBlueprintEdition, renderAudioClip };
