function getFlaskBaseUrl() {
  return (
    flaskBaseUrlInput?.value.trim() ||
    localStorage.getItem(FLASK_BASE_URL_KEY) ||
    "http://127.0.0.1:5000"
  );
}