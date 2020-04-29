import httpProxy from "http-proxy";
import fastify from "fastify";
import { Config } from "./Config";
import { Rule } from "./Rules";
import { MonitorStatus } from "./Monitor";
import { Logger } from "./Logger";
import { getPathMatcher, getPathParamsApplier } from "./Path";

export class Server {

  constructor (
    private config: Config,
    private monitorStatus: MonitorStatus,
    private logger: Logger
  ) {}

  start (): void {
    const config = this.config;

    const proxyServer = httpProxy.createProxyServer();

    const httpServer = fastify({
      logger: this.logger.getPino()
    });

    config.rules.forEach((rule: Rule): void => {

      const matchPath   = getPathMatcher(rule.path);
      const applyParams = getPathParamsApplier(rule.destPath);

      httpServer.route({
        method: rule.method || "GET",
        url: rule.path,
        handler: (request, reply) => {

          const reply503 = (): void => {
            reply.code(503).send({
              status: "Service Unavailable",
              path: request.raw.url
            });
          };

          // Return a 503 error only if I actually know that the target is not reachable
          if(this.monitorStatus.connectivityAvailableByUrl(rule.dest) === 0) {
            return reply503();
          }

          const destPath = applyParams(request.params);

          const options: httpProxy.ServerOptions = {
            target: rule.dest + (destPath ? destPath : ""),
            ignorePath: !!destPath
          };
          proxyServer.web(request.raw, reply.res, options, (error: Error & {code: string}) => {
            this.logger.warn(error.message);
            if(error.code === "ECONNREFUSED") {
              reply503();
              this.monitorStatus.addResultForUrl(rule.dest, {
                success: false
              });
            }
          });
        }
      });
    });

    httpServer.listen(config.server.port, (err, address) => {
      if(err) {
        this.logger.fatal(err.message);
        process.exit(0);
      }
      this.logger.info(`Server listening at ${address}`);
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
