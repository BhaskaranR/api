import * as boom from 'boom';
import * as util from '../../helpers/util';
import { unwrap } from '../../helpers/responseHelper';

let handler = {};
const basicPin = {
    role: 'user'
};

export default class DeviceController {
    static register = (request, reply) => {
        // setup pattern
        let pattern = util.clone(request.basicSenecaPattern);
        pattern.cmd = 'register';
        pattern.entity = 'device';
        const device = request.payload;
        device.user_id = request.basicSenecaPattern.requesting_user_id;
        const senecaAct = util.setupSenecaPattern(pattern, device, basicPin);
        request.server.pact(senecaAct)
            .then(unwrap)
            .then(result => {
                return reply({ message: 'device registered, karmasoc-cookie was set' })
                    .state('karmasoc', { device_id: result.deviceId }).code(201);
            })
            .catch(error => reply(boom.badImplementation(error)));
    }

    static unregister = (request, reply) => {
        const pattern = util.clone(request.basicSenecaPattern);
        pattern.cmd = 'unregister';
        pattern.entity = 'device';

        const device = request.payload;
        device.user_id = request.basicSenecaPattern.requesting_user_id;
        const senecaAct = util.setupSenecaPattern(pattern, device, basicPin);
        request.server.pact(senecaAct)
            .then((unwrap))
            .then(resulg => {
                return reply({message: 'device unregistered'})
            })
            .catch(error => reply(boom.badImplementation(error)));
    }
}
