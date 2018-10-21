'use strict';
import * as Joi from 'joi';
import { validations } from '../validations/post';
import { safeObjectId, decorateNewDateData } from '../helpers/util';
import { links, getMongoClient } from "../db/mongo-connector";
import * as mongoist from "mongoist";
import * as MongoPaging from 'mongo-cursor-pagination';
import { validate } from '../helpers/util';
import * as shortid from 'shortid';
import * as mime from 'mime';
import * as AWS from 'aws-sdk';
import { ThumboUrl } from '../helpers/thumbor/thumborUrlBuilder';
import * as config from 'config';

const s3 = new AWS.S3({
    accessKeyId: config.get("aws.s3.accessKeyId"),
    secretAccessKey: config.get("aws.s3.accessKeySecret")
});

// remove this
const MONGO_URL = 'mongodb://localhost:27017/posts?authSource=admin';

export class Post {

    private async getPostCollection() {
        const db = mongoist(MONGO_URL);
        return db.collection("posts");
    }

    private async getDefaultCollection() {
        const collections = await links();
        return collections.posts;
    }

    async getPostById(id: string) {
        const postCollection = await this.getDefaultCollection();
        const oId = await safeObjectId(id);
        const response = postCollection
            .find({ _id: oId })
            .limit(-1)
            .next();
        if (!response) {
            throw new Error('not found');
        }
        return response;
    }


    async getPostOfUser(userId: string, previous: string, next: string, limit: number, loggedInUserId: string) {
        try {
            const postCollection = await this.getPostCollection();
            //if (userId == loggedInUserId) {
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: userId }, //posted by
                        { likes: userId },  // liked by
                        { shares: userId }, // shared by
                        { bookmarks: { $elemMatch: { userId: userId } } } // bookmarked by
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
            // }
        }
        catch (err) {
            throw err;
        }
    }

    async getPhotoPostOfUser(userId: string, previous: string, next: string, limit: number) {
        try {
            const postCollection = await this.getPostCollection();
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: userId }, //posted by
                        { likes: userId },  // liked by
                        { shares: userId }, // shared by
                        { bookmarks: { $elemMatch: { userId: userId } } }, // bookmarked by
                        { postType: { $in: ["image"] } }
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (err) {
            throw err;
        }
    }

    async getVideoPostOfUser(userId: string, previous: string, next: string, limit: number) {
        try {
            const postCollection = await this.getPostCollection();
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: userId }, //posted by
                        { likes: userId },  // liked by
                        { shares: userId }, // shared by
                        { bookmarks: { $elemMatch: { userId: userId } } }, // bookmarked by
                        { postType: { $in: ["video"] } }
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (err) {
            throw err;
        }
    }

    async getFeaturedPosts(userIds: Array<string>, previous: string, next: string, limit: number) {
        try {
            // userIds = userIds.map(u => u.toString())
            const postCollection = await this.getPostCollection();
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: { $in: userIds } }, //posted by
                        { likes: { $in: userIds } },  // liked by
                        { shares: { $in: userIds } }, // shared by
                        { bookmarks: { $elemMatch: { userId: { $in: userIds } } } }
                         // bookmarked by
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (err) {
            debugger;
            throw err;
        }
    }

    async getPhotoPosts(userIds: Array<string>, previous: string, next: string, limit: number) {
        try {
            const postCollection = await this.getPostCollection();
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: { $in: userIds } }, //posted by
                        { likes: { $in: userIds } },  // liked by
                        { shares: { $in: userIds } }, // shared by
                        { bookmarks: { $elemMatch: { userId: { $in: userIds } } } },  // bookmarked by
                        { postType: { $in: ["image"] } }
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (err) {
            throw err;
        }
    }

    async getVideoPosts(userIds: Array<string>, previous: string, next: string, limit: number) {
        try {
            const postCollection = await this.getPostCollection();
            return await MongoPaging.find(postCollection, {
                query: {
                    $or: [
                        { userId: { $in: userIds } }, //posted by
                        { likes: { $in: userIds } },  // liked by
                        { shares: { $in: userIds } }, // shared by
                        { bookmarks: { $elemMatch: { userId: { $in: userIds } } } },  // bookmarked by
                        { postType: { $in: ["video"] } }
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (err) {
            throw err;
        }
    }


    private async hasUserPostFavored(postId: string, userId: string) {
        let collection = await this.getDefaultCollection();
        return safeObjectId(postId)
            .then(oId =>
                collection
                    .find({ '_id': oId, 'favorites': { $elemMatch: { userId: userId } } })
                    .limit(-1)
                    .toArray()
                    .then(res => !!res.length)
            );
    }

    private async updateFavor(postId: string, favorData, operation: string) {
        let collection = await this.getDefaultCollection();
        let updateObject = {};
        switch (operation) {
            case "update":
                return safeObjectId(postId, 'postId')
                    .then(oId =>
                        collection
                            .findOneAndUpdate(
                            { '_id': oId, 'likes': { $elemMatch: { userId: favorData.userId } } },
                            { "$set": { "likes.$.like": favorData } })
                    );
            case "add":
                /*updateObject["$addToSet"] = {
                    likes: favorData
                };*/
                return safeObjectId(postId, 'postId')
                    .then(oId =>
                        collection
                            .findOneAndUpdate(
                            { '_id': oId },
                            { '$addToSet': { likes: favorData } })
                    );
            case "remove":
                /*updateObject["$pull"] = {
                    likes: favorData
                };
                */
                return safeObjectId(postId, 'postId')
                    .then(oId =>
                        collection
                            .findOneAndUpdate({ '_id': oId, 'likes': { $elemMatch: { userId: favorData.userId } } }, { "$pull": { "likes": { "userId": favorData.userId } } })
                    );
        }

    }

    async favorPost(postId: string, like: string, userId: string) {
        let validatedLike;

        try {
            validatedLike = await validate(like, validations.likeType);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }

        var favorData = {
            userId: userId,
            like: like
        };

        try {
            const updateFavor = this.updateFavor(postId, favorData, 'remove');
        }
        catch (e) {
            throw new Error(e.message);
        }

        try {
            return this.updateFavor(postId, favorData, "add");
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    async unfavorPost(postId: string, like: string, userId: string) {
        let validatedLike;

        try {
            validatedLike = await validate(like, validations.likeType);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }

        let favorData = {
            userId: userId,
            like: like
        };

        try {
            return await this.updateFavor(postId, favorData, "remove");
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async addPost(post, userId: string) {
        let postObj = decorateNewDateData(post);
        postObj['userId'] = userId;
        let collection = await this.getDefaultCollection();
        return await collection.insertOne(postObj);
    }

    async createPost(post, userId: string) {
        let validatedData;
        try {
            validatedData = await validate(post, validations.post);
        }
        catch (e) {
            throw new Error("validating create post faileds, " + e.message);
        }

        try {
            return await this.addPost(validatedData, userId);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async editPostInDb(post, userId: string) {
        const collection = await this.getDefaultCollection();
        const id = post['_id'];
        delete post._id;
        return safeObjectId(id)
            .then(oId =>
                collection
                    .findOneAndUpdate(
                    { _id: oId, userId: userId },
                    {
                        $set: post
                    }
                    )
            );

    }

    async editPost(post, userId: string) {
        let validatedData;

        try {
            validatedData = await validate(post, validations.editPost);
        }
        catch (e) {
            throw new Error("edit post validation failed, " + e.ValidationError);
        }

        try {
            return await this.editPostInDb(validatedData, userId);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    async deletePost(postId: string, userId: string) {
        let collection = await this.getDefaultCollection();
        return safeObjectId(postId)
            .then(oId =>
                collection
                    .deleteOne(
                    { '_id': oId, 'userId': userId }
                    ));
    }


    async sharePost(postId: string, comment: string, userId: string) {
        try {
            const response = await this.deleteSharedby(postId, userId);
            return await this.addSharedby(postId, comment, userId);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async deleteSharedby(postId: string, userId: string) {
        const collection = await this.getDefaultCollection();

        return safeObjectId(postId, 'post_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        $pull: {
                            'sharedby': {
                                userId: userId,
                            }
                        }
                    },
                    { returnOriginal: false });
            });
    }

    async addSharedby(postId: string, comment: string, userId: string) {
        const collection = await this.getDefaultCollection();

        return safeObjectId(postId)
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    {
                        $push: {
                            'sharedby': {
                                userId: userId,
                                comment: comment
                            }
                        }
                    },
                    { returnOriginal: false });
            });
    }

    async unsharePost(postId: string, userId: string) {
        try {
            return await this.deleteSharedby(postId, userId)
        }
        catch (e) {
            throw new Error(e);
        }
    }

    private async genericInsertOne(obj) {
        let insert = decorateNewDateData(obj);
        let collection = await this.getDefaultCollection();
        return collection.insertOne(insert);
    }

    private async getPostsOfUserAction(userId: string) {
        let collection = await this.getDefaultCollection();
        return collection
            .find({ userId: userId })
            .sort({ create_date: -1 })
            .toArray();
    }


    async getPostsOfUser(data) {
        let validatedData;

        try {
            validatedData = await validate(data, validations.postOfUser);
        }
        catch (e) {
            throw new Error(e);
        }

        try {
            return await this.getPostsOfUserAction(validatedData.userId);
        }
        catch (e) {
            throw new Error(e);

        }
    }

    private async getCountForPostsByUserIdAction(userId: string) {
        let collection = await this.getDefaultCollection();
        return collection.count({ 'userId': userId });
    }

    async getCountForPostsByUserId(data) {
        try {
            return await this.getCountForPostsByUserIdAction(data.user_id);
        }
        catch (e) {
            throw new Error(e);
        }
    }


    private async getSettingsAction(postId: string, userId: string) {
        const collection = await this.getDefaultCollection();

        return safeObjectId(postId, 'postId')
            .then((oId) =>
                collection.findOne({ '_id': oId }))
            .then((post) => (post && post.settings) ? post.settings : {});
    }

    async getSettings(data, userId: string) {
        let validatedData;

        try {
            validatedData = await validate(data, validations.getSettings);
        }
        catch (e) {
            throw new Error(e);
        }

        try {
            return await this.getSettingsAction(data.postId, userId);
        }
        catch (e) {
            throw new Error(e);
        }
    }

    private async updateSettingsAction(postId: string, userId: string, settings) {
        let collection = await this.getDefaultCollection();
        return safeObjectId(postId)
            .then(oId =>
                collection
                    .update({ '_id': oId }, {
                        $set: {
                            settings: settings
                        }
                    })
            );
    }

    async updateSettings(data, userId: string) {
        let validatedData;

        try {
            validatedData = await validate(data, validations.updateSettings);
        }
        catch (e) {
            throw new Error(e);
        }

        try {
            return await this.updateSettingsAction(data.postId, '', data.settings);
        }
        catch (e) {
            throw new Error(e);
        }

    }


    private async s3fileUpload(file) {
        let filename = shortid.generate();
        let urlParams = {
            Bucket: "karmasoc-thumbor-storage",
            Key: filename + "." + mime.extension(file.mimetype),
            Body: file,
        };
        s3.upload(urlParams, (err, data) => {
            return { key: data.Key, ext: mime.extension(file.mimetype) };
        });
    }

    private async s3fileDelete(key) {
        let params = {
            Bucket: "karmasoc-thumbor-storage",
            Key: key
        };

        s3.deleteObject(params, (err, data) => {
            if (err) {
                throw new Error(err.message);
            }

            return data;
        })
    }

    async uploadPhoto(postId: string, file) {
        try {
            let response: any = await this.s3fileUpload(file);
            const saveInDb = await this.saveImageKeyInDb(postId, response.key, response.ext);
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

    private async saveImageKeyInDb(postId: string, key, ext) {
        let collection = await this.getDefaultCollection();
        let image = {
            key: key,
            ext: ext
        }

        let imgObj = {};
        imgObj['images'] = image;

        let obj = {
            $set: imgObj
        }

        return safeObjectId(postId, 'post_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId },
                    obj,
                    { returnOriginal: false });
            });
    }

    async deletePhoto(id, postId: string, userId: string) {
        return this.s3fileDelete(id);
    }

    async deletePhotoFromPost(id, postId: string, userId: string) {
        try {
            const response = this.s3fileDelete(id);
            return await this.deletePhotoFromPostIndb(id, postId, userId);
        }
        catch (e) {
            throw new Error(e);
        }
    }

    private async deletePhotoFromPostIndb(id, postId: string, userId: string) {
        const collection = await this.getDefaultCollection();

        return safeObjectId(postId, 'post_id')
            .then(oId => {
                return collection
                    .findOneAndUpdate(
                    { _id: oId, userId: userId },
                    {
                        $pull: {
                            images: {
                                key: id
                            }
                        }
                    },
                    { returnOriginal: false });
            });

    }

    async bookMarkPost(postId: string, bookMark: string, userId: string) {
        try {
            const response = await this.updateBookMarkPostInDb(postId, bookMark, userId, 'add');
            return response;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    async unbookMarkPost(postId: string, bookMark: string, userId: string) {
        try {
            return await this.updateBookMarkPostInDb(postId, bookMark, userId, 'remove');
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async updateBookMarkPostInDb(postId: string, bookmark: string, userId: string, operation: string) {
        const collection = await this.getDefaultCollection();
        var bookmarkData = {
            userId: userId,
            bookmark: bookmark
        };
        switch (operation) {
            case 'add': {
                return safeObjectId(postId)
                    .then((oId) => {
                        collection
                            .findOneAndUpdate(
                            { '_id': oId },
                            {
                                '$addToSet': {
                                    'bookMarks': bookmarkData
                                }
                            })

                    });
            }
            case 'remove': {
                return safeObjectId(postId)
                    .then(oId =>
                        collection
                            .findOneAndUpdate(
                            { '_id': oId },
                            {
                                '$pull': {
                                    'bookMarks': { 'userId': userId }
                                }
                            })
                    );
            }
        }
    }
}