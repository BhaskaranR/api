import { Post } from "./post";
import { User } from "./user";
import { Notification} from "./notification";

export enum Events {
    newFollower,
    followApproved,
    postShared,
    postBookmarked,
    commentAdded,
    reactionAdded,
    rewardsUpdated
}

export interface PostEvent {
    event: Events
    post: Post
}

export interface UserEvent {
    event: Events,
    user?: User,
    notification: Notification
}