import { PhotoDetails } from "./user";

export enum like {
    like,
    dislike,
    neutral
}

export interface favor {
    postId: string;
    favor: string
}

export interface favoredBy extends favor {
    userId: string;
    userFirstName: string;
    userLastName: string;
    userImgNormal: string;
    userImgSmall: string;
}

export enum PostType {
    text,
    file,
    geotag
}

export enum AccessType {
    public,
    private,
    friends
}

export enum Bookmark {
    mypage,
    fun,
    learn
}

export interface Geotag {
    type: string;
    coordinates: { lat: string, long: string };
    title: string;
    placeId: string;
}

export interface FileDetails {
    id: string;
    //name: string;
    thumbnail: PhotoDetails;
}

export interface PostInput {
    clientId: string;
    text: string;
    geotag: Geotag;
    mentions: string[];
    bizId?: string;
}



export interface Post {
    _id?: string;
    bizId?: string;
    text?: string;
    geotag?: Geotag;
    photos?: PhotoDetails[];
    withFriends?: string[];
    postType?: string;
    access?: AccessType;
    shares?: string[];
    mentions?: string;
    likes?: { userId: string, like: string }[];
    userId?: string;
    userFirstName?: string;
    userLastName?: string;
    userImgNormal?: string;
    userImgSmall?: string;
    bookmarks?: { userId: string, bookMark: Bookmark[] };
    fileUrl?: FileDetails[];
    comments?: postComment[];
    contentLoaded?: boolean,
    loadedAfterBootstrap?: boolean,
    featured?: boolean
    modified_date?: string;
    create_date?: string;
}


export interface postComment {
    _id: string;
    postId: string;
    text?: string;
    photos?: PhotoDetails[];
    withFriends?: string[];
    postType?: string;
    mentions?: string;
    likes?: string[];
    userId: string;
    userFirstName?: string;
    userLastName?: string;
    userImgNormal?: string;
    userImgSmall?: string;
    fileUrl?: FileDetails[];
    modified_date?: string;
    create_date?: string;
}


export interface Posts {
    ids: string[],
    entities: { [id: string]: Post };
    selectedPostId: string | null,
    loadingPostPreviews: boolean,
    currentAPIPage: number,
    allPostPreviewsLoaded: boolean
}

export interface SharePost {
    userId: string;
    postId: string;
    impression: Impression;
}

export interface Impression {
    id: string;
    postId: string;
    text: string;
    imageUrl: PhotoDetails;
    videoUrl: string;
    userId: string;
}

export interface Favorites {
    favorites: number;
    added: boolean;
    updated: boolean;
    removed: boolean;
};


export declare type feedType  = { 
    Home
    Photos
    Videos
    Fun
    Learn
  }

export declare type feedArgs = { feedType: feedType, cursor: string, count: number };







export enum postType{
    text,
    image,
    audio,
    video,
    geotag
}


export enum accessType{
    public,
    private,
    friends
}

export enum bookmark{
    mypage,
    fun,
    learn
}

export interface geomap{
    type : string;
    coordinates: {lat: string, long: string},
    city : {title: string, placeId: string}
}

export interface fileUrl {
    id : string;
    name: string;
}

export interface post
{
    text?: string;
    geomap?: geomap;
    videoUrl?: string;
    audioUrl?: string;
    photos?: photoUrl[];
    withFriends?: string[];
    postType?: postType;
    access?: accessType;
    userId: string;
    shares?: string[];
    likes?: string[]
    bookmarks?: bookmark[]
    fileUrl? : fileUrl
}

export interface postdb{
    text?: string;
    geomap?: geomap;
    fileUrl?: {id: string, name: string};
    photos?: photoUrlDb[];
    withFriends?: string[];
    postType?: postType;
    access?: accessType;
    userId: string;
    shares?: string[];
    likes?: string[]
    bookmarks?: bookmark[]
}

export interface sharePost{
    userId: string;
    postId: string;
    impression: impression;
}

export interface impression{
    id: string;
    postId: string;
    text: string;
    imageUrl: photoUrl;
    videoUrl: string;
    userId: string;
}

export interface photoUrl{
    xlarge: string;
    large: string;
    normal: string;
    small:  string;
}


export interface photoUrlDb extends  photoUrl{
    name: string;
    path: string;
}

export interface UserPostService{
    //post and comment
    addPost(post: post) : post;
    editPost(post: post) : boolean;
    deletePost(postId : string) : boolean;
    favorPost(postId : string, like : like): boolean;
    postImpression(postId: string, impression: impression): boolean;
    editImpression(impression: impression) : boolean;
    deleteImpression(impressionId: string) : boolean;
    //bookmark
    addPostWithBookMark(post: post, bookMark: bookmark[]) : post;
    bookMarkPost(post:number, bookMark:bookmark[]);
    //retrieval
    getPostsForUser(userId: string,  index : number, count : number, bookMark?: bookmark) : post[];//pagination
    getImagePostsForUser(userId: string, index : number, count : number, bookMark?: bookmark): post[];
    getVideoPostsForUser(userId: string, index : number, count : number, bookMark?: bookmark): post[];
    getImpressionsForPost(postId: string, index : number, count) : impression[]; //pagination
    getTrendingPosts(index : number, count : number, bookMark?: bookmark): post[];
    getTrendingImages(index : number, count : number, bookMark?: bookmark): post[];
    getTrendingVideos(index : number, count : number, bookMark?: bookmark): post[];
    //share posts
    sharePost(post: sharePost): post;
    shareToFaceBook(post: post); //enabled
    shareToGooglePlus(post:post);
    //notify posts
    notifyPosts(userId : string): post;//socket.io implementation will do it.. next phase
}
  