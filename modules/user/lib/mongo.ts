import * as MongoDb from 'mongodb';
import { FindAndModifyWriteOpResultObject } from "mongodb";
import { InsertOneWriteOpResult } from "mongodb";
import { ObjectID } from "mongodb";
import { UpdateWriteOpResult } from "mongodb";
import { PlacesHistory, CustomUrls, WorkHistory, Story, EducationHistory, PersonalContact, PersonalInfo } from '../model/user';
import { IUser } from '../model/interfaces';
import { safeObjectId } from '../../../helpers/util';

export class Db {
    static database: MongoDb.Db;

    static findUserByMail(mail: string) {
        let collection = this.database.collection('user');
        return collection
            .find({ 'mail': mail })
            .limit(-1)
            .toArray()
            .then(result => result.length ? result[0] : null);
    }

    static findUserBySMId(id: string): any {
        let collection = this.database.collection('user');
        return collection
            .find({ smId: id })
            .limit(-1)
            .next();
    }

    static getUserInfo(userIdArr: string[]) {
        let collection = this.database.collection('user');
        return Promise.all(userIdArr.map(sid => safeObjectId(sid, 'user_id')))
            .then(oIds => {
                return collection
                    .find({ _id: { $in: oIds } })
                    .toArray();
            });
    }

    static getAllUserExcept(userIdArr: string[]) {
        let collection = this.database.collection('user');
        return Promise.all(userIdArr.map(sid => safeObjectId(sid, 'user_id')))
            .then(oIds => {
                return collection
                    .find({ _id: { $nin: oIds } })
                    .toArray();
            });
    }


    static createUser(user: IUser) {
        let collection = this.database.collection('user');
        return collection
            .insertOne(user);
    }

    static findUserById(userId: string) {
        return this.genericById(userId);
    }

    static genericById(id: string) {
        let collection = this.database.collection('user');
        return safeObjectId(id)
            .then(oId => {
                return collection
                    .find({ _id: oId })
                    .limit(-1)
                    .next()
                    .then(res => {
                        if (!res) {
                            throw Error('not found');
                        }
                        return res;
                    });
            });
    }

    static findUsersById(userIdArr: string[]) {
        let collection = this.database.collection('user');
        return Promise.all(userIdArr.map(sid => safeObjectId(sid, 'user_id')))
            .then(oIds => {
                return collection
                    .find({ _id: { $in: oIds } })
                    .toArray();
            });
    }

    static updateUserWithTempPassword(mail: string, hash: string) {
        let collection = this.database.collection('user');
        return collection
            .findOneAndUpdate(
            {
                mail: mail
            },
            {
                $set: {
                    temp_pw: hash
                }
            }).then(res => {
                if (!res.value) {
                    throw Error('not found');
                }
                return res;
            });
    }

    static updateFollow(userId, toFollow, unfollow) {
        let operation = unfollow ? '$pull' : '$addToSet';
        let updateObject = {};
        /* updateObject[operation] = {
            following: toFollow
        };
        */
        return Promise.all([safeObjectId(userId, 'user_id'), safeObjectId(toFollow, 'follow_id')])
            .then((ids) => {
                updateObject[operation] = {
                    following: ids[1]
                };
                return this.database.collection('user')
                    .findOneAndUpdate(
                    { _id: ids[0] },
                    updateObject,
                    { returnOriginal: false });
            });
    };


    static follow(userId: string, toFollow: string) {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        '$addToSet': {
                            following: toFollow
                        }
                    },
                    { returnOriginal: false });
            });
    }


    static unFollow(userId: string, toFollow: string) {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        '$pull': {
                            following: toFollow
                        }
                    },
                    { returnOriginal: false });
            });
    }

    static addBgImageToUser(userId: string, images: string[]) {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        $set: {
                            backgroundImage: images
                        }
                    },
                    { returnOriginal: false });
            });
    }


    static addImageToUser(userId: string, images: string[]) {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        $set: {
                            images: images
                        }
                    },
                    { returnOriginal: false });
            });
    }

    static getFollowersByUserId(id: string) {
        let collection = this.database.collection('user');
        return safeObjectId(id, 'user_id')
            .then(oId => collection
                .find({ 'following': oId })
                .toArray());
    }

    static getFollowingByUserId(id: string) {
        return this.findUserById(id)
            .then((user: any) => (user && user.following) ? user.following : []);
    }

    static getFollowersCountByUserId(id: string): Promise<number> {
        let collection = this.database.collection('user');
        return collection
            .count({
                following: id
            });
    }

    static changePassword(userId: string, password: string){
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            password: password
                        }
                    });
            });
    }


    static setConfirmEmail(userId: string) {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection.updateOne({ _id: oId }, {
                    $set: {
                        confirmMail: true
                    }
                })
            })
    }

    static useTempPw(userId: ObjectID, password: string): Promise<any> {
        let collection = this.database.collection('user');
        return collection
            .updateOne(
            { _id: userId },
            {
                $set: {
                    password: password
                }
            });
    }

    static getAllUsersByIds(userIds: string[]) {
        let collection = this.database.collection('user');
        return collection
            .find({ _id: { $in: userIds } })
            .toArray();
    }

    static deleteTempPw(userId: ObjectID): Promise<any> {
        let collection = this.database.collection('user');
        return collection
            .updateOne(
            { _id: userId },
            {
                $unset: {
                    temp_pw: ''
                }
            })
            .catch(err => {
                throw err;
            });
    }

    static getSettings(userId: string): Promise<{ [key: string]: any }> {
        return this.findUserById(userId)
            .then((user: any) =>
                (user && user.settings) ? user.settings : {});
    }

    static updateSettings(userId: string, settings: { [key: string]: any }): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            settings: settings
                        }
                    });
            });
    }

    static updatePersonalContact(userId: string, personalContact : PersonalContact): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            personalContact: personalContact
                        }
                    });
            });
    }

    static updatePersonalInfo(userId: string, personalInfo : PersonalInfo): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            personalInfo: personalInfo
                        }
                    });
            });
    }


    static updateCustomUrls(userId: string, customUrls : CustomUrls): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            customUrls: customUrls
                        }
                    });
            });
    }

    static updateUserPlacesHistory(userId: string, placesHistory: PlacesHistory): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            placesHistory: placesHistory
                        }
                    });
            });
    }

    static updateUserWorkHistory(userId: string, workHistory: WorkHistory): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            workHistory: workHistory
                        }
                    });
            });
    }

    static updateUserStory(userId: string, userStory: Story): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            userStory: userStory
                        }
                    });
            });
    }

    static updateUserEducationHistory(userId: string, educationHistory: EducationHistory): Promise<any> {
        let collection = this.database.collection('user');
        return safeObjectId(userId, 'user_id')
            .then(oId => {
                collection
                    .updateOne(
                    { _id: oId },
                    {
                        $set: {
                            educationHistory: educationHistory
                        }
                    });
            });
    }

}