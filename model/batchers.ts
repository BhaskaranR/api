import User from './user';
import { Comments } from './comments';

/*export const commentBatcher = async (ids, commentModel: Comments) => {
  const results = await commentModel.getCommentsByPostId(ids);
  const data = {};
  results.forEach((r) => {
    data[r.id] = r;
  });
  return ids.map(id => data[id]);
};
*/

export const commentCountBatcher = async (ids, commentModel: Comments) => {
  const results = await commentModel.getCommentsCountByPostId(ids);
  const data = {};
  results.forEach((r) => {
    data[r._id] = r;
  });
  return ids.map(id => data[id] !== undefined? data[id].count : 0 );
};

export const userBatcher = async (ids, userModel: User) => {
  const results = await userModel.findUsersByIds(ids);
  const data = {};
  results.forEach((r) => {
    data[r.id] = r;
  });
  return ids.map(id => data[id]);
};