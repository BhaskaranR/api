import { Rewards } from '../interfaces/rewardEvents';
import { UserEvent, Events } from '../interfaces/subscriptionEvents';
import { pubsub } from '../pubsub';
import { checkSubscription } from '../model/permissions';
import { withFilter } from 'graphql-subscriptions';

const USER_REWARD_EVENT = 'USER_REWARD_EVENT';


export default {
    Subscription: {
        rewardEvent: {
            subscribe: checkSubscription.createResolver(withFilter(
              () => pubsub.asyncIterator(USER_REWARD_EVENT),
              (payload, args, context) => {
                return payload !== undefined && payload.userId === context.user.id.toString()
              },
            )),
          }
    }
}

export const publishRewardsFunc = async (results) => {
    (<Rewards[]>results).forEach(result => {
      const notificationData: any = {}
      notificationData.notification = {
        title: "Rewards Updated",
        body: "new price" + result.reward,
        dir: 'auto',
        tag: 'renotify',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 400]
      }
      const data: UserEvent = {
        event: Events.rewardsUpdated,
        notification: notificationData.notification
      }
      pubsub.publish(USER_REWARD_EVENT, {
        userId: result.person,
        data: data
      });
    })
  };