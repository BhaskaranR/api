import  * as Boom from 'boom';
export const ERRORS = {
    'NOT_FOUND': Boom.notFound,
    'LOGIN_FAILED': Boom.unauthorized,
    'USER_EXISTS': Boom.conflict,
    'SELF_FOLLOW': Boom.badRequest,
    'MISSING_ID': Boom.notFound,
    'INVALID_ID': Boom.badRequest,
    'USER_NOT_FOUND': Boom.badRequest,
    'ILLEGAL_OPERATION': Boom.badRequest
};

export const unwrap = (serviceResponse) => {
    if (serviceResponse && !serviceResponse.err && serviceResponse.data) {
        return serviceResponse.data;
    }
    if (serviceResponse && serviceResponse.err) {
        let boom = ERRORS [serviceResponse.err.msg];
        if (!boom) {
            log.error('No boom object found for :', serviceResponse.err);
            return Boom.badImplementation(serviceResponse.err);
        }
        return boom(serviceResponse.err.detail);
    }
    return Boom.badImplementation();
};