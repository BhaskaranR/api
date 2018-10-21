interface IError{
    path:string | null,
    message:string | null
}

export default class GenericResponse {
    ok:boolean;
    errors:IError[] = [];

    constructor(ok:boolean, errors?: string[]){
        this.ok = ok;

        if(!!errors && !!errors.length){
            errors.forEach((val, idx) => {
                this.addError(null, val);
            });
        }
    }

    addError(path: string, message: string) {
        let error : IError = {
            path:!!path ? path : '',
            message:message
        }
        this.errors.push(error);
    }
}