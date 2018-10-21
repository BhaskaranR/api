import { links, getMongoClient } from "../db/mongo-connector";
import { safeObjectId, decorateNewDateData, validate } from '../helpers/util';
import { validations } from '../validations/post';
import * as mongoist from "mongoist";
import * as MongoPaging from 'mongo-cursor-pagination';


export class Comments {

    //remove this 
    MONGO_URL = 'mongodb://localhost:27017/posts?authSource=admin';

    private async getCommentCollection() {
        const db = mongoist(this.MONGO_URL);
        return db.collection("impressions");
    }


    private async getDefaultCollection() {
        const collections = await links();
        return collections.impressions;
    }

    private async findPostById(id) {
        let collection = await links();
        let postCollection = collection.posts;
        return safeObjectId(id)
            .then(oId =>
                postCollection
                    .find({ '_id': oId })
                    .limit(-1)
                    .next()
                    .then(res => {
                        if (!res) {
                            throw new Error('not found');
                        }
                        return res;
                    }))
    }

    private async genericById(id) {
        const collection = await this.getCommentCollection();
        return safeObjectId(id)
            .then(oId =>
                collection
                    .find({ _id: oId })
                    .limit(-1)
                    .next()
                    .then(res => {
                        if (!res) {
                            throw new Error('not found');
                        }
                        return res;
                    })
            );
    }

    private async genericInsertOne(obj) {
        let insert = decorateNewDateData(obj);
        let collection = await this.getDefaultCollection();
        return collection.insertOne(insert);
    }

    async addComment(comment, userId) {
        let validatedData;

        comment['userId'] = userId;

        try {
            validatedData = await validate(comment, validations.impression);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }
        try {
            const response = await this.findPostById(comment.postId);
        }
        catch (e) {
            throw new Error("Post id not found" + e.message);
        }
        try {
            return await this.genericInsertOne(comment);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }


    async editComment(commentid, comment, userId) {
        let validatedData;

        comment['userId'] = userId;
        debugger

        try {
            validatedData = await validate(comment, validations.impression);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }
        try {
            return await this.editCommentInDb(commentid, validatedData);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }


    async editCommentInDb(commentId, comment) {
        const collection = await this.getCommentCollection();
        return safeObjectId(commentId)
            .then(oId =>
                collection
                    .findOneAndUpdate(
                        { _id: oId },
                        {
                            $set: comment
                        }
                    )
            );

    }


    async deleteComment(commentId) {
        const collection = await this.getCommentCollection();

        return safeObjectId(commentId)
            .then(oId =>
                collection.findOneAndDelete({ '_id': oId }));
    }

    async getCommentsCountByPostId(ids: string[]) {
        try {
            const collection = await this.getCommentCollection();
            return await collection.aggregate([
                { "$match": { "$and": [{ postId: { $in: ids } }] } },
                { "$group": { _id: "$postId", count: { $sum: 1 } } }
            ]);
        }
        catch (e) {
            throw new Error(e.message);
        }
    }


    async getCommentsByPostId( postId: string, previous: string, next: string, limit: number ) {
        try {
            let collection = await this.getCommentCollection();
            return await MongoPaging.find(collection, {
                query: {
                    $and: [
                        { postId: postId }
                    ]
                },
                limit: limit,
                next: next,
                previous: previous
            })
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    /* async getCommentsByPostId(data: { postId: string, previous: string, next: string, limit: number }[]) {
        try {
            const ids = data.map(d => d.postId);
            let collection = await this.getCommentCollection();
            return await MongoPaging.find(collection, {
                query: {
                    $and: [
                        { postId: ids }
                    ],
                    $group: {
                        _id: null
                    }
                },
                limit: data[0].limit,
                next: data[0].next,
                previous: data[0].previous
            })
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    */

    async addReactionToComment(commentId, userId) {
        const collection = await this.getCommentCollection();
        debugger;
        return safeObjectId(commentId)
            .then(oId =>
                collection
                    .findOneAndUpdate(
                        { '_id': oId },
                        {
                            '$addToSet': {
                                'likes': userId
                            }
                        })
            )
    }

    async removeReactionToComment(commentId, userId) {
        const collection = await this.getCommentCollection();

        return safeObjectId(commentId)
            .then(oId =>
                collection
                    .findOneAndUpdate(
                        { '_id': oId },
                        {
                            '$pull': {
                                'likes': userId
                            }
                        }))
    }
}