

import { Search } from '../model/search';

export default {
  Query: {
    search: async (_, { text }, { searchModel }: { searchModel: Search }) => {
      return await searchModel.search(text);
    },
    suggest: async (_, { text }, { searchModel }: { searchModel: Search }) => {
      return await searchModel.suggest(text);
    }
  }
}
