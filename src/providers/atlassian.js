export default function Atlassian(options) {
  return {
    id: "atlassian",
    name: "Atlassian",
    type: "oauth",
    authorization: {
      url: "https://auth.atlassian.com/oauth/authorize",
      params: {
        audience: "api.atlassian.com",
        prompt: "consent",
      },
    },
    accessTokenUrl: "https://auth.atlassian.com/oauth/token",
    profileUrl: "https://api.atlassian.com/me",
    profile(profile) {
      return {
        id: profile.account_id,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
    ...options,
  }
}
