import { Profile, TokenSet, User } from "."
import { Awaitable, NextApiRequest } from "./internals/utils"
import { Options as SMTPConnectionOptions } from "nodemailer/lib/smtp-connection"
import {
  AuthorizationParameters,
  CallbackParamsType,
  IssuerMetadata,
  OAuthCallbackChecks,
  OpenIDCallbackChecks,
} from "openid-client"

export type ProviderType = "oauth" | "email" | "credentials"

export interface CommonProviderOptions {
  id: string
  name: string
  type: ProviderType
}

/**
 * OAuth Provider
 */

type ChecksType = "pkce" | "state" | "both" | "none"

export type OAuthChecks = OpenIDCallbackChecks | OAuthCallbackChecks

type PartialIssuer = Partial<Pick<IssuerMetadata, "jwks_endpoint" | "issuer">>

/**
 * OAuth provider options
 *
 * [Documentation](https://next-auth.js.org/configuration/providers#oauth-provider-options)
 */
export interface OAuthConfig<P extends Record<string, unknown> = Profile>
  extends CommonProviderOptions,
    PartialIssuer {
  authorization: string | { params?: AuthorizationParameters; url: string }
  token:
    | string
    | {
        url: string
        /**
         * If set to `true`, the user information will be extracted
         * from the `id_token` claims, instead of
         * making a request to the userinfo endpoint.
         *
         * It is usually present in OpenID Connect (OIDC) compliant providers.
         *
         * [`id_token` explanation](https://www.oauth.com/oauth2-servers/openid-connect/id-tokens)
         */
        idToken?: boolean
        /**
         * Control the OAuth `/token` endpoint request completely.
         * Useful if your provider relies on some custom behaviour.
         *
         * - ⚠ **This is an advanced option.**
         * You should **try to avoid using advanced options** unless you are very comfortable using them.
         */
        request?(params: {
          /** Provider is passed for convenience, but also contains the `callbackUrl`. */
          provider: OAuthConfig & {
            signinUrl: string
            callbackUrl: string
          }
          /**
           * Parameters extracted from the request to the `/api/auth/callback/:providerId` endpoint.
           * Contains params like `state`.
           */
          params: CallbackParamsType
          /**
           * When using this custom flow, you are on your own to do all the necessary security checks.
           * Thist object contains parameters you have to match against the request to make sure it is valid.
           */
          checks: OAuthChecks
        }): Promise<{ profile: Partial<P>; tokens: TokenSet }>
      }
  type: "oauth"
  version: string
  accessTokenUrl: string
  requestTokenUrl?: string
  profileUrl: string
  profile(profile: P, tokens: TokenSet): Awaitable<User & { id: string }>
  checks?: ChecksType | ChecksType[]
  clientId: string
  clientSecret:
    | string
    // TODO: only allow for Apple
    | Record<"appleId" | "teamId" | "privateKey" | "keyId", string>
  idToken?: boolean
  // TODO: only allow for BattleNet
  region?: string
  // TODO: only allow for some
  issuer?: string
  // TODO: only allow for Azure Active Directory B2C and FusionAuth
  tenantId?: string
}

export type OAuthProviderType =
  | "Apple"
  | "Atlassian"
  | "Auth0"
  | "AzureAD"
  | "AzureADB2C"
  | "Basecamp"
  | "BattleNet"
  | "Box"
  | "Bungie"
  | "Cognito"
  | "Coinbase"
  | "Discord"
  | "Dropbox"
  | "EVEOnline"
  | "Facebook"
  | "FACEIT"
  | "FortyTwo"
  | "Foursquare"
  | "FusionAuth"
  | "GitHub"
  | "GitLab"
  | "Google"
  | "IdentityServer4"
  | "Instagram"
  | "Kakao"
  | "LINE"
  | "LinkedIn"
  | "Mailchimp"
  | "MailRu"
  | "Medium"
  | "Naver"
  | "Netlify"
  | "Okta"
  | "Osso"
  | "Reddit"
  | "Salesforce"
  | "Slack"
  | "Spotify"
  | "Strava"
  | "Twitch"
  | "Twitter"
  | "VK"
  | "WordPress"
  | "WorkOS"
  | "Yandex"
  | "Zoho"
  | "Zoom"

export type OAuthProvider = (options: Partial<OAuthConfig>) => OAuthConfig

/**
 * Credentials Provider
 */

interface CredentialInput {
  label?: string
  type?: string
  value?: string
  placeholder?: string
}

export type Credentials = Record<string, CredentialInput>

interface CredentialsConfig<C extends Credentials = {}>
  extends CommonProviderOptions {
  type: "credentials"
  credentials: C
  authorize(
    credentials: Record<keyof C, string>,
    req: NextApiRequest
  ): Awaitable<User | null>
}

export type CredentialsProvider = <C extends Record<string, CredentialInput>>(
  options: Partial<CredentialsConfig<C>>
) => CredentialsConfig<C>

export type CredentialsProviderType = "Credentials"

export type SendVerificationRequest = (params: {
  identifier: string
  url: string
  baseUrl: string
  token: string
  provider: EmailConfig
}) => Awaitable<void>

export interface EmailConfig extends CommonProviderOptions {
  type: "email"
  // TODO: Make use of https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
  server: string | SMTPConnectionOptions
  /** @default "NextAuth <no-reply@example.com>" */
  from?: string
  /**
   * How long until the e-mail can be used to log the user in,
   * in seconds. Defaults to 1 day
   * @default 86400
   */
  maxAge?: number
  sendVerificationRequest: SendVerificationRequest
}

export type EmailProvider = (options: Partial<EmailConfig>) => EmailConfig

// TODO: Rename to Token provider
// when started working on https://github.com/nextauthjs/next-auth/discussions/1465
export type EmailProviderType = "Email"

export type Provider = OAuthConfig | EmailConfig | CredentialsConfig

export type BuiltInProviders = Record<OAuthProviderType, OAuthProvider> &
  Record<CredentialsProviderType, CredentialsProvider> &
  Record<EmailProviderType, EmailProvider>

export type AppProviders = Array<
  Provider | ReturnType<BuiltInProviders[keyof BuiltInProviders]>
>

export interface AppProvider extends CommonProviderOptions {
  signinUrl: string
  callbackUrl: string
}

declare const Providers: BuiltInProviders

export default Providers
