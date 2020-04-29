import httpProxy from "http-proxy";
import fastify from "fastify";
import fastifyCookie from "fastify-cookie";
import querystring from "querystring";
import { URL } from "url";
import { Config } from "./Config";
import { Rule } from "./Rules";
import { MonitorStatus } from "./Monitor";
import { Logger } from "./Logger";
import { getPathParamsApplier } from "./Path";



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

    httpServer.register(fastifyCookie);

    config.rules.forEach((rule: Rule): void => {
      const applyParams = getPathParamsApplier(rule.destPath);

      httpServer.route({
        method: rule.method || "GET",
        url: rule.path,
        handler: (request: fastify.FastifyRequest, reply) => {

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



          const url = new URL(request.req.url, "http://localhost");
          const requestPath = url.pathname;
          let query = url.search.replace("?", "");

          const destPath = applyParams(request.params) || requestPath;

          if(rule.query) {
            const queryMap = this.mapParamsRecord(request, rule.query);
            query += (query ? "&" : "") + querystring.stringify(queryMap, "&", "=");
          }

          const options: httpProxy.ServerOptions = {
            target: rule.dest + destPath + (query ? "?" : "") + query,
            ignorePath: true
          };

          console.log("Server -> start -> destPath", destPath)

          console.log(options);

          if(rule.headers) {
            options.headers = this.mapParamsRecord(request, rule.headers);
          }

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

  private mapParamsRecord (request: fastify.FastifyRequest, map: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for(const name in map) {
      result[name] = this.getParamsValue(request, map[name]);
    }
    return result;
  }

  private getParamsValue (request: fastify.FastifyRequest, value: string): string {
    const match = value.match(/\{\$(headers|cookies|query)\.([^}]+)\}/);
    if(match) {
      const key = match[1] as ("headers" | "cookies" | "query");
      value = value.replace(match[0], request[key][match[2]] || "");
    }
    return value;
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
