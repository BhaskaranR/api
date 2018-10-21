
import { find, filter } from 'lodash';
import * as Joi from 'joi';
import GenericResponse from '../model/generic-response';
import { ObjectID } from 'mongodb';
import { Post } from '../model/post';
import User from '../model/user';
import * as userInterface from '../interfaces/user'
import { context } from '../interfaces/context';
import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../pubsub';
import { checkSubscription } from '../model/permissions';
import { UserEvent, Events } from '../interfaces/subscriptionEvents';
import { sendPush } from '../model/offlinePush';
import { Rewards } from '../interfaces/rewardEvents';
import { publishRewardsFunc } from './rewards';



const USER_EVENT = 'USER_EVENT';
export default {
  Subscription: {
    userEvent: {
      subscribe: checkSubscription.createResolver(withFilter(
        () => pubsub.asyncIterator(USER_EVENT),
        (payload, args, context) => {
          return payload !== undefined && payload.userId === context.user.id.toString()
        },
      )),
    }
  },
  Query: {
    user:  async (_, { id }, { userModel, user }: { userModel: User, user: any},) => {
      let thisUser ;
      try {

        if (id){ 
          thisUser = await userModel.findUserById(id);
        } else {
          thisUser = await userModel.findUserById(user.id.toString());
        }
        return thisUser;
      }
      catch (e) {
        throw new Error('not found');
      }
    },
    suggestedFriends:  (_, { id, cursor, count }, { userModel }: { userModel: User }) => {
      //todo
      return {};
    }
  },
  User: {
    post: async (parent, { prev, next, limit }, { postModel, user }: { postModel: Post, user: userInterface.User }) => {
      try {
        const posts = await postModel.getPostOfUser(parent._id.toString(), prev, next, limit, user.id.toString());
        return posts;
      }
      catch (e) {
        throw new Error('error in post');
      }
    },
    followersUsers: async (parent, { cursor, limit }, { userModel }: { userModel: User, user: userInterface.User }) => {
      try {
        const users =  await userModel.getFollowers(parent._id.toString(), cursor, limit);
        return {
          usersArray: users};
      }
      catch (e) {
        throw new Error('error in getting followers');
      }
    },
    followingUsers: async (parent, { cursor, limit }, { userModel }: { userModel: User, user: userInterface.User }) => {
      try {
        const users = await userModel.findUsersByIds(parent.following);
        return {
          usersArray: users};
      }
      catch (e) {
        throw new Error('error in getting following');
      }
    },
    followingBusiness: async (parent, { }, { userModel, bizModel }) => {
      try {
        const response = await bizModel.getFollowingBizByUserId(parent.id.toString());
        return response;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    mybusinesses: async (parent, { }, cntxt: context) => {
      try {
        const response = await cntxt.bizModel.getBizByUserId(parent._id.toString())
        return response;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    imagePost: async (user, { prev, next, limit }, { postModel }: { postModel: Post }) => {
      try {
        const posts = await postModel.getPhotoPostOfUser(user._id.toString(), prev, next, limit);
        console.log(posts);
      }
      catch (e) {
        throw new Error('error in post');
      }
    },
    videoPost: async (user, { prev, next, limit }, { postModel }: { postModel: Post }) => {
      try {
        const posts = await postModel.getVideoPosts(user._id.toString(), prev, next, limit);
        console.log(posts);
      }
      catch (e) {
        throw new Error('error in post');
      }
    },
    followersCount: async (user, { }, { userModel }: { userModel: User }) => {
      return await userModel.getFollowersCount(user._id.toString());
    },
    followingCount: async (user, { }, { userModel }: { userModel: User }) => {
      return await userModel.getFollowingCount(user._id.toString());
    },
  },
  Mutation: {
    follow:  async (_, { followingId }, cntxt: context) => {
      try {
        const userM = cntxt.userModel
        const response = await cntxt.userModel.follow(followingId, cntxt.user.id.toString());
        //send notification to logged in user
        const asyncFunc = async () => {
          const following = await userM.findUserById(followingId); //get follower info
          const devices = await cntxt.deviceModel.getPushToken([followingId]); //get follower device info

          const notificationData: any = {}
          notificationData.notification = {
            title: "new follower request",
            body: following.firstName + " " + following.lastName + ' has sent you a follow request',
            dir: 'auto',
            tag: 'renotify',
            renotify: true,
            requireInteraction: true,
            vibrate: [300, 100, 400]
          }
          const data: UserEvent = {
            event: Events.newFollower,
            user: following,
            notification: notificationData.notification
          }
          pubsub.publish(USER_EVENT, {
            userId: followingId,
            data: data
          });
          sendPush(devices, JSON.stringify(notificationData));//send offline notification
        };
        asyncFunc();

        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    unfollow:  async (_, { followerId }, cntxt: context) => {
      try {
        const response = await cntxt.userModel.unfollow(followerId, cntxt.user.id.toString());
        //Calculate Rewards
        const asyncFunc = async () => {
          const results = await cntxt.rewardsModel.userActionRewards.unfollow(cntxt.user.id.toString(), {
            follow_id: followerId
          });
          publishRewardsFunc(results);
        };
        asyncFunc();
        //notify rewards todo
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    rejectFollower:  async (_, { followerId }, cntxt: context) => {
      try {
        const response = await cntxt.userModel.rejectFollower(followerId, cntxt.user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    approveFollower:  async (_, { followerId }, cntxt: context) => {
      try {
        const response = await cntxt.userModel.approveFollower(followerId, cntxt.user.id.toString());
        //send notification to follower
        const asyncFunc = async () => {
          const devices = await cntxt.deviceModel.getPushToken([followerId]); //get followings device info
          const notificationData: any = {}
          notificationData.notification = {
            title: "Your follow request has been approved",
            body: cntxt.user.profile.firstName + " " + cntxt.user.profile.lastName + ' has approved your follow request',
            dir: 'auto',
            tag: 'renotify',
            renotify: true,
            requireInteraction: true,
            vibrate: [300, 100, 400]
          }

          const data: UserEvent = {
            event: Events.newFollower,
            user: cntxt.user,
            notification: notificationData.notification
          }
          pubsub.publish(USER_EVENT, {
            userId: followerId,
            data: data
          });
          sendPush(devices, JSON.stringify(notificationData));//send offline notification

          //Calculate Rewards
          const results = await cntxt.rewardsModel.userActionRewards.follow(followerId, {
            follow_id: cntxt.user.id.toString()
          });
          publishRewardsFunc(results);
        };
        asyncFunc();
        //notify users
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updatePersonalInfo:  async (_, { personalInfo }, { userModel, user }) => {
      try {
        const response = await userModel.updatePersonalInfo(user.id.toString(), personalInfo);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updatePersonalContact:  async (_, { personalContact }, { userModel, user }) => {
      try {
        const response = await userModel.updatePersonalContact(user.id.toString(), personalContact);
        console.log(response);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updateUserCustomUrl:  async (_, { customUrls }, { userModel, user }) => {
      try {
        const response = await userModel.updateUserCustomUrl(user.id.toString(), customUrls);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updateUserPlacesHistory:  async (_, { placesHistory }, { userModel, user }) => {
      try {
        const response = await userModel.updateUserPlacesHistory(user.id.toString(), placesHistory);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updateEducationHistory:  async (_, { educationHistory }, { userModel, user }) => {
      try {
        const response = await userModel.updateUserEducationHistory(user.id.toString(), educationHistory);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updateWorkHistory:  async (_, { workHistory }, { userModel, user }) => {
      try {
        const response = await userModel.updateUserWorkHistory(user.id.toString(), workHistory);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    updateUserStory:  async (_, { userStory }, { userModel, user }) => {
      try {
        const response = await userModel.updateUserStory(user.id.toString(), userStory);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    uploadProfilePhoto:  async (_, { file }, cntxt: context) => {
      try {
        const response = await cntxt.userModel.uploadProfilePhoto(cntxt.user.id.toString(), file, 'images');
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    uploadProfileBackgroundPhoto:  async (_, { file }, cntxt: context) => {
      try {
        const response = await cntxt.userModel.uploadProfilePhoto(cntxt.user.id.toString(), file, 'backgroundImages');
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    deleteProfilePhoto:  async (_, args, cntxt: context) => {
      try {
        const response = await cntxt.userModel.deleteProfilePhoto(cntxt.user.id.toString(), 'images');
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    deleteBackgroundPhoto:  async (_, args, cntxt: context) => {
      try {
        const response = await cntxt.userModel.deleteProfilePhoto(cntxt.user.id.toString(), 'backgroundImages');
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    deactiveAccount:  async (_, args, {userModel, user}) => {
      try {
        const response = await userModel.deactivateUser(user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    referFriends:  async (_, agrs, {userModel, user}) => {
      //todo
      return new GenericResponse(false, ['Under Construction']);
    }
  }
}


