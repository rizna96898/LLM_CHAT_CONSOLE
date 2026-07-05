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

const FLASK_BASE_URL_KEY = "flask_base_url";
const BASE_CHAT_PATH_KEY = "base_chat_path";

const API_PATHS = {
  HEALTH: "/health",
  WORLD_START: "/world_start",
  CHAT_STARTUP: "/chat_startup",
  NEW_CHAT: "/new_chat",
  DELETE_SESSION: "/delete_session",
  LOAD_SESSION_LIST: "/load_session_list",
};

const STORAGE_KEY = "char_list";
const FLASK_BASE_URL = "http://127.0.0.1:5000";
const BASE_CHAT_PATH_KEY = "base_chat_path";

// 定数化候補
// "/settings/load_character_settings"
// "/settings/get_template_character_yaml"
// "/settings/load_image"
// "/settings/save_image"
// "/settings/save_character_setting"

const STORAGE_KEY = "player_list";
const FLASK_BASE_URL = "http://127.0.0.1:5000";
const BASE_CHAT_PATH_KEY = "base_chat_path";

// 定数化候補
// /settings/get_template_player_yaml
// /settings/save_image
// /settings/save_player_setting

const FLASK_BASE_URL = "http://127.0.0.1:5000";
const WORLD_LIST_STORAGE_KEY = "world_list";

// 定数化候補
// "base_chat_path"
// "selected_world_id"
// "player_list"
// "char_list"
// /settings/get_template_world_include_player_yaml
// /settings/get_template_world_goal_setting_yaml
// /settings/get_template_world_parameter_setting_yaml
// /settings/save_world_setting
// /settings/load_world_settings