import { context } from '../interfaces/context';
export default {
    Mutation: {
        registerDevice: async (_, { deviceInput }, cntxt: context) => {
            cntxt.deviceModel.registerDevice(deviceInput);
        },
        unregisterDevice: async (_, { deviceInput }, cntxt: context) => {
            cntxt.deviceModel.unregisterDevice(deviceInput);
        }
    }
}
