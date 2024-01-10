import Jimp from 'jimp';
import logger from '../../lib/logger/logger.js';

function getLayerWithId(layout, layerId) {
  for (let layer of layout.layers) {
    if (layer.id == layerId) {
      if ('states' in layer) {
        for (let option of layer.states.options) {
          if (option.active) {
            return option;
          }
        }
      } else {
        return layer;
      }
    }
  }
  return null;
}

async function renderLayer(image, layout, layer, layerImage, readIntProperty) {
  // scale the layer (optionally)
  let bitmapWidth = layerImage.bitmap.width;
  let bitmapHeight = layerImage.bitmap.height;

  if ('scale' in layer) {
    const scaleX =
      (await readIntProperty(layer.scale, 'x', 'Layer Scale X')) / 100;
    const scaleY =
      (await readIntProperty(layer.scale, 'y', 'Layer Scale Y')) / 100;

    if (scaleX == 0 || scaleY == 0) {
      logger.info('Scale X or Y is 0 -- returning currentImage.');
      return image;
    }
    // determine the new width
    bitmapWidth = layerImage.bitmap.width * scaleX;
    bitmapHeight = layerImage.bitmap.height * scaleY;
    // resize the image
    layerImage.resize(bitmapWidth, bitmapHeight);
  }

  // rotate the layer (optionally)
  if ('fixed-rotation' in layer) {
    let rotation = await readIntProperty(
      layer,
      'fixed-rotation',
      'Layer Fixed Rotation'
    );

    if ('multiplier' in layer['fixed-rotation']) {
      const multiplier = await readIntProperty(
        layer['fixed-rotation'],
        'multiplier',
        'Rotation Multiplier'
      );
      rotation *= multiplier;
    }

    layerImage.rotate(rotation, true);

    // adjust for the new width and height based on the rotation
    bitmapWidth = layerImage.bitmap.width;
    bitmapHeight = layerImage.bitmap.height;
  }

  // check for mirror
  if ('mirror' in layer) {
    const shouldMirrorHorizontal =
      (await readIntProperty(layer.mirror, 'x', 'Mirror X')) == 1;
    const shouldMirrorVertical =
      (await readIntProperty(layer.mirror, 'y', 'Mirror Y')) == 1;

    layerImage.mirror(shouldMirrorHorizontal, shouldMirrorVertical);
  }

  let x = 0;
  let y = 0;

  if ('anchor' in layer) {
    const anchorLayor = getLayerWithId(layout, layer.anchor);
    logger.info(`Anchor Layer Id: ${layer.anchor}`);

    x = anchorLayor.finalCenterX;
    y = anchorLayor.finalCenterY;
  }

  let relativeX = 0;
  let relativeY = 0;

  // position the layer (optionally)
  if ('fixed-position' in layer) {
    // Fixed position sets an absolute position
    x = await readIntProperty(
      layer['fixed-position'],
      'x',
      'Layer Fixed Position X'
    );
    y = await readIntProperty(
      layer['fixed-position'],
      'y',
      'Layer Fixed Position Y'
    );
  } else {
    // relative position adjusts xy based on the anchor
    if ('relative-position' in layer) {
      relativeX = await readIntProperty(
        layer['relative-position'],
        'x',
        'Layer Relative Position X'
      );
      relativeY = await readIntProperty(
        layer['relative-position'],
        'y',
        'Layer Relative Position Y'
      );
    }

    // relative rotation orbits this layer around an anchor
    if ('orbit-rotation' in layer) {
      const relativeRotation = await readIntProperty(
        layer,
        'orbit-rotation',
        'Layer Orbit Rotation'
      );

      logger.info(`Orbiting ${relativeRotation} degrees around anchor`);

      const unrotatedRelativeX = relativeX;
      const rad = (-relativeRotation * Math.PI) / 180;

      // On back-end we have layout.version 1 - 5 for art.
      // However renderer implementations for versions 2 - 5 are exactly the same
      // so intead of duplicating files (previously), this simple check is used.
        relativeX = Math.round(
          relativeX * Math.cos(rad) - relativeY * Math.sin(rad)
        );

      relativeY =
        layoutVersion === 1
          ? Math.round(relativeY * Math.cos(rad) + relativeX * Math.sin(rad))
          : Math.round(
          relativeY * Math.cos(rad) + unrotatedRelativeX * Math.sin(rad)
        );
    }

    x += relativeX;
    y += relativeY;
  }

  // stamp the final center X and Y that this layer was rendered at (for any follow-up layers that might be anchored here)
  layer.finalCenterX = x;
  layer.finalCenterY = y;
  layer.active = true; // set this to be true so that any subsequent layers that are anchored to this can tell which layer was active (for multi state layers)

  // offset x and y so that layers are drawn at the center of their image
  x -= bitmapWidth / 2;
  y -= bitmapHeight / 2;

  if (layer.color?.red !== undefined) {
    const red = await readIntProperty(layer.color, 'red', 'Layer Color Red');

    if (red != 0) {
      layerImage.color([
        {
          apply: 'red',
          params: [red],
        },
      ]);
    }
  }

  if (layer.color?.green !== undefined) {
    const green = await readIntProperty(
      layer.color,
      'green',
      'Layer Color Green'
    );

    if (green != 0) {
      layerImage.color([
        {
          apply: 'green',
          params: [green],
        },
      ]);
    }
  }

  if (layer.color?.blue !== undefined) {
    const blue = await readIntProperty(layer.color, 'blue', 'Layer Color Blue');

    if (blue != 0) {
      layerImage.color([
        {
          apply: 'blue',
          params: [blue],
        },
      ]);
    }
  }

  if (layer.color?.hue !== undefined) {
    const hue = await readIntProperty(layer.color, 'hue', 'Layer Color Hue');

    if (hue != 0) {
      layerImage.color([
        {
          apply: 'hue',
          params: [hue],
        },
      ]);
    }
  }

  if (layer.color?.brightness !== undefined) {
    const brightness = await readIntProperty(
      layer.color,
      'brightness',
      'Layer Color Brightness'
    );

    if (brightness != 0) {
      layerImage.brightness(brightness / 100);
    }
  }

  if (layer.color?.saturation !== undefined) {
    const saturation = await readIntProperty(
      layer.color,
      'saturation',
      'Layer Color Saturation'
    );

    if (saturation != 0) {
      layerImage.color([
        {
          apply: 'saturate',
          params: [saturation],
        },
      ]);
    }
  }

  if (layer.color?.alpha !== undefined) {
    const alpha = await readIntProperty(
      layer.color,
      'alpha',
      'Layer Color Alpha'
    );

    if (alpha < 100) {
      layerImage.opacity(alpha / 100);
    }
  }

  const compositeOptions = {};

  if (layer.color?.multiply) compositeOptions.mode = Jimp.BLEND_MULTIPLY;
  if (layer.color?.hardlight) compositeOptions.mode = Jimp.BLEND_HARDLIGHT;
  if (layer.color?.lighten) compositeOptions.mode = Jimp.BLEND_LIGHTEN;
  if (layer.color?.overlay) compositeOptions.mode = Jimp.BLEND_OVERLAY;
  if (layer.color?.difference) compositeOptions.mode = Jimp.BLEND_DIFFERENCE;
  if (layer.color?.exclusion) compositeOptions.mode = Jimp.BLEND_EXCLUSION;
  if (layer.color?.screen) compositeOptions.mode = Jimp.BLEND_SCREEN;

  if (layer.color?.opacity !== undefined) {
    const opacity = await readIntProperty(
      layer.color,
      'opacity',
      'Layer Opacity'
    );

    compositeOptions.opacitySource = opacity / 100.0;
  }

  if (image != null) {
    // composite this layer onto the current image
    image.composite(layerImage, x, y, compositeOptions);

    return image;
  } else {
    layer.finalCenterX = bitmapWidth / 2;
    layer.finalCenterY = bitmapHeight / 2;

    return layerImage;
  }
}

export default renderLayer;
