export type Error = {
    path: string
    message: string
  }
  
  export  type genericResponse = {
    ok: boolean
    errors: [Error]
  }
  
  