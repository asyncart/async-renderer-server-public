// @ts-check
import { SERVER_BASE, V2_CONTRACT_ADDRESS } from '../constants/constants.js';
import { loadJSONFile } from './common/utils.js';
import { v2Contract } from '../constants/contracts.js';
import axios from 'axios';
import renderArt from './renderArt.js';
import cloudinary from './common/cloudinary.js';
import image_renderer from '../image_renderer/lib/baseRenderer.js';
import logger from './logger/logger.js';
import { loadCloudFile } from '../image_renderer/lib/utils.js';
import Jimp from 'jimp';

// Remove unsupported characters
// https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
function sanitize(str) {
  // "B"s not caught by regex so have to be manually removed
  return str
    .replace('฿', 'B')
    .replace('₿', 'B')
    .replace('பண் (Pann)', 'Pann')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const lookupOwnerName = async address => {
  const { data } = await axios.get(`${SERVER_BASE}users/${address}`);

  if (data.name) return data.name;
  return `${address.substring(0, 6)}...${address.substring(38, 42)}`;
};

function truncateStemName(stemName) {
  // if it's an eth address, use beginning and end
  if (stemName.startsWith('0x') && stemName.length === 42)
    return `${stemName.substring(0, 7)}...${stemName.substring(38, 42)}`;

  if (stemName.length > 14) return `${stemName.substring(0, 14)}...`;

  return stemName;
}

function generateLayoutFromTemplate(
  editionType,
  stemCount,
  editionInfo,
  albumUri
) {
  const stemOwnersTemplate = [
    {
      id: 'Stem Owner 1',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 1906,
        },
      },
    },
    {
      id: 'Stem Owner 2',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 920,
          y: 1906,
        },
      },
    },
    {
      id: 'Stem Owner 3',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 1240,
          y: 1906,
        },
      },
    },
    {
      id: 'Stem Owner 4',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 1956,
        },
      },
    },
    {
      id: 'Stem Owner 5',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 920,
          y: 1956,
        },
      },
    },
    {
      id: 'Stem Owner 6',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 1240,
          y: 1956,
        },
      },
    },
    {
      id: 'Stem Owner 7',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 2006,
        },
      },
    },
    {
      id: 'Stem Owner 8',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 920,
          y: 2006,
        },
      },
    },
    {
      id: 'Stem Owner 9',
      text: {
        text: 'XXX',
        font: `image_renderer/fonts/RecordedEdition${editionType}SmallContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 1240,
          y: 2006,
        },
      },
    },
  ]
    .slice(0, stemCount)
    .map((stemOwner, index) => {
      stemOwner.text.text = sanitize(
        truncateStemName(editionInfo.stemNames[index])
      );
      return stemOwner;
    });

  return [
    {
      id: 'Background',
      uri: `EditionAssets/Music${editionType}Edition/Layers/001_Background/01_STATE_1/01_NORMAL.jpg`,
      label: '1',
    },
    {
      id: 'Album',
      'relative-position': {
        x: -134,
        y: -278,
      },
      scale: {
        x: 45,
        y: 45,
      },
      uri: albumUri,
      label: '1',
      anchor: 'Background',
    },
    {
      id: 'Title Text',
      text: {
        text: sanitize(editionInfo.title),
        font: `image_renderer/fonts/RecordedEdition${editionType}MasterTrack/Chivo-Regular.ttf.fnt`,
        position: {
          'horizontal-alignment': 'center',
          x: 840,
          y: 1350,
        },
      },
    },
    {
      id: 'Artist Text',
      text: {
        text: sanitize(editionInfo.artist),
        font: `image_renderer/fonts/RecordedEdition${editionType}ArtistName/Chivo-Regular.ttf.fnt`,
        position: {
          'horizontal-alignment': 'center',
          x: 840,
          y: 1460,
        },
      },
    },
    {
      id: 'Stem Mix',
      text: {
        text: 'Stem Mix',
        font: `image_renderer/fonts/RecordedEdition${editionType}Header/Chivo-Regular.ttf.fnt`,
        position: {
          x: 150,
          y: 1670,
        },
      },
    },
    {
      id: 'Stem Mix Content',
      text: {
        text: editionInfo.stemMix,
        font: `image_renderer/fonts/RecordedEdition${editionType}RegularContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 150,
          y: 1730,
        },
      },
    },
    {
      id: 'Master Track Owner',
      text: {
        text: 'Master Track Owner',
        font: `image_renderer/fonts/RecordedEdition${editionType}Header/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 1670,
        },
      },
    },
    {
      id: 'Master Track Owner Content',
      text: {
        text: sanitize(editionInfo.masterName),
        font: `image_renderer/fonts/RecordedEdition${editionType}RegularContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 1730,
        },
      },
    },
    {
      id: 'Block Height',
      text: {
        text: 'Block Height',
        font: `image_renderer/fonts/RecordedEdition${editionType}Header/Chivo-Regular.ttf.fnt`,
        position: {
          x: 150,
          y: 1843,
        },
      },
    },
    {
      id: 'Block Height Content',
      text: {
        text: editionInfo.block,
        font: `image_renderer/fonts/RecordedEdition${editionType}RegularContent/Chivo-Regular.ttf.fnt`,
        position: {
          x: 150,
          y: 1903,
        },
      },
    },
    {
      id: 'Stem Owners',
      text: {
        text: 'Stem Owners',
        font: `image_renderer/fonts/RecordedEdition${editionType}Header/Chivo-Regular.ttf.fnt`,
        position: {
          x: 600,
          y: 1843,
        },
      },
    },
    ...stemOwnersTemplate,
    {
      id: 'TopHighlight',
      uri: `EditionAssets/Music${editionType}Edition/Layers/010_TopHighlight/01_STATE_1/01_SCREEN.png`,
      label: '1',
      color: {
        screen: 1,
      },
      anchor: 'Background',
    },
  ];
}

async function loadEditionInfo({ masterTokenID, blockHeight, stemCount }) {
  // Keep Promise.alls sequential to not trigger Infura's rate limit
  const contractFnOptions = { blockTag: blockHeight };
  const stemsIds = Array(stemCount)
    .fill('')
    .map((_, index) => masterTokenID + index + 1);

  const masterOwnerAddress = await v2Contract.ownerOf(
    masterTokenID,
    contractFnOptions
  );

  const stemsOwnersAddresses = await Promise.all(
    stemsIds.map(stemId => v2Contract.ownerOf(stemId, contractFnOptions))
  );

  const stemsControlTokens = await Promise.all(
    stemsIds.map(stemId =>
      v2Contract.getControlToken(stemId, contractFnOptions)
    )
  );

  const artResponse = await axios.get(
    `${SERVER_BASE}arts/${V2_CONTRACT_ADDRESS}-${masterTokenID}`
  );

  const art = artResponse.data.primary;
  const stemMix = stemsControlTokens
    .map(token => parseInt(token[2].toString()))
    .join('');

  const isPannEdition = art.title.includes('பண்');
  return {
    block: blockHeight,
    stemMix,
    masterName: await lookupOwnerName(masterOwnerAddress),
    stemNames: await Promise.all(stemsOwnersAddresses.map(lookupOwnerName)),
    // Custom replacements for https://async.art/music/master/0xb6dae651468e9593e4581705a09c10a76ac1e0c8-4284
    title: sanitize(art.title),
    artist: isPannEdition
      ? 'Pradeep Kumar et al'
      : art.artists.map(artist => artist.name).join(', '),
  };
}

async function renderMusicEdition({
  masterTokenID,
  stemCount,
  editionType,
  blockHeight,
  mintedEditionId,
}) {
  logger.info(
    { masterTokenID, blockHeight, editionType, stemCount, mintedEditionId },
    'Rendering classic music edition'
  );

  // Will render the art image if it doesn't exist, otherwise returns the imageUrl
  const { imageUrl: cloudinaryTargetURL } = await renderArt(
    blockHeight,
    masterTokenID
  );

  const editionInfo = await loadEditionInfo({
    masterTokenID,
    blockHeight,
    stemCount,
  });

  // Generate the actual layout that we'll use to render the MintedEdition image:
  const layers = generateLayoutFromTemplate(
    editionType,
    stemCount,
    editionInfo,
    cloudinaryTargetURL
  );

  const renderedImage = await image_renderer.render({
    loadFile: loadCloudFile,
    layout: { layers },
    isMusicEdition: true,
  });

  renderedImage.write(`tmp/${masterTokenID}-${editionType}-${blockHeight}.jpg`);

  const finalImageBase64 = await renderedImage.getBase64Async(Jimp.AUTO);
  const cloudinaryResult = await cloudinary.uploader.upload(finalImageBase64, {
    public_id: `editionRenders/${V2_CONTRACT_ADDRESS}-${masterTokenID}/${blockHeight}`,
    invalidate: true,
  });

  logger.info(
    `Classic music edition image: ${cloudinaryResult.secure_url}`
  );

  return cloudinaryResult.secure_url;
}

export default renderMusicEdition;
