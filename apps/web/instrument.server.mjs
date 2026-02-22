/* eslint-disable node/prefer-global/process */
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.ENVIRONMENT !== "testing",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  tunnel: "/tunnel-v2",
});
