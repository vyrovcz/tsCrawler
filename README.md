# tsCrawler

is a very basic experimental crawler with strict limitations and is useful to grab an initial overview of a domain.

### requires

node.js (https://github.com/nodesource/distributions) 

(typescript if you want to compile yourself, precompiled .js you can find in ./out) (https://www.typescriptlang.org/download)

internet connection (use at own risk, your IP might be blocked for flooding a domain)

### Usage

git clone https://github.com/vyrovcz/tsCrawler.git

cd tsCrawler

tsc

node out/crawler.js "https://www.crawler-test.com/"

at the end, the webpage tree is printed in JSON format

### Limitations

limited to the seed domain, it won't crawl outside

limited to text/html pages, others will get added to the website tree, but not traversed

limited to basic url string syntax, no special chars like % or & are accepted. They will be ignored and not even added to the links collection of the respective webpage.

not very efficient (yet), crawling could be made much more efficient with better parallelizing the queue. As of now, this runs pretty much single threaded

no real logic to hide crawling activity has been implemented. A domain might block this program and even put your IP on a bot/block list. Use at own risk

### Future work

for each external link that has been found but is ignored as of now, a new process can be spawned to traverse this new domain. A large cluster, for example a k8s swarm running this program in a docker container, could be utilized to scan every link. This has to be carefully synchronized with a central database of already crawled domains.