import { createClient } from 'redis';
import config from './index';

export type RedisClientType = ReturnType<typeof createClient>;

const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis reconnection limit reached');
        return new Error('Redis reconnection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔌 Redis Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Connected and Ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis Reconnecting...');
});

redisClient.on('end', () => {
  console.log('🛑 Redis Connection Closed');
});


export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

export const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
};

export default redisClient;