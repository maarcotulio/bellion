const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type AuthEnv = {
  readonly [key: string]: string | undefined;
  readonly APP_PASSWORD?: string;
  readonly SESSION_SECRET?: string;
};

type AuthOptions = {
  readonly env?: AuthEnv;
  readonly now?: Date;
};

type AuthConfig = {
  readonly appPassword: string;
  readonly sessionSecret: string;
};

type SessionPayload = {
  readonly v: 1;
  readonly exp: number;
};

export const sessionCookieName = "royal_bellion_session";
export const sessionMaxAgeSeconds = SESSION_TTL_MS / 1_000;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function readAuthConfig(env: AuthEnv = process.env): AuthConfig {
  const appPassword = env.APP_PASSWORD?.trim();
  const sessionSecret = env.SESSION_SECRET?.trim();

  if (!appPassword) {
    throw new Error("APP_PASSWORD must be configured before Royal Bellion can run.");
  }

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be configured before Royal Bellion can run.");
  }

  return {
    appPassword,
    sessionSecret,
  };
}

export async function authenticateAppPassword(
  password: string,
  options: AuthOptions = {},
): Promise<string | null> {
  const config = readAuthConfig(options.env);

  if (password !== config.appPassword) {
    return null;
  }

  return createSessionToken(config.sessionSecret, options.now ?? new Date());
}

export async function verifySessionToken(
  token: string | null | undefined,
  options: AuthOptions = {},
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const config = readAuthConfig(options.env);
  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [payloadBase64, signatureBase64] = parts;
  const signature = decodeBase64Url(signatureBase64);

  if (!payloadBase64 || !signature) {
    return false;
  }

  const isSigned = await verifySignature(payloadBase64, signature, config.sessionSecret);

  if (!isSigned) {
    return false;
  }

  const payloadText = decodeBase64UrlText(payloadBase64);

  if (!payloadText) {
    return false;
  }

  try {
    const payload: unknown = JSON.parse(payloadText);

    if (!isSessionPayload(payload)) {
      return false;
    }

    return payload.exp > (options.now ?? new Date()).getTime();
  } catch {
    return false;
  }
}

async function createSessionToken(sessionSecret: string, now: Date) {
  const payload: SessionPayload = {
    v: 1,
    exp: now.getTime() + SESSION_TTL_MS,
  };
  const payloadBase64 = encodeBase64UrlText(JSON.stringify(payload));
  const signature = await sign(payloadBase64, sessionSecret);

  return `${payloadBase64}.${encodeBase64Url(signature)}`;
}

async function sign(payload: string, sessionSecret: string) {
  const key = await createSigningKey(sessionSecret, ["sign"]);

  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, textEncoder.encode(payload)));
}

async function verifySignature(
  payload: string,
  signature: Uint8Array<ArrayBuffer>,
  sessionSecret: string,
) {
  const key = await createSigningKey(sessionSecret, ["verify"]);

  return globalThis.crypto.subtle.verify("HMAC", key, signature, textEncoder.encode(payload));
}

async function createSigningKey(secret: string, usages: KeyUsage[]) {
  return globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

function isSessionPayload(value: unknown): value is SessionPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "v" in value &&
    "exp" in value &&
    value.v === 1 &&
    typeof value.exp === "number"
  );
}

function encodeBase64UrlText(value: string) {
  return encodeBase64Url(textEncoder.encode(value));
}

function decodeBase64UrlText(value: string) {
  const bytes = decodeBase64Url(value);

  if (!bytes) {
    return null;
  }

  return textDecoder.decode(bytes);
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    return null;
  }
}
