import { createHash } from 'crypto'

import { CreateUserError } from '../../lib/errors'
import logger from '../../lib/logger'

const Adapter = (prismaConfig, options = {}) => {
  const { prisma, modelMapping = {
    User: 'user',
    Account: 'account',
    Session: 'session',
    VerificationRequest: 'verificationRequest'
  }} = prismaConfig

  const { User, Account, Session, VerificationRequest } = modelMapping

  async function getAdapter (appOptions) {
    function debugMessage(debugCode, ...args) {
      if (appOptions && appOptions.debug) {
        logger.debug(`PRISMA_${debugCode}`, ...args)
      }
    }

    if (appOptions && (!appOptions.session || !appOptions.session.maxAge)) {
      debugMessage('GET_ADAPTER', 'Session expiry not configured (defaulting to 30 days')
    }
    const defaultSessionMaxAge = 30 * 24 * 60 * 60 * 1000
    const sessionMaxAge = (appOptions && appOptions.session && appOptions.session.maxAge)
      ? appOptions.session.maxAge * 1000
      : defaultSessionMaxAge
    const sessionUpdateAge = (appOptions && appOptions.session && appOptions.session.updateAge)
      ? appOptions.session.updateAge * 1000
      : 0

    async function createUser (profile) {
      debugMessage('CREATE_USER', profile)
      try {
        return prisma[User].create({
          data: {
            name: profile.name,
            email: profile.email,
            image: profile.image,
            emailVerified: profile.emailVerified && 
            Object.prototype.toString.call(profile.emailVerified) === '[object Date]'
              ? profile.emailVerified.toISOString() 
              : null
          }
        })
      } catch (error) {
        logger.error('CREATE_USER_ERROR', error)
        return Promise.reject(new CreateUserError(error))
      }
    }

    async function getUser (id) {
      debugMessage('GET_USER', id)
      try {
        return prisma[User].findOne({ where: { id } })
      } catch (error) {
        logger.error('GET_USER_BY_ID_ERROR', error)
        return Promise.reject(new Error('GET_USER_BY_ID_ERROR', error))
      }
    }

    async function getUserByEmail (email) {
      debugMessage('GET_USER_BY_EMAIL', email)
      try {
        if (!email) { return Promise.resolve(null) }
        return prisma[User].findOne({ where: { email } })
      } catch (error) {
        logger.error('GET_USER_BY_EMAIL_ERROR', error)
        return Promise.reject(new Error('GET_USER_BY_EMAIL_ERROR', error))
      }
    }

    async function getUserByProviderAccountId (providerId, providerAccountId) {
      debugMessage('GET_USER_BY_PROVIDER_ACCOUNT_ID', providerId, providerAccountId)
      try {
        return prisma[Account].findOne({ where: { providerAccountId: `${providerAccountId}` } })[User]()
      } catch (error) {
        logger.error('GET_USER_BY_PROVIDER_ACCOUNT_ID_ERROR', error)
        return Promise.reject(new Error('GET_USER_BY_PROVIDER_ACCOUNT_ID_ERROR', error))
      }
    }

    async function updateUser (user) {
      debugMessage('UPDATE_USER', user)
      try {
        const { id, ...rest } = user
        return prisma[User].update({ where: { id }, data: rest })
      } catch (error) {
        logger.error('UPDATE_USER_ERROR', error)
        return Promise.reject(new Error('UPDATE_USER_ERROR', error))
      }
      
    }

    async function deleteUser (id) {
      debugMessage('DELETE_USER', userId)
      try {
        return prisma[User].delete({ where: { id } })
      } catch (error) {
        logger.error('DELETE_USER_ERROR', error)
        return Promise.reject(new Error('DELETE_USER_ERROR', error))
      }
    }

    async function linkAccount (userId, providerId, providerType, providerAccountId, refreshToken, accessToken, accessTokenExpires) {
      debugMessage('LINK_ACCOUNT', userId, providerId, providerType, providerAccountId, refreshToken, accessToken, accessTokenExpires)
      try {
        return prisma[Account].create({
          data: {
            accessToken,
            refreshToken,
            compoundId: createHash('sha256').update(`${providerId}:${providerAccountId}`).digest('hex'),
            providerAccountId: `${providerAccountId}`,
            providerId,
            providerType,
            accessTokenExpires,
            [User]: {
              connect: {
                id: userId
              }
            }
          }
        })
      } catch (error) {
        logger.error('LINK_ACCOUNT_ERROR', error)
        return Promise.reject(new Error('LINK_ACCOUNT_ERROR', error))
      }
    }

    async function unlinkAccount (userId, providerId, providerAccountId) {
      debugMessage('UNLINK_ACCOUNT', userId, providerId, providerAccountId)
      try {
        return prisma[Account].delete({ where: { providerAccountId: `${providerAccountId}` } })
      } catch (error) {
        logger.error('UNLINK_ACCOUNT_ERROR', error)
        return Promise.reject(new Error('UNLINK_ACCOUNT_ERROR', error))
      }
    }

    async function createSession (user) {
      debugMessage('CREATE_SESSION', user)
      try {
        let expires = null
        if (sessionMaxAge) {
          const dateExpires = new Date()
          dateExpires.setTime(dateExpires.getTime() + sessionMaxAge)
          expires = dateExpires.toISOString()
        }

        return prisma[Session].create({
          data: {
            expires,
            [User]: {
              connect: {
                id: user.id
              }
            }
          }
        })
      } catch (error) {
        logger.error('CREATE_SESSION_ERROR', error)
        return Promise.reject(new Error('CREATE_SESSION_ERROR', error))
      }
    }

    async function getSession (sessionToken) {
      debugMessage('GET_SESSION', sessionToken)
      try {
        const session = await prisma[Session].findOne({ where: { sessionToken }})

        // Check session has not expired (do not return it if it has)
        if (session && session.expires && new Date() > session.expires) {
          await prisma[Session].delete({ where: { sessionToken } })
          return null
        }

        return session
      } catch (error) {
        logger.error('GET_SESSION_ERROR', error)
        return Promise.reject(new Error('GET_SESSION_ERROR', error))
      }
    }

    async function updateSession (session, force) {
      debugMessage('UPDATE_SESSION', session)
      try {
        if (sessionMaxAge && (sessionUpdateAge || sessionUpdateAge === 0) && session.expires) {
          // Calculate last updated date, to throttle write updates to database
          // Formula: ({expiry date} - sessionMaxAge) + sessionUpdateAge
          //     e.g. ({expiry date} - 30 days) + 1 hour
          //
          // Default for sessionMaxAge is 30 days.
          // Default for sessionUpdateAge is 1 hour.
          const dateSessionIsDueToBeUpdated = new Date(session.expires)
          dateSessionIsDueToBeUpdated.setTime(dateSessionIsDueToBeUpdated.getTime() - sessionMaxAge)
          dateSessionIsDueToBeUpdated.setTime(dateSessionIsDueToBeUpdated.getTime() + sessionUpdateAge)

          // Trigger update of session expiry date and write to database, only
          // if the session was last updated more than {sessionUpdateAge} ago
          if (new Date() > dateSessionIsDueToBeUpdated) {
            const newExpiryDate = new Date()
            newExpiryDate.setTime(newExpiryDate.getTime() + sessionMaxAge)
            session.expires = newExpiryDate
          } else if (!force) {
            return null
          }
        } else {
          // If session MaxAge, session UpdateAge or session.expires are
          // missing then don't even try to save changes, unless force is set.
          if (!force) { return null }
        }

        const { id, ...rest } = session
        return prisma[Session].update({ where: { id }, data: rest })
      } catch (error) {
        logger.error('UPDATE_SESSION_ERROR', error)
        return Promise.reject(new Error('UPDATE_SESSION_ERROR', error))
      }
    }

    async function deleteSession (sessionToken) {
      debugMessage('DELETE_SESSION', sessionToken)
      try {
        return prisma[Session].delete({ where: { sessionToken } })
      } catch (error) {
        logger.error('DELETE_SESSION_ERROR', error)
        return Promise.reject(new Error('DELETE_SESSION_ERROR', error))
      }
    }

    async function createVerificationRequest (identifier, url, token, secret, provider) {
      debugMessage('CREATE_VERIFICATION_REQUEST', identifier)
      try {
        const { site } = appOptions
        const { sendVerificationRequest, maxAge } = provider

        // Store hashed token (using secret as salt) so that tokens cannot be exploited
        // even if the contents of the database is compromised.
        // @TODO Use bcrypt function here instead of simple salted hash
        const hashedToken = createHash('sha256').update(`${token}${secret}`).digest('hex')

        let expires = null
        if (maxAge) {
          const dateExpires = new Date()
          dateExpires.setTime(dateExpires.getTime() + (maxAge * 1000))
          expires = dateExpires.toISOString()
        }

        // Save to database
        const verificationRequest = await prisma[VerificationRequest].create({ data: {
          identifier,
          token: hashedToken,
          expires
        }})

        // With the verificationCallback on a provider, you can send an email, or queue
        // an email to be sent, or perform some other action (e.g. send a text message)
        await sendVerificationRequest({ identifier, url, token, site, provider })

        return verificationRequest
      } catch (error) {
        logger.error('CREATE_VERIFICATION_REQUEST_ERROR', error)
        return Promise.reject(new Error('CREATE_VERIFICATION_REQUEST_ERROR', error))
      }
    }

    async function getVerificationRequest (identifier, token, secret, provider) {
      debugMessage('GET_VERIFICATION_REQUEST', identifier, token)
      try {
        // Hash token provided with secret before trying to match it with database
        // @TODO Use bcrypt instead of salted SHA-256 hash for token
        const hashedToken = createHash('sha256').update(`${token}${secret}`).digest('hex')
        const verificationRequest = await prisma[VerificationRequest].findOne({ where: { token: hashedToken }})

        if (verificationRequest && verificationRequest.expires && new Date() > verificationRequest.expires) {
          // Delete verification entry so it cannot be used again
          await prisma[VerificationRequest].delete({ where: { token: hashedToken } })
          return null
        }

        return verificationRequest
      } catch (error) {
        logger.error('GET_VERIFICATION_REQUEST_ERROR', error)
        return Promise.reject(new Error('GET_VERIFICATION_REQUEST_ERROR', error))
      }
    }

    async function deleteVerificationRequest (identifier, token, secret, provider) {
      debugMessage('DELETE_VERIFICATION', identifier, token)
      try {
        // Delete verification entry so it cannot be used again
        const hashedToken = createHash('sha256').update(`${token}${secret}`).digest('hex')
        await prisma[VerificationRequest].delete({ where: { token: hashedToken } })
      } catch (error) {
        logger.error('DELETE_VERIFICATION_REQUEST_ERROR', error)
        return Promise.reject(new Error('DELETE_VERIFICATION_REQUEST_ERROR', error))
      }
    }

    return Promise.resolve({
      createUser,
      getUser,
      getUserByEmail,
      getUserByProviderAccountId,
      updateUser,
      deleteUser,
      linkAccount,
      unlinkAccount,
      createSession,
      getSession,
      updateSession,
      deleteSession,
      createVerificationRequest,
      getVerificationRequest,
      deleteVerificationRequest
    })
  }

  return {
    getAdapter
  }
}

export default {
  Adapter,
}