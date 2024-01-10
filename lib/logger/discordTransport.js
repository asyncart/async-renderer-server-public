import build from 'pino-abstract-transport';
import { DISCORD_ERRORS_WEBHOOK } from '../../constants/constants.js';

export default options =>
  build(source => {
    source.on('data', log => {
      // Custom transport must not throw
      const { message, error } = log;
      const errorMsg = message || error?.message;

      fetch(DISCORD_ERRORS_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Async',
          embeds: [
            {
              fields: [
                {
                  name: 'Service',
                  value: 'async-renderer-server',
                },
                {
                  name: 'Error',
                  value: `\`\`\`${errorMsg?.slice(0, 1000)}\`\`\``,
                },
                {
                  name: 'Stack Trace',
                  value: `\`\`\`${error?.stack?.slice(0, 1000) || 'N/A'}\`\`\``,
                },
              ],
              color: 15548997,
            },
          ],
        }),
      }).catch(() => null);
    });
  });
