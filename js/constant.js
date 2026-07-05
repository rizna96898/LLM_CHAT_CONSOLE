const STORAGE_KEYS = {
  BASE_PATH: "base_path",
  BASE_CHAT_PATH: "base_chat_path",
  FLASK_BASE_URL: "flask_base_url",

  WORLD_LIST: "world_list",
  PLAYER_LIST: "player_list",
  CHARACTER_LIST: "char_list",

  SELECTED_WORLD_ID: "selected_world_id",
  SELECTED_WORLD_NAME: "selected_world_name",
  SELECTED_SESSION_ID: "selected_session_id",
};

const DEFAULT_FLASK_BASE_URL = "http://127.0.0.1:5000";

const API_PATHS = {
  HEALTH: "/health",

  CHAT_STARTUP: "/chat_startup",
  NEW_CHAT: "/new_chat",
  WORLD_START: "/world_start",
  DELETE_SESSION: "/delete_session",
  LOAD_SESSION_LIST: "/load_session_list",

  SELECT_BASE_PATH: "/settings/select_base_path",
  OPEN_SYSTEM_YAML: "/settings/open_system_yaml",
  LOAD_MODEL: "/settings/load_model",

  LOAD_IMAGE: "/settings/load_image",
  SAVE_IMAGE: "/settings/save_image",

  LOAD_CHARACTER_SETTINGS: "/settings/load_character_settings",
  GET_TEMPLATE_CHARACTER_YAML: "/settings/get_template_character_yaml",
  SAVE_CHARACTER_SETTING: "/settings/save_character_setting",

  GET_TEMPLATE_PLAYER_YAML: "/settings/get_template_player_yaml",
  SAVE_PLAYER_SETTING: "/settings/save_player_setting",

  GET_TEMPLATE_WORLD_INCLUDE_PLAYER_YAML: "/settings/get_template_world_include_player_yaml",
  GET_TEMPLATE_WORLD_GOAL_SETTING_YAML: "/settings/get_template_world_goal_setting_yaml",
  GET_TEMPLATE_WORLD_PARAMETER_SETTING_YAML: "/settings/get_template_world_parameter_setting_yaml",
  SAVE_WORLD_SETTING: "/settings/save_world_setting",
  LOAD_WORLD_SETTINGS: "/settings/load_world_settings",
};

const MESSAGE_TYPE = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
};