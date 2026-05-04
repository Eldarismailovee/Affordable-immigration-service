export function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.ended = true;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    get(name) {
      return this.headers[name.toLowerCase()];
    },
  };
  return res;
}

export function mockRequest({
  body,
  params,
  query,
  user = null,
  headers = {},
  ip = "127.0.0.1",
  method = "GET",
  url = "/",
  log = { error: () => {}, info: () => {}, warn: () => {} },
} = {}) {
  return {
    body: body ?? {},
    params: params ?? {},
    query: query ?? {},
    user,
    method,
    originalUrl: url,
    url,
    ip,
    id: "req-1",
    log,
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

export function nextSpy() {
  const calls = [];
  function next(err) {
    calls.push(err ?? null);
  }
  next.calls = calls;
  next.calledOnce = () => calls.length === 1;
  next.calledOnceWithNoArg = () => calls.length === 1 && calls[0] === null;
  next.calledWithError = () => calls.length === 1 && calls[0] instanceof Error;
  return next;
}
