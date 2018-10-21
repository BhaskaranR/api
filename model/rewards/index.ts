import { BusinessActionRewards } from './bizActionRewards';
import { PostActionRewards } from './postActionRewards';
import { UserActionRewards } from './userActionRewards';

export class ActionRewards{

    businessActionRewards: BusinessActionRewards;
    postActionRewards: PostActionRewards;
    userActionRewards: UserActionRewards;

    constructor() {
        this.businessActionRewards = new BusinessActionRewards();
        this.postActionRewards = new PostActionRewards();
        this.userActionRewards = new UserActionRewards();
    }
} 
