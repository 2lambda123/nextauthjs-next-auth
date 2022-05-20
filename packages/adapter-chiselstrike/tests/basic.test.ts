import { runBasicTests } from "@next-auth/adapter-test"
import { ChiselStrikeAdapter, ChiselStrikeAuthFetcher } from "../src"
import fetch from "cross-fetch"

const fetcher = new ChiselStrikeAuthFetcher('http://localhost:8080', '1234')
const adapter = ChiselStrikeAdapter(fetcher)

runBasicTests(
    {
        adapter,
        db: {
            connect: async () => {
                await fetcher.deleteEverything()
            },
            session: async (sessionToken: string) => {
                const s = await fetcher.filter(fetcher.sessions(`?.sessionToken=${sessionToken}`))
                return s ? { ...s, expires: new Date(s.expires) } : null
            },
            user: async (id: string) => {
                return await adapter.getUser(id)
            },
            account: async (providerAccountId: { provider: string; providerAccountId: string }) => {
                const providerFilter = providerAccountId.provider ? `.provider=${providerAccountId.provider}` : ''
                const providerAccountIdFilter =
                    providerAccountId.providerAccountId ? `.providerAccountId=${providerAccountId.providerAccountId}` : ''
                return await fetcher.filter(
                    fetcher.accounts(`?${providerFilter}&${providerAccountIdFilter}`))
            },
            verificationToken: async (params: { identifier: string; token: string }) => {
                const idFilter = `.identifier=${params.identifier}`
                const tokenFilter = `.token=${params.token}`
                let token = await fetcher.filter(
                    fetcher.tokens(`?${idFilter}&${tokenFilter}`))
                return token ? { ...token, expires: new Date(token.expires), id: undefined } : null
            }
        }
    }
)