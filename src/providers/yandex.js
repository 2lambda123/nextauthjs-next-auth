export default function Yandex(options) {
  return {
    id: "yandex",
    name: "Yandex",
    type: "oauth",
    authorization:
      "https://oauth.yandex.ru/authorize?scope=login:email+login:info",
    accessTokenUrl: "https://oauth.yandex.ru/token",
    profileUrl: "https://login.yandex.ru/info?format=json",
    profile(profile) {
      return {
        id: profile.id,
        name: profile.real_name,
        email: profile.default_email,
        image: null,
      }
    },
    ...options,
  }
}
