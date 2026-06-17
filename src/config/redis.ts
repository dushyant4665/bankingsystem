import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redisClient = redisUrl ? new Redis(redisUrl, { lazyConnect: true }) : null;

let connectPromise: Promise<void> | null = null;

export async function ensureRedisConnection() {
  if (!redisClient) {
    return null;
  }

  if ((redisClient as any).status === "ready") {
    return redisClient;
  }

  if (!connectPromise) {
    connectPromise = redisClient.connect().catch(() => {
      connectPromise = null;
      return;
    });
  }

  await connectPromise;
  return redisClient.status === "ready" ? redisClient : null;
}

export async function getRedis() {
  return ensureRedisConnection();
}
