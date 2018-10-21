

import * as DataLoader from 'dataloader';
import GenericResponse from '../model/generic-response';
import { Comments } from '../model/comments';
import User from '../model/user';
import { Post } from '../model/post';
import * as ip from '../interfaces/post';
import { context } from '../interfaces/context';


export default {
  Query : {
    comment:  async (_, { postId, prev, next, count }, cntxt : context) => {
      return await cntxt.commentModel.getCommentsByPostId(postId, prev, next, count);
    }
  },
  Comment: {
    user: async (comment, { }, { userModel }: { userModel: User }) => {
      const user = await userModel.findUserById(comment.userId);
      return user;
    }
  },
  Mutation: {
    addComment:  async (_, { comment }, cntxt : context) => {
      try {
        const response = await cntxt.commentModel.addComment(comment, cntxt.user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        const response = new GenericResponse(false);
        response.addError(null, e.message);
        return response;
      }
    },
    editComment:  async (_, { commentId, comment }, { commentModel, user }) => {
      try {
        const response = await commentModel.editComment(commentId, comment, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        const response = new GenericResponse(false);
        response.addError(null, e.message);
        return response;
      }
    },
    deleteComment:  async (_, { commentId, content }, { commentModel }: { commentModel: Comments }) => {
      try {
        const response = await commentModel.deleteComment(commentId);
        return new GenericResponse(true);
      }
      catch (e) {
        const response = new GenericResponse(false);
        response.addError(null, e.message);
        return response;
      }
    },

    addReactionToComment:  async (_, { commentId }, { commentModel, user }) => {
      try {
        const response = await commentModel.addReactionToComment(commentId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        const response = new GenericResponse(false);
        response.addError(null, e.message);
        return response;
      }
    },

    removeReactionToComment:  async (_, { commentId }, { commentModel, user }) => {
      try {
        const response = await commentModel.removeReactionToComment(commentId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        const response = new GenericResponse(false);
        response.addError(null, e.message);
        return response;
      }
    }
  }
}