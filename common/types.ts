
import { ObjectID } from "mongodb";
export interface IEntity {
    _id: ObjectID;
    createdDate: Date;
    updatedAt: Date;
}
