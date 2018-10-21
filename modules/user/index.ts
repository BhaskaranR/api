"use strict";

import UserRepository from './lib/user';
const config = require('config');
export const userRepository: UserRepository = new UserRepository();


//const seneca = require('seneca')();
//const patternPin = 'role:user';
/*
seneca
    //.add(patternPin + ',cmd:register,entity:device', device.registerDevice)
    //.add(patternPin + ',cmd:unregister,entity:device', device.unregisterDevice)
    //.add(patternPin + ',cmd:get,entity:pushToken', device.getPushToken)
    //.add(patternPin + ',cmd:register,entity:user', user.register)
    //.add(patternPin + ',cmd:confirmemail,entity:user', user.confirmEmail)
    .add(patternPin + ',cmd:changePwd', user.changePassword)


    
    .add(patternPin + ',cmd:getSettings', user.getSettings)
    .add(patternPin + ',cmd:updateSettings', user.updateSettings)
    .add(patternPin + ',cmd:updateCustomUrls', user.updateCustomUrls)
    .add(patternPin + ',cmd:updatePersonalInfo', user.updatePersonalInfo)
    .add(patternPin + ',cmd:updatePersonalContact', user.updatePersonalContact)
    .add(patternPin + ',cmd:updateUserPlacesHistory', user.updateUserPlacesHistory)
    .add(patternPin + ',cmd:updateUserWorkHistory', user.updateUserWorkHistory)
    .add(patternPin + ',cmd:updateUserStory', user.updateUserStory)
    .add(patternPin + ',cmd:updateUserEducationHistory', user.updateUserEducationHistory)
    .add(patternPin + ',cmd:add,entity:image', user.addImageToUser)
    .add(patternPin + ',cmd:add,entity:bgimage', user.addBgImageToUser)
    .add(patternPin + ',cmd:follow', user.follow)
    .add(patternPin + ',cmd:getfollowers', user.getFollowers)
    .add(patternPin + ',cmd:getfollowing', user.getFollowing)
    .add(patternPin + ',cmd:count,entity:follower,by:userId', user.getFollowersCountByUserId)
    .add(patternPin + ',cmd:unfollow', user.unFollow)
    .add(patternPin + ',cmd:getAllUserExceptMe', user.getAllUserExceptMe)
    .add(patternPin + ',cmd:getUserInfo', user.getUserInfo)
    .add(patternPin + ',cmd:getUser,by:id', user.getUserById)
    .add(patternPin + ',cmd:getUser,by:ids', user.getAllUsersById)
    .add(patternPin + ',cmd:getUser,by:mail', user.getUserByMail).listen({
        type: 'amqp',
        pin: patternPin
    })
    */

