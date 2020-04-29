import { Monitor, MonitorConfiguration, MonitorConnectivityResult, MonitorResultCallback, MonitorStatus } from "../src/Monitor";

const config: MonitorConfiguration = {
  enabled: true,
  endpoint: "",
  interval: 5000,
  timeout: 500
};

const monitorStatus = new MonitorStatus();
const monitor       = new Monitor(config, monitorStatus);

const callback: MonitorResultCallback = (result: MonitorConnectivityResult) => {
  console.log("result", result);
};

monitor.addDestinationByUrl("http://localhost:6060", callback);
monitor.addDestinationByUrl("https://localhost:7070", callback);
monitor.addDestinationByUrl("http://localhost:8080", callback);

monitor.startPolling();
