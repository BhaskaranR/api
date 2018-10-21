
import {PubSub} from 'graphql-subscriptions';
export const pubsub = new PubSub();

/*import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as config from 'config';

export const pubsub = new RedisPubSub({
  connection: {
    host: config.get("redisHost") || '127.0.0.1',
    port: 6379,
    retry_strategy: options => Math.max(options.attempt * 100, 3000),
  },
});
*/
