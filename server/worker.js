import Jimp from "jimp";
import axios from 'axios';
import fs from 'fs/promises';
import { RENDERER_AUTH_SECRET, SERVER_BASE } from '../constants/constants.js';
import { getQueryStr } from '../lib/common/utils.js';
import logger from '../lib/logger/logger.js';
import renderArt from '../lib/renderArt.js';
import {
  renderAudioClip,
  renderBlueprintEdition,
} from '../lib/renderBlueprintEdition.js';
import renderMusicEdition from '../lib/renderMusicEdition.js';

const defaultAxiosOptions = {
  headers: { Authorization: RENDERER_AUTH_SECRET },
};

// https://github.com/jimp-dev/jimp/issues/915#issuecomment-967163466
const cachedJpegDecoder = Jimp.decoders['image/jpeg'];
Jimp.decoders['image/jpeg'] = data => {
  const userOpts = { maxMemoryUsageInMB: 1024 };
  return cachedJpegDecoder(data, userOpts);
};

/** @param {import("bullmq").SandboxedJob} job */
export default async job => {
  try {
    // Sharp won't automatically create output directory so we need to do it.
    // https://github.com/lovell/sharp/issues/874
    await fs.mkdir('tmp', { recursive: true });

    if (job.name === 'art') {
      const { tokenAddress, tokenId, blockNum = -1, txHash } = job.data;
      const { audioUrl, imageUrl } = await renderArt(
        blockNum,
        parseInt(tokenId),
        txHash
      );

      const imagePath = imageUrl.split('/upload/')[1];
      const queryStr = getQueryStr({ imagePath, txHash, audioUrl });

      const endpoint = `${SERVER_BASE}arts/${tokenAddress}-${tokenId}?${queryStr}`;
      await axios.patch(endpoint);
    }

    if (job.name === 'mintededition') {
      const {
        masterTokenID,
        stemCount,
        editionType,
        blockHeight,
        mintedEditionId,
      } = job.data;

      const imageUrl = await renderMusicEdition({
        masterTokenID: parseInt(masterTokenID),
        stemCount: parseInt(stemCount),
        editionType,
        blockHeight: parseInt(blockHeight),
        mintedEditionId,
      });

      const endpoint = `${SERVER_BASE}mintedEditions/${mintedEditionId}?fullImageURL=${imageUrl}`;
      await axios.patch(endpoint);
    }

    if (job.name === 'blueprintedition') {
      const { slug, layout } = job.data;
      const { imageUrl, standardAudioUrl, hdAudioUrl, mergedMp4Url } =
        await renderBlueprintEdition(layout, slug);

      let endpoint = `${SERVER_BASE}blueprintEditions/${slug}/updateBlueprintEditionImage?`;
      if (imageUrl) endpoint = endpoint + `imageUrl=${imageUrl}&`;
      if (standardAudioUrl)
        endpoint = endpoint + `audioUrl=${standardAudioUrl}&`;
      if (hdAudioUrl) endpoint = endpoint + `hdAudioUrl=${hdAudioUrl}&`;
      if (mergedMp4Url) endpoint = endpoint + `mergedMp4Url=${mergedMp4Url}`;
      await axios.patch(endpoint);
    }

    if (job.name === 'blueprinteditionprerender') {
      const { bpId, index, layout } = job.data;
      const { imageUrl, standardAudioUrl, hdAudioUrl, mergedMp4Url } =
        await renderBlueprintEdition(layout, null);

      const endpoint = `${SERVER_BASE}blueprints/${bpId}/prerenderedImages/${index}`;
      await axios.patch(
        endpoint,
        {
          imageUrl,
          audioUrl: standardAudioUrl,
          hdAudioUrl,
          mergedMp4Url,
        },
        defaultAxiosOptions
      );
    }

    if (job.name === 'dynamicblueprintedition') {
      const { slug, layout, hash, renderSmallerImage } = job.data;
      logger.info({ slug, hash, renderSmallerImage }, 'Starting dynamicblueprintedition job');
      const { imageUrl, standardAudioUrl, hdAudioUrl, mergedMp4Url } =
        await renderBlueprintEdition(layout, hash, renderSmallerImage);

      let endpoint = `${SERVER_BASE}dynamicBlueprintEditions/${slug}/updateBlueprintEditionImage?`;
      if (imageUrl) endpoint = endpoint + `imageUrl=${imageUrl}&`;
      if (standardAudioUrl)
        endpoint = endpoint + `audioUrl=${standardAudioUrl}&`;
      if (hdAudioUrl) endpoint = endpoint + `hdAudioUrl=${hdAudioUrl}&`;
      if (mergedMp4Url) endpoint = endpoint + `mergedMp4Url=${mergedMp4Url}`;
      if (hash) endpoint = endpoint + `hash=${hash}`;
      await axios.patch(endpoint);
    }

    if (job.name === 'blueprintaudioclip') {
      const { eventId, audioUrls, timeStart, timeEnd, masteringObject } =
        job.data;

      const audioUrl = await renderAudioClip({
        audioUrls,
        masteringObject,
        timeStart,
        timeEnd,
      });

      const endpoint = `${SERVER_BASE}renderer/blueprintAudioClip`;
      await axios.post(endpoint, { eventId, audioUrl }, defaultAxiosOptions);
    }

    // When rendering a Dynamic Blueprint, we're just rendering a single default image.
    // We reuse the "blueprintEdition" function, because a DBP is just a BP with one state per layer.
    if (job.name === 'dynamicblueprint') {
      const { dbpId, typeName, layout } = job.data;
      logger.info({ job: job.data }, 'Rendering dynamic blueprint');
      const { imageUrl, standardAudioUrl, hdAudioUrl, mergedMp4Url } =
        await renderBlueprintEdition(layout);

      const endpoint = `${SERVER_BASE}dynamicBlueprints/${dbpId}/updateDefaultImage`;
      await axios.patch(
        endpoint,
        {
          typeName,
          imageUrl,
          audioUrl: standardAudioUrl,
          hdAudioUrl,
          mergedMp4Url
        },
        defaultAxiosOptions
      );
    }

  } catch (error) {
    // error field doesn't show up on OpenSearch for some reason
    logger.error({ error, job: job.data }, `Job failed: ${error}`);
    // Throw error so bullmq also marks job as failed
    throw error;
  }
};
