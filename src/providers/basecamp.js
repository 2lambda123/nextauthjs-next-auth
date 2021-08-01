export default function Basecamp(options) {
  return {
    id: "basecamp",
    name: "Basecamp",
    type: "oauth",
    authorization:
      "https://launchpad.37signals.com/authorization/new?type=web_server",
    token:
      "https://launchpad.37signals.com/authorization/token?type=web_server",
    userinfo: "https://launchpad.37signals.com/authorization.json",
    profile(profile) {
      return {
        id: profile.identity.id,
        name: `${profile.identity.first_name} ${profile.identity.last_name}`,
        email: profile.identity.email_address,
        image: null,
      }
    },
    ...options,
  }
}
