import AccountsServer from '@accounts/server';
import MongoDBInterface from '@accounts/mongo';
import { AccountsPassword } from '@accounts/password';
import { DatabaseManager } from '@accounts/database-manager';
import { getMongoClient } from './db/mongo-connector';
import * as mailgun from 'mailgun-js';
import * as config from 'config';

const gun = mailgun({ apiKey: config.get('mailGunApiKey'), domain: config.get('mailGunDomain') });


export const initAccounts = async () => {
  let mongoAdapter = null;
  const db = await getMongoClient();
  const userStorage = new MongoDBInterface(db.db('userdb'));
  const accountsDb = new DatabaseManager({
    sessionStorage: userStorage,
    userStorage,
  });


  const as = new AccountsServer({
    db: accountsDb,
    tokenSecret: "instant karma's gonna get ya",
    tokenConfigs: {
      accessToken: {
        expiresIn: '3d',
      },
      refreshToken: {
        expiresIn: '30d',
      }
    },
    sendMail: (mail) => {
      return new Promise((resolve, reject) => {
        gun.messages().send(mail, err => {
          if (err) {
            reject(err);
          }
          resolve();
        });
      });
    },
    emailTemplates: {
      from: 'karmasoc <zengxiangxiang@gmail.com>',
      verifyEmail: {
        subject: (user: any) => `verify your account email ${user.profile.name}`,
        text: (user, url) => `To verify your account email please click on this link: ${url}`
      },
      resetPassword: {
        subject: (user: any) => `reset your account email ${user.profile.name}`,
        text: (user, url) => `To reset your account email please click on this link: ${url}`
      },
      enrollAccount: {
        subject: (user: any) => `enroll your account email ${user.profile.name}`,
        text: (user, url) => `To enroll your account email please click on this link: ${url}`
      }
    }
  }, {
      password: new AccountsPassword({
        passwordHashAlgorithm: "sha256"
      })
    })
  return as;
}