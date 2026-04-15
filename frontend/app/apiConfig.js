// Dynamic API URL configuration
// When running behind nginx reverse proxy, use /api prefix
// Otherwise, use the full backend URL

export const getApiUrl = () => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  // If running on ngrok domain, use relative /api
  if (host.includes("ngrok")) {
    return `${protocol}//${host}/api`;
  }

  // If on localhost, use relative /api (nginx is on port 80)
  if (host === "localhost" || host === "127.0.0.1") {
    return `${protocol}//${host}/api`;
  }

  // Fallback for other domains
  return `${protocol}//${host}/api`;
};

export const API_URL = getApiUrl();
