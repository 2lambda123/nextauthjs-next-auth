import { randomBytes } from 'crypto'
import { EntitySchemaOptions } from 'typeorm/entity-schema/EntitySchemaOptions'

export class Session {
  userId: any
  expires: any
  sessionToken: string
  accessToken: string
  constructor (userId, expires, sessionToken?: string, accessToken?: string) {
    this.userId = userId
    this.expires = expires
    this.sessionToken = sessionToken || randomBytes(32).toString('hex')
    this.accessToken = accessToken || randomBytes(32).toString('hex')
  }
}

export const SessionSchema: EntitySchemaOptions<any> = {
  name: 'Session',
  target: Session,
  columns: {
    id: {
      // This property has `objectId: true` instead of `type: int` in MongoDB
      primary: true,
      type: 'int',
      generated: true
    },
    userId: {
      // This property is set to `type: objectId` on MongoDB databases
      type: 'int'
    },
    expires: {
      // The date the session expires (is updated when a session is active)
      type: 'timestamp'
    },
    sessionToken: {
      // The sessionToken should never be exposed to client side JavaScript
      type: 'varchar',
      unique: true
    },
    accessToken: {
      // The accessToken can be safely exposed to client side JavaScript to
      // to identify the owner of a session without exposing the sessionToken
      type: 'varchar',
      unique: true
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true
    }
  }
}
