/**
 * :::warning Deprecated
 * This module is being replaced by [`@auth/core/adapters`](https://authjs.dev/reference/core/adapters) and only kept for backwards compatibility.
 * :::
 *
 * @module adapters
 */

// TODO: remove this file and replace references with `@auth/core/adapters`

import {
  Adapter as CoreAdapter,
  AdapterAccount as CoreAdapterAccount,
  AdapterSession as CoreAdapterSession,
  AdapterUser as CoreAdapterUser,
  VerificationToken as CoreVerificationToken,
} from "@auth/core/adapters"

/**
 * @deprecated use `@auth/core/adapters`
 * Read more at: https://nextjs.authjs.dev/v5
 */
export type Adapter = CoreAdapter

/**
 * @deprecated use `@auth/core/adapters`
 * Read more at: https://nextjs.authjs.dev/v5
 */
export type AdapterAccount = CoreAdapterAccount

/**
 * @deprecated use `@auth/core/adapters`
 * Read more at: https://nextjs.authjs.dev/v5
 */
export type AdapterSession = CoreAdapterSession

/**
 * @deprecated use `@auth/core/adapters`
 * Read more at: https://nextjs.authjs.dev/v5
 */
export type AdapterUser = CoreAdapterUser

/**
 * @deprecated use `@auth/core/adapters`
 * Read more at: https://nextjs.authjs.dev/v5
 */
export type VerificationToken = CoreVerificationToken
