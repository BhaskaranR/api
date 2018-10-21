import * as boom from 'boom';
import * as Wreck from 'wreck';
import * as config from 'config';
import { clone, setupSenecaPattern } from '../../helpers/util';
import { unwrap } from '../../helpers/responseHelper';
import { ThumboUrl } from '../../helpers/thumbor/thumborUrlBuilder';

const basicPin = {
    role: 'user'
};

const mailerPin = {
    role: 'mailer'
}
const vapidkeyDetails = "BEMHvDSNah5TnwfBzY5kZc8l4ax7fmLaoHg9lP8eDJ7wdJldEFoRg3TC46-oiyUKg3R9gms-zNY5BbNsotPC2VE";

export const follow = (request, reply) => {
    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'follow';

    let senecaAct = setupSenecaPattern(pattern, {
        follow_id: request.params.follow_id,
        user_id: pattern.requesting_user_id
    }, basicPin);

    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));

    let notificationAct = clone(senecaAct);
    notificationAct.cmd = 'notify';
    notificationAct.role = 'notifications';
    notificationAct.entity = 'newFollower';
    request.server.pact(notificationAct);

};

export const unfollow = (request, reply) => {
    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'unfollow';

    let senecaAct = setupSenecaPattern(pattern, {
        follow_id: request.params.follow_id,
        user_id: pattern.requesting_user_id
    }, basicPin);

    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));

};

export const getFollowingUsersByUserId = (request, reply, userId) => {
    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'getfollowing';

    let senecaAct = setupSenecaPattern(pattern, {
        user_id: userId
    }, basicPin);

    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const getMyFollowing = (request, reply) => {
    getFollowingUsersByUserId(request, reply, request.basicSenecaPattern.requesting_user_id);
};

export const getFollowingByUserId = (request, reply) => {
    getFollowingUsersByUserId(request, reply, request.params.userId);
};


export const getFollowerByUserId = (request, reply, userId) => {
    request.basicSenecaPattern.cmd = 'getfollowers';

    let senecaAct = setupSenecaPattern(request.basicSenecaPattern, {
        user_id: userId || request.requestingUserId
    }, basicPin);

    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const getMyFollower = (request, reply) => {

    getFollowerByUserId(request, reply, request.basicSenecaPattern.requesting_user_id);

};
export const getFollowerByUser = (request, reply) => {
    getFollowerByUserId(request, reply, request.params.userId);
};



export const getUserById = (request, reply, useRequestingUser) => {
    let options: any = {};
    let userId = request.params.userId;
    let basicPost;
    let basicFollower;
    let basicBusiness;
    let senecaActPostCount;
    let senecaActFollowerCount;
    let deviceId = request.basicSenecaPattern.requesting_device_id
    let basicUser = clone(request.basicSenecaPattern);

    if (request.query.count) {
        options.countFollowers = request.query.count.includes('followers');
        options.countPosts = request.query.count.includes('posts');
        options.getbiz = request.query.count.includes('biz');
    }

    if (useRequestingUser) {
        userId = request.basicSenecaPattern.requesting_user_id;
    }

    if (!userId || userId === 'unknown') {
        return reply(boom.badRequest('No user id found in cookie (or param)'));
    }

    let postCountPromise = true;
    let followersCountPromise = true;
    let businessPromise = true;

    basicUser.cmd = 'getUser';
    basicUser.by = 'id';

    let senecaActUser = setupSenecaPattern(basicUser, {
        user_id: userId
    }, basicPin);

    if (options.countPosts) {
        basicPost = clone(request.basicSenecaPattern);

        basicPost.cmd = 'count';
        basicPost.entity = 'post';
        basicPost.by = 'userId';

        senecaActPostCount = setupSenecaPattern(basicPost, {
            user_id: userId
        }, { role: 'posts' });

        // override bool with promise
        postCountPromise = request.server.pact(senecaActPostCount);
    }

    if (options.countFollowers) {
        basicFollower = clone(request.basicSenecaPattern);

        basicFollower.cmd = 'count';
        basicFollower.entity = 'follower';
        basicFollower.by = 'userId';

        senecaActFollowerCount = setupSenecaPattern(basicFollower, {
            user_id: userId
        }, basicPin);

        // override bool with promise
        followersCountPromise = request.server.pact(senecaActFollowerCount);
    }

    if (options.getbiz) {
        basicBusiness = clone(request.basicSenecaPattern);
        basicBusiness.cmd = 'getbizbyuserid';
        let senecaActBiz = setupSenecaPattern(basicBusiness, {
            user_id: userId
        }, {
                role: 'business'
            });

        businessPromise = request.server.pact(senecaActBiz)
    }

    Promise.all([request.server.pact(senecaActUser), postCountPromise, followersCountPromise, businessPromise])
        .then(result => {
            let user = unwrap(result[0]);

            if (!user.isBoom) {
                if (options.countPosts) {
                    user.postsCount = result[1]["count"] || 0;
                }
                if (options.countFollowers) {
                    user.followersCount = result[2]["count"] || 0;
                }
            }
            let userbiz = unwrap(result[3]);
            if (userbiz) {
                user.mybusinesses = userbiz;
            }

            // HACK: add default user images
            if (!user.images || !user.images.normal || !user.images.small) {
                user.images = {
                    normal: '',
                    small: '',
                    large: ''
                };
            }

            if (!user.backgroundImage || !user.backgroundImage.normal || !user.backgroundImage.small) {
                user.backgroundImage = {
                    normal: '',
                    small: '',
                    large: ''
                };
            }

            return reply(user);
        })
        .catch(error => {
            reply(boom.badImplementation(error))
        });
}


export const userImageUploadResponse =(err, res, request, reply) => {
    if (err) {
        return reply(boom.badRequest());
    }
    // read response
    Wreck.read(res, { json: true }, (err, response) => {
        if (err) {
            return reply(boom.badRequest());
        }
        if (response.statusCode >= 400) {
            return reply(boom.create(response.statusCode, response.message, response.error));
        }
        let pattern = clone(request.basicSenecaPattern);
        pattern.cmd = 'add';
        pattern.entity = 'image';
        let message: any = { user_id: getUserId(request.auth) };
        if (request.path === "/users/bgimage") {
            pattern.entity = 'bgimage';
            message.bgimages = {
                small: ThumboUrl.smallPhoto(response.file.key),
                normal: ThumboUrl.normalPhoto(response.file.key),
                large: ThumboUrl.largePhoto(response.file.key),
                verylarge: ThumboUrl.verylargePhoto(response.file.key)
            };
        }
        else {
            pattern.entity = 'image';
            message.images = {
                normal: ThumboUrl.smallAvatarImage(response.file.key),
                small: ThumboUrl.largeAvatarImage(response.file.key)
            };
        }
        let senecaAct = setupSenecaPattern(pattern, message, basicPin);
        request.server.pact(senecaAct)
            .then(unwrap)
            .then(res => {
                reply(res);
                if (res.isBoom) {
                    // remove the uploaded image again by making an internal DELETE request
                 /*   Wreck.delete(config.get("env.host.karmasoc-mediaserve") +
                        config.get('env.port.karmasoc-mediaserve') + '/file/' + response.id, (err) => {
                            if (err) {
                                //log.error(err, 'Error Deleting file type ', { id: response.id });
                            }
                        });
                        */
                }
            })
            .catch(error => reply(boom.badImplementation(error)));
    });
}

export const userRegisterImageUploadRespone(err, res, request, reply) {
    reply(boom.notImplemented('Wait for it'));
}


export const getSettings = (request, reply) => {
    getSettingsByUserId(request, reply,
        request.basicSenecaPattern.requesting_user_id /*"57afd9d64e35a7000526b63b"*/);
};

export const getSettingsByUserId = (request, reply, userId) => {

    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'getSettings';

    let senecaAct = setupSenecaPattern(pattern, {
        user_id: userId
    }, basicPin);

    request.server.pact(senecaAct)
        .then(res =>
            reply(unwrap(res)))
        .catch(error =>
            reply(boom.badImplementation(error)));
};

export const updateSettings = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        settings: request.payload.settings
    };
    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateSettings';
    let senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updatePersonalInfo = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        personalInfo: request.payload
    };
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updatePersonalInfo';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updatePersonalContact = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        personalInfo: request.payload
    };
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updatePersonalContact';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updateUserCustomUrl = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        customUrls: request.payload
    };
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateCustomUrls';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updateUserPlacesHistory = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        placesHistory: request.payload
    }

    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateUserPlacesHistory';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updateUserEducationHistory = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        educationHistory: request.payload.educationHistory,
        visibility: request.payload.visibility
    };
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateUserEducationHistory';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updateUserWorkHistory = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        workHistory: request.payload.workHistory,
        visibility: request.payload.visibility
    }
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateUserWorkHistory';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const updateUserStory = (request, reply) => {
    const data = {
        user_id: request.basicSenecaPattern.requesting_user_id,
        story: request.payload
    };
    const pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'updateUserStory';
    const senecaAct = setupSenecaPattern(pattern, data, basicPin);
    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};

export const getAllUsers = (request, reply) => {
    let pattern = clone(request.basicSenecaPattern);
    pattern.cmd = 'getAllUserExceptMe';

    let senecaAct = setupSenecaPattern(pattern,
        {
            userId: request.basicSenecaPattern.requesting_user_id
        }, basicPin);

    request.server.pact(senecaAct)
        .then(res => reply(unwrap(res)))
        .catch(error => reply(boom.badImplementation(error)));
};
