import fastify from "fastify";

// TODO: server 6060 for monitor endpoint
// TODO: server 7070 for /service-one
// TODO: server 8080 for /service-two

// -------------------------------------------------

const server6060 = fastify({
  logger: true
});

server6060.post("/monitor", async (request) => {
  console.log("[6060]", "body", request.body);
  return {
    success: true
  };
});

server6060.listen(6060, (err, address) => {
  if(err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});

// -------------------------------------------------

const server7070 = fastify({
  logger: true
});

server7070.get("/:name/*", async (request) => {
  console.log("[7070]", "params", request.params);
  return {
    success: true,
    from: 7070,
    params: request.params
  };
});

server7070.listen(7070, (err, address) => {
  if(err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});

// -------------------------------------------------

const server8080 = fastify({
  logger: true
});

server8080.get("/:name/*", async (request) => {
  console.log("[8080]", "params", request.params);
  return {
    success: true,
    from: 8080,
    params: request.params
  };
});

server8080.listen(8080, (err, address) => {
  if(err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});