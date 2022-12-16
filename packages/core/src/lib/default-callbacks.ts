import type { CallbacksOptions } from "../index.js"

export const defaultCallbacks: CallbacksOptions = {
  authorized() {
    return true
  },
  redirect({ url, baseUrl }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`
    else if (new URL(url).origin === baseUrl) return url
    return baseUrl
  },
  session({ session }) {
    return session
  },
  jwt({ token }) {
    return token
  },
}
