import { OAuthResolver } from './oauth-resolver';
import {AccountsServer} from '@accounts/server';
import { getMongoClient } from '../db/mongo-connector';
import { AccountsPassword } from '@accounts/password';


const oauthResolver: OAuthResolver = new OAuthResolver();

export const getOAuthResolver = () => {
  return oauthResolver;
};

export const findUserByOAuthId = async (service: string, id) => {
  const mongoClient = await getMongoClient();
  const dbCollection = await mongoClient.collection('users');
  return await dbCollection.findOne({ [`profile.oauth.${service}`]: id });
};

export const addOAuthIdToUserProfile = async (accounts: AccountsServer, user, service: string, serviceId) => {
  accounts.setProfile(user.id, Object.assign({}, user.profile,
    {
      oauth: {
        ...user.profile.oauth,
        [service]: serviceId
      }
    }));
};

export const initializeOAuthResolver = (accounts: AccountsServer) => {
  oauthResolver.setServicesResolver({
    google: {
      url: 'https://www.googleapis.com/plus/v1/people/me?access_token=',
      userResolver: async (userData) => {
        let user = await findUserByOAuthId('google', userData.id);
        if (user) {
          user.id = user._id;
        }
        else {
          user = await accounts.findUserById(userData.emails[0].value);
        }

        if (user) {
          await addOAuthIdToUserProfile(accounts, user, 'google', userData.id);
        }
        else {
          const ap: any = accounts.getServices().password;
          const id = await ap.createUser({
            password:  "",
            username: userData.emails[0].value,
            email: userData.emails[0].value,
            profile: {
              name: userData.name.givenName + ' ' + userData.name.familyName,
              avatar: userData.image.url,
              oauth: {
                google: userData.id,
              }
            }
          });
          user = await accounts.findUserById(id);
        }
        return user;
      },
    },
  });
};
