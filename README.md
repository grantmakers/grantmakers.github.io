# Grantmakers.io - A Community Project

[![Stories in Ready](https://badge.waffle.io/grantmakers/grantmakers.github.io.png?label=ready&title=Ready)](http://waffle.io/grantmakers/grantmakers.github.io)

The Grantmakers.io project is spread across three repos:  
1. Foundation Search (this repo)
1. [Foundation Profiles](https://github.com/grantmakers/profiles)
1. [Grant Search](https://github.com/grantmakers/charity-search)    

## Goal  
Demonstrate how open source technologies + hosted microservices can be leveraged to minimize the cost of hosting and sharing philanthropic data.

Grantmakers.io was built at zero cost and has zero ongoing costs.  

## Search  
The search functionality is fully hosted by [Algolia](https://www.algolia.com/). See [`/assets/js/search.js`](https://github.com/grantmakers/grantmakers.github.io/blob/master/assets/js/search.js).  

## Data  
All data is pulled directly from machine-readable IRS Form 990PF. These files are [hosted publicly by Amazon Web Services](https://aws.amazon.com/public-datasets/irs-990/).

Download link for the normalized data we sync with Algolia:  
[JSON | 166MB](https://drive.google.com/open?id=0B_ODHXi37sCcTEFhWmdvX3V3MzA)

Download link for the entire MongoDB database (includes index data, filing data, and normalized data:  
[BSON | 5GB - please email us for a link](mailto:opensource@grantmakers.io)

## Feature Requests
If you have a question, feature request, find a bug, or just want to say hi, please open an [issue on GitHub](https://github.com/grantmakers/grantmakers.github.io/issues).

## Roadmap  
The roadmap is [openly available](https://waffle.io/grantmakers/grantmakers.github.io)

## Tools  
Cross-browser compatibility provided by [BrowserStack](https://browserstack.com)  
![browserstack](https://assets-github.s3.amazonaws.com/repo/progcode/img/browserstack-logo-footer.png)

## Credits
- Material Kit: [Creative Tim](https://github.com/timcreative/material-kit)
- Bootstrap Material Design: [Federico Zivolo](https://github.com/FezVrasta/bootstrap-material-design)
- Electronic Tax Filings: [Amazon Web Services](https://aws.amazon.com/public-datasets/irs-990/)
- PDF Links: [Foundation Center PDF Archives](http://990finder.foundationcenter.org/)
- Images: [Unsplash](https://unsplash.com/)

## License
Copyright 2016, 2017 Chad Kruse, SmarterGiving

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
