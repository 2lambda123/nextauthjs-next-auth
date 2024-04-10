import nextra from "nextra"

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  defaultShowCopyCode: true,
  codeHighlight: true,
})

export default withNextra({
  experimental: {
    serverComponentsExternalPackages: ["@shikijs/twoslash"],
  },
})
