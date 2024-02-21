import type { AuthAction, AuthConfig } from "../../types.js"

/** Set default env variables on the config object */
export function setEnvDefaults(envObject: any, config: AuthConfig) {
  try {
    const url = envObject.AUTH_URL
    if (url && !config.basePath) config.basePath = new URL(url).pathname
  } catch {
  } finally {
    config.basePath ??= `/auth`
  }

  if (!config.secret?.length) {
    config.secret = []
    const secret = envObject.AUTH_SECRET
    if (secret) config.secret.push(secret)
    for (const i of [1, 2, 3]) {
      const secret = envObject[`AUTH_SECRET_${i}`]
      if (secret) config.secret.unshift(secret)
    }
  }

  config.redirectProxyUrl ??= envObject.AUTH_REDIRECT_PROXY_URL
  config.trustHost ??= !!(
    envObject.AUTH_URL ??
    envObject.AUTH_TRUST_HOST ??
    envObject.VERCEL ??
    envObject.CF_PAGES ??
    envObject.NODE_ENV !== "production"
  )
  config.providers = config.providers.map((p) => {
    const finalProvider = typeof p === "function" ? p({}) : p
    const ID = finalProvider.id.toUpperCase()
    if (finalProvider.type === "oauth" || finalProvider.type === "oidc") {
      finalProvider.clientId ??= envObject[`AUTH_${ID}_ID`]
      finalProvider.clientSecret ??= envObject[`AUTH_${ID}_SECRET`]
      if (finalProvider.type === "oidc") {
        finalProvider.issuer ??= envObject[`AUTH_${ID}_ISSUER`]
      }
    } else if (finalProvider.type === "email") {
      finalProvider.apiKey ??= envObject[`AUTH_${ID}_KEY`]
    }
    return finalProvider
  })
}

export function createActionURL(
  action: AuthAction,
  protocol: string,
  headers: Headers,
  envObject: any,
  basePath?: string
): URL {
  let envUrl = envObject.AUTH_URL ?? envObject.NEXTAUTH_URL

  let detectedHost = headers.get("x-forwarded-host") ?? headers.get("host")
  let detectedProtocol = headers.get("x-forwarded-proto") ?? protocol ?? "https"

  let url: URL
  if (envUrl) {
    url = new URL(envUrl)
  } else {
    url = new URL(`${detectedProtocol}://${detectedHost}`)
  }

  // remove trailing slash
  const sanitizedUrl = url.toString().replace(/\/$/, "")
  // remove leading and trailing slash
  const sanitizedBasePath = basePath?.replace(/(^\/|\/$)/g, "") ?? ""

  return new URL(`${sanitizedUrl}/${sanitizedBasePath}/${action}`)
}
