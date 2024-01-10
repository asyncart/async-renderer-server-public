## Development Setup

1. Install dependencies `npm i`
2. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install?authuser=1) for your operating system
3. Install Redis 6.x and have it run it on port 6379 (standard Redis port).
4. Ask @bbarton for development `.env` file and place it to the root directory
5. Ask @bbarton to add you to staging project on Google Cloud and assign you Storage Object Admin & Editor roles
6. After being added to Google Cloud Project: `gcloud auth application-default login`
7. Start dev server `npm run dev`

## Deployment

Currently, renderer server is deployed as a microservice on K8S.

Previously it was deployed as a service on Google App Engine.

> ⚠️ It can't be deployed to App Engine and K8S at the same time.
> This causes an issue with BullMQ to drop tasks without completing them.

## Logs

[Pino](https://getpino.io) library is being used for logging.
It's very low overhead, well maintained and focused on performance.

Logger usage examples:

```js
// Log message
logger.info('Rendering image');

// Log context
logger.info({ tokenId: 5 });

// Log message with context
logger.info({ tokenId: 5 }, 'Rendering image');

// Log error message
logger.error('Error occured');

// Log error object
logger.error(new Error('Error'));

// Log error object within context and custom message
logger.error({ error: new Error('error'), tokenId: 5 }, 'Rendering failed');
```

> ⚠️ The above arguments format MUST be followed!
