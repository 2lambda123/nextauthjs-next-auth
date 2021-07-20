export default function Discord(options) {
  return {
    id: "discord",
    name: "Discord",
    type: "oauth",
    authorization:
      "https://discord.com/api/oauth2/authorize?scope=identify+email",
    accessTokenUrl: "https://discord.com/api/oauth2/token",
    profileUrl: "https://discord.com/api/users/@me",
    profile(profile) {
      if (profile.avatar === null) {
        const defaultAvatarNumber = parseInt(profile.discriminator) % 5
        profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
      } else {
        const format = profile.avatar.startsWith("a_") ? "gif" : "png"
        profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
      }
      return {
        id: profile.id,
        name: profile.username,
        image: profile.image_url,
        email: profile.email,
      }
    },
    ...options,
  }
}
