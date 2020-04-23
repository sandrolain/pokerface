import path from "path";
import fs from "fs";
import cluster from "cluster";
import os from "os";
import { createCheckers } from "ts-interface-checker";
import checks from "./Config-ti";
import { Config } from "./Config";
import { Server } from "./Server";
import { Monitor, MonitorConnectivityResult } from "./Monitor";
import { Message } from "./Message";
const { Config: ConfigCheck } = createCheckers(checks);

const jsonConfigFileName = "pokerface.config.json";
const jsonConfigFilePath = path.join(process.cwd(), jsonConfigFileName);
// TODO: config file form cli argument

if(!fs.existsSync(jsonConfigFilePath)) {
  console.error("Config file not found");
  process.exit(0);
}

let config: Config;

try {
  const configSource = fs.readFileSync(jsonConfigFilePath);
  config = JSON.parse(configSource.toString("utf8"));
  ConfigCheck.check(config);
} catch(e) {
  console.error("Inavalid config file.", e.toString());
  process.exit(0);
}

if(cluster.isMaster) {
  const cpuNum = os.cpus().length;
  const forksNum = (!config.threads || config.threads === "auto")
    ? Math.max(1, Math.round(cpuNum / 2))
    : config.threads;

  console.log(`Master with PID ${process.pid} is running`);
  console.log(`Forks number: ${forksNum}`);

  // Fork workers.
  for(let i = 0; i < forksNum; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker with PID ${worker.process.pid} died`);
  });

  if(config.monitor && config.monitor.enabled) {
    const monitor = new Monitor(config.monitor);

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
  console.log(`Worker with PID ${process.pid} started`);

  // TODO: Init logger
  // TODO: Monitor result collector class with instance

  cluster.worker.on("message", (msg: Message) => {
    if(msg && msg.type === "monitor:result") {
      const result = msg.data as MonitorConnectivityResult;
      console.log("result", result)
      Monitor.addResult(result);
    }
  });

  const server = new Server(config);

  server.start();
}
