import { MongoClient } from 'mongodb';
import * as config from 'config';
import * as util from '../../../helpers/util';
const mongoUrl = config.get('db.karmasoc-messenger.dbcon');

export const db: any = {};

const c = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages'
};

export const insertOne = (data, collectionId) => {
    let collection = db.collection(collectionId);
    let now = new Date();
    data.create_date = now.toISOString();
    data.modified_date = now.toISOString();
    return collection.insertOne(data);
};

export const findConversationsByUser = (query) => {
    let collection = db.collection(c.CONVERSATIONS);
    return collection
        .find({ 'participants.user_id': query.user_id })
        .toArray();
};

export const findById = (id, collectionId) => {
    let collection = db.collection(collectionId);
    return util.safeObjectId(id, collectionId + '_id')
        .then(oId => {
            return collection
                .find({ '_id': oId })
                .limit(-1)
                .next();
        });
};

export const countByIds = (ids, collectionId) => {
    let collection = db.collection(collectionId);
    let promises = ids.map(id => util.safeObjectId(id, collectionId + '_id'));
    return Promise.all(promises)
        .then(oIds => {
            return collection
                .count({
                    '_id': {
                        $in: oIds
                    }
                });
        });
};


export const findMessagesByConversationId = (conversationId, query) => {
    let collection = db.collection(c.MESSAGES);
    return collection
        .find({ conversation_id: conversationId })
        .limit(-query.elements)
        .sort({ timestamp: -1 })
        .skip(query.page * query.elements)
        .toArray();
};

export const findLatestMessagesByDistinctConversation = (userId, query) => {
    let collectionMessages = db.collection(c.MESSAGES);
    let collectionConversations = db.collection(c.CONVERSATIONS);
    return collectionConversations
        .find({ 'participants.user_id': userId })
        .toArray()
        .then(conversations => {
            return conversations.map(con => {
                return collectionMessages.find({
                        'conversation_id': con._id.toString()
                    })
                    .limit(-1)
                    .sort({ timestamp: -1 })
                    .toArray();
            });
        })
        .then(promises => Promise.all(promises))
        .then(messages => messages.filter(message => message.length))
        .then(results => {
            let merged = [].concat.apply([], results);
            merged.sort((a, b) => {
                return b.timestamp - a.timestamp;
            });
            return merged.slice(0, query.count || 3);
        });
};

export const acknowledgeConversation = (conversationId, userId, lastRead) => {
    return util.safeObjectId(conversationId, 'conversation_id')
        .then(objectId => {
            return db.collection(c.CONVERSATIONS)
                .findOneAndUpdate({
                    _id: objectId,
                    'participants.user_id': { $eq: userId }
                }, {
                    $set: {
                        'participants.$.last_read': lastRead
                    }
                });
        });
};


const isUserPartOfConversation = (conversationId, userId) => {
    return util.safeObjectId(conversationId, 'conversation_id')
        .then(oId => {
            return db.collection(c.CONVERSATIONS)
                .find({
                    '_id': oId,
                    'participants.user_id': userId
                })
                .limit(-1)
                .batchSize(1)
                .toArray()
                .then(res => {
                    return !!res[0];
                });
        });
};
