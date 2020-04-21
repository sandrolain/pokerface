import { Config } from "./Config";
import httpProxy from "http-proxy";
import fastify from "fastify";
import { Rule } from "./Rules";

export class Server {

  constructor (private config: Config) {}

  start (): void {
    const config = this.config;

    const proxyServer = httpProxy.createProxyServer();

    const httpServer = fastify({
      logger: true
    });

    config.rules.forEach(function (rule: Rule): void {

      const target = rule.dest;

      httpServer.route({
        method: rule.method || "GET",
        url: rule.path,
        handler: (request, reply) => {
          const options = {
            target
          };
          proxyServer.web(request.raw, reply.res, options, (error) => {
            console.error(error);
          });
        }
      });
    });


    httpServer.listen(config.server.port, (err, address) => {
      if(err) {
        console.error(err);
        process.exit(0);
      }
      console.log(`Server listening at ${address}`);
    });
  }
}


// TODO: http2 support
// if(config.server.protocol === "http2") {
//   const server = fastify({
//     http2: true,
//     https: {
//       allowHTTP1: true,
//       key: config.server.certs.key,
//       cert: config.server.certs.cert
//     },
//     logger: true
//   });

//   server.get("/ping", async (request, reply) => {
//     const options = {
//       target: "http://localhost:8080"
//     };
//     proxyServer.web(request.raw, reply.res, options, (error) => {
//       console.error(error);
//     });
//   });

// } else {
// }
