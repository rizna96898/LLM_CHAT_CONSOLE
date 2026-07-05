const STORAGE_KEYS = {
  BASE_PATH: "base_path",
  BASE_CHAT_PATH: "base_chat_path",
  FLASK_BASE_URL: "flask_base_url",
};

const DEFAULT_FLASK_BASE_URL = "http://127.0.0.1:5000";

const API_PATHS = {
  HEALTH: "/health",
  SELECT_BASE_PATH: "/settings/select_base_path",
  OPEN_SYSTEM_YAML: "/settings/open_system_yaml",
  LOAD_MODEL: "/settings/load_model",
};

const MESSAGE_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
};