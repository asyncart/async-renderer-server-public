import pino from 'pino';
import build from 'pino-abstract-transport';

export default options =>
  build(source => {
    source.on('data', log => {
      const { level, time, ...rest } = log;
      const newLog = {
        level: pino.levels.labels[level],
        timestamp: time,
        ...rest
      };
      console.log(JSON.stringify(newLog));
    });
  });
