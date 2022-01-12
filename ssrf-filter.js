const http = require('http');
const { Agent: HttpAgent } = require('http');
const { Agent: HttpsAgent } = require('https');
const is_ip_private = require('private-ip');
const patchAgent = (    {isPrivate = (address)=> is_ip_private(address),
                        agent}
) => {
    const createConnection = agent.createConnection;
    agent.createConnection = function(options, fn) {
        const { host: address } = options;
        if (isPrivate(address)) {
            throw new Error(`private address ${address} is not allowed.`);
        }

        const client = createConnection.call(this, options, fn);
        client.on('lookup', (err, address) => {
            if (err || !isPrivate(address)) {
                return;
            }

            return client.destroy(new Error(`DNS lookup of private '${client._host}' returned ${address} is not allowed.`));
        });

        return client;
    };
    agent.PATCHED = true;
    return agent;
}


const httpAgent = patchAgent({agent:new HttpAgent()});
const httpsAgent = patchAgent({agent:new HttpsAgent()});

const getAgent = ({url, allowListDomains=[], trace=false}) => {
    const urlObject = new URL(url);
    const protocol = urlObject.protocol;
    const hostname = urlObject.hostname
    if (allowListDomains.includes(hostname)) {
        trace && console.log(`Allow list match: ${hostname}, in: ${allowListDomains}`)
        return undefined;
    }
    if (protocol==='https:') return httpsAgent;
    if (protocol==='http:') return httpAgent;
    new Error(`Bad protocol, url must start with http/https, Got ${url}`)
};

async function httpGet({ url, trace= true, ssrf = false, allowListDomains = [] }) {
    trace && console.log(`Calling ${url} ssrf:${ssrf} allowListDomains:${allowListDomains}`);
    const options = {}
    if (ssrf) {
        options.agent = getAgent({url, allowListDomains, trace});
    }
    const waitfor = new Promise((resolve, reject) => {
        let data = [];
         trace && console.log(`http.get ${url},  ${JSON.stringify(options)}`)
        http.get(url, options, res => {
            const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
             trace && console.log('Status Code:', res.statusCode);
             trace && console.log('Date in Response header:', headerDate);

            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                 trace && console.log('Response ended: ');
                resolve({ data: data.join(''), statusCode: res.statusCode });
            });
        })
        .on('error', err => {
             trace && console.log('Error: ', err.message);
            reject(err);
        });
    });
    const result = await waitfor;
     trace && console.log(`Called ${url} return ${JSON.stringify(result)}`);
}

module.exports = { getAgent, httpGet };
