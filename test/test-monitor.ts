import { Monitor, MonitorConfiguration, MonitorConnectivityResult, MonitorResultCallback } from "../src/Monitor";

const config: MonitorConfiguration = {
  enabled: true,
  endpoint: "",
  interval: 5000,
  timeout: 500
};

const monitor = new Monitor(config);

const callback: MonitorResultCallback = (result: MonitorConnectivityResult) => {
  console.log("result", result);
};

monitor.addDestination("http://localhost:6060", callback);
monitor.addDestination("https://localhost:7070", callback);
monitor.addDestination("http://localhost:8080", callback);

monitor.startPolling();
