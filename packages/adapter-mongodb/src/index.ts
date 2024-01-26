/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>Official <a href="https://www.mongodb.com">MongoDB</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://www.mongodb.com">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/mongodb.svg" width="30" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/mongodb-adapter mongodb
 * ```
 *
 * @module @auth/mongodb-adapter
 */
import { ObjectId } from "mongodb"

import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "@auth/core/adapters"
import type { MongoClient } from "mongodb"

/** This is the interface of the MongoDB adapter options. */
export interface MongoDBAdapterOptions {
  /**
   * The name of the {@link https://www.mongodb.com/docs/manual/core/databases-and-collections/#collections MongoDB collections}.
   */
  collections?: {
    Users?: string
    Accounts?: string
    Sessions?: string
    VerificationTokens?: string
  }
  /**
   * The name you want to give to the MongoDB database
   */
  databaseName?: string
}

export const defaultCollections: Required<
  Required<MongoDBAdapterOptions>["collections"]
> = {
  Users: "users",
  Accounts: "accounts",
  Sessions: "sessions",
  VerificationTokens: "verification_tokens",
}

export const format = {
  /** Takes an object that's coming from a database and converts it to plain JavaScript. */
  from<T extends Record<string, any> | null>(object: T, withId?: boolean) {
    if (!object) return null
    const newObject: any = {}
    for (const [key, value] of Object.entries(object))
      if (key === "_id") newObject.id = value.toHexString()
      else if (key === "userId") newObject[key] = value.toHexString()
      else newObject[key] = value
    if (!withId) delete newObject.id
    return newObject
  },
  /** Takes an object that's coming from Auth.js and prepares it to be written to the database. */
  to<T extends Record<string, any>>(object: T) {
    const newObject: any = {}
    for (const [key, value] of Object.entries(object))
      if (key === "id") newObject._id = _id(value)
      else if (key === "userId") newObject[key] = _id(value)
      else newObject[key] = value
    return newObject as NonNullable<T>
  },
}

/** @internal */
export function _id(hex?: any) {
  if (hex instanceof ObjectId) return hex
  if (hex?.length !== 24) return new ObjectId()
  return new ObjectId(hex)
}

/**
 * ## Setup
 *
 * The MongoDB adapter does not handle connections automatically, so you will have to make sure that you pass the Adapter a `MongoClient` that is connected already. Below you can see an example how to do this.
 *
 * ### Add the MongoDB client
 *
 * ```ts
 * // This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
 * import { MongoClient } from "mongodb"
 *
 * if (!process.env.MONGODB_URI) {
 *   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
 * }
 *
 * const uri = process.env.MONGODB_URI
 * const options = {}
 *
 * let client
 * let clientPromise: Promise<MongoClient>
 *
 * if (process.env.NODE_ENV === "development") {
 *   // In development mode, use a global variable so that the value
 *   // is preserved across module reloads caused by HMR (Hot Module Replacement).
 *   if (!global._mongoClientPromise) {
 *     client = new MongoClient(uri, options)
 *     global._mongoClientPromise = client.connect()
 *   }
 *   clientPromise = global._mongoClientPromise
 * } else {
 *   // In production mode, it's best to not use a global variable.
 *   client = new MongoClient(uri, options)
 *   clientPromise = client.connect()
 * }
 *
 * // Export a module-scoped MongoClient promise. By doing this in a
 * // separate module, the client can be shared across functions.
 * export default clientPromise
 * ```
 *
 * ### Configure Auth.js
 *
 * ```js
 * import NextAuth from "next-auth"
 * import { MongoDBAdapter } from "@auth/mongodb-adapter"
 * import clientPromise from "../../../lib/mongodb"
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/providers/oauth
 * export default NextAuth({
 *   adapter: MongoDBAdapter(clientPromise),
 *   ...
 * })
 * ```
 **/
export function MongoDBAdapter(
  client: Promise<MongoClient>,
  options: MongoDBAdapterOptions = {}
): Adapter {
  const { from, to } = format
  const c = { ...defaultCollections, ...options.collections }

  const db = client.then((db) => {
    const _db = db.db(options.databaseName)
    return {
      U: _db.collection<AdapterUser>(c.Users),
      A: _db.collection<AdapterAccount>(c.Accounts),
      S: _db.collection<AdapterSession>(c.Sessions),
      V: _db.collection<VerificationToken>(c?.VerificationTokens),
    }
  })

  return {
    async createUser(data) {
      const user = to(data)
      await (await db).U.insertOne(user)
      return from(user, true)
    },
    async getUser(id) {
      return from(await (await db).U.findOne({ _id: _id(id) }), true)
    },
    async getUserByEmail(email) {
      return from(await (await db).U.findOne({ email }), true)
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await (await db).A.findOne(provider_providerAccountId)
      if (!account) return null
      const user = await (await db).U.findOne({ _id: _id(account.userId) })
      if (!user) return null
      return from(user, true)
    },
    async updateUser(data) {
      const user = await (
        await db
      ).U.findOneAndUpdate(
        { _id: _id(data.id) },
        { $set: data },
        { returnDocument: "after" }
      )
      return from(user, true)
    },
    async deleteUser(id) {
      const userId: any = _id(id)
      const m = await db
      const [user] = await Promise.all([
        m.U.findOneAndDelete({ _id: userId }),
        m.A.deleteMany({ userId }),
        m.S.deleteMany({ userId }),
      ])
      return from(user, true)
    },
    async linkAccount(account) {
      await (await db).A.insertOne(to(account))
      return account
    },
    async unlinkAccount(provider_providerAccountId) {
      const account = await (
        await db
      ).A.findOneAndDelete(provider_providerAccountId)
      return from(account)
    },
    async getSessionAndUser(sessionToken) {
      const session = await (await db).S.findOne({ sessionToken })
      if (!session) return null
      const user = await (await db).U.findOne({ _id: _id(session.userId) })
      return { user: from(user, true), session: from(session) }
    },
    async createSession(session) {
      await (await db).S.insertOne(to(session))
      return session
    },
    async updateSession(session) {
      const updatedSession = await (
        await db
      ).S.findOneAndUpdate(
        { sessionToken: session.sessionToken },
        { $set: session },
        { returnDocument: "after" }
      )
      return from(updatedSession)
    },
    async deleteSession(sessionToken) {
      return from(await (await db).S.findOneAndDelete({ sessionToken }))
    },
    async createVerificationToken(verificationToken) {
      await (await db).V.insertOne(to(verificationToken))
      return verificationToken
    },
    async useVerificationToken(params) {
      return from(await (await db).V.findOneAndDelete(params))
    },
  }
}
