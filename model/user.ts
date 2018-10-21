import { links } from "../db/mongo-connector";
import * as boom from 'boom';
import * as config from 'config';
import * as Joi from 'joi';
import {
    validation,
    personalInfo as personalInfoValidation,
    personalContact as personalContactValidation,
    userCustomUrls as userCustomUrlsValidation,
    userPlacesHistory as userPlacesHistoryValidation,
    userEducationHistory as userEducationHistoryValidation,
    userWorkHistory as userWorkHistoryValidation,
    userStory as userStoryValidation
} from '../validations/user';
import { safeObjectId } from "../helpers/util";
import { PersonalInfo, PlacesHistory, EducationHistory, WorkHistory, Story, } from '../interfaces/user';
import * as IUser from '../interfaces/user';

import { validate } from '../helpers/util';
import * as shortid from 'shortid';
import * as mime from 'mime';
import * as AWS from 'aws-sdk';
import { ThumboUrl } from '../helpers/thumbor/thumborUrlBuilder';


const s3 = new AWS.S3({
    accessKeyId: config.get("aws.s3.accessKeyId"),
    secretAccessKey: config.get("aws.s3.accessKeySecret")
});

const basicPin = {
    role: 'user'
};

const mailerPin = {
    role: 'mailer'
}

const vapidkeyDetails = "BEMHvDSNah5TnwfBzY5kZc8l4ax7fmLaoHg9lP8eDJ7wdJldEFoRg3TC46-oiyUKg3R9gms-zNY5BbNsotPC2VE";
export default class User {
   

    private async getUserCollection() {
        const collections = await links();
        return collections.users
    }

    private async getDeactivatedUserCollection() {
        const collections = await links();
        return collections.deactivatedUsers;
    }

    async findUserById(userId: string) {
        const usr = await this.genericById(userId);
        if (!usr) {
            throw new Error('user not found');
        }
        return usr
    }

    async findUsersByIds(userIdArr: any[]) {
        const userCollection = await this.getUserCollection();
        return await userCollection
            .find({ _id: { $in: userIdArr } })
            .toArray();
    }

    async getSuggestedFriends(id: string) {

    }


    async getFollowing(userId, cursor: string, limit: number) {
        const userIds = await this.findUserById(userId)
            .then((user: any) => (user && user.profile.following ? user.profile.following: []));
        return await this.findUsersByIds(userIds);
    }

    async getFollowingUserIds(userId) {
        return await this.findUserById(userId)
            .then((user: any) => (user && user.profile.following) ? <string[]>user.profile.following : []);
    }

    async getFollowingCount(userId: string) {
        return await this.findUserById(userId)
            .then((user: any) => (user && user.profile.following ? user.profile.following.length : 0));
    }

    async getFollowers(userId: string, cursor: string, limit: number) {
        const userCollection = await this.getUserCollection();
        return await safeObjectId(userId, 'user_id')
            .then(oId => userCollection
                .find({ 'following': oId })
                .toArray());
    }

    async getFollowersCount(userId: string) {
        const userCollection = await this.getUserCollection();
        const userIds = await safeObjectId(userId, 'user_id')
            .then(oId => userCollection
                .find({ 'following': oId })
                .toArray());
        return userIds.length;
    }


    private async genericById(id: string) {
        const userCollection = await this.getUserCollection();
        const oId = await safeObjectId(id);
        return userCollection
            .find({ _id: oId })
            .limit(-1)
            .next();
    }

    // working, tested
    private async updateFollow(userId, toFollow, unfollow) {
        let operation = unfollow ? '$pull' : '$addToSet';
        let updateObject = {};
        const userCollection = await this.getUserCollection();
        return Promise.all([safeObjectId(userId, 'user_id'), safeObjectId(toFollow, 'follow_id')])
            .then((ids) => {
                updateObject[operation] = {
                    'following': ids[1]
                }
                return userCollection
                    .findOneAndUpdate(
                        { _id: ids[0] },
                        updateObject,
                        { returnOriginal: false });
            });
    }

    //working, tested
    private async updateFollowersPending(userId, toFollow, removePending) {
        let operation = removePending ? '$pull' : '$addToSet';
        let updateObject = {};
        const collection = await this.getUserCollection();
        return Promise.all([safeObjectId(userId, 'user_id'), safeObjectId(toFollow, 'follow_id')])
            .then((ids) => {
                updateObject[operation] = {
                    'followersPending': ids[0]
                }
                return collection
                    .findOneAndUpdate(
                        { _id: ids[1] },
                        updateObject,
                        { returnOriginal: false });
            });

    }

    //working tested
    private async clearPending(userId, toFollow) {
        const collection = await this.getUserCollection();
        let updateObject = {};

        return Promise.all([safeObjectId(userId, 'user_id'), safeObjectId(toFollow, 'follow_id')])
            .then((ids) => {
                updateObject['$pull'] = {
                    'profile.followersPending': ids[1]
                }
                return collection
                    .findOneAndUpdate(
                        { '_id': ids[0] },
                        updateObject,
                        { returnOriginal: false });
            });
    }

    //working, tested
    async follow(follow_id: string, user_id: string) {
        let validatedData;

        try {
            validatedData = await validate({ 'follow_id': follow_id, 'user_id': user_id }, validation.follow);
        }
        catch (e) {
            throw new Error("Error validating follow the request , " + e);
        }

        if (validatedData.user_id === validatedData.follow_id) {
            throw new Error("Can\'t follow yourself");
        }

        try {
            const findUser = await this.findUserById(validatedData.follow_id);
            const response = await this.updateFollowersPending(validatedData.user_id, validatedData.follow_id, false);
            return response;
        }
        catch (err) {
            throw new Error("Error validating follow the request , " + err);
        }
    }

    // working, tested
    async unfollow(follow_id: string, user_id: string) {
        let validatedData;

        try {
            validatedData = await validate({ 'follow_id': follow_id, 'user_id': user_id }, validation.follow);
        }
        catch (e) {
            throw new Error("Error validating the request");
        }

        if (validatedData.user_id === validatedData.follow_id) {
            throw new Error("Can\'t follow yourself");
        }

        try {
            const userFound = await this.findUserById(validatedData.follow_id);
            return await this.updateFollow(validatedData.user_id, validatedData.follow_id, true);
        }
        catch (err) {
            if (err.message === 'not found') {
                throw new Error("User not found");
            }
            if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                throw new Error("Invalid user id");
            }
        }
    }

    //working, tested
    async approveFollower(follower_id: string, user_id: string) {
        let validatedData;

        try {
            validatedData = await validate({ 'follow_id': user_id, 'user_id': follower_id }, validation.follow);
        }
        catch (e) {
            throw new Error("Error approving follower , " + e);
        }

        try {
            const findUser = await this.findUserById(validatedData.follow_id);
            const removeFromPending = await this.updateFollowersPending(validatedData.user_id, validatedData.follow_id, true);
            const response = await this.updateFollow(validatedData.user_id, validatedData.follow_id, false);
            const clearPending = await this.clearPending(validatedData.user_id, validatedData.follow_id);
            return response;
        }
        catch (err) {
            throw new Error("Error approving follower , " + err);
        }
    }

    async rejectFollower(follower_id: string, user_id: string) {
        let validatedData;

        try {
            validatedData = await validate({ 'follow_id': user_id, 'user_id': follower_id }, validation.follow);
        }
        catch (e) {
            throw new Error("Error approving follower , " + e);
        }

        try {
            const findUser = await this.findUserById(validatedData.follow_id);
            const removeFromPending = await this.updateFollowersPending(validatedData.user_id, validatedData.follow_id, true);
            const clearPending = await this.clearPending(validatedData.user_id, validatedData.follow_id);
        }
        catch (err) {
            throw new Error("Error approving follower , " + err);
        }
    }

    //working, tested
    private async updatePersonalInfoInDb(userId: string, personalInfo: PersonalInfo) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: { 'profile.personalInfo': personalInfo }
                        })
            });
    }

    //working, tested
    async updatePersonalInfo(user_id, personalInfo) {
        let validatedData;

        try {
            validatedData = await validate(personalInfo, personalInfoValidation);
        }
        catch (e) {
            throw new Error(e + ' , update settings by user id service ');
        }

        try {
            return await this.updatePersonalInfoInDb(user_id, validatedData);
        }
        catch (e) {
            throw new Error(e);
        }
    }

    //working tested
    private async updatePersonalContactInDb(user_id, personalContact) {
        const collection = await this.getUserCollection();
        return safeObjectId(user_id, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: { 'profile.personalContact': personalContact }
                        })
            });
    }

    // working, but validate does not throw error, first catch not working
    async updatePersonalContact(user_id, personalContact) {
        let validatedData;

        try {
            validatedData = await validate(personalContact, personalContactValidation);
        }
        catch (e) {
            return new Error(e + ', update settings by user id service ');
        }

        try {
            const response = await this.updatePersonalContactInDb(user_id, validatedData);
            return response;
        }
        catch (e) {
            throw new Error(e);
        }
    }


    private async updateSettingsInDb(userId, settings) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        { $set: { 'profile.settings': settings } });
            });
    }

    async updateUserCustomUrl(user_id, customerUrls) {
        let validatedData;
      
        try {
            validatedData = await validate(customerUrls, userCustomUrlsValidation);
        }
        catch (e) {
            throw new Error(e + ' update settings by user id service')
        }

        try {
            return await this.updateSettingsInDb(user_id, validatedData);
        }
        catch (e) {
            throw new Error(e + 'Update user settings');
        }
    }


    private async updateUserPlacesHistoryAction(userId: string, placesHistory: PlacesHistory) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: {
                                'profile.placesHistory': placesHistory
                            }
                        });
            });

    }

    async updateUserPlacesHistory(user_id: string, placesHistory: PlacesHistory) {
        let validatedData;
        debugger;
        try {
            validatedData = await validate(placesHistory, userPlacesHistoryValidation);
        }
        catch (e) {
            throw new Error(e + ' , update settings by user id service ');
        }

        try {
            return await this.updateUserPlacesHistoryAction(user_id, validatedData);
        }
        catch (e) {
            throw new Error(e + ' , update user settings ');
        }
    }


    private async updateUserEducationHistoryAction(userId: string, educationHistory: EducationHistory) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: {
                                'profile.educationHistory': educationHistory
                            }
                        });
            });
    }

    async updateUserEducationHistory(user_id, educationHistory) {
        let validatedData;
        
        try {
            validatedData = await validate(educationHistory, userEducationHistoryValidation);
        }
        catch (e) {
            throw new Error(e + ' , updating settings by user id service');
        }

        try {
            return await this.updateUserEducationHistoryAction(user_id, educationHistory.educationHistory);
        }
        catch (e) {
            throw new Error(e + ' , update user settings');
        }
    }


    private async updateUserWorkHistoryAction(userId: string, workHistory: WorkHistory) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: {
                                'profile.workHistory': workHistory
                            }
                        });
            });

    }

    async updateUserWorkHistory(user_id, workHistory) {
        let validatedData;

        try {
            validatedData = await validate(workHistory, userWorkHistoryValidation);
        }
        catch (e) {
            throw new Error(e + ' , update settings by user id service');
        }

        try {
            return await this.updateUserWorkHistoryAction(user_id, validatedData);
        }
        catch (e) {
            throw new Error(e + ' , update setting by user id service');
        }
    }

    private async updateUserStoryAction(userId: string, userStory: Story) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                        { _id: oId },
                        {
                            $set: {
                                'profile.userStory': userStory
                            }
                        });
            });
    }

    async updateUserStory(user_id, story, visibility) {
        let validatedData;

        try {
            validatedData = await validate(story, userStoryValidation);
        }
        catch (e) {
            throw new Error(e + ' , user service');
        }

        try {
            return await this.updateUserStoryAction(user_id, validatedData);
        }
        catch (e) {
            throw new Error(e + 'update user settings');
        }
    }

    async addBgImageToUser(userId: string, images: string[]) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                        { _id: oId },
                        {
                            $set: {
                                'profile.backgroundImage': images
                            }
                        },
                        { returnOriginal: false });
            });
    }


    async addImageToUser(userId: string, images: string[]) {
        const collection = await this.getUserCollection();
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                        { _id: oId },
                        {
                            $set: {
                                'profile.images': images
                            }
                        },
                        { returnOriginal: false });
            });
    }

    async s3fileUpload(file) {
        let filename = shortid.generate();
        let urlParams = {
            Bucket: "karmasoc-thumbor-storage",
            Key: filename + "." + mime.extension(file.mimetype),
            Body: file,
        };
        s3.upload(urlParams, function (err, data) {
            return { key: data.Key, ext: mime.extension(file.mimetype) };
        });
    }

    async saveImageKeyInDb(userId, key, ext, type) {
        const collection = await this.getUserCollection();
        let image = {
            key: key,
            ext: ext
        }

        let imgObj = {};
        imgObj['profile.' + type] = image;

        let obj = {
            $set: imgObj
        }

        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                        { _id: oId },
                        obj,
                        { returnOriginal: false });
            });
    }

    async uploadProfilePhoto(userId: string, file, type) {

        try {
            let response: any = await this.s3fileUpload(file);
            const saveInDb = await this.saveImageKeyInDb(userId, response.key, response.ext, type);
            const url = {
                small: ThumboUrl.smallPhoto(response.key),
                normal: ThumboUrl.normalPhoto(response.key),
                large: ThumboUrl.largePhoto(response.key),
                verylarge: ThumboUrl.verylargePhoto(response.key)
            }
            return url;
        }
        catch (e) {
            return new Error(e);
        }
    }

    async deactivateUser(id) {
        let user = await this.findUserById(id);
        
        const deactivatedUsersCollection = await this.getDeactivatedUserCollection();
        let result = await deactivatedUsersCollection.insert(user);
        
        const userCollection = await this.getUserCollection();
        return safeObjectId(id, 'user_id')
                .then(oId => {
                    return userCollection
                        .deleteOne({
                            _id:oId
                        })
                })

    }


    async deleteProfilePhoto(userId, imageType) {
        const collection = await this.getUserCollection();
        let imgObj = {};
        imgObj['profile.' + imageType] = null;

        let obj = {
            $set: imgObj
        }

        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                        { _id: oId },
                        obj,
                        { returnOriginal: false });
            });
    }


    async getBizFollowers(bizId) {
        const collection = await this.getUserCollection();
        return collection
            .find(
                {
                    'followingBusinesses':
                        {
                            "$in": [bizId]
                        }
                }).toArray();
    }

}
