import renderer from './layered_static.js';
import { v2Contract } from '../../constants/contracts.js';
import { bucket } from '../../lib/common/gcloudUtils.js';
import { loadJSONFile } from '../../lib/common/utils.js';
import { loadCloudFile, loadLocalFile } from './utils.js';

// tokenDataFilePath & controlTokensFilePath must be ABSOLUTE paths to JSON files
async function renderLocal(tokenDataFilePath, controlTokensFilePath) {
  return renderer.render(
    loadLocalFile,
    loadJSONFile(tokenDataFilePath),
    loadJSONFile(controlTokensFilePath),
    0
  );
}

async function renderFromChain(tokenId, controlTokensMap) {
  const tokenURI = await v2Contract.tokenURI(tokenId);
  const buffer = await bucket.file(`ipfs/${tokenURI}`).download();
  const tokenData = JSON.parse(buffer[0].toString());
  return renderer.render(loadCloudFile, tokenData, controlTokensMap, tokenId);
}

export default {
  renderLocal,
  renderFromChain
};
