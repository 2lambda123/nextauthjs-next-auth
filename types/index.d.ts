// Minimum TypeScript Version: 3.5

/// <reference types="node" />

import { ConnectionOptions } from "typeorm"
import { Adapter } from "./adapters"
import { JWTOptions, JWT } from "./jwt"
import { AppProviders } from "./providers"
import {
  Awaitable,
  NextApiRequest,
  NextApiResponse,
  NextApiHandler,
} from "internals/utils"

/**
 * Configure your NextAuth instance
 *
 * [Documentation](https://next-auth.js.org/configuration/options#options)
 */
export interface NextAuthOptions {
  /**
   * An array of authentication providers for signing in
   * (e.g. Google, Facebook, Twitter, GitHub, Email, etc) in any order.
   * This can be one of the built-in providers or an object with a custom provider.
   * * **Default value**: `[]`
   * * **Required**: *Yes*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#providers) | [Providers documentaion](https://next-auth.js.org/configuration/providers)
   */
  providers: AppProviders
  /**
   * A database connection string or configuration object.
   * * **Default value**: `null`
   * * **Required**: *No (unless using email provider)*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#database) | [Databases](https://next-auth.js.org/configuration/databases)
   */
  database?: string | Record<string, any> | ConnectionOptions
  /**
   * A random string used to hash tokens, sign cookies and generate crytographic keys.
   * If not specified is uses a hash of all configuration options, including Client ID / Secrets for entropy.
   * The default behaviour is volatile, and **it is strongly recommended** you explicitly specify a value
   * to avoid invalidating end user sessions when configuration changes are deployed.
   * * **Default value**: `string` (SHA hash of the "options" object)
   * * **Required**: No - **but strongly recommended**!
   *
   * [Documentation](https://next-auth.js.org/configuration/options#secret)
   */
  secret?: string
  /**
   * Configure your session like if you want to use JWT or a database,
   * how long until an idle session expires, or to throttle write operations in case you are using a database.
   * * **Default value**: See the documentaion page
   * * **Required**: No
   *
   * [Documentation](https://next-auth.js.org/configuration/options#session)
   */
  session?: SessionOptions
  /**
   * JSON Web Tokens can be used for session tokens if enabled with the `session: { jwt: true }` option.
   * JSON Web Tokens are enabled by default if you have not specified a database.
   * By default JSON Web Tokens are signed (JWS) but not encrypted (JWE),
   * as JWT encryption adds additional overhead and comes with some caveats.
   * You can enable encryption by setting `encryption: true`.
   * * **Default value**: See the documentation page
   * * **Required**: *No*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#jwt)
   */
  jwt?: JWTOptions
  /**
   * Specify URLs to be used if you want to create custom sign in, sign out and error pages.
   * Pages specified will override the corresponding built-in page.
   * * **Default value**: `{}`
   * * **Required**: *No*
   * @example
   *
   * ```js
   *   pages: {
   *     signIn: '/auth/signin',
   *     signOut: '/auth/signout',
   *     error: '/auth/error',
   *     verifyRequest: '/auth/verify-request',
   *     newUser: null
   *   }
   * ```
   *
   * [Documentation](https://next-auth.js.org/configuration/options#pages) | [Pages documentaion](https://next-auth.js.org/configuration/pages)
   */
  pages?: PagesOptions
  /**
   * Callbacks are asynchronous functions you can use to control what happens when an action is performed.
   * Callbacks are *extremely powerful*, especially in scenarios involving JSON Web Tokens
   * as they **allow you to implement access controls without a database** and to **integrate with external databases or APIs**.
   * * **Default value**: See the Callbacks documentaion
   * * **Required**: *No*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#callbacks) | [Callbacks documentaion](https://next-auth.js.org/configuration/callbacks)
   */
  callbacks?: CallbacksOptions
  /**
   * Events are asynchronous functions that do not return a response, they are useful for audit logging.
   * You can specify a handler for any of these events below - e.g. for debugging or to create an audit log.
   * The content of the message object varies depending on the flow
   * (e.g. OAuth or Email authentication flow, JWT or database sessions, etc),
   * but typically contains a user object and/or contents of the JSON Web Token
   * and other information relevant to the event.
   * * **Default value**: `{}`
   * * **Required**: *No*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#events) | [Events documentaion](https://next-auth.js.org/configuration/events)
   */
  events?: EventsOptions
  /**
   * By default NextAuth.js uses a database adapter that uses TypeORM and supports MySQL, MariaDB, Postgres and MongoDB and SQLite databases.
   * An alternative adapter that uses Prisma, which currently supports MySQL, MariaDB and Postgres, is also included.
   * You can use the adapter option to use the Prisma adapter - or pass in your own adapter
   * if you want to use a database that is not supported by one of the built-in adapters.
   * * **Default value**: TypeORM adapter
   * * **Required**: *No*
   *
   * - ⚠ If the `adapter` option is specified it overrides the `database` option, only specify one or the other.
   * - ⚠ Adapters are being migrated to their own home in a Community maintained repository.
   *
   * [Documentation](https://next-auth.js.org/configuration/options#adapter) |
   * [Default adapter](https://next-auth.js.org/schemas/adapters#typeorm-adapter) |
   * [Community adapters](https://github.com/nextauthjs/adapters)
   */
  adapter?: Adapter
  /**
   * Set debug to true to enable debug messages for authentication and database operations.
   * * **Default value**: `false`
   * * **Required**: *No*
   *
   * - ⚠ If you added a custom `logger`, this setting is ignored.
   *
   * [Documentation](https://next-auth.js.org/configuration/options#debug) | [Logger documentaion](https://next-auth.js.org/configuration/options#logger)
   */
  debug?: boolean
  /**
   * Override any of the logger levels (`undefined` levels will use the built-in logger),
   * and intercept logs in NextAuth. You can use this option to send NextAuth logs to a third-party logging service.
   * * **Default value**: `console`
   * * **Required**: *No*
   *
   * @example
   *
   * ```js
   * // /pages/api/auth/[...nextauth].js
   * import log from "logging-service"
   * export default NextAuth({
   *   logger: {
   *     error(code, ...message) {
   *       log.error(code, message)
   *     },
   *     warn(code, ...message) {
   *       log.warn(code, message)
   *     },
   *     debug(code, ...message) {
   *       log.debug(code, message)
   *     }
   *   }
   * })
   * ```
   *
   * - ⚠ When set, the `debug` option is ignored
   *
   * [Documentation](https://next-auth.js.org/configuration/options#logger) | [Debug documentaion](https://next-auth.js.org/configuration/options#debug)
   */
  logger?: LoggerInstance
  /**
   * Changes the theme of pages.
   * Set to `"light"` if you want to force pages to always be light.
   * Set to `"dark"` if you want to force pages to always be dark.
   * Set to `"auto"`, (or leave this option out)if you want the pages to follow the preferred system theme.
   * * **Default value**: `"auto"`
   * * **Required**: *No*
   *
   * [Documentation](https://next-auth.js.org/configuration/options#theme) | [Pages documentation]("https://next-auth.js.org/configuration/pages")
   */
  theme?: "auto" | "dark" | "light"
  /**
   * When set to `true` then all cookies set by NextAuth.js will only be accessible from HTTPS URLs.
   * This option defaults to `false` on URLs that start with http:// (e.g. http://localhost:3000) for developer convenience.
   * You can manually set this option to `false` to disable this security feature and allow cookies
   * to be accessible from non-secured URLs (this is not recommended).
   * * **Default value**: `true` for HTTPS and `false` for HTTP sites
   * * **Required**: No
   *
   * [Documentation](https://next-auth.js.org/configuration/options#usesecurecookies)
   *
   * - ⚠ **This is an advanced option.** Advanced options are passed the same way as basic options,
   * but **may have complex implications** or side effects.
   * You should **try to avoid using advanced options** unless you are very comfortable using them.
   */
  useSecureCookies?: boolean
  /**
   * You can override the default cookie names and options for any of the cookies used by NextAuth.js.
   * You can specify one or more cookies with custom properties,
   * but if you specify custom options for a cookie you must provide all the options for that cookie.
   * If you use this feature, you will likely want to create conditional behaviour
   * to support setting different cookies policies in development and production builds,
   * as you will be opting out of the built-in dynamic policy.
   * * **Default value**: `{}`
   * * **Required**: No
   *
   * - ⚠ **This is an advanced option.** Advanced options are passed the same way as basic options,
   * but **may have complex implications** or side effects.
   * You should **try to avoid using advanced options** unless you are very comfortable using them.
   *
   * [Documentation](https://next-auth.js.org/configuration/options#cookies) | [Usage example](https://next-auth.js.org/configuration/options#example)
   */
  cookies?: CookiesOptions
}

export interface LoggerInstance {
  warn(code: string, ...message: unknown[]): void
  error(code: string, ...message: unknown[]): void
  debug(code: string, ...message: unknown[]): void
}

export interface TokenSet {
  accessToken: string
  idToken?: string
  refreshToken?: string
  access_token: string
  expires_in?: number | null
  refresh_token?: string
  id_token?: string
}

export interface Account extends TokenSet, Record<string, unknown> {
  id: string
  provider: string
  type: string
}

export interface Profile extends Record<string, unknown> {
  sub?: string
  name?: string
  email?: string
  image?: string
}

export interface CallbacksOptions<
  P extends Record<string, unknown> = Profile,
  A extends Record<string, unknown> = Account
> {
  signIn?(user: User, account: A, profile: P): Awaitable<string | boolean>
  redirect?(url: string, baseUrl: string): Awaitable<string>
  session?(session: Session, userOrToken: JWT | User): Awaitable<Session>
  jwt?(
    token: JWT,
    user?: User,
    account?: A,
    profile?: P,
    isNewUser?: boolean
  ): Awaitable<JWT>
}

export interface CookieOption {
  name: string
  options: {
    httpOnly: boolean
    sameSite: true | "strict" | "lax" | "none"
    path?: string
    secure: boolean
    maxAge?: number
    domain?: string
  }
}

export interface CookiesOptions {
  sessionToken?: CookieOption
  callbackUrl?: CookieOption
  csrfToken?: CookieOption
  pkceCodeVerifier?: CookieOption
}

export type EventType =
  | "signIn"
  | "signOut"
  | "createUser"
  | "updateUser"
  | "linkAccount"
  | "session"
  | "error"

export type EventCallback = (message: any) => Promise<void>

export type EventsOptions = Partial<Record<EventType, EventCallback>>

export interface PagesOptions {
  signIn?: string
  signOut?: string
  /** Error code passed in query string as ?error= */
  error?: string
  verifyRequest?: string
  /** If set, new users will be directed here on first sign in */
  newUser?: string
}

export interface Session extends Record<string, unknown> {
  user?: User
  accessToken?: string
  expires: string
}

export interface SessionOptions {
  jwt?: boolean
  maxAge?: number
  updateAge?: number
}

export interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

declare function NextAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  options: NextAuthOptions
): ReturnType<NextApiHandler>

declare function NextAuth(options: NextAuthOptions): ReturnType<NextApiHandler>

export default NextAuth
