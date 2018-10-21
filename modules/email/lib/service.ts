import * as bluebird from 'bluebird';
import { unwrap } from '../../../helpers/responseHelper';

export const getUserByMail = (userMail, seneca) => {
    let act : any= bluebird.promisify(seneca.act, {context: seneca});
    return act({
        role: 'user',
        cmd: 'getUser',
        by: 'mail',
        data: {
            mail: userMail
        }
    }).then(unwrap);
}
