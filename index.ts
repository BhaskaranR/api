import 'babel-polyfill';
import 'source-map-support/register'

import * as express from 'express';
import * as session from 'express-session';
import * as Grant from 'grant-express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as config from 'config';
import { invert, isString, merge } from 'lodash';
import { graphiqlExpress, graphqlExpress } from 'graphql-server-express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { apolloUploadExpress } from 'apollo-upload-server';
import { Engine } from 'apollo-engine';
import { createServer } from 'http';
import { initAccounts } from './accounts';
import { initializeOAuthResolver } from './oauth/oauth-service';
import { GRANT_PATH, grantConfig } from './oauth/grant-config';
import { AccountsServer } from '@accounts/server';
import * as path from 'path';
import * as dataloader from 'dataloader';
import { addMockFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import { createAccountsGraphQL, accountsContext } from '@accounts/graphql-api';
import * as mergeGraphqlSchemas from 'merge-graphql-schemas';
import * as mongolinks from './db/mongo-connector';
import * as DataLoader from 'dataloader';
import {context} from './interfaces/context';


import User from './model/user';
import { Post } from './model/post';
import { Comments } from './model/comments';
import { Business } from './model/business';
import { Search } from './model/search';
import { Device } from './model/device';
import { ActionRewards } from './model/rewards';
import { Reporter } from './model/reporter';
import { userBatcher,  commentCountBatcher } from './model/batchers';
import { setupDb } from './db/mongo-connector';

const PORT = 3000;
const WS_GQL_PATH = '/subscriptions';
const STATIC_SERVER = 'http://localhost:3000';

const ENGINE_API_KEY: string = config.get("apolloEngineKey");
const fileLoader = mergeGraphqlSchemas.fileLoader;
const mergeTypes = mergeGraphqlSchemas.mergeTypes;
const mergeResolvers = mergeGraphqlSchemas.mergeResolvers;

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schemas'), { recursive: true, extensions: ['.graphql'] }))
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers')));

function createSchemeWithAccounts(accountsServer) {
  const accountsGraphQL = createAccountsGraphQL(accountsServer,  { extend: true } );

  const mockResolvers = {
    Query: {},
    Mutation: {}
  };
  const resolversWithAccounts = merge(accountsGraphQL.resolvers, resolvers);
  
  const executableSchema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers: resolversWithAccounts,
    schemaDirectives: {
      ...accountsGraphQL.schemaDirectives,
    },
    logger: { log: (e) => console.log(e) },
  });

  return executableSchema;
}


async function main() {
  const app = express();
  app.use(cors());
  const accounts = await initAccounts();
  await setupDb();
  app.use(session({
    secret: 'grant',
    resave: true,
    saveUninitialized: true,
  }));

  app.use(bodyParser.urlencoded({ extended: true }));

  const grant = new Grant(grantConfig);

  app.use(GRANT_PATH, grant);

  app.get(`${GRANT_PATH}/handle_facebook_callback`, function (req, res) {
    const accessToken = req.query.access_token;
    res.redirect(`${STATIC_SERVER}/login?service=facebook&access_token=${accessToken}`);
  });

  app.get(`${GRANT_PATH}/handle_google_callback`, function (req, res) {
    const accessToken = req.query.access_token;
    res.redirect(`${STATIC_SERVER}/login?service=google&access_token=${accessToken}`);
  });

  initializeOAuthResolver(accounts);

  const schema = createSchemeWithAccounts(accounts);

  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const userModel = new User();
  const commentModel = new Comments();

  const models: context = {
    userModel: userModel,
    postModel: new Post(),
    commentModel: commentModel,
    bizModel: new Business(),
    searchModel: new Search(),
    deviceModel: new Device(),
    reporterModel: new Reporter(),
    rewardsModel: new ActionRewards(),
    commentsCountLoader: new DataLoader(ids => commentCountBatcher(ids, commentModel),{
      cache: false
    }),
    userLoader: new DataLoader(ids => userBatcher(ids, userModel)),
  }

  app.use(
    '/graphql',
    bodyParser.json(),
    apolloUploadExpress(),
    graphqlExpress((request) => {
      return {
        schema,
        tracing: true,
        cacheControl: true,
        context: Object.assign({},
          models,
          accountsContext(request, "authorization")),
        debug: true
      }
    }));

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: 'ws://localhost:3000/subscriptions',
  }));


  app.post('/upload', (req, res) => {
    /*if (req.files) {
      userModel.s3fileUpload(req.files);
    }
    */
  });

  const server = createServer(app);

  new SubscriptionServer(
    {
      schema,
      execute,
      subscribe,
      onConnect: async ({authToken, refreshToken}, webSocket) => {
        if (authToken && refreshToken) {
          try {
            const user = await accounts.refreshTokens(authToken, refreshToken, "", "",);
            if (user === null) {
              throw new Error('Invalid or expired token!');
            }
            return Object.assign(models, { user: user });
          } catch (err) {
            const newTokens: any = await accounts.refreshTokens(authToken, refreshToken, "", "", ); //todo get ip and useragent
            return Object.assign(models, { user: newTokens.user });
          }
        }
        return models;
      },
    },
    {
      path: WS_GQL_PATH,
      server,
    }
  );

  server.listen(PORT, () => {
    console.log('server running on: ' + PORT);
  });
}

main().catch((e) => console.error('Failed to start server', e));
