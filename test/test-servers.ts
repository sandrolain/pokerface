import fastify from "fastify";
import fastifyCookie from "fastify-cookie";

// -------------------------------------------------
// server 6060 for monitor endpoint

const server6060 = fastify({
  logger: true
});

server6060.register(fastifyCookie);

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
// server 7070 for /service-one

const server7070 = fastify({
  logger: true
});

server7070.register(fastifyCookie);

server7070.get("/:name/*", async (request) => {
  console.log("[7070]", "params", request.params);
  return {
    success: true,
    from: 7070,
    params: request.params,
    query: request.query,
    cookies: request.cookies,
    headers: request.headers
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
// server 8080 for /service-two

const server8080 = fastify({
  logger: true
});

server8080.register(fastifyCookie);

server8080.get("/:name/*", async (request) => {
  console.log("[8080]", "params", request.params);
  return {
    success: true,
    from: 8080,
    params: request.params,
    query: request.query,
    cookies: request.cookies,
    headers: request.headers
  };
});

server8080.listen(8080, (err, address) => {
  if(err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});
