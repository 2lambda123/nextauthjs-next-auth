export default function Mailchimp(options) {
  return {
    id: "mailchimp",
    name: "Mailchimp",
    type: "oauth",
    authorization: "https://login.mailchimp.com/oauth2/authorize",
    accessTokenUrl: "https://login.mailchimp.com/oauth2/token",
    profileUrl: "https://login.mailchimp.com/oauth2/metadata",
    profile: (profile) => {
      return {
        id: profile.login.login_id,
        name: profile.accountname,
        email: profile.login.email,
        image: null,
      }
    },
    ...options,
  }
}
