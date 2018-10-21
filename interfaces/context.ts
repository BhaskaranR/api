import User from '../model/user';
import { Post } from '../model/post';
import { Business } from '../model/business';
import {Comments} from '../model/comments';
import {Search} from '../model/search';
import {Device} from '../model/device';
import { Reporter } from '../model/reporter';
import { ActionRewards } from '../model/rewards';
import * as userInterface from './user';
import * as DataLoader from 'dataloader';

export interface context {
   userModel: User 
   postModel: Post
   bizModel: Business
   user?: userInterface.User
   commentModel: Comments
   searchModel: Search
   deviceModel: Device
   rewardsModel: ActionRewards
   reporterModel: Reporter
   commentsCountLoader: any
   userLoader: any
}