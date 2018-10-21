import * as Joi from "joi";
import * as _ from "lodash";
import { IUser, User } from "../model/interfaces";
import { InsertOneWriteOpResult } from "mongodb";
import { Db } from './mongo';
import { ObjectID } from "mongodb";
import { validation } from '../validations/validation';
import * as bcrypt from 'bcrypt';
import { validationError, serviceError } from '../../../helpers/util';
import GenericResponse from './genericResponse';



export default class UserRepository {
    private deletePassword = (elem => {
        delete elem.password;
        delete elem.temp_pw;
        return elem;
    });

    private getForUI = (elem: IUser, meId: any) => {
        if (!elem.settings) {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'followers', 'following', 'images', 'friends']);
        }
        if (elem.settings["profile"] == "private") {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'images']);
        }
        else if (elem.settings["profile"] == "friends" && !elem.following.every(userId => userId === meId)) {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'images']);
        }
        else if (elem.settings["profile"] == "friends") {
            if (elem.settings["following"] == "private") {
                return _.pick(elem, ['_id', 'firstName', 'lastName', 'images', 'followers']);
            }
            else
                return _.pick(elem, ['_id', 'firstName', 'lastName', 'images', 'followers', 'following']);
        }
        //public profile
        else if (elem.settings["following"] == "private") {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'followers', 'images']);
        }
        else if (elem.settings["following"] == "friends" && !elem["following"].every(userId => userId === meId)) {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'followers', 'images']);
        }
        else {
            return _.pick(elem, ['_id', 'firstName', 'lastName', 'followers', 'following', 'images', 'friends']);
        }
    };

    private generatePasswordToken = (password) => {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return reject(err);
                }
                bcrypt.hash(password, salt, null, (err, hash) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(hash);
                });
            });
        });
    };

    private comparePassword = (plain, password) => {
        return new Promise((resolve, reject) => {
            if (!plain || !password) {
                return reject('wrong_password');
            }
            bcrypt.compare(plain, password, (err, res) => {
                if (err) {
                    return reject(err);
                }
                if (!res) {
                    return reject('wrong_password');
                }
                return resolve();
            });
        });
    };

    private make_passwd = (length) => {
        let a = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
        let index = (Math.random() * (a.length - 1)).toFixed(0);
        return length > 0 ? a[index] + this.make_passwd(length - 1) : '';
    };

   
    changePassword = (message, next) => {
        Joi.validate(message.data, validation.changePwd, (err, user) => {
            if (err) {
                return validationError(err, 'Change password service', null);
            }

            Db.findUserById(user.user_id)
                .then(res => this.comparePassword(user.old_password, res.password))
                .then(() => this.generatePasswordToken(user.new_password))
                .then((hash: string) => Db.changePassword(user.user_id, hash))
                .then(() => next(null, { data: { ok: 'true' } }))
                .catch(err => {
                    if (err.message === 'not found') {
                        return next(null, { err: { msg: 'NOT_FOUND', detail: 'User not found' } });
                    }
                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        return next(null, { err: { msg: 'INVALID_ID', detail: 'Invalid user id' } });
                    }
                    if (err === 'wrong_password') {
                        return next(null, { err: { msg: 'LOGIN_FAILED', detail: 'Wrong password' } });
                    }
                    return serviceError(err, 'change password service', next);
                });
        });
    };

    addBackgroundImageToUser = (message, next) => {
        Joi.validate(message.data, validation.addImage, (err, data) => {
            if (err) {
                return validationError(err, 'add image to user service', next);
            }
            Db.addImageToUser(data.user_id, data.images)
                .then((dbValue: any) => this.deletePassword(dbValue.value))
                .then(user => next(null, { data: user }))
                .catch(err => serviceError(err, 'Add image to user service', next));
        });
    };

    addImageToUser = (message, next) => {
        Joi.validate(message.data, validation.addImage, (err, data) => {
            if (err) {
                return validationError(err, 'add image to user service', next);
            }
            Db.addImageToUser(data.user_id, data.images)
                .then((dbValue: any) => this.deletePassword(dbValue.value))
                .then(user => next(null, { data: user }))
                .catch(err => serviceError(err, 'Add image to user service', next));
        });

    };

    addBgImageToUser = (message, next) => {
        Joi.validate(message.data, validation.addBgImage, (err, data) => {
            if (err) {
                return validationError(err, 'add bd image to user service', next);
            }
            Db.addBgImageToUser(data.user_id, data.bgimages)
                .then((dbValue: any) => this.deletePassword(dbValue.value))
                .then(user => {
                    return next(null, { data: user })
                })
                .catch(err => serviceError(err, 'Add image to user service', next));
        });

    };


    follow = (param) => {
        Joi.validate(param, validation.follow, (err, validatedData) => {
            
            if (err) {
                let result = new GenericResponse(false);
                result.addError(null,err.message);
                return result;
            }

            // don't follow yourself
            if (validatedData.user_id === validatedData.follow_id) {
                let result = new GenericResponse(false);
                result.addError(null,'Can\'t follow yourself');
                return result;
            }

            Db.findUserById(validatedData.follow_id)
                .then(() => Db.updateFollow(validatedData.user_id, validatedData.follow_id, false))
                .then((response: any) => {
                    this.deletePassword(response.value);
                    let result = new GenericResponse(true);
                    return result;
                })
                //.then(user => next(null, { data: user }))
                .catch(err => {

                    if (err.message === 'not found') {
                        let result = new GenericResponse(false);
                        result.addError(null,'User not found');
                        return result;
                    }

                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        let result = new GenericResponse(false);
                        result.addError(null,'Invalid user id');
                        return result;

                    }

                    let result = new GenericResponse(false);
                    result.addError(null,err.message);
                    return result;
                });
        });
    };

    unFollow = (param) => {
        Joi.validate(param, validation.follow, (err, validatedData) => {
            if (err) {
                let result = new GenericResponse(false);
                result.addError(null,err.message);
                return result;
            }
            if (validatedData.user_id === validatedData.follow_id) {
                let result = new GenericResponse(false);
                result.addError(null,'Can\'t unfollow yourself');
                return result;
            }
            Db.findUserById(validatedData.follow_id)
                .then(() => Db.updateFollow(validatedData.user_id, validatedData.follow_id, true))
                .then(response => {
                    this.deletePassword(response.value);
                    let result = new GenericResponse(true);
                    return true;
                })
                //.then(user => next(null, { data: user }))
                .catch(err => {
                    if (err.message === 'not found') {
                        let result = new GenericResponse(false);
                        result.addError(null,'User not found');
                        return result;
                    }
                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        let result = new GenericResponse(false);
                        result.addError(null,'Invalid user id');
                        return result;
                    }

                    let result = new GenericResponse(false);
                    result.addError(null,err);
                    return result;
                });
        });
    };

    getFollowers = (message, next) => {
        Joi.validate(message.data, validation.getUser, (err, user) => {
            if (err) {
                return validationError(err, 'get follower service ', next);
            }
            
            /*
            Promise.all([ksocsafeObjectId(message.data.userId), Db.getFollowersByUserId(user.user_id)])
                .then((ids: [string, any[]]) => ids[1].map(user => this.getForUI(user, ids[0])))
                .then(follower => { next(null, { data: follower }) })
                .catch(err => serviceError(err, 'Get Follower service', next));
                */
        });
    };

    getFollowing = (message, next) => {
        Joi.validate(message.data, validation.getFollowing, (err, data) => {

            if (err) {
                return validationError(err, 'get following service ', next);
            }

            Db.getFollowingByUserId(data.user_id)
                .then((followingIds: string[]) => Db.findUsersById(followingIds))
                .then(following => following.map(user => this.getForUI(user, message.data.user_id)))
                .then(users => next(null, { data: users }))
                .catch(err => {
                    if (err.message === 'not found') {
                        return next(null, { err: { msg: 'NOT_FOUND', detail: 'User not found' } });
                    }
                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        return next(null, { err: { msg: 'INVALID_ID', detail: 'Invalid user id' } });
                    }
                    return serviceError(err, 'get following service', next);
                });
        });

    };

    getUserByIdDeprecated = (message, next) => {
        //log.warn('Deprecated Pattern called', {message: message});
        this.getUserById(message, next);
    };

    getAllUsersById = (message, next) => {
        Joi.validate(message.data, validation.idArray, (err, data) => {

            if (err) {
                return validationError(err, 'get user by id service ', next);
            }

            Db.findUserById(data.user_ids)
                .then(user => {
                    return this.getForUI(user, message.requesting_user_id)
                })
                .then(user => {
                    next(null, { data: user })
                })
                .catch(err => {
                    if (err.message === 'not found') {
                        return next(null, { err: { msg: 'NOT_FOUND', detail: 'User not found' } });
                    }
                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        return next(null, { err: { msg: 'INVALID_ID', detail: 'Invalid user id' } });
                    }
                    return serviceError(err, 'get user by id service', next);
                });
        });
    };

    getUserById = (message, next) => {
        Joi.validate(message.data, validation.getUser, (err, currentuser) => {

            if (err) {
                return validationError(err, 'get user by id service ', next);
            }

            Db.findUserById(currentuser.user_id)
                .then(user => {
                    if (currentuser.user_id == message.requesting_user_id) {
                        return this.deletePassword(user)
                    }
                    else {
                        return this.getForUI(user, message.requesting_user_id)
                    }
                }

                )
                .then(user => {
                    next(null, { data: user })
                })
                .catch(err => {
                    if (err.message === 'not found') {
                        return next(null, { err: { msg: 'NOT_FOUND', detail: 'User not found' } });
                    }
                    if (err.message === 'Invalid id' || err.message === 'Invalid user_id') {
                        return next(null, { err: { msg: 'INVALID_ID', detail: 'Invalid user id' } });
                    }
                    return serviceError(err, 'get user by id service', next);
                });
        });
    };

    getUserByMail = (message, next) => {
        Joi.validate(message.data, validation.getUserByMail, (err, user) => {

            if (err) {
                return validationError(err, 'get user by id service ', next);
            }

            Db.findUserByMail(user.mail.toLowerCase())
                .then(user => {
                    if (!user) {
                        throw new Error('not found');
                    }

                    return this.deletePassword(user);
                })
                .then(user => next(null, { data: user }))
                .catch(err => {
                    if (err.message === 'not found') {
                        return next(null, { err: { msg: 'NOT_FOUND', detail: 'User not found' } });
                    }
                    return serviceError(err, 'get user by id service', next);
                });
        });
    };

    getUserInfo = (message, next) => {
        Db.getUserInfo(message.data.userIds)
            .then(users => {
                console.log(users);
                return users.map(user => this.getForUI(user, message.data.requesting_user_id));
            })
            .then(users => next(null, { data: users }))
            .catch(err => {
                return serviceError(err, 'get all user service', next);
            });
    }

    getAllUserExceptMe = (message, next) => {
        Db.getFollowingByUserId(message.data.userId)
            .then((ids: string[]) => {
                Db.getAllUserExcept([...ids, message.data.userId])
                    .then(users => {
                        console.log(users);
                        return users.map(user => this.getForUI(user, message.data.userId));
                    })
                    .then(users => next(null, { data: users }))
                    .catch(err => {
                        return serviceError(err, 'get all user service', next);
                    });
            })
    };

    getFollowersCountByUserId = (message, next) => {
        Joi.validate(message.data, validation.getUser, (err, user) => {
            if (err) {
                return validationError(err, 'get followers count by user id service ', next);
            }
            Db.getFollowersCountByUserId(user.user_id)
                .then(count => next(null, { count: count }))
                .catch(err => serviceError(err, 'get user by id service', next));
        });
    };

    getSettings = (message, next) => {
        Joi.validate(message.data, validation.getUser, (err, user) => {

            if (err) {
                return validationError(err, 'get settings by user id service ', next);
            }

            Db.getSettings(user.user_id)
                .then(settings =>
                    next(null, { data: settings }))
                .catch(err =>
                    serviceError(err, 'get user settings', next));
        });
    };


    updateSettings = (message, next) => {
        Joi.validate(message.data, validation.upateSettings, (err, data) => {
            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }

            Db.updateSettings(data.user_id, data.settings)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    };

    // Remove validation and change data.personalContact -> personalInfo
    updatePersonalContact  = (message, next) => {
        Joi.validate(message.data, (err, data) => {
            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }
            Db.updatePersonalContact(data.user_id, data.personalInfo)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }
    //  updatePersonalContact  = (message, next) => {
    //     Joi.validate(message.data, validation.personalContact, (err, data) => {
    //         if (err) {
    //             return validationError(err, 'update settings by user id service ', next);
    //         }
    //         Db.updatePersonalContact(data.user_id, data.personalContact)
    //             .then(next(null, { data: { ok: 'true' } }))
    //             .catch(err => serviceError(err, 'update user settings', next));
    //     });
    // }

    updatePersonalInfo  = (message, next) => {
        Joi.validate(message.data, (err, data) => {
            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }
            Db.updatePersonalInfo(data.user_id, data.personalInfo)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }

    updateCustomUrls = (message, next) => {
        Joi.validate(message.data, (err, data) => {
            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }
            Db.updateSettings(data.user_id, data.customUrls)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }

    updateUserPlacesHistory = (message, next) => {
        Joi.validate(message.data, (err, data) => {

            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }

            Db.updateUserPlacesHistory(data.user_id, data.placesHistory)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }

    updateUserWorkHistory = (message, next) => {
        Joi.validate(message.data, (err, data) => {

            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }

            Db.updateUserWorkHistory(data.user_id, data)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }

    updateUserStory = (message, next) => {
        Joi.validate(message.data, (err, data) => {

            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }

            Db.updateUserStory(data.user_id, data.userStory)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }

    updateUserEducationHistory = (message, next) => {
        Joi.validate(message.data, (err, data) => {

            if (err) {
                return validationError(err, 'update settings by user id service ', next);
            }

             Db.updateUserEducationHistory(data.user_id, data)
                .then(next(null, { data: { ok: 'true' } }))
                .catch(err => serviceError(err, 'update user settings', next));
        });
    }
}


