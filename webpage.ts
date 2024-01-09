export class Webpage {
    url : URL
    visited : Date = new Date()
    contentType : string = ""
    statusCode : number = 0
    //payload : string[] = []
    links = new Map<string,Webpage>()

    constructor(url : URL){
        this.url = url
    }
}