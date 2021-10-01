import crypto from "crypto"
import jose from "jose"
import logger from "../lib/logger"
import { NextApiRequest } from "next"
import type { JWT, JWTDecodeParams, JWTEncodeParams, Secret } from "./types"

export * from "./types"

// Set default algorithm to use for auto-generated signing key
const DEFAULT_SIGNATURE_ALGORITHM = "HS512"

// Set default algorithm for auto-generated symmetric encryption key
const DEFAULT_ENCRYPTION_ALGORITHM = "A256GCM"

// Use encryption or not by default
const DEFAULT_ENCRYPTION_ENABLED = false

const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function encode({
  token = {},
  maxAge = DEFAULT_MAX_AGE,
  secret,
  signingKey,
  signingOptions = {
    expiresIn: `${maxAge}s`,
  },
  encryptionKey,
  encryptionOptions = {
    alg: "dir",
    enc: DEFAULT_ENCRYPTION_ALGORITHM,
    zip: "DEF",
  },
  encryption = DEFAULT_ENCRYPTION_ENABLED,
}: JWTEncodeParams) {
  // Signing Key
  const _signingKey = signingKey
    ? jose.JWK.asKey(JSON.parse(signingKey))
    : getDerivedSigningKey(secret)

  // Sign token
  const signedToken = jose.JWT.sign(token, _signingKey, signingOptions)

  if (encryption) {
    // Encryption Key
    const _encryptionKey = encryptionKey
      ? jose.JWK.asKey(JSON.parse(encryptionKey))
      : getDerivedEncryptionKey(secret)

    // Encrypt token
    return jose.JWE.encrypt(signedToken, _encryptionKey, encryptionOptions)
  }
  return signedToken
}

export async function decode({
  secret,
  token,
  maxAge = DEFAULT_MAX_AGE,
  signingKey,
  verificationKey = signingKey, // Optional (defaults to encryptionKey)
  verificationOptions = {
    maxTokenAge: `${maxAge}s`,
    algorithms: [DEFAULT_SIGNATURE_ALGORITHM],
  },
  encryptionKey,
  decryptionKey = encryptionKey, // Optional (defaults to encryptionKey)
  decryptionOptions = {
    algorithms: [DEFAULT_ENCRYPTION_ALGORITHM],
  },
  encryption = DEFAULT_ENCRYPTION_ENABLED,
}: JWTDecodeParams): Promise<JWT | null> {
  if (!token) return null

  let tokenToVerify = token

  if (encryption) {
    // Encryption Key
    const _encryptionKey = decryptionKey
      ? jose.JWK.asKey(JSON.parse(decryptionKey))
      : getDerivedEncryptionKey(secret)

    // Decrypt token
    const decryptedToken = jose.JWE.decrypt(
      token,
      _encryptionKey,
      decryptionOptions
    )
    tokenToVerify = decryptedToken.toString("utf8")
  }

  // Signing Key
  const _signingKey = verificationKey
    ? jose.JWK.asKey(JSON.parse(verificationKey))
    : getDerivedSigningKey(secret)

  // Verify token
  return jose.JWT.verify(
    tokenToVerify,
    _signingKey,
    verificationOptions
  ) as JWT | null
}

export type GetTokenParams<R extends boolean = false> = {
  req: NextApiRequest
  secureCookie?: boolean
  cookieName?: string
  raw?: R
  decode?: typeof decode
  secret?: string
} & Omit<JWTDecodeParams, "secret">

/** [Documentation](https://next-auth.js.org/tutorials/securing-pages-and-api-routes#using-gettoken) */
export async function getToken<R extends boolean = false>(
  params?: GetTokenParams<R>
): Promise<R extends true ? string : JWT | null> {
  const {
    req,
    // Use secure prefix for cookie name, unless URL is NEXTAUTH_URL is http://
    // or not set (e.g. development or test instance) case use unprefixed name
    secureCookie = !(
      !process.env.NEXTAUTH_URL ||
      process.env.NEXTAUTH_URL.startsWith("http://")
    ),
    cookieName: baseCookieName,
    raw = false,
    decode: _decode = decode,
  } = params ?? {}
  const cookieName =
    baseCookieName ?? secureCookie
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  if (!req) throw new Error("Must pass `req` to JWT getToken()")

  // Try to get token from cookie
  let token = req.cookies[cookieName]

  // If cookie not found in cookie look for bearer token in authorization header.
  // This allows clients that pass through tokens in headers rather than as
  // cookies to use this helper function.
  if (!token && req.headers.authorization?.split(" ")[0] === "Bearer") {
    const urlEncodedToken = req.headers.authorization.split(" ")[1]
    token = decodeURIComponent(urlEncodedToken)
  }

  if (raw) {
    // @ts-expect-error
    return token
  }

  try {
    // @ts-expect-error
    return await _decode({ token, ...params })
  } catch {
    // @ts-expect-error
    return null
  }
}

// Generate warning (but only once at startup) when auto-generated keys are used
let DERIVED_SIGNING_KEY_WARNING = false
let DERIVED_ENCRYPTION_KEY_WARNING = false

// Do the better hkdf of Node.js one added in `v15.0.0` and Third Party one
function hkdf(
  secret: Secret,
  {
    byteLength,
    encryptionInfo,
    digest = "sha256",
  }: { byteLength: number; encryptionInfo: string; digest?: string }
) {
  if (crypto.hkdfSync) {
    return Buffer.from(
      crypto.hkdfSync(
        digest,
        secret,
        Buffer.alloc(0),
        encryptionInfo,
        byteLength
      )
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("futoin-hkdf")(secret, byteLength, {
    info: encryptionInfo,
    hash: digest,
  })
}

function getDerivedSigningKey(secret: Secret) {
  if (!DERIVED_SIGNING_KEY_WARNING) {
    logger.warn("JWT_AUTO_GENERATED_SIGNING_KEY")
    DERIVED_SIGNING_KEY_WARNING = true
  }

  const buffer = hkdf(secret, {
    byteLength: 64,
    encryptionInfo: "NextAuth.js Generated Signing Key",
  })
  const key = jose.JWK.asKey(buffer, {
    alg: DEFAULT_SIGNATURE_ALGORITHM,
    use: "sig",
    kid: "nextauth-auto-generated-signing-key",
  })
  return key
}

function getDerivedEncryptionKey(secret: Secret) {
  if (!DERIVED_ENCRYPTION_KEY_WARNING) {
    logger.warn("JWT_AUTO_GENERATED_ENCRYPTION_KEY")
    DERIVED_ENCRYPTION_KEY_WARNING = true
  }

  const buffer = hkdf(secret, {
    byteLength: 32,
    encryptionInfo: "NextAuth.js Generated Encryption Key",
  })
  const key = jose.JWK.asKey(buffer, {
    alg: DEFAULT_ENCRYPTION_ALGORITHM,
    use: "enc",
    kid: "nextauth-auto-generated-encryption-key",
  })
  return key
}
