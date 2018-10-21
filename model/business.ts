import { Db } from "mongodb";
import { links } from "../db/mongo-connector";
import * as boom from 'boom';
import * as config from 'config';
import * as Joi from 'joi';
import * as moment from 'moment';
import { bizvalidations as validation } from '../validations/business';
import { safeObjectId, validate, decorateNewDateData } from "../helpers/util";
import { distanceCheck } from '../helpers/googleutil';
import * as mongoist from 'mongoist';



export class Business {

    //remove the connection todo
    MONGO_BIZ_URL = 'mongodb://localhost:27017/business?authSource=admin';


    constructor() { }

    private async getBizCollection() {
        const db = mongoist(this.MONGO_BIZ_URL);
        return db.collection("business");
    }

    private async getCollection() {
        const collection = await links();
        return collection.business;
    }

    private async getUserCollection() {
        const collection = await links();
        return collection.users;
    }

    private async getGeobizCollection() {
        const collection = await links();
        return collection.geobiz;
    }

    async referBiz(userId, bizId) {

    }

    async addBiz(biz, userId) {
        let validatedData;
        biz['userId'] = userId;

        try {
            validatedData = await validate(biz, validation.newBiz);
        }
        catch (e) {
            throw new Error(e.message);
        }

        try {
            const response = await this.addNewBiz(decorateNewDateData(validatedData));
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async addNewBiz(data) {
        const collection = await this.getCollection();
        return collection.insertOne(data);
    }

    async editBiz(biz, userId) {
        let validatedData;

        biz['userId'] = userId;

        try {
            validatedData = await validate(biz, validation.editBiz);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }

        try {
            const response = await this.editBizInDb(biz);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async editBizInDb(biz) {
        let userId = biz['userId'];
        let collection = await this.getCollection();

        delete biz['userId'];

        return collection
            .findOneAndUpdate(
            { 'userId': userId },
            {
                '$set': biz
            },
            { returnOriginal: false }
            )

    }

    async deleteBiz(bizId) {
        let collection = await this.getCollection();
        return safeObjectId(bizId)
            .then(oId =>
                collection.findOneAndDelete({ '_id': oId }));
    }

    async followBiz(bizId, userId) {
        let biz;

        try {
            biz = this.getBizById(bizId);
        }
        catch (e) {
            throw new Error(e.message);
        }

        if (!biz) {
            throw new Error('biz does not exist');
        }

        try {
            const response = this.followBizInDb(bizId, userId);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }

    }

    private async followBizInDb(bizId, userId) {
        let userDb = await this.getUserCollection();

        return safeObjectId(userId)
            .then(oId =>
                userDb
                    .findOneAndUpdate(
                    { '_id': oId },
                    {
                        '$addToSet': {
                            'bizFollowed': oId
                        }
                    },
                    { returnOriginal: false }
                    ))
    }

    async getBizById(bizId) {
        const collection = await this.getCollection();
        const oId = await safeObjectId(bizId);
        const response = collection
            .find({ '_id': oId })
            .limit(-1)
            .next();
        if (!response) {
            throw new Error('not found');
        }
        return response;
    }


    async unfollowBiz(bizId, userId) {
        let biz;

        try {
            biz = this.getBizById(bizId);
        }
        catch (e) {
            throw new Error(e.message);
        }

        if (!biz) {
            throw new Error('biz does not exist');
        }

        try {
            const response = this.unfollowBizInDb(bizId, userId);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async unfollowBizInDb(bizId, userId) {
        let collection = await this.getUserCollection();

        return safeObjectId(userId)
            .then(oId =>
                collection
                    .findOneAndUpdate(
                    { '_id': oId },
                    {
                        '$pull': {
                            bizFollowed: bizId
                        }
                    }
                    ));
    }


    async createPromoPost(promo, userId) {
        let validatedData;
        let biz;

        try {
            validatedData = await validate(promo, validation.geobiz);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }

        try {
            biz = await this.findBizByUserId(userId);
        }
        catch (e) {
            throw new Error(e.message);
        }

        let now = moment();

        let geobizData = {
            geotag: {
                coordinates: [validatedData.coordinates.long, validatedData.coordinates.lat],
                type: 'Point'
            },
            create_date: now.toISOString(),
            modified_date: now.toISOString(),
            hour: now.hour()
        };

        try {
            const response = await this.addPromoPostInDb(geobizData);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async addPromoPostInDb(promo) {
        let collection = await this.getGeobizCollection();
        return collection.insertOne(promo);
    }

    private async findBizByUserId(userId) {
        let collection = await this.getCollection();
        return collection.findOne({ 'userId': userId });
    }



    async editPromoPost(post, userId) {
        let validatedData;
        let biz;

        try {
            validatedData = await validate(post, validation.editPromo);
        }
        catch (e) {
            throw new Error(e.ValidationError);
        }


        try {
            biz = await this.findBizByUserId(userId);
        }
        catch (e) {
            throw new Error(e.message);
        }

        try {
            const response = await this.updatePromoInDb(validatedData);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async updatePromoInDb(promo) {
        let collection = await this.getGeobizCollection();
        let bizId = promo['bizId'];
        delete promo['bizId'];

        return collection.findOneAndUpdate(
            { 'bizId': bizId },
            {
                '$set': promo
            },
            { returnOriginal: false });

    }

    async deletePromoPost(postId, userId) {
        let biz;

        try {
            biz = await this.findBizByUserId(userId);
        }
        catch (e) {
            throw new Error(e.message);
        }

        if (!biz) {
            throw new Error('you are not the owner of the business');
        }

        try {
            const response = this.deletePromoInDb(postId);
            return true;
        }
        catch (e) {
            throw new Error(e.message);
        }
    }

    private async deletePromoInDb(postId) {
        let collection = await this.getGeobizCollection();

        return safeObjectId(postId)
            .then(oId =>
                collection
                    .findOneAndDelete({ '_id': oId }))
    }

    async getFollowingBizByUserId(userId) {
        let collection = await this.getCollection();
        return collection
            .find({ following: { $in: [userId] } })
            .toArray();
    }

    async getBizByUserId(userId) {
        let collection = await this.getCollection();
        return collection
            .find({ 'userId': userId })
            .toArray();
    }

    async getBizNearBy(nearBiz) {
        let validatedData;
        try {
            validatedData = await validate(nearBiz, validation.geobizNearby);
        }
        catch (e) {
            throw new Error(e.message);
        }
        const distance = validatedData.maxDistance || 1;
        /*const options = {
            maxDistance: distance / 6371,
            limit: validatedData.limit || 10,
            spherical: true,
            distanceMultiplier: 6371
        }
        */
        const collection = await this.getBizCollection();
        return await collection.aggregate([{
            "$geoNear": {
                near: { type: "Point", coordinates: [parseFloat(validatedData.coordinates.long), parseFloat(validatedData.coordinates.lat)] },
                distanceField: "dist.calculated",
                maxDistance: distance,
                num: validatedData.limit || 10,
                spherical: true
            }
        }]);
    }

    async getPromoBizNearby(nearBiz) {

        let validatedData;

        try {
            validatedData = await validate(nearBiz, validation.geobizNearby);
        }
        catch (e) {
            throw new Error(e.message);
        }

        const collection = await this.getGeobizCollection();

        let now = moment();
        let twoHoursAgo = now.subtract(2, 'h').hour();
        let twoHoursFromNow = now.add(2, 'h').hour();
        let options = {
            maxDistance: validatedData.maxDistance / 6371,
            limit: validatedData.limit || 10,
            query: {
                $and: [
                    { hour: { $gte: twoHoursAgo } },
                    { hour: { $lte: twoHoursFromNow } }
                ]
            },
            spherical: true,
            distanceMultiplier: 6371,
        }

        return collection.geoNear(validatedData.long, validatedData.lat, options);
    }


    async getRecommendedBusiness(userId) {
        return {};
    }
}