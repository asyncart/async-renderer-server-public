import Jimp from 'jimp';
import axios from 'axios';
import logger from '../../lib/logger/logger.js';
import renderLayer from './layered_static.js';

/**
 * Iterate through each Layer and propogate down the tree to get the final image URI. Don't actually render the image but return back
 * render values that will determine how the image is rendered.
 * TODO: optimize this into a Promise.all
 **/

async function loadRenderValues(layoutAndTokens, tokenId) {
  const readIntProperty = createReadIntPropertyFn(
    layoutAndTokens.tokens,
    tokenId
  );

  for (var i = 0; i < layoutAndTokens.layout.layers.length; i++) {
    let layer = layoutAndTokens.layout.layers[i];

    while ('states' in layer) {
      const uriIndex = await readIntProperty(layer, 'states', 'Layer Index');

      layer = layer['states'].options[uriIndex];
    }

    // check if this layer has visbility controls
    if ('visible' in layer) {
      const isVisible =
        (await readIntProperty(layer, 'visible', 'Layer Visible')) === 1;
      if (isVisible === false) {
        logger.info('NOT VISIBLE. SKIPPING.');
        continue;
      }
    }

    const layerImagePlaceholder = {
      bitmap: {},
      rotate: () => {},
      mirror: () => {},
      resize: () => {},
      color: () => {},
      brightness: () => {},
      opacity: () => {}
    };

    await renderLayer(
      null,
      layoutAndTokens.layout,
      layer,
      layerImagePlaceholder,
      readIntProperty
    );
  }

  return layoutAndTokens.tokens.renderValues;
}

/**
 * Iterate through each Layer and propogate down the tree to get the final image URI. Composite them from back to front and return the final image
 **/
async function render(layoutAndTokens, tokenId) {
  let image = null;
  const readIntProperty = createReadIntPropertyFn(
    layoutAndTokens.tokens,
    tokenId
  );

  for (var i = 0; i < layoutAndTokens.layout.layers.length; i++) {
    logger.info(`${process.memoryUsage().rss / 1024 / 1024} MB`);

    let layer = layoutAndTokens.layout.layers[i];

    logger.info(
      `rendering layer: ${i + 1} of ${layoutAndTokens.layout.layers.length} (${
        layer.id
      })`
    );

    while ('states' in layer) {
      const uriIndex = await readIntProperty(layer, 'states', 'Layer Index');
      layer = layer['states'].options[uriIndex];
    }

    // check if this layer has visbility controls
    if ('visible' in layer) {
      const isVisible =
        (await readIntProperty(layer, 'visible', 'Layer Visible')) === 1;
      if (isVisible === false) {
        logger.info('NOT VISIBLE. SKIPPING.');
        continue;
      }
    }

    if (layer.text != undefined) {
      image = await writeText(layer.text, image, readIntProperty);
    } else {
      let layerImage = null;
      if (!layer.uri) {
        if (layer.width) {
          layerImage = new Jimp(layer.width, layer.height);
        } else {
          // Skip this layer if it has no width or height AND no .uri.
          // This means we're rendering a BlueprintEdition with Audio, but this layer just has an audioUri
          continue;
        }
      } else {
        // In case we're rending a MintedEdition art, and we're pulling the album art (the second layer of the MintedEdition image layout), we want to pull it from IPFS:
        let buffer;
        if (layer.id === 'Album' && layoutAndTokens.isMusicEdition) {
          const { data } = await axios.get(layer.uri, {
            responseType: 'arraybuffer'
          });
          buffer = Buffer.from(data);
        } else {
          // If layer.uri starts with a "/", remove that leading char.
          const layerUri =
            layer.uri.charAt(0) === '/' ? layer.uri.substring(1) : layer.uri;
          buffer = await layoutAndTokens.loadFile(layerUri);
        }
        layerImage = await Jimp.read(buffer);
      }
      image = await renderLayer(
        image,
        layoutAndTokens.layout,
        layer,
        layerImage,
        readIntProperty
      );
    }
  }
  return image;
}

async function writeText(textData, image, readIntProperty) {
  const font = await Jimp.loadFont(textData.font);

  let x = await readIntProperty(textData.position, 'x', 'Font X Position');
  const y = await readIntProperty(textData.position, 'y', 'Font Y Position');

  if (textData.position['horizontal-alignment'] == 'center') {
    const measuredWidth = Jimp.measureText(font, textData.text);

    x -= measuredWidth / 2;
  }

  image.print(font, x, y, textData.text);

  return image;
}

/**
 * Read an integer property in the layout. This can be a token-id, time, random, currency, comboLayer, etc.
 **/
const createReadIntPropertyFn =
  (tokens, masterTokenId) => async (object, key, label) => {
    let value = object[key];

    if (typeof value !== 'object') {
      logger.info(`${label} = ${value}`);
      return value;
    }

    // check if this is a standard token property
    if (object[key]['token-id']) {
      const relativeTokenId = object[key]['token-id'];
      const tokenId = relativeTokenId + masterTokenId;
      const leverId = object[key]['lever-id'];

      // tokens[tokenId] is in format [minValue, maxValue, currentValue, ..., ..., ...]
      // so currentValue for the lever we want will be index 2, 5, 8, 11, etc.
      value = parseInt(
        (await tokens.getControlToken(tokenId, relativeTokenId))[
          2 + leverId * 3
        ]
      );
      logger.info(
        `${label} = ${value} (TokenId=${tokenId}, LeverId=${leverId})`
      );
    } else if (object[key].currency_price) {
      // This functionality is currently being used by 1 piece in production.
      // https://async.market/art/master/0xb6dae651468e9593e4581705a09c10a76ac1e0c8-1076

      const { data } = await axios.get('https://api.async-api.com/misc/prices');
      const measureValue = Math.round(data.price);
      const handler = object[key].currency_price.handler;

      value = handleMeasure(measureValue, handler);

      logger.info(
        `${label} = ${value} (Currency=eth_current, MeasureVal=${measureValue}, HandlerType=${handler.type})`
      );
    } else if (object[key].random) {
      // This functionality is currently being used by 2 pieces in production.
      // https://async.market/art/master/0xb6dae651468e9593e4581705a09c10a76ac1e0c8-1497
      // https://async.market/art/master/0xb6dae651468e9593e4581705a09c10a76ac1e0c8-1524

      const maxValueInclusive = object[key].random.max_value_inclusive;
      const measureValue = await tokens.getRandomInt(maxValueInclusive + 1);
      const handler = object[key].random.handler;

      value = handleMeasure(measureValue, handler);

      logger.info(
        `${label} = ${value} (RandomMax=${maxValueInclusive}, MeasureVal=${measureValue}, HandlerType=${handler.type})`
      );
    } else if (object[key].combo_layer) {
      // This functionality is currently being used by 1 piece in production.
      // https://async.market/art/master/0xb6dae651468e9593e4581705a09c10a76ac1e0c8-1148

      let measureValue = 0;
      const comboLayerTokens = object[key].combo_layer.tokens;

      // iterate through tokens and update the measure value
      for (var i = 0; i < comboLayerTokens.length; i++) {
        const relativeTokenId = comboLayerTokens[i].tokenId;
        const absoluteTokenId = relativeTokenId + masterTokenId; // layer token ids are relative to their master token id

        const leverId = comboLayerTokens[i].leverId;
        const leverValue = parseInt(
          (await tokens.getControlToken(absoluteTokenId, relativeTokenId))[
            2 + leverId * 3
          ]
        );

        measureValue += leverValue;
      }

      const handler = object[key].combo_layer.handler;

      value = handleMeasure(measureValue, handler);

      logger.info(
        `${label} = ${value} (ComboLayer=${JSON.stringify(
          comboLayerTokens
        )}, MeasureVal=${measureValue}, HandlerType=${handler.type})`
      );
    } else if (object[key].time) {
      const measureType = object[key].time.type;
      const date = new Date(tokens.getTimestamp() * 1000);
      const measureValue =
        {
          SECONDS: date.getTime() / 1000,
          MONTH: date.getUTCMonth(),
          HOUR_OF_DAY: date.getUTCHours(),
          DAY_OF_MONTH: date.getUTCDate() - 1,
          DAY_OF_YEAR:
            (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
              Date.UTC(date.getUTCFullYear(), 0, 0)) /
            86_400_000
        }[measureType] || 0;

      const handler = object[key].time.handler;

      value = handleMeasure(measureValue, handler);

      logger.info(
        `${label} = ${value} (Timestamp=${date.getTime()}, Measure=${measureType}, MeasureVal=${measureValue}, HandlerType=${
          handler.type
        })`
      );
    }

    tokens.renderValues.push(value);

    return value;
  };

/**
 * Generic handler for any integer type. Can be handled via modulo, normalization, or custom ruleset.
 **/
function handleMeasure(measureValue, handler) {
  if (handler.type === 'MODULO') {
    const maxBoundInclusive = handler['max_bound_inclusive'];
    // modulo to keep the value within the max bound inclusive
    return measureValue % (maxBoundInclusive + 1);
  }

  if (handler.type === 'CUSTOM') {
    // format of a rule is: [minInclusive, maxInclusive, index]
    return handler.rules.find(
      ruleSet => measureValue >= ruleSet[0] && measureValue <= ruleSet[1]
    )?.[2] || 0;
  }

  // value defaults at 0 if we can't find a handler that applies
  return 0;
}

export default {
  render,
  loadRenderValues
};
