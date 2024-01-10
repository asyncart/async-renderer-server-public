import fs from 'fs/promises';
import crypto from 'crypto';
import ffmpeg from '../../lib/common/ffmpeg.js';
import logger from '../../lib/logger/logger.js';
import { fileTypeFromFile } from 'file-type';
import { getRandomString, saveFfmpeg } from '../../lib/common/utils.js';
import { loadWebFile } from './utils.js';

/*
  This is the "legacy" version that renders "Audio classic" pieces, and MintedEditions
  (does not render music BlueprintEditions; see renderUrls below for that)
*/
async function render(loadFile, tokenData, controlTokensMap, masterTokenId) {
  const command = ffmpeg();
  const layout = tokenData['audio-layout'];
  const activeAudioStateUris = layout.layers.map(layer => {
    // layer token ids are relative to their master token id
    const layerTokenId = layer.states['token-id'] + masterTokenId;
    const leverId = layer.states['lever-id'];

    // controlToken is in format [minValue, maxValue, currentValue, ..., ..., ...]
    // so currentValue for the lever we want will be index 2, 5, 8, 11, etc.
    const controlToken = controlTokensMap[layerTokenId];
    const activeStateIndex = parseInt(controlToken[2 + leverId * 3]);

    return layer.states.options[activeStateIndex].uri;
  });

  const outputDir = `./tmp/audio/${crypto.randomUUID()}`;
  await fs.mkdir(outputDir, { recursive: true });

  const localAudioFilePaths = await Promise.all(
    activeAudioStateUris.map(uri => loadFile(uri, outputDir))
  );
  localAudioFilePaths.forEach(filePath => command.addInput(filePath));

  const artist = tokenData.attributes
    .filter(attribute => attribute.trait_type === 'Artist')
    .map(attribute => attribute.value)
    .join(', ');

  command.outputOptions('-id3v2_version', '3');
  command.outputOptions('-metadata', `title=${tokenData.name}`);
  command.outputOptions('-metadata', `artist=${artist}`);
  command.complexFilter(`amix=inputs=${layout.layers.length}:duration=longest`);

  if (layout.mastering.bitrate) {
    command.audioBitrate(layout.mastering.bitrate);
  }

  command.outputOptions('-write_xing', 0);

  const fileOutputPath = `${outputDir}/song.mp3`;

  await saveFfmpeg(command, fileOutputPath);

  if (layout.mastering.filters?.length > 0) {
    const masteringCommand = ffmpeg()
      .addInput(fileOutputPath)
      .withAudioFilters(layout.mastering.filters);

    if (layout.mastering.bitrate) {
      masteringCommand.audioBitrate(layout.mastering.bitrate);
    }

    const newFileOutputPath = fileOutputPath.replace('.mp3', '-normalized.mp3');
    await saveFfmpeg(masteringCommand, newFileOutputPath);

    return newFileOutputPath;
  }

  return fileOutputPath;
}

/*
  Renders music BlueprintEditions,
  and also renders mastering previews (artists can preview mastering on 30-second clips in Canvas)
  mastering, title, and artist are optional.
  mastering object looks like:
            .corrective
              (none for gentle)

            .broadShaping
              -af asubcut=cutoff=20:order=10:level=1
              -af equalizer=f=45:width_type=q:width=8.5:g=0.4
              -af equalizer=f=1600:width_type=q:width=2:g=0.5
              -af treble=gain=1:f=24000:width_type=q:width=1:poles=2:mix=1:channels=default:normalize=disabled:transform=svf:precision=auto

            .compressionThresholdEquation   (into which we plug maxVolume, to get Y, the threshold) (this equation differs depending on preset)
              y = 10 ^ ((x-4)/20)
              saved as: ?

            .compressionEquation    (a string which has inputs for maxVolume (x) and threshold (y))
              -af acompressor=threshold=Y:ratio=2:attack=50:release=115:makeup=(-X+2)

            .limiter
              -af alimiter=level_in=1:level_out=1:limit=1:attack=6:release=50:level=enabled


*/
async function renderUrls({
  audioUrls,
  masteringObject = {},
  title,
  artist,
  renderHd = false
}) {
  const {
    corrective,
    broadShaping,
    compressionThresholdEquation,
    compressionEquation,
    limiter
  } = masteringObject || {};

  logger.info({ audioUrls }, `Downloading ${audioUrls.length} audioUrls...`);

  const audioFiles = await Promise.all(
    audioUrls.map(audioUrl => loadWebFile(audioUrl, './tmp'))
  );

  const audioFileTypes = await Promise.all(audioFiles.map(fileTypeFromFile));
  const areAllAudioFilesWAVs = audioFileTypes.every(res => res.ext === 'wav');

  if (renderHd && !areAllAudioFilesWAVs) {
    logger.info('Audio files are not all WAVs, so not rendering HD version');
    return null;
  }

  const command1 = ffmpeg();
  audioFiles.forEach(audioFile => command1.addInput(audioFile));

  if (title) command1.outputOptions('-metadata', `title=${title}`);
  if (artist) command1.outputOptions('-metadata', `artist=${artist}`);

  // We're adding normalize=0 (that's not present on the "normal" audio renderer)
  // Without that, the output of this call will reduce the volume of the tracks rather than just adding them together.
  command1.complexFilter(
    `amix=inputs=${audioUrls.length}:duration=longest:normalize=0`
  );

  // If we're rendering the MP3, set the bitrate to 320kbps.
  if (!renderHd) command1.audioBitrate('320k');
  command1.outputOptions('-write_xing', 0);

  // Save the file to tmp/artist/something4122.mp3
  const outputDir = `tmp/renders/${
    artist ? `${artist}_${getRandomString(10)}` : getRandomString(10)
  }`;
  await fs.mkdir(outputDir, { recursive: true });

  const fileType = areAllAudioFilesWAVs && renderHd ? '.wav' : '.mp3';
  if (fileType === '.wav') command1.format('wav');
  let fileOutputPath = `${outputDir}/step_1${fileType}`;

  await saveFfmpeg(command1, fileOutputPath);

  // Perform the first mastering step (Corrective EQ (optional), and Broad Shaping EQ (always present))
  const initialFilters = [];
  if (corrective) initialFilters.push(...corrective);
  if (broadShaping) initialFilters.push(...broadShaping);
  if (initialFilters.length > 0) {
    logger.info(`corrective and broad shaping filters = ${initialFilters}`);
    const command2 = ffmpeg()
      .addInput(fileOutputPath)
      .withAudioFilters(initialFilters);

    fileOutputPath = `${outputDir}/step_2_correctiveAndBroadShaping${fileType}`;
    await saveFfmpeg(command2, fileOutputPath);
  }

  // Perform the second mastering step (Compression)

  if (compressionThresholdEquation && compressionEquation) {
    // Now we get the max-volume of the partially-mastered file:
    const command3 = ffmpeg({ source: fileOutputPath })
      .withAudioFilter('volumedetect')
      .addOption('-f', 'null');

    const maxVolume = await new Promise((resolve, reject) => {
      command3
        .on('end', function (stdout, stderr) {
          // The output of the volumedetect command is stderr
          const lines = stderr.split('\n');
          const lineWithMaxVolume = lines.filter(line =>
            line.includes('max_volume:')
          )[0];
          const maxVol = lineWithMaxVolume
            .split('max_volume: ')[1]
            .replace(' dB', '');
          resolve(maxVol);
        })
        .save('/dev/null');
    });

    logger.info(`maxVolume = ${maxVolume}`);

    // Now we'd plug maxVolume into the provided threshold equation function:
    // FOR A GENTLE COMPRESSION THE EQUATION IS:
    // y = 10 ^ ((maxVolume-4)/20)

    // Create a JS function from the provided string:
    // compressionThresholdEquation looks like: "return Math.pow(10, ((maxVolume-4)/20));"); (maxVolume must be defined)
    const thresholdCompressionFunction = new Function(
      'maxVolume',
      compressionThresholdEquation
    );
    const threshold = thresholdCompressionFunction(maxVolume);
    logger.info(`threshold: ${threshold}`);

    // Now run the compression filter. The compressionEquation must have {threshold} and {maxVolume} replaced with the actual values.
    logger.info(`compressionEquation: ${compressionEquation}`);
    let compressionFilter = compressionEquation
      .replace('{threshold}', threshold)
      .replace('{maxVolume}', `(${maxVolume})`);
    /*
      Now we want to evaluate the expression for the "makeup" component of the compression filter.
      For example, original compressionFilter might be:
        acompressor=threshold={threshold}:ratio=2:attack=50:release=115:makeup=(-{maxVolume}+2)
          ...we replace maxVolume with (maxVolume), then it becomes:
            acompressor=threshold=0.4027170343254591:ratio=2:attack=50:release=115:makeup=(-(-3.9)+2)
          (we now want to calculate (-(-3.9)+2) and plug that value in to "makeup"
    */
    if (compressionFilter.includes('makeup')) {
      let makeupComponent = compressionFilter.split('makeup=')[1];
      // Now make sure we don't take anything beyond the "makeup" component (even though it's normally the last argument, we can't be sure):
      makeupComponent = makeupComponent.split(':')[0]; // this will be something like "(-(-3.9)+2)"
      // Now we need to evaluate the makeup component.
      // But first: make sure it only contains basic +/- arithmetic, and numbers, so we don't run malicious code:
      if (!ensureStringIsArithmetic(makeupComponent)) {
        throw new Error(
          `makeupComponent is not arithmetic: ${makeupComponent}`
        );
      }
      const makeupFloatValue = eval(makeupComponent);
      logger.info(`makeupFloatValue: ${makeupFloatValue}`);
      // Now we can plug the makeupFloatValue into the compression filter:
      const compressionFilterFirstPart = compressionFilter.split('makeup=')[0];
      const compressionFilterSecondPart = compressionFilter
        .split('makeup=')[1]
        .split(':')[1]; // This usually won't exist
      compressionFilter = `${compressionFilterFirstPart}makeup=${makeupFloatValue}`;
      if (compressionFilterSecondPart) {
        compressionFilter = `${compressionFilter}:${compressionFilterSecondPart}`;
      }
    }

    logger.info(`Final compression filter: ${compressionFilter}`);
    const command4 = ffmpeg()
      .addInput(fileOutputPath)
      .withAudioFilters([compressionFilter]);

    fileOutputPath = `${outputDir}/step_3_compressed${fileType}`;
    await saveFfmpeg(command4, fileOutputPath);
  }

  if (limiter) {
    logger.info(`Applying limiter: ${limiter}`);
    const command5 = ffmpeg()
      .addInput(fileOutputPath)
      // Limiter needs to be an array
      .withAudioFilters(limiter);

    fileOutputPath = `${outputDir}/step_4_limiterApplied${fileType}`;
    await saveFfmpeg(command5, fileOutputPath);
  }

  // We can't just delete the containing folder now, because the renderer needs to upload it.

  return fileOutputPath;
}

// Ensure a string is an arithmetic expression, using plus and minus and parentheses (floats supported). ie: "4.12402+(2-3)"
// Make sure the string only contains numbers or (, ), +, -, and .
function ensureStringIsArithmetic(stringToValidate) {
  const pattern = new RegExp('^[0-9_.+()-]*$');
  return stringToValidate?.length > 0 && pattern.test(stringToValidate);
}

async function renderAudioClip({
  audioUrls,
  masteringObject,
  timeStart,
  timeEnd
}) {
  // First: render the file normally. Then get a 30-second clip of it.
  const audioFilePath = await renderUrls({ audioUrls, masteringObject });
  const clipFilePath = await cutClip(audioFilePath, timeStart, timeEnd);
  return clipFilePath;
}

async function cutClip(filePath, timeStart, timeEnd) {
  const duration = parseFloat(timeEnd) - parseFloat(timeStart);

  // ffmpeg -ss 60 -i input-audio.aac -t 15 -c copy output.aac
  const command = ffmpeg()
    .addInput(filePath)
    .setStartTime(timeStart)
    .outputOptions('-t', duration);

  const outputDir = `tmp/clip_${getRandomString(10)}`;
  await fs.mkdir(outputDir, { recursive: true });

  const fileOutputPath = `${outputDir}/${getRandomString(10)}.mp3`;
  await saveFfmpeg(command, fileOutputPath);

  return fileOutputPath;
}

export default {
  render,
  renderUrls,
  renderAudioClip
};
