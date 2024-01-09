"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawl = void 0;
const https = require('node:https');
const webpage_1 = require("./webpage");
// return https links from a given string
function getURLsFromString(haystack) {
    let needle = 'https://';
    let fragments = haystack.split(needle);
    let needleIndices = [];
    // find the starting indices of any https-link
    // inspired by https://stackoverflow.com/q/3410464
    fragments.forEach((fragment, index) => {
        let newIndex = fragment.length;
        let offset = needleIndices.length > 0 ? (needleIndices[index - 1] + needle.length) : 0;
        needleIndices.push(newIndex + offset);
    });
    // remove the last, since it only defines EOL
    needleIndices.pop();
    let urls = new Map();
    // extract urls from the haystack
    needleIndices.forEach(index => {
        let urlstring = needle;
        // checking each char for validness, only allow simply URLs
        for (let i = index + needle.length; i < haystack.length; i++) {
            let c = haystack[i];
            let isLetter = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
            let isNumber = (c >= '0' && c <= '9');
            let isSpecialchar = c == '.' || c == '-' || c == '_' || c == "/";
            if (isLetter || isNumber || isSpecialchar)
                urlstring += c;
            else
                break;
        }
        // test if URL valid
        try {
            let url = new URL(urlstring);
            let webpage = new webpage_1.Webpage(url);
            //console.log("      Adding "+url.href)
            urls.set(urlstring, webpage);
        }
        catch (e) {
            console.log("(URL link rejected, skipping) " + e);
        }
    });
    return urls;
}
// Discover any new URLs by extracting 
// them from the fetched content
function discoverURLs(urlData) {
    let links = new Map();
    urlData.forEach(line => {
        getURLsFromString(line)
            .forEach((webpage, urlstring) => links.set(urlstring, webpage));
    });
    // sorting by key value
    // inspired by https://stackoverflow.com/a/51242261
    return new Map([...links].sort((a, b) => a[0].localeCompare(b[0])));
}
// Returns a Webpage object containing every found
// link-URL given a source URL
function loadURL(webpage) {
    return new Promise((resolve, reject) => {
        https.get(webpage.url.href, (res) => {
            webpage.statusCode = res.statusCode;
            webpage.visited = res.headers['date'];
            webpage.contentType = res.headers['content-type'];
            let error;
            try {
                // only allow actual text/html to be parsed
                // skip links to non text resources
                if (!webpage.contentType.startsWith("text"))
                    reject("TypeError - not a text/html type");
            }
            catch (error) {
                reject("webpage undefined");
            }
            // test for error codes 
            if (webpage.statusCode < 200 || webpage.statusCode > 299)
                error = new Error(`https.get(${webpage.url.href}) 
                    failed with code: ${webpage.statusCode}`);
            if (error) {
                // Consume response
                res.resume();
                reject(error);
            }
            res.setEncoding('utf8');
            let rawData = [];
            // store URL response data to check for links
            res.on('data', (line) => rawData.push(line));
            // download finished, parse the output to find links
            res.on('end', () => {
                try {
                    //console.log("D: ")
                    // parse
                    webpage.links = discoverURLs(rawData);
                    //console.log("  Found Links Outer: ")
                    //webpage.links.forEach((wp,urlstring) => console.log("    " + wp.url.href))
                    resolve();
                }
                catch (e) {
                    console.error(e.message);
                    reject(e);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e}`);
            reject(e);
        });
    });
}
// crawls an URL and builds a link database of the domain by
// crawling the found links on a given URL
function crawl(sourceWebpage) {
    return __awaiter(this, void 0, void 0, function* () {
        let urlDB = new Set();
        let webpageQueue = [];
        let sourceDN = sourceWebpage.url.hostname.split('.').splice(-2);
        // start with root URL
        webpageQueue.push(sourceWebpage);
        // iterate through the url queue in a BFS style
        while (webpageQueue.length > 0) {
            let nextWebpage = webpageQueue.shift();
            urlDB.add(nextWebpage.url.href);
            console.log("crawling: " + nextWebpage.url.href);
            try {
                yield loadURL(nextWebpage);
            }
            catch (e) {
                console.log("URL " + nextWebpage.url + " failed with " + e);
                continue;
            }
            // manage the found links
            // decide which links to crawl
            for (let [urlstring, webpage] of nextWebpage.links) {
                // skip already cralwed URLs
                let alreadyQueued = false;
                for (let wp of webpageQueue) {
                    if (wp.url.href == urlstring || wp.url.href == (urlstring + "/")) {
                        alreadyQueued = true;
                        break;
                    }
                }
                let hasUnsupportedEnding = false;
                // a link https://ipfabric.io/ has split like this length 3, check for longer
                // links like https://ipfabric.io/wp-content
                if (urlstring.split('/').length > 3) {
                    let probe = urlstring.slice(-5);
                    // if we find a '.' at the end but no "htm", skip this link
                    if (probe.includes('.') && !probe.includes("htm"))
                        hasUnsupportedEnding = true;
                }
                if (!alreadyQueued && !hasUnsupportedEnding
                    && !urlDB.has(urlstring) && !urlDB.has(urlstring + "/")) {
                    // only crawl URLs with same domain name (SDL.TLD)
                    // check if domainname is same
                    let dn = webpage.url.hostname.split('.').splice(-2);
                    if (sourceDN[0] == dn[0] && sourceDN[1] == dn[1])
                        webpageQueue.push(webpage);
                }
            }
            console.log("urlDB size = " + urlDB.size);
            console.log("  crawled:");
            urlDB.forEach(url => console.log(url));
            console.log();
            console.log("  scheduled:");
            webpageQueue.forEach(wp => console.log(wp.url.href));
            console.log();
        }
        // convert key-value maps to JSON style
        let replacer = (k, v) => {
            return v instanceof Map ? Object.fromEntries(v) : v;
        };
        console.log("Printing finished webpage-tree: ");
        console.log(JSON.stringify(sourceWebpage, replacer, 2));
    });
}
exports.crawl = crawl;
//# sourceMappingURL=crawl.js.map