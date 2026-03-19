const http = require("http");
const httpProxy = require("http-proxy");

const servers = [
 "http://localhost:5000",
 "http://localhost:5001"
];

let current = 0;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req,res)=>{

 const target = servers[current];

 current = (current + 1) % servers.length;

 proxy.web(req,res,{ target });

});

server.listen(3000,()=>{
 console.log("Load balancer running on port 3000");
});