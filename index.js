const assertLib =  require('assert');
const assert = assertLib.strict;
const http = require('http');
const { httpGet } = require('./ssrf-filter');

// var request = require("request"),
//   options = {
//     uri: 'http://www.someredirect.com/somepage.asp',
//     timeout: 2000,
//     followAllRedirects: false
//   };

// const request = require('request-promise');
// const httpGet = async (url) => {
//   const waitfor = new Promise((resolve, reject) => {
//     http.get(url, (resp) => {
//       let data = '';
//
//       // a data chunk has been received.
//       resp.on('data', (chunk) => {
//         data += chunk;
//       });
//
//       // complete response has been received.
//       resp.on('end', () => {
//         resolve(data)
//       });
//
//     }).on("error", (err) => {
//         reject(err);
//         });
//   });
//   await waitfor;
//
// }
const server = http.createServer(function (req, res) {
    const url = req.url;

    if (url === '/') {
        // do a 200 response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<h1>Hello World!<h1>');
        res.end();
    } else if (url === '/google') {
        // do a 302 redirect
        res.writeHead(302, {
            location: 'https://google.com',
        });
        res.end();
    }else if (url === '/google') {
        // do a 302 redirect
        res.writeHead(302, {
            location: 'https://google.com',
        });
        res.end();
    } else {
        // do a 404 redirect
        res.writeHead(404);
        res.write('<h1>Sorry nothing found!<h1>');
        res.end();
    }
});

const PORT=3000
server.listen(PORT);
const baseurl = `http://0.0.0.0:${PORT}`;
const google = `${baseurl}/google`;
const url404 = `${baseurl}/notfound`;

const test = async () => {
    const trace = true;
    // fail
    // await httpGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });

    await httpGet({ trace, url: baseurl });
    await httpGet({ trace, url: google });
    await httpGet({ trace, url: `http://private.com:${PORT}` });
    var hadFailedCnt = 0;
    try {
        await httpGet({ trace, url: baseurl, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===1);
    try {
        await httpGet({ trace, url: google, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===2);
    try {
        await httpGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });
    } catch(err) {
        hadFailedCnt ++;
    }
    assert(hadFailedCnt===3);
    await httpGet({ trace, url: `http://private.com:${PORT}`, ssrf: true, allowListDomains:['xxxx.io', 'private.com'] });
};

test()
    .then(() => {console.log(`Done`);})
    .catch(error => {
        console.log(`Had err ${error}`);
        throw error;
    });
//
// but it might have redirect issue.
// request(url, {
//   agent: ssrfAgent(url)
// }, (err, response, body) => {
//
// })
