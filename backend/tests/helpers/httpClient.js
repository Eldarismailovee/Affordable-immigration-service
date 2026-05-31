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

function parseSetCookieHeaders(setCookieHeader) {
  const cookies = {};
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];

  for (const header of headers) {
    const [pair] = header.split(";");
    const eqIndex = pair.indexOf("=");

    if (eqIndex === -1) {
      continue;
    }

    const name = pair.slice(0, eqIndex).trim();
    const value = decodeURIComponent(pair.slice(eqIndex + 1).trim());
    cookies[name] = value;
  }

  return cookies;
}

function makeRequest({ port, method, path, body, token, cookies = {} }) {
  return new Promise((resolve, reject) => {
    const headers = { "content-type": "application/json" };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const cookieHeader = Object.entries(cookies)
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join("; ");

    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }

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
          resolve({
            status: res.statusCode,
            body: parsed,
            raw: text,
            headers: res.headers,
            cookies: parseSetCookieHeaders(res.headers["set-cookie"]),
          });
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
  let cookieJar = {};

  try {
    const client = {
      get: async (path, opts = {}) => {
        const res = await makeRequest({
          port,
          method: "GET",
          path,
          cookies: cookieJar,
          ...opts,
        });
        cookieJar = { ...cookieJar, ...res.cookies };
        return res;
      },
      post: async (path, body, opts = {}) => {
        const res = await makeRequest({
          port,
          method: "POST",
          path,
          body,
          cookies: cookieJar,
          ...opts,
        });
        cookieJar = { ...cookieJar, ...res.cookies };
        return res;
      },
      patch: async (path, body, opts = {}) => {
        const res = await makeRequest({
          port,
          method: "PATCH",
          path,
          body,
          cookies: cookieJar,
          ...opts,
        });
        cookieJar = { ...cookieJar, ...res.cookies };
        return res;
      },
      delete: async (path, opts = {}) => {
        const res = await makeRequest({
          port,
          method: "DELETE",
          path,
          cookies: cookieJar,
          ...opts,
        });
        cookieJar = { ...cookieJar, ...res.cookies };
        return res;
      },
      getCookies: () => ({ ...cookieJar }),
      clearCookies: () => {
        cookieJar = {};
      },
    };
    return await runner(client);
  } finally {
    await stopServer(server);
  }
}

export { parseSetCookieHeaders, makeRequest };
