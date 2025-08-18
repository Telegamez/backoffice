import { createClient } from 'redis';

const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

let redisClient: ReturnType<typeof createClient>;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      console.error(`Error getting from Redis cache: ${error}`);
      return null;
    }
  },

  async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    try {
      const client = await getRedisClient();
      const data = JSON.stringify(value);
      await client.set(key, data, { EX: options?.ttl || 3600 }); // Default TTL of 1 hour
    } catch (error) {
      console.error(`Error setting to Redis cache: ${error}`);
    }
  },

  async del(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error(`Error deleting from Redis cache: ${error}`);
    }
  },
};
