# Grantmakers.io - A Community Project

The Grantmakers.io project is spread across two repos:  
1. Foundation Search (this repo)
1. [Foundation Profiles](https://github.com/grantmakers/profiles)

## Goal  
Demonstrate how open source technologies + hosted microservices can be leveraged to minimize the cost of hosting and sharing philanthropic data.

Grantmakers.io was built at zero cost and has zero ongoing costs.  

## Search  
The search functionality is fully hosted by [Algolia](https://www.algolia.com/). See [`/assets/js/search-profiles.js`](https://github.com/grantmakers/grantmakers.github.io/blob/master/assets/js/search-profiles.js).

## Data  
All data is pulled directly from machine-readable IRS Form 990PF. These files are [hosted publicly by Amazon Web Services](https://registry.opendata.aws/irs990/) and controlled by the IRS.

To build your own database of tax filings direct from the AWS source dataset, I've open sourced the [Node + MongoDB scripts](https://github.com/smartergiving/irs-990-fetch) used to build Grantmakers.io. If you prefer other platforms (e.g. Python), check out the [Nonprofit Open Data Collective](https://github.com/Nonprofit-Open-Data-Collective/irs-990-efiler-database) or a [quick search on Github](https://github.com/search?q=irs990&type=Repositories) should yield a few results.

## Researchers

If you're struggling with the AWS filings, [get in touch](mailto:opensource@grantmakers.io). I have MongoDB-friendly BSON files I'm happy to share with the academic, research, and journalism communities. Unzipped, these files are ~10GB in size and contain the AWS index data, filing data, and normalized data. Of course, you'll need to be a little familiar with MongoDB to use the files (see below).

## Setting up MongoDB using BSON files
First, set up your MongoDB instance. You have two options:
1. Install MongoDB on your local machine. MacOS instructions [here](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/).
2. Use a hosted cloud service. Check out [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (students and faculty might be eligible for [free credits](https://www.mongodb.com/students)).

Next, import the BSON file using the `mongorestore` command:  
`mongorestore --gzip --db=yourdbname path/to/BSON/files/`


## Feature Requests
If you have a question, feature request, find a bug, or just want to say hi, please open an [issue on GitHub](https://github.com/grantmakers/grantmakers.github.io/issues).

## Roadmap  
Grantmakers.io is developed in the open and uses Github Issues at its core. To view the prioritized list across all repos, simply download the [Zenhub browser extension](https://www.zenhub.com/extension).

## Tools  
Cross-browser compatibility provided by [BrowserStack](https://browserstack.com)  
![browserstack](https://assets-github.s3.amazonaws.com/repo/progcode/img/browserstack-logo-footer.png)

## Credits
- Materialize: [Alvin Wang et al](http://materializecss.com/)
- Electronic Tax Filings: [Amazon Web Services](https://aws.amazon.com/public-datasets/irs-990/)
- PDF Links: [Foundation Center PDF Archives](http://990finder.foundationcenter.org/)
- Images: [Unsplash](https://unsplash.com/)

## License
Copyright 2016 Chad Kruse

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
