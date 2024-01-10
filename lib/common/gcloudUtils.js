import { Storage } from '@google-cloud/storage';

const generalAssets = new Storage();
const bucket = generalAssets.bucket(process.env.ART_CREATION_BUCKET_NAME);

const uploadAudio = (buffer, filePath, contentType) =>
  new Promise((resolve, reject) => {
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: { contentType }
    });

    blobStream
      .on('finish', () => resolve(getPublicURLforFilePath(filePath)))
      .on('error', () => reject('Unable to upload image, something went wrong'))
      .end(buffer);
  });

function getPublicURLforFilePath(filePath) {
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

async function checkFileExists(filePath) {
  const result = await bucket.file(filePath).exists(filePath);
  return result[0];
}

export { bucket, uploadAudio, checkFileExists, getPublicURLforFilePath };
