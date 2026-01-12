import { useContext, useEffect, useRef, useState } from "react";
import "./../assets/scss/app.scss";

import {
  DEFAULT_APP_SETTINGS,
  ESCAPP_CLIENT_SETTINGS,
  MAIN_SCREEN,
} from "../constants/constants.jsx";
import { GlobalContext } from "./GlobalContext.jsx";
import MainScreen from "./MainScreen.jsx";

export default function App() {
  const { escapp, setEscapp, appSettings, setAppSettings, Storage, setStorage, Utils, I18n } =
    useContext(GlobalContext);
  const hasExecutedEscappValidation = useRef(false);

  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState(MAIN_SCREEN);
  const prevScreen = useRef(screen);
  const [solved, setSolved] = useState(false);
  const [solvedTrigger, setSolvedTrigger] = useState(0);

  useEffect(() => {
    if (escapp !== null) {
      return;
    }
    let _escapp = new ESCAPP(ESCAPP_CLIENT_SETTINGS);
    setEscapp(_escapp);
    Utils.log("Escapp client initiated with settings:", _escapp.getSettings());
    setStorage(_escapp.getStorage());
    let _appSettings = processAppSettings(_escapp.getAppSettings());
    setAppSettings(_appSettings);
  }, []);

  useEffect(() => {
    if (!hasExecutedEscappValidation.current && escapp !== null && appSettings !== null && Storage !== null) {
      hasExecutedEscappValidation.current = true;

      escapp.registerCallback("onNewErStateCallback", function (erState) {
        try {
          Utils.log("New escape room state received from ESCAPP", erState);
          restoreAppState(erState);
        } catch (e) {
          Utils.log("Error in onNewErStateCallback", e);
        }
      });

      escapp.registerCallback("onErRestartCallback", function (erState) {
        try {
          Utils.log("Escape Room has been restarted.", erState);
          if (typeof Storage !== "undefined") {
            Storage.removeSetting("state");
          }
        } catch (e) {
          Utils.log("Error in onErRestartCallback", e);
        }
      });

      escapp.validate((success, erState) => {
        try {
          Utils.log("ESCAPP validation", success, erState);
          if (success) {
            restoreAppState(erState);
            setLoading(false);
          }
        } catch (e) {
          Utils.log("Error in validate callback", e);
        }
      });
    }
  }, [escapp, appSettings, Storage]);

  useEffect(() => {
    if (screen !== prevScreen.current) {
      Utils.log("Screen ha cambiado de", prevScreen.current, "a", screen);
      prevScreen.current = screen;
    }
  }, [screen]);

  function restoreAppState(erState) {
    Utils.log("Restore application state based on escape room state:", erState);
    const _settings = escapp.getSettings();

    if (!_settings.linkedPuzzleIds || _settings.linkedPuzzleIds.length === 0) {
      setAppSettings((prevSettings) => {
        return {
          ...prevSettings,
          disableButton: true,
        };
      });
    }

    if (escapp.getAllPuzzlesSolved() && escapp.getLastSolution()) {
      if (appSettings.actionWhenLoadingIfSolved) {
        setSolved(true);
      }
    }
  }

  function processAppSettings(_appSettings) {
    if (typeof _appSettings !== "object") {
      _appSettings = {};
    }
    if (typeof _appSettings.skin === "undefined" && typeof DEFAULT_APP_SETTINGS.skin === "string") {
      _appSettings.skin = DEFAULT_APP_SETTINGS.skin;
    }

    _appSettings = Utils.deepMerge(DEFAULT_APP_SETTINGS, _appSettings);

    I18n.init(_appSettings);

    if (typeof _appSettings.message !== "string") {
      _appSettings.message = I18n.getTrans("i.message");
    }
    if (typeof _appSettings.backgroundImg === "string" && _appSettings.backgroundImg.trim() !== "" && _appSettings.backgroundImg !== "NONE") {
      _appSettings.background = "url(" + _appSettings.backgroundImg + ") no-repeat";
      _appSettings.backgroundSize = "100% 100%";
    }
    _appSettings = Utils.checkUrlProtocols(_appSettings);

    Utils.preloadImages([_appSettings.backgroundMessage]);
    Utils.log("App settings:", _appSettings);
    return _appSettings;
  }

  function solvePuzzle(_solution) {
    Utils.log("solution: ", _solution);

    return checkResult(_solution);
  }

  function checkResult(_solution) {
    escapp.checkNextPuzzle(_solution, {}, (success, erState) => {
      Utils.log("Check solution Escapp response", success, erState);
      if (success) {
        setSolved(true);
        try {
          setTimeout(() => {
            submitPuzzleSolution(_solution);
          }, 2000);
        } catch (e) {
          Utils.log("Error in checkNextPuzzle", e);
        }
      }
      setSolvedTrigger((prev) => prev + 1);
    });
  }
  function submitPuzzleSolution(_solution) {
    Utils.log("Submit puzzle solution", _solution);
    escapp.submitNextPuzzle(_solution, {}, (success, erState) => {
      Utils.log("Solution submitted to Escapp", _solution, success, erState);
    });
  }

  const renderScreens = (screens) => {
    if (loading === true) {
      return null;
    } else {
      return <>{screens.map(({ id, content }) => renderScreen(id, content))}</>;
    }
  };

  const renderScreen = (screenId, screenContent) => (
    <div key={screenId} className={`screen_wrapper ${screen === screenId ? "active" : ""}`}>
      {screenContent}
    </div>
  );

  let screens = [
    {
      id: MAIN_SCREEN,
      content: (
        <div
          className="main-background"
          style={{
            backgroundImage: appSettings?.backgroundImg ? `url(${appSettings.backgroundImg})` : {},
            height: " 100%",
            width: "100%",
          }}
        >
          <MainScreen solvePuzzle={solvePuzzle} solved={solved} solvedTrigger={solvedTrigger} />
        </div>
      ),
    }
  ];

  return (
    <div
      id="global_wrapper"
      className={`${appSettings !== null && typeof appSettings.skin === "string" ? appSettings.skin.toLowerCase() : ""
        }`} {...(appSettings !== null &&
          typeof appSettings.background === "string" &&
          typeof appSettings.backgroundSize === "string"
          ? {
            style: {
              background: appSettings.background,
              backgroundSize: appSettings.backgroundSize,
            },
          }
          : {})}
    >
      {renderScreens(screens)}
    </div>
  );
}
