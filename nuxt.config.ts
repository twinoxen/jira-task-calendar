// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private keys (only available server-side)
    jiraBaseUrl: process.env.JIRA_BASE_URL,
    jiraEmail: process.env.JIRA_EMAIL,
    jiraApiToken: process.env.JIRA_API_TOKEN,
    jiraBoard: process.env.JIRA_BOARD,
    githubToken: process.env.GITHUB_TOKEN,
    githubOrg: process.env.GITHUB_ORG,
    githubRepos: process.env.GITHUB_REPOS,

    // Public keys (exposed to client)
    public: {
      appName: 'JIRA/GitHub Grind Analyzer',
    },
  },
});
