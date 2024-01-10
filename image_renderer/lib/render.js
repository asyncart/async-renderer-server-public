import seedrandom from 'seedrandom';
import baseRenderer from './baseRenderer.js';
import { v2Contract, v1Contract } from '../../constants/contracts.js';
import { loadJSONFile } from '../../lib/common/utils.js';
import { loadCloudFile, loadLocalFile } from './utils.js';

class Tokens {
  constructor({ blockNum, cache, timestampOffset, unmintedTokenValues }) {
    this.blockNum = parseInt(blockNum) || -1;
    this.cache = cache || {};
    this.timestampOffset = timestampOffset || 0;

    this.unmintedTokenValues = unmintedTokenValues;
    this.random = null;
    this.renderValues = []; // this stores the render values as they're looked up
  }

  async getRandomInt(maxExclusive) {
    if (!this.random) {
      const seed = await this.getTimestamp();
      this.random = seedrandom(seed);
    }

    return Math.floor(this.random() * maxExclusive);
  }

  getTimestamp() {
    if (this.cache.timestamp) return this.cache.timestamp;
    const timestamp = Math.round(Date.now() / 1000) + this.timestampOffset;
    this.cache.timestamp = timestamp;
    return this.cache.timestamp;
  }

  async getControlToken(tokenId, relativeTokenId) {
    if (this.cache[tokenId]) return this.cache[tokenId];

    // Options MUST be an object (it can't be undefined/null or ethers will crash)
    const options = this.blockNum >= 0 ? { blockTag: this.blockNum } : {};

    let controlToken = await v2Contract
      .getControlToken(tokenId, options)
      .catch(() => null);

    // There are only 348 tokens [0 - 347] on the v1 contract
    if (!controlToken && tokenId <= 347) {
      controlToken = await v1Contract
        .getControlToken(tokenId, options)
        .catch(() => null);
    }

    if (!controlToken) {
      // If no token found in main contract or fallback contract, then use the unminted token
      // Use the relative token id for the unminted token values since when we generate the layout we don't know the absolute token Ids
      controlToken = this.unmintedTokenValues[relativeTokenId];
    }

    this.cache[tokenId] = controlToken;
    return this.cache[tokenId];
  }
}

async function getTokenMetadata(tokenId) {
  let tokenURI = await v2Contract.tokenURI(tokenId).catch();
  // if undefined then token wasn't upgraded, use fallback instead
  if (!tokenURI) tokenURI = await v1Contract.tokenURI(tokenId);

  // Some old pieces contain "master" field which is the pointer
  // to actual metadata that includes layout field.
  const responseBuffer = await loadCloudFile(tokenURI);
  const data = JSON.parse(responseBuffer.toString());

  if (data.master) {
    const responseBuffer2 = await loadCloudFile(data.master);
    return JSON.parse(responseBuffer2.toString());
  }

  return data;
}

async function initLayoutAndTokens(
  loadFile,
  blockNum,
  tokenMetadata,
  prefetchedCache
) {
  const timestampOffset =
    // v1 gasless
    tokenMetadata['async-attributes']?.default_utc_offset ||
    // v2 gasless
    tokenMetadata['async-attributes']?.timezone?.default_utc_offset ||
    0;
  const unmintedTokenValues =
    tokenMetadata['async-attributes']?.['unminted-token-values'] || {};

  const tokens = new Tokens({
    blockNum,
    timestampOffset,
    unmintedTokenValues,
    cache: prefetchedCache,
  });

  return {
    loadFile,
    layout: tokenMetadata.layout,
    tokens
  };
}

/* Used for determining the render values before actually rendering an image. Used for caching previous rendered states. */
async function peekAtRenderValues(tokenId, blockNum) {
  const tokenMetadata = await getTokenMetadata(tokenId);
  let layoutAndTokens = await initLayoutAndTokens(
    loadCloudFile,
    blockNum,
    tokenMetadata,
    null
  );

  // load the render values into the layoutAndTokens object (this will fill up the cache etc)
  await baseRenderer.loadRenderValues(layoutAndTokens, tokenId);
  layoutAndTokens.json = tokenMetadata;

  return layoutAndTokens;
}

async function renderLocal(layoutFilePath, controlTokensFilePath) {
  let layoutAndTokens = await initLayoutAndTokens(
    loadLocalFile,
    -1,
    loadJSONFile(layoutFilePath),
    loadJSONFile(controlTokensFilePath)
  );

  return baseRenderer.render(layoutAndTokens, 0);
}

async function renderFromChain(tokenId, blockNum, controlTokensMap) {
  const tokenMetadata = await getTokenMetadata(tokenId);
  let layoutAndTokens = await initLayoutAndTokens(
    loadCloudFile,
    blockNum,
    tokenMetadata,
    controlTokensMap
  );

  return baseRenderer.render(layoutAndTokens, tokenId);
}

export default {
  renderLocal,
  renderFromChain,
  peekAtRenderValues,
};
