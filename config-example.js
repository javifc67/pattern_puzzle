//Copy this file to config.js and specify your own settings

export let ESCAPP_APP_SETTINGS = {
  //Settings that can be specified by the authors
  skin: "PHONE", //skin can be STANDARD or PHONE
  backgroundImg: "NONE", //background can be "NONE" or a URL.
  backgroundColor: "transparent", //Only used if backgroundImg is NONE; can be NONE, a color or transparent

  row: 4,
  cols: 3,

  //Settings that will be automatically specified by the Escapp server
  locale: "es",

  escappClientSettings: {
    endpoint: "https://escapp.es/api/escapeRooms/id",
    linkedPuzzleIds: [1],
    rtc: false,
  },
};
