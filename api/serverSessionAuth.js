import crypto from "node:crypto";

const COOKIE = "pegasus_core_session";

function safeEqual(a = "", b = "") {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return Boolean(ab.length && ab.length === bb.length && crypto.timingSafeEqual(ab, bb));
}

function secret() {
  return String(process.env.PEGASUS_CORE_API_SECRET || "").trim();
}

function sign(value) {
  const key = secret();
  if (!key) return "";
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function cookieValue(req) {
  const raw = String(req?.headers?.cookie || "");
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === COOKIE) return rest.join("=");
  }
  return "";
}

export function hasFounderCoreSession(req) {
  const key = secret();
  if (!key) return false;

  const token = cookieValue(req);
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data?.role === "founder" && Number(data?.exp) > Date.now();
  } catch {
    return false;
  }
}
