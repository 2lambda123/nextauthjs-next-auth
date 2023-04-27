interface ErrorCause extends Record<string, unknown> {}

export class AuthError extends Error {
  constructor(message: string | Error | ErrorCause, cause?: ErrorCause) {
    if (message instanceof Error) {
      super(undefined, {
        cause: { err: message, ...(message.cause as any), ...cause },
      })
    } else if (typeof message === "string") {
      if (cause instanceof Error) {
        cause = { err: cause, ...(cause.cause as any) }
      }
      super(message, cause)
    } else {
      super(undefined, message)
    }
    Error.captureStackTrace?.(this, this.constructor)
    this.name =
      message instanceof AuthError ? message.name : this.constructor.name
  }
}

/**
 * @todo
 * Thrown when an Email address is already associated with an account
 * but the user is trying an OAuth account that is not linked to it.
 */
export class AccountNotLinked extends AuthError {}

/**
 * @todo
 * One of the database `Adapter` methods failed.
 */
export class AdapterError extends AuthError {}

/** @todo */
export class AuthorizedCallbackError extends AuthError {}

/**
 * There was an error while trying to finish up authenticating the user.
 * Depending on the type of provider, this could be for multiple reasons.
 *
 * :::tip
 * Check out `[auth][details]` in the error message to know which provider failed.
 * @example
 * ```sh
 * [auth][details]: { "provider": "github" }
 * ```
 * :::
 *
 * For an **OAuth provider**, possible causes are:
 * - The user denied access to the application
 * - There was an error parsing the OAuth Profile:
 *   Check out the provider's `profile` or `userinfo.request` method to make sure
 *   it correctly fetches the user's profile.
 * - The `signIn` or `jwt` callback methods threw an uncaught error:
 *   Check the callback method implementations.
 *
 * For an **Email provider**, possible causes are:
 * - The provided email/token combination was invalid/missing:
 *   Check if the provider's `sendVerificationRequest` method correctly sends the email.
 * - The provided email/token combination has expired:
 *   Ask the user to log in again.
 * - There was an error with the database:
 *   Check the database logs.
 *
 * For a **Credentials provider**, possible causes are:
 * - The `authorize` method threw an uncaught error:
 *   Check the provider's `authorize` method.
 * - The `signIn` or `jwt` callback methods threw an uncaught error:
 *   Check the callback method implementations.
 *
 * :::tip
 * Check out `[auth][cause]` in the error message for more details.
 * It will show the original stack trace.
 * :::
 */
export class CallbackRouteError extends AuthError {}

/** @todo */
export class ErrorPageLoop extends AuthError {}

/** @todo */
export class EventError extends AuthError {}

/** @todo */
export class InvalidCallbackUrl extends AuthError {}

/** @todo */
export class InvalidEndpoints extends AuthError {}

/** @todo */
export class InvalidCheck extends AuthError {}

/** @todo */
export class JWTSessionError extends AuthError {}

/** @todo */
export class MissingAdapter extends AuthError {}

/** @todo */
export class MissingAdapterMethods extends AuthError {}

/** @todo */
export class MissingAPIRoute extends AuthError {}

/** @todo */
export class MissingAuthorize extends AuthError {}

/**
 * Auth.js requires a secret to be set, but none was not found. This is used to encrypt cookies, JWTs and other sensitive data.
 *
 * :::note
 * If you are using a framework like Next.js, we try to automatically infer the secret from the `AUTH_SECRET` environment variable.
 * Alternatively, you can also explicitly set the [`AuthConfig.secret`](https://authjs.dev/reference/core#secret).
 * :::
 *
 *
 * :::tip
 * You can generate a good secret value:
 *  - On Unix systems: type `openssl rand -hex 32` in the terminal
 *  - Or generate one [online](https://generate-secret.vercel.app/32)
 *
 * :::
 */
export class MissingSecret extends AuthError {}

/** @todo */
export class OAuthSignInError extends AuthError {}

/** @todo */
export class OAuthCallbackError extends AuthError {}

/** @todo */
export class OAuthCreateUserError extends AuthError {}

/**
 * This error occurs during an OAuth sign in attempt when the provdier's
 * response could not be parsed. This could for example happen if the provider's API
 * changed, or the [`OAuth2Config.profile`](https://authjs.dev/reference/core/providers_oauth#profile) method is not implemented correctly.
 */
export class OAuthProfileParseError extends AuthError {}

/** @todo */
export class SessionTokenError extends AuthError {}

/** @todo */
export class SignInError extends AuthError {}

/** @todo */
export class SignOutError extends AuthError {}

/**
 * Auth.js was requested to handle an operation that it does not support.
 *
 * See [`AuthAction`](https://authjs.dev/reference/core/types#authaction) for the supported actions.
 */
export class UnknownAction extends AuthError {}

/** @todo */
export class UnsupportedStrategy extends AuthError {}

/** @todo */
export class UntrustedHost extends AuthError {}

/**
 * The user's email/token combination was invalid.
 * This could be because the email/token combination was not found in the database,
 * or because it token has expired. Ask the user to log in again.
 */
export class Verification extends AuthError {}
