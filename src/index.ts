import path from "path";
import fs from "fs";
import cluster from "cluster";
import os from "os";
import yargs from "yargs";
import { createCheckers } from "ts-interface-checker";
import checks from "./Config-ti";
import { Config } from "./Config";
import { Server } from "./Server";
import { Logger } from "./Logger";
import { Monitor, MonitorConnectivityResult, MonitorStatus } from "./Monitor";
import { Message } from "./Message";
const { Config: ConfigCheck } = createCheckers(checks);

const argv = yargs
  .option("config", {
    alias: "c",
    type: "string",
    describe: "pokerface configuration file",
    default: "./pokerface.config.json"
  })
  .demandOption(["config"], "Please provide configuration file path")
  .help()
  .argv;

let jsonConfigFilePath: string;

if(argv.config) {
  jsonConfigFilePath = argv.config as string;
} else {
  jsonConfigFilePath = path.join(process.cwd(), "pokerface.config.json");
}

if(!fs.existsSync(jsonConfigFilePath)) {
  console.error(`Config file not found: ${jsonConfigFilePath}`);
  process.exit(0);
}

let config: Config;

try {
  const configSource = fs.readFileSync(jsonConfigFilePath);
  config = JSON.parse(configSource.toString("utf8"));
  ConfigCheck.check(config);
} catch(e) {
  console.error("Invalid configuration file.", e.toString());
  process.exit(0);
}

const logger        = new Logger(config.logs, cluster.isMaster);
const monitorStatus = new MonitorStatus();

if(cluster.isMaster) {
  const cpuNum   = os.cpus().length;
  const forksNum = (config.threads && config.threads.number)
    ? config.threads.number
    : Math.max(1, Math.round(cpuNum / 2));

  logger.info(`Master with PID ${process.pid} is running`);
  logger.info(`Forks number: ${forksNum}`);

  for(let i = 0; i < forksNum; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    logger.warn(`Worker with PID ${worker.process.pid} died`);
    if(config.threads.autorestart) {
      logger.warn(`New worker will start in ${config.threads.autorestart} ms`);
      setTimeout(() => {
        cluster.fork();
      }, config.threads.autorestart);
    }
  });

  if(config.monitor && config.monitor.enabled) {
    const monitor = new Monitor(config.monitor, monitorStatus);

    const onResult = (result: MonitorConnectivityResult): void => {
      for(const id in cluster.workers) {
        cluster.workers[id].send({
          type: "monitor:result",
          data: result
        });
      }
    };

    for(const rule of config.rules) {
      monitor.addDestinationByUrl(rule.dest, onResult);
    }

    monitor.startPolling();
  }

} else {
  logger.info(`Worker with PID ${process.pid} started`);

  cluster.worker.on("message", (msg: Message) => {
    if(msg && msg.type === "monitor:result") {
      const result = msg.data as MonitorConnectivityResult;
      monitorStatus.addResult(result);
    }
  });

  const server = new Server(config, monitorStatus, logger);

  server.start();
}


process.on("uncaughtException",  logger.final("uncaughtException"));
process.on("unhandledRejection", logger.final("unhandledRejection"));


