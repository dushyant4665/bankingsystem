import { NextFunction, Request, Response } from "express";
import { getRedis } from "../config/redis";

type RateLimitOptions = {
  windowSeconds: number;
  maxRequests: number;
  message?: string;
};

export function createRateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const redis = await getRedis();

    if (!redis) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `rate-limit:${req.method}:${req.path}:${ip}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, options.windowSeconds);
    }

    if (count > options.maxRequests) {
      return res.status(429).json({
        success: false,
        message: options.message ?? "Too many requests",
      });
    }

    return next();
  };
}
