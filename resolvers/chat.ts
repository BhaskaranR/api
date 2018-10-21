import * as faker from 'faker';
import { getOAuthResolver } from '../oauth/oauth-service';
import { pubsub } from '../pubsub';

export const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';
const messages = new Map<string, any[]>();
const oauthResolver = getOAuthResolver();
const channels = [];

const createMessage = (channelId) => {
  return {
    id: faker.random.uuid(),
    content: faker.lorem.sentence(),
    creationTime: faker.date.past().getTime().toString(),
    author: {
      name: faker.name.firstName() + '.' + faker.name.lastName(),
      avatar: faker.image.avatar(),
    },
    channel: { id: channelId },
  };
};

const createChannel = () => {
  return {
    id: faker.random.uuid(),
    name: faker.random.word(),
    direct: faker.random.boolean(),
    unseenMessages: faker.random.boolean() ? faker.random.number(30) : 0
  };
};


for (let i = 0; i < 15; i++) {
  const channel = createChannel();
  channels.push(channel);
  const messagesArray = [];
  messages.set(channel.id, messagesArray);
  for (let j = 0; j < 2000; j++) {
    messagesArray.push(createMessage(channel.id));
  }
}

export default  {
  User: ({user}) => {
    return {
      name: () => user.profile.name,
      avatar: () => user.profile.avatar,
    };
  },
  Channel: () => ({
    id: () => faker.random.uuid(),
    name: () => faker.random.word(),
    direct: () => faker.random.boolean(),
    unseenMessages: () => faker.random.boolean() ? faker.random.number(30) : 0,
  }),
  Mutation: () => ({
    sendMessage:  (root, { channelId, content }, {user}) => {
      const messagesArray = messages.get(channelId);
      if (!messagesArray) {
        console.error('channel not found');
        return null;
      }
      const newMessage = {
        id: faker.random.uuid(),
        content,
        creationTime: (new Date()).getTime().toString(),
        author: {
          name: user.profile.name,
          avatar: user.profile.avatar
        },
        channel: {
          id: channelId,
        }
      };

      messagesArray.unshift(newMessage);
      pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, { chatMessageAdded: newMessage });
      return newMessage;
    }
  }),
};
