import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EmailProviderType } from "../providers"
import { signIn } from "../src/lib/actions"
import { NextAuthConfig } from "../src"
import { MemoryAdapter } from "../../core/test/memory-adapter"

let mockedHeaders = vi.hoisted(() => {
  return new globalThis.Headers()
})

const mockRedirect = vi.hoisted(() => vi.fn())
vi.mock("next/navigation", async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    // @ts-expect-error - not typed
    ...originalModule,
    redirect: mockRedirect,
  }
})

vi.mock("next/headers", async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    // @ts-expect-error - not typed
    ...originalModule,
    headers: () => mockedHeaders,
    cookies: () => {
      const cookies: { [key: string]: unknown } = {}
      return {
        get: (name: string) => {
          return cookies[name]
        },
        set: (name: string, value: string) => {
          cookies[name] = value
        },
      }
    },
  }
})

let options = {
  redirectTo: "http://localhost/dashboard",
  email: "jane@example.com",
}
let authorizationParams = {}
let config: NextAuthConfig = {
  secret: ["supersecret"],
  trustHost: true,
  basePath: "/api/auth",
  adapter: MemoryAdapter(),
  providers: [
    {
      id: "nodemailer",
      type: "email" as EmailProviderType,
      name: "Email",
      from: "no-reply@authjs.dev",
      maxAge: 86400,
      sendVerificationRequest: async () => { },
      options: {},
    },
  ],
}

describe("signIn", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_URL = "http://localhost"
  })

  afterEach(() => {
    process.env.NEXTAUTH_URL = undefined
    vi.resetModules()
  })

  it("redirects to verify URL", async () => {
    await signIn("nodemailer", options, authorizationParams, config)

    expect(mockRedirect).toHaveBeenCalledWith(
      "http://localhost/api/auth/verify-request?provider=nodemailer&type=email"
    )
  })

  describe("when Auth retunrs a web response", () => {
    function mockAuthResponse(locationUrl?: string) {
      vi.doMock("@auth/core", async (importOriginal) => {
        const original = await importOriginal()
        return {
          // @ts-expect-error - not typed
          ...original,
          Auth: () =>
            new Response(null, {
              headers: {
                ...(locationUrl && { Location: locationUrl }),
              },
            }),
        }
      })
    }

    it("handle web Response and get redirect URL from Location header", async () => {
      mockAuthResponse("http://localhost/api/auth/error?error=Configuration")
      const actionModule = await import("../src/lib/actions")
      const signIn = actionModule.signIn
      let redirectTo: string | undefined | null
      redirectTo = await signIn(
        "nodemailer",
        { ...options, redirect: false },
        authorizationParams,
        config
      )
      expect(redirectTo).toEqual(
        "http://localhost/api/auth/error?error=Configuration"
      )
    })

    it("redirects to signin URL when response is undefined", async () => {
      mockAuthResponse()
      const actionModule = await import("../src/lib/actions")
      const signIn = actionModule.signIn
      let redirectTo: string | undefined | null
      redirectTo = await signIn(
        "nodemailer",
        { ...options, redirect: false },
        authorizationParams,
        config
      )
      expect(redirectTo).toEqual(
        "http://localhost/api/auth/signin/nodemailer?"
      )
    })
  })
})
