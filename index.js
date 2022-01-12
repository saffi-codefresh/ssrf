const assertLib =  require('assert');
const assert = assertLib.strict;
const http = require('http');
const { httpSsrfGet, requestSsrfGet } = require('./ssrf-filter');

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
    }else if (url === '/rprivate.com') {
        // do a 302 redirect
        res.writeHead(302, {
            location: 'https://private.com',
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

const testHttp = async () => {
    const trace = true;
    // fail
    // await httpSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });

    await httpSsrfGet({ trace, url: baseurl, ssrf: false });
    await httpSsrfGet({ trace, url: google, ssrf: false });
    await httpSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: false });
    var hadFailedCnt = 0;
    try {
        await httpSsrfGet({ trace, url: baseurl, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===1);
    try {
        await httpSsrfGet({ trace, url: google, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===2);
    try {
        await httpSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });
    } catch(err) {
        hadFailedCnt ++;
    }
    assert(hadFailedCnt===3);
    await httpSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true, allowListDomains:['xxxx.io', 'private.com'] });
};

testHttp()
    .then(() => {console.log(`Done`);})
    .catch(error => {
        console.log(`Had err ${error}`);
        throw error;
    });




const testRequest = async () => {
    const trace = true;
    // fail
    // await httpSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });

    await requestSsrfGet({ trace, url: baseurl, ssrf: false });
    await requestSsrfGet({ trace, url: google, ssrf: false });
    await requestSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: false });
    var hadFailedCnt = 0;
    try {
        await requestSsrfGet({ trace, url: baseurl, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===1);
    try {
        await requestSsrfGet({ trace, url: google, ssrf: true });
    } catch(err) {
        hadFailedCnt++;
    }
    assert(hadFailedCnt===2);
    try {
        await requestSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true });
    } catch(err) {
        hadFailedCnt ++;
    }
    assert(hadFailedCnt===3);
    await requestSsrfGet({ trace, url: `http://private.com:${PORT}`, ssrf: true, allowListDomains:['xxxx.io', 'private.com'] });
    try {
        await requestSsrfGet({ trace, url: `http://rprivate.com:${PORT}`, ssrf: true });
    } catch(err) {
        hadFailedCnt ++;
    }
    assert(hadFailedCnt===4);
    await requestSsrfGet({ trace, url: `http://rprivate.com:${PORT}`, ssrf: true, allowListDomains:['xxxx.io', 'rprivate.com'] });
    try {
        await requestSsrfGet({ trace, url: `http://rprivate.com:${PORT}`, ssrf: true, allowListDomains:['xxxx.io', 'private.com'] });
    } catch(err) {
        hadFailedCnt ++;
    }
    assert(hadFailedCnt===5);
};

testRequest()
    .then(() => {console.log(`Done`);})
    .catch(error => {
        console.log(`Had err ${error}`);
        throw error;
    });
