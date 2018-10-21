'use strict';
import * as config from 'config';
import * as  database from './lib/database';
import * as nearby from './lib/nearby';
import * as promobiz from './lib/promobiz';
import * as biz from './lib/business';
import * as categories from './lib/categories';
import * as newBiz from './lib/newBiz';
const seneca = require('seneca')({
    actcache: {
        active: true,
        size: 257
    }
});

var patternPin = 'role:business';
seneca
    .add(patternPin + ',cmd:nearbypromobiz', promobiz.getPromoBizNearby)
    .add(patternPin + ',cmd:bizById', biz.getBizById)
    .add(patternPin + ',cmd:getsuggestedbiz', biz.getAllBizExceptMe)
    .add(patternPin + ',cmd:getfollowingbizofuser', biz.getFollowingBizOfUser)
    .add(patternPin + ',cmd:bizByname', biz.getBizByName)
    .add(patternPin + ',cmd:getbizbyuserid', biz.getBizOfUser)
    .add(patternPin + ',cmd:getfavoriteBizbyuserid', biz.getFavoriteBizbyUserId)
    .add(patternPin + ',cmd:count,entity:biz,by:userId', biz.getCountForBizByUserId)
    .add(patternPin + ',cmd:getBizLookup', categories.getBizLookup)
    .add(patternPin + ',cmd:getBizSubCategories', categories.getBizSubCategories)
    .add(patternPin + ',cmd:nearby', nearby.getBizNearby)
    .add(patternPin + ',cmd:getfollowers', biz.getFollowers)
    .add(patternPin + ',cmd:getfollowing', biz.getFollowing)
    .add(patternPin + ',cmd:count,entity:follower,by:bizId', biz.getFollowersCountByBizId)
    .add(patternPin + ',cmd:addnewBiz', newBiz.addNewBiz)
    .add(patternPin + ',cmd:deleteBiz', biz.deleteBiz)
    .add(patternPin + ',cmd:follow', biz.follow)
    .add(patternPin + ',cmd:unfollow', biz.unFollow)
    .add(patternPin + 'cmd:addpromobiz', promobiz.addpromoBiz)
    .add(patternPin + ',cmd:add,entity:image', biz.addImageToBiz)
    .add(patternPin + ',cmd:add,entity:bgimage', biz.addBgImageToBiz)
    .listen({
        type: 'amqp',
        pin: patternPin
    })