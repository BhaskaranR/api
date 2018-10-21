interface IError{
    path:string | null,
    message:string | null
}

export default class GenericResponse {
    ok:boolean;
    errors:IError[] = [];

    constructor(ok:boolean){
        this.ok = ok;
    }

    addError(path: string, message: string) {
        let error : IError = {
            path:path,
            message:message
        }

        this.errors.push(error);
    }
}