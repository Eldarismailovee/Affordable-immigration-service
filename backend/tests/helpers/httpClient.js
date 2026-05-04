import http from "http";

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function makeRequest({ port, method, path, body, token }) {
  return new Promise((resolve, reject) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;

    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    if (data) headers["content-length"] = data.length;

    const req = http.request(
      { hostname: "127.0.0.1", port, method, path, headers },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch {
            parsed = text;
          }
          resolve({ status: res.statusCode, body: parsed, raw: text });
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

export async function withApp(app, runner) {
  const { server, port } = await startServer(app);
  try {
    const client = {
      get: (path, opts = {}) => makeRequest({ port, method: "GET", path, ...opts }),
      post: (path, body, opts = {}) =>
        makeRequest({ port, method: "POST", path, body, ...opts }),
      patch: (path, body, opts = {}) =>
        makeRequest({ port, method: "PATCH", path, body, ...opts }),
      delete: (path, opts = {}) =>
        makeRequest({ port, method: "DELETE", path, ...opts }),
    };
    return await runner(client);
  } finally {
    await stopServer(server);
  }
}
