import GenericResponse from '../model/generic-response';
import { Business } from '../model/business';
import User from '../model/user';

export default {
  Mutation: {
    createPromoPost:  async (_, { post, file }, { bizModel, user }) => {
      try {
        const response = await bizModel.createPromoPost(post, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    editPromoPost: async (_, { post }, { bizModel , user}) => {
      try {
        const response = await bizModel.editPromoPost(post, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    deletePromoPost: async (_, { postId }, { bizModel, user }) => {
      try {
        const response = await bizModel.deletePromoPost(postId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }

    },

    referBiz: async (_, { userId, bizId }, {bizModel,user}) => {
      try {
        const response = await bizModel.referBiz(userId, bizId, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    addBiz: async (_, { biz }, { bizModel, user }) => {
      try {
        const response = await bizModel.addBiz(biz, user.id.toString());
        return new GenericResponse(response);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    editBiz: async (_, { biz }, { bizModel, user }) => {
      try {
        const response = await bizModel.editBiz(biz, user.id.toString());
        return new GenericResponse(response);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },
    deleteBiz: async (_, { deleteBiz }, { bizModel, user }) => {
      try {
        const response = await bizModel.deleteBiz(deleteBiz, user.id.toString());
        return new GenericResponse(true);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    followBiz: async(_, {id}, {bizModel, user}) => {
      try {
        const response = await bizModel.followBiz(id, user.id.toString());
        return new GenericResponse(response);
      }
      catch (e) {
        return new GenericResponse(false, [e.message]);
      }
    },

    unfollowBiz: async (_, { id }, { bizModel, user }) => {
      try{
        const response = await bizModel.unfollowBiz(id, user.id.toString());
        return new GenericResponse(response);
      }
      catch(e){
        return new GenericResponse(false, [e.message]);
      }
    }
  }
};