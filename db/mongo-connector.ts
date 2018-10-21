import { MongoClient, Db } from 'mongodb';

let mongoDB;
//change the mongo
const MONGO_URL = 'mongodb://localhost:27017/admin';

const initMongoClient = async (): Promise<Db> => {
  try {
    mongoDB = await MongoClient.connect(MONGO_URL);
  }
  catch (e) {
    console.error('cannot connect to db', e);
  }
  return mongoDB;
};


export const getMongoClient = async (): Promise<Db> => {
  if (!mongoDB) {
    await initMongoClient();
  }
  return mongoDB;
};

export const links = async () => {
  const db = await getMongoClient();
  return {
    users: db.db('userdb').collection('users'),
    posts: db.db('posts').collection('posts'),
    impressions: db.db('posts').collection('impressions'),
    business: db.db('business').collection('business'),
    geobiz: db.db('business').collection('geobiz'),
    device: db.db('posts').collection('device'),
    deactivatedUsers: db.db('userdb').collection('deactivatedUsers')
  }
}

export const setupDb = async() => {
  const db = await getMongoClient();
  const geobiz = db.db('business').collection('business').createIndex({ 'geotag.coordinates': '2dsphere' });
  const business = db.db('business').collection('geobiz').createIndex({ 'geotag.coordinates': '2dsphere' });
  return await Promise.all([geobiz, business]);
}
