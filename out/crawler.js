"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpage_1 = require("./webpage");
const crawl_1 = require("./crawl");
let urlstring = "https://www.crawler-test.com/";
let url = new URL(urlstring);
// check for cli URL parameter input
const argv = process.argv.slice(2);
if (argv.length > 0 && argv[0].startsWith("https")) {
    urlstring = argv[0];
    // test if URL valid
    try {
        url = new URL(urlstring);
    }
    catch (e) {
        console.log("(URL link rejected, using default) " + e);
    }
}
let webpage = new webpage_1.Webpage(url);
console.log("A: Crawling " + url);
(0, crawl_1.crawl)(webpage).then(() => {
    console.log("F: no more links to follow");
});
//# sourceMappingURL=crawler.js.map