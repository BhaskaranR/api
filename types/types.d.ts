export interface ServicesResolver {
  [name: string]: { url: string, userResolver: (userData: any) => Promise<any> };
}
