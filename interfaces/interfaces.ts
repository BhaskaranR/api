import * as MongoDb from 'mongodb';
import { FindAndModifyWriteOpResultObject, ObjectID, InsertOneWriteOpResult, UpdateWriteOpResult } from 'mongodb';

export interface IUser  {
    smId: string;
    strategy: string;
    firstName: string;
    lastName: string;
    city: string;
    state: string;
    country: string;
    gender: string;
    dob: Date;
    mail: string;
    confirmMail: boolean;
    password: string;
    loginType: string;
    verified: boolean;
    isActive: boolean;
    following: ObjectID[];
    friends: ObjectID[];
    settings: { [key: string]: any };
}


export class User implements IUser {
    _id: ObjectID;
    createdDate: Date;
    updatedAt: Date;
    smId: string;
    strategy: string;
    firstName: string;
    lastName: string;
    city: string;
    state: string;
    country: string;
    gender: string;
    dob: Date;
    mail: string;
    confirmMail: boolean;
    password: string;
    loginType: string;
    verified: boolean;
    isActive: boolean;
    following: ObjectID[];
    friends: ObjectID[];
    settings: { [key: string]: any };
}


export interface IRepository<T extends IEntity> {
    findUserByMail(mail: string): Promise<T>;
    findUserBySMId(id: string): Promise<T>;
    createUser(user: T): Promise<InsertOneWriteOpResult>;
    findUserById(userId: string): Promise<T>;
    genericById(userId: string, collectionId: string): Promise<T>;
    findUsersById(userIdArr: string[]): Promise<T[]>;
    updateUserWithTempPassword(email: string, hash: string): Promise<FindAndModifyWriteOpResultObject>;
    follow(userId: string, toFollow: string): Promise<T>;
    unFollow(userId: string, toFollow: string): Promise<T>;
    addImageToUser(userId: string, images: string[]): Promise<T>;
    getFollowersByUserId(userId: string): Promise<T[]>;
    getFollowingByUserId(userId: string): Promise<string[]>;
    getFollowersCountByUserId(id: string): Promise<number>;
    changePassword(userId: string, password: string): Promise<UpdateWriteOpResult>;
    useTempPw(userId: ObjectID, password: string): Promise<any>;
    deleteTempPw(userId: ObjectID): Promise<any>;
}

export interface IUserRepository extends IRepository<IUser> {

}

export interface IDeviceRepository<T extends IEntity> {
    getPushTokenFromUser(userIds: string[]): Promise<T[]>;
}
