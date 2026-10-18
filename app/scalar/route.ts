import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  url: "/openapi.json",
  pageTitle: "UK Tax Calculator API",
  theme: "kepler",
  hideModels: false,
  showSidebar: true,
});
