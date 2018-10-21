


export interface PhotoDetails {
    xlarge: string;
    large: string;
    normal: string;
    small: string;
    ext: string;
}

export interface UserAction {
    entity: User;
    action: string;
}


export interface UserGroup {
    _id: string;
    icon: string;
    name: string;
}

export interface Email {
    email: string;
    emailtype: string;
}
export interface Phone {
    phoneNumber: string;
    phoneType: string;
}
export interface Address {
    address: string;
}
export interface PersonalContact {
    website: Email[];
    phonenumber: Phone[];
    address: Address[];
    visibility: string;
}


export interface PersonalInfo {
    gender: string;
    birthday: string;
    occupation: string;
    visibility: string;
}
export interface Urls {
    title: string;
    url: string;
}
export interface  CustomUrls {
    customUrls: Urls[];
    visibility: string;
}

export interface Places {
    currentPlace: string;
    livedPlaces: string[];
}
export interface PlacesHistory {
    placesHistory: Places[];
    visibility: string;
}
export interface Work {
     companyName: string;
     title: string;
     startDate: number;
     endDate: number;
     description: string;
}
export interface WorkHistory {
    workHistory: Work[];
    visibility: string;
}
export interface EducationHistory {
    educationHistory : Education[];
    visibility: string;
}

export interface Story {
    story: string;
    tagline: string;
}

export interface Education {
    schoolName: string;
    major: string;
    year: number;
    endYear: number;
    description: string;
}

export interface Profile {
    fbId?: string;
    googlePlusId?: string;
    firstName: string;
    lastName: string;
    userName: string;
    avatar: string;
    referredBy: string;
    //strategy: string;
    images: PhotoDetails;
    personalContact: PersonalContact;
    userCustomUrls: CustomUrls;
    placesHistory: PlacesHistory;
    workHistory: WorkHistory;
    educationHistory: EducationHistory[];
    userStory: Story;
    backgroundImage: PhotoDetails;
}


export interface Settings {
    notifyposts: string;
    listposts: string;
    commentposts: string;
    profile: string;
    following: string;
    enablenotifications: boolean;
    enableemail: boolean;
}

export interface emailAddress {
    address: string
}

export interface User {
    id: string;
    profile: Profile;
    email: emailAddress[];
    profileSet: boolean;
    followers: User[];
    following: string[];
    followersCount: number;
    followingCount: number;
    postsCount: number;
    createdAt: string | Date;
    modifiedAt: string | Date;
    settings: any | Settings;
    followingBusiness: string[];
    mybusinesses: string[];
}