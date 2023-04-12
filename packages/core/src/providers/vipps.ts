import type { OIDCConfig, OIDCUserConfig } from "./index.js"

/** @see [User Profile Structure](https://vippsas.github.io/vipps-developer-docs/docs/APIs/login-api/vipps-login-api#userinfo) */
export interface VippsProfile extends Record<string, any> {
  sid: string
  birthdate: string
  email: string
  email_verified: boolean
  family_name: string
  given_name: string
  name: string
  phone_number: string
  sub: string
}

interface AdditonalConfig {
  redirectUri?: string
}

/**
 * @see [Vipps Login API](https://vippsas.github.io/vipps-developer-docs/docs/APIs/login-api/vipps-login-api)
 *
 * ## Example
 *
 * ```ts
 * import Vipps from "@auth/core/providers/vipps"
 * ...
 * providers: [
 *  Vipps({
 *    clientId: process.env.VIPPS_CLIENT_ID,
 *    clientSecret: process.env.VIPPS_CLIENT_SECRET,
 *  })
 * ]
 * ...
 * ```
 * ::: note
 * If you're testing, make sure to override the issuer option with apitest.vipps.no
 * :::
 */

export default function Vipps<P extends VippsProfile>(
  options: OIDCUserConfig<P> & AdditonalConfig
): OIDCConfig<P> {
  options.issuer ??= "https://api.vipps.no/access-management-1.0/access"
  return {
    id: "vipps",
    name: "Vipps",
    type: "oidc",
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    authorization: {
      params: {
        scope: "openid name email",
        client_id: options.clientId,
        response_type: "code",
      },
    },
    userinfo: {
      async request({ tokens }) {
        const response = await fetch(
          "https://apitest.vipps.no/vipps-userinfo-api/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        )

        return await response.json()
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
      }
    },
    style: {
      bgDark: "#f05c18",
      bg: "#f05c18",
      text: "#fff",
      textDark: "#fff",
      logo: "/vipps.svg",
      logoDark: "/vipps-dark.svg",
    },
    options,
  }
}
