import { JWT as JoseJWT, JWE } from "jose"
import { NextApiRequest } from "internals/utils"

export interface JWT extends Record<string, unknown> {
  name?: string | null
  email?: string | null
  picture?: string | null
}

export interface JWTEncodeParams {
  token?: JWT
  maxAge?: number
  secret: string | Buffer
  signingKey?: string
  signingOptions?: JoseJWT.SignOptions
  encryptionKey?: string
  encryptionOptions?: object
  encryption?: boolean
}

export function encode(params?: JWTEncodeParams): Promise<string>

export interface JWTDecodeParams {
  token?: string
  maxAge?: number
  secret: string | Buffer
  signingKey?: string
  verificationKey?: string
  verificationOptions?: JoseJWT.VerifyOptions<false>
  encryptionKey?: string
  decryptionKey?: string
  decryptionOptions?: JWE.DecryptOptions<false>
  encryption?: boolean
}

export function decode(params?: JWTDecodeParams): Promise<JWT>

export type GetTokenParams<R> = {
  req: NextApiRequest
  secureCookie?: boolean
  cookieName?: string
  raw?: R
  decode?: typeof decode
  secret?: string
} & Omit<JWTDecodeParams, "secret">

export function getToken<R extends boolean = false>(
  params?: GetTokenParams<R>
): Promise<R extends true ? string : JWT>

export interface JWTOptions {
  secret?: string
  maxAge?: number
  encryption?: boolean
  signingKey?: string
  encryptionKey?: string
  encode?: typeof encode
  decode?: typeof decode
  verificationOptions?: JoseJWT.VerifyOptions<false>
}
