import { createServer } from "http";
import { randomUUID } from "crypto";

const PORT = Number(process.env.AUTH_API_PORT || 8787);

const DEMO_USER = {
  email: "demo@curso.dev",
  password: "curso123",
};

const sessions = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/login" && req.method === "POST") {
    try {
      const { email, password } = await readBody(req);
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const token = randomUUID();
        sessions.set(token, { email, createdAt: Date.now() });
        return json(res, 200, { ok: true, token, user: { email } });
      }
      return json(res, 401, { ok: false, error: "Email o contraseña incorrectos" });
    } catch {
      return json(res, 400, { ok: false, error: "Petición inválida" });
    }
  }

  if (url.pathname === "/api/me" && req.method === "GET") {
    const auth = req.headers.authorization || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const session = sessions.get(token);
    if (!session) return json(res, 401, { ok: false, error: "No autenticado" });
    return json(res, 200, { ok: true, user: { email: session.email } });
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    return json(res, 200, { ok: true });
  }

  json(res, 404, { ok: false, error: "No encontrado" });
}).listen(PORT, () => {
  console.log(
    `\x1b[36m[auth-api]\x1b[0m http://localhost:${PORT} — demo: ${DEMO_USER.email} / ${DEMO_USER.password}\n`
  );
});
