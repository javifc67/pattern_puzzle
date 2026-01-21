export const DEFAULT_APP_SETTINGS = {
  skin: "PHONE", //skin can be STANDARD or PHONE
  backgroundImg: "NONE", //background can be "NONE" or a URL.
  backgroundColor: "transparent", //Only used if backgroundImg is NONE; can be NONE, a color or transparent
  row: 3,
  cols: 3,
};

export const ESCAPP_CLIENT_SETTINGS = {
  imagesPath: "./images/",
};
export const MAIN_SCREEN = "MAIN_SCREEN";

export const THEMES = {
  DEFAULT: "DEFAULT",
  PHONE: "PHONE",
};

export const THEME_ASSETS = {
  [THEMES.DEFAULT]: {

  },
  [THEMES.PHONE]: {
    phoneImg: "images/phone.png",
  },
};

