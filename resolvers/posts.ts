import { flatten, keysIn, zipObject } from 'lodash';
import * as DataLoader from 'dataloader';
import GenericResponse from '../model/generic-response';
import { Post } from '../model/post';
import User from '../model/user';
import * as ip from '../interfaces/post';
import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../pubsub';
import { checkSubscription } from '../model/permissions';
import { Business } from '../model/business';
import * as _ from 'lodash';
import { PostEvent, Events } from '../interfaces/subscriptionEvents';
import { context } from '../interfaces/context';
import { publishRewardsFunc } from './rewards';
import { bookmark } from '../modules/posts/posts';


const POST_EVENT = "postEvent";
const POST_SHARED = "postShared";
const POST_BOOKMARKED = "postBookmarked";
const COMMENT_ADDED = "commentAdded";
const REACTION_ADDED = "reactionAdded";
export default {
  Subscription: {
    postEvent: {
      subscribe: checkSubscription.createResolver(withFilter(
        () => pubsub.asyncIterator(POST_EVENT),
        (payload, args, context) => {
          return payload !== undefined && payload.userId === context.user.id.toString()
        },
      )),
    }
  },
  Query: {
    featuredPosts:  async (_, { feedType, prev, next, count }, { userModel, postModel, user }: { userModel: User, postModel: Post, user: any }) => {
      switch (feedType) {
        case "Home":
 
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString());
          
          const result = await postModel.getFeaturedPosts([...followingUserIds, user._id.toString()], prev, next, count);
          const posts = result.results;
          result.posts = posts;

          return result;
        case "Photos":
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString())
          return await postModel.getPhotoPosts([...followingUserIds, user._id.toString()], prev, next, count)
        case "Videos":
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString())
          return await postModel.getVideoPosts([...followingUserIds, user._id.toString()], prev, next, count)
        case "Fun":
          return {};
        case "Learn":
          return {}
      }
    },
    friendsPosts: async (_, { feedType, prev, next, count }, { userModel, postModel, user }: { userModel: User, postModel: Post, user: any }) => {
      switch (feedType) {
        case "Home":
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString())
          return await postModel.getFeaturedPosts([...followingUserIds], prev, next, count)
        case "Photos":
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString())
          return await postModel.getPhotoPosts([...followingUserIds], prev, next, count)
        case "Videos":
          var followingUserIds = await userModel.getFollowingUserIds(user._id.toString())
          return await postModel.getVideoPosts([...followingUserIds], prev, next, count)
        case "Fun":
          return {};
        case "Learn":
          return {}
      }
    },
    trendingPosts: async (root, { feedType, prev, next, count }, { user }) => {
      switch (feedType) {
        case "Home":
          return {};
        case "Photos":
          return {};
        case "Videos":
          return {};
        case "Fun":
          return {};
        case "Learn":
          return {}
      }
    },
    recommendedPosts: (root, { feedType, prev, next, count }, { user }) => {
      switch (feedType) {
        case "Home":
          return {};
        case "Photos":
          return {};
        case "Videos":
          return {};
        case "Fun":
          return {};
        case "Learn":
          return {}
      }
    },
    getBizNearby: async (_, { nearBiz }, { bizModel }) => {
      try {
        const res = await bizModel.getBizNearBy(nearBiz);
        console.log(res);
        return res;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    getPromoBizNearby: async (_, { nearBiz }, { bizModel, user }) => {
      try {
        const res = await bizModel.getPromoBizNearby(nearBiz);
        return res;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    getBusiness: async (_, { bizId }, { bizModel }) => {
      try {
        const res = await bizModel.getBizById(bizId);
        let response = {
          id: res._id.toString(),
          bizName: res.bizName || '',
          address: res.address || '',
          zipcode: res.zipcode || null,
          title: res.title || '',
          website: res.website || '',
          geotag: res.geotag || '',
          followersCount: '4'
        }
        return response;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },

    getRecommendedBusiness: async (_, { userId }, { bizModel }) => {
      try {
        const res = await bizModel.getRecommendedBusiness(userId);
        return res;
      }
      catch (e) {
        throw new Error(e.message);
      }
    }
  },
  Post: {
    user: async (post: ip.Post, { }, { userLoader }) => {
      return userLoader.load(post.userId);
    },
    commentsCount: async (post: ip.Post, { }, cntxt: context) => {
      return cntxt.commentsCountLoader.load(post._id.toString());
    }
   /* comments: async (post: ip.Post, { prev, next, limit }, cntxt: context) => {
      const input = {
        id: post._id,
        prev: prev,
        next: next,
        limit: limit
      }
      return cntxt.commentsLoader.load(input);
    } */
  },

  Business: {
    followers: async (business, { cursor, limit }, { bizModel, userModel }: { bizModel: Business, userModel: User }) => {
      try {
        return await userModel.getBizFollowers(business.id);
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    followersCount: async (business, { cursor, limit }, { bizModel, userModel }: { bizModel: Business, userModel: User }) => {
      try {
        const users = await userModel.getBizFollowers(business.id);
        let result = 0;

        if (_.isArray(users) && !!users.length) {
          result = users.length;
        }

        return result;
      }
      catch (e) {
        throw new Error(e.message);
      }
    },
    user: async (business, { cursor, limit }, { userModel, bizModel }) => {
      try {
        const biz = await bizModel.getBizById(business.id);
        const user = await userModel.findUserById(biz.userId);
        return user;
      }
      catch (e) {
        throw new Error(e.message);
      }

    },
  },
  Mutation: {
    createPost: async (_, { post, file }, cntxt: context) => {
      try {
        const response = await cntxt.postModel.createPost(post, cntxt.user.id.toString());
        const asyncFunc = async () => {
          const results = await cntxt.rewardsModel.postActionRewards.newPost(cntxt.user.id.toString(), {
            id: response.insertedId.toString(),
            //todo for photos
          });
          publishRewardsFunc(results);
        }
        asyncFunc();
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    editPost: async (_, { post }, { postModel, user }) => {
      try {
        const response = await postModel.editPost(post, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    deletePost: async (_, { postId }, cntxt: context) => {
      try {

        const response = await cntxt.postModel.deletePost(postId, cntxt.user.id.toString());
        const asyncFunc = async () => {
          const results = await cntxt.rewardsModel.postActionRewards.deletePost(cntxt.user.id.toString(), {
            id: postId
          });
          publishRewardsFunc(results);
        };
        asyncFunc();
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    deletePhotoFromPost: async (_, { id, postId }, cntxt: context) => {
      try {
        const response = await cntxt.postModel.deletePhotoFromPost(id, postId, cntxt.user.id.toString());
        //todo assign rewards check if any more photos are on the post and update reward results
        
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    favorPost: async (_, { postId, like }, cntxt: context) => {
      try {
        const response = await cntxt.postModel.favorPost(postId, like, cntxt.user.id.toString());
        const asyncFunc = async () => {
          const currentPost = await cntxt.postModel.getPostById(postId);
          const data: PostEvent = {
            event: Events.reactionAdded,
            post: currentPost,
          }
          pubsub.publish(POST_EVENT, {
            userId: currentPost.userId,
            data: data
          });
          const results = await cntxt.rewardsModel.postActionRewards.favorPost(cntxt.user.id.toString(), {
            id: postId
          });
          publishRewardsFunc(results);
        };
        asyncFunc();
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    unFavorPost: async (_, { postId, like }, cntxt: context) => {
      try {
        const response = await cntxt.postModel.unfavorPost(postId, like, cntxt.user.id.toString());
        const asyncFunc = async () => {
          const results = await cntxt.rewardsModel.postActionRewards.unfavorPost(cntxt.user.id.toString(), {
            id: postId
          });
          publishRewardsFunc(results);
        };
        asyncFunc();
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    bookMarkPost: async (_, { postId, bookMark }, cntxt: context) => {
      try {
        const response = await cntxt.postModel.bookMarkPost(postId, bookMark, cntxt.user.id.toString());
        //Notify User
        const asyncFunc = async () => {
          const currentPost = await cntxt.postModel.getPostById(postId);
          const data: PostEvent = {
            event: Events.postBookmarked,
            post: currentPost,
          }
          pubsub.publish(POST_EVENT, {
            userId: currentPost.userId,
            data: data
          });

          const asyncFunc = async () => {
            const results = await cntxt.rewardsModel.postActionRewards.bookmarkPost(cntxt.user.id.toString(), {
              id: postId
            });
            publishRewardsFunc(results);
          };
          asyncFunc();
        };
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    unbookMarkPost: async (_, { postId, bookMark }, { postModel, user }) => {
      try {
        const response = await postModel.unbookMarkPost(postId, bookMark, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    sharePost: async (_, { postId, comment }, { postModel, user }) => {
      try {
        const response = await postModel.sharePost(postId, comment, user.id.toString());
        //Notify User
        const asyncFunc = async () => {
          const currentPost = await postModel.getPostById(postId);
          const data: PostEvent = {
            event: Events.postShared,
            post: currentPost,
          }
          pubsub.publish(POST_EVENT, {
            userId: currentPost.userId,
            data: data
          });
        };
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    unsharePost: async (_, { postId }, { postModel, user }) => {
      try {
        const response = await postModel.unsharePost(postId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    uploadPhoto: async (_, { file }, { postModel }) => {
      try {
        const response = await postModel.uploadPhoto(file);
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    deletePhoto: async (_, { id, postId }, { postModel, user }) => {
      try {
        const response = await postModel.deletePhoto(id, postId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
  }
};
