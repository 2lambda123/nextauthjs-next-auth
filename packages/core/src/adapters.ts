/**
 * The `@auth/core/adapters` module contains useful helpers that a database adapter
 * can incorporate in order to be compatible with Auth.js.
 * You can think of an adapter as a way to normalize database implementation details to a common interface
 * that Auth.js can use to interact with the database.
 *
 * Auth.js supports 2 session strtategies to persist the login state of a user.
 * The default is to use a cookie + {@link https://authjs.dev/concepts/session-strategies#jwt JWT}
 * based session store (`strategy: "jwt"`),
 * but you can also use a database adapter to store the session in a database.
 *
 * :::info Note
 * Auth.js _currently_ does **not** implement {@link https://authjs.dev/concepts/session-strategies#federated-logout federated logout}.
 * So even if the session is deleted from the database, the user will still be logged in to the provider.
 * See [this discussion](https://github.com/nextauthjs/next-auth/discussions/3938) for more information.
 * :::
 *
 * ## Installation
 *
 * ```bash npm2yarn2pnpm
 * npm install @auth/core
 * ```
 *
 * ## Usage
 *
 * {@link https://authjs.dev/reference/adapters/overview Built-in adapters} already implement this interface, so you likely won't need to
 * implement it yourself. If you do, you can use the following example as a
 * starting point.
 *
 * ```ts
 * // src/your-adapter.ts
 * import { type Adapter } from "@auth/core/adapters"
 *
 * export function MyAdapter(options: any): Adapter {
 *  // implement the adapter methods
 * }
 *
 * // src/index.ts
 * import { MyAdapter } from "./your-adapter"
 *
 * const response = Auth({
 *   adapter: MyAdapter({ ...adapter options }),
 *   ... auth options
 * })
 * ```
 *
 * @module adapters
 */

import type { Account, Awaitable, User } from "./types.js"

// TODO: Discuss if we should expose methods to serialize and deserialize
// the data? Many adapters share this logic, so it could be useful to
// have a common implementation.

export interface AdapterUser extends User {
  id: string
  email: string
  emailVerified: Date | null
}

export interface AdapterAccount extends Account {
  userId: string
}

/**
 * The session object implementing this interface is
 * is used to look up the user in the database.
 */
export interface AdapterSession {
  /** A randomly generated value that is used to get hold of the session. */
  sessionToken: string
  /** Connects the active session to a user in the database */
  userId: string
  /**
   * The absolute date when the session expires.
   *
   * If a session is accessed prior to its expiry date,
   * it will be extended based on the `maxAge` option as defined in by {@linkcode SessionOptions.maxAge}.
   * It is never extended more than once in a period defined by {@linkcode SessionOptions.updateAge}.
   *
   * If a session is accessed past its expiry date,
   * it will be removed from the database to clean up inactive sessions.
   *
   */
  expires: Date
}

export interface VerificationToken {
  identifier: string
  expires: Date
  token: string
}

/**
 * Using a custom adapter you can connect to any database backend or even
 * several different databases. Custom adapters created and maintained by our
 * community can be found in the adapters repository. Feel free to add a custom
 * adapter from your project to the repository, or even become a maintainer of a
 * certain adapter. Custom adapters can still be created and used in a project
 * without being added to the repository.
 *
 * ## Useful resources
 *
 * @see [Session strategies](https://authjs.dev/concepts/session-strategies#database)
 * @see [Using a database adapter](https://authjs.dev/guides/adapters/using-a-database-adapter)
 * @see [Creating a database adapter](https://authjs.dev/guides/adapters/creating-a-database-adapter)
 */
export type Adapter<WithVerificationToken = boolean> = DefaultAdapter &
  (WithVerificationToken extends true
    ? {
        createVerificationToken: (
          verificationToken: VerificationToken
        ) => Awaitable<VerificationToken | null | undefined>
        /**
         * Return verification token from the database and delete it so it
         * cannot be used again.
         */
        useVerificationToken: (params: {
          identifier: string
          token: string
        }) => Awaitable<VerificationToken | null>
      }
    : {})

export interface DefaultAdapter {
  createUser: (user: Omit<AdapterUser, "id">) => Awaitable<AdapterUser>
  getUser: (id: string) => Awaitable<AdapterUser | null>
  getUserByEmail: (email: string) => Awaitable<AdapterUser | null>
  /**
   * Using the provider id and the id of the user for a specific account, get
   * the user.
   */
  getUserByAccount: (
    providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">
  ) => Awaitable<AdapterUser | null>
  updateUser: (user: Partial<AdapterUser>) => Awaitable<AdapterUser>
  /** @todo Implement */
  deleteUser?: (
    userId: string
  ) => Promise<void> | Awaitable<AdapterUser | null | undefined>
  linkAccount: (
    account: AdapterAccount
  ) => Promise<void> | Awaitable<AdapterAccount | null | undefined>
  /** @todo Implement */
  unlinkAccount?: (
    providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">
  ) => Promise<void> | Awaitable<AdapterAccount | undefined>
  /** Creates a session for the user and returns it. */
  createSession: (session: {
    sessionToken: string
    userId: string
    expires: Date
  }) => Awaitable<AdapterSession>
  getSessionAndUser: (
    sessionToken: string
  ) => Awaitable<{ session: AdapterSession; user: AdapterUser } | null>
  updateSession: (
    session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">
  ) => Awaitable<AdapterSession | null | undefined>
  /**
   * Deletes a session from the database. It is preferred that this method also
   * returns the session that is being deleted for logging purposes.
   */
  deleteSession: (
    sessionToken: string
  ) => Promise<void> | Awaitable<AdapterSession | null | undefined>
  createVerificationToken?: (
    verificationToken: VerificationToken
  ) => Awaitable<VerificationToken | null | undefined>
  /**
   * Return verification token from the database and delete it so it cannot be
   * used again.
   */
  useVerificationToken?: (params: {
    identifier: string
    token: string
  }) => Awaitable<VerificationToken | null>
}
