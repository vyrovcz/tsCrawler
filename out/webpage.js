"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webpage = void 0;
class Webpage {
    constructor(url) {
        this.visited = new Date();
        this.contentType = "";
        this.statusCode = 0;
        //payload : string[] = []
        this.links = new Map();
        this.url = url;
    }
}
exports.Webpage = Webpage;
//# sourceMappingURL=webpage.js.map