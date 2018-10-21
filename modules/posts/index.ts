'use strict';
import * as config from 'config';
import * as newPost from './lib/newPost';
import * as post from './lib/post';
import * as Seneca from 'seneca';

const patternPin = 'role:posts';
const seneca = Seneca();

seneca
    .use('seneca-amqp-transport')
    .add(patternPin + ',cmd:newPost', newPost.newPost)
    .add(patternPin + ',cmd:deletePost', post.deletePost)
    .add(patternPin + ',cmd:favorPost', post.favorPost)
    .add(patternPin + ',cmd:unfavorPost', post.unfavorPost)
    .add(patternPin + ',cmd:toggleFavorPost', post.toggleFavorPost)
    .add(patternPin + ',cmd:addimpression', post.addTextImpression)
    .add(patternPin + ',cmd:addimpression,type:image', post.addImageImpression)
    .add(patternPin + ',cmd:addimpression,type:video', post.addVideoImpression)
    .add(patternPin + ',cmd:addimpression,type:audio', post.addAudioImpression)
    .add(patternPin + ',cmd:deleteImpression', post.deleteImpression)
    .add(patternPin + ',cmd:getSettings', post.getSettings)
    .add(patternPin + ',cmd:count,entity:post,by:userId', post.getCountForPostsByUserId)
    .add(patternPin + ',cmd:updateSettings', post.updateSettings)

    .add(patternPin + ',cmd:getPostsById', post.getPostsById)
    .add(patternPin + ',cmd:getPostByPostId', post.getPostByPostId)
    .add(patternPin + ',cmd:getAllPostByPostId', post.getAllPostByPostId)
    .add(patternPin + ',cmd:getAllPostByUserId', post.getAllPostByUserId)
    .add(patternPin + ',cmd:getProfilePostByUserId', post.getProfilePostByUserId)
    .add(patternPin + ',cmd:getGalleryPostByUserId', post.getGalleryPostByUserId)
    .add(patternPin + ',cmd:getPostByUserIdandPostType', post.getPostByUserIdandPostType)
    .add(patternPin + ',cmd:getFunPostByUserId', post.getFunPostByUserId)
    .add(patternPin + ',cmd:getLearnPostByUserId', post.getLearnPostByUserId)
    .add(patternPin + ',cmd:getMyPagePostByUserId', post.getMyPagePostByUserId)

    .add(patternPin + ',cmd:getAllImpressionsForPostId', post.getAllImpressionsForPostId)
    .add(patternPin + ',cmd:getImpressionsByPostId', post.getImpressionsByPostId)
    .listen({
        type: 'amqp',
        pin: patternPin
    });