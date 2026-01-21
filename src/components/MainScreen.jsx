import "./../assets/scss/MainScreen.scss";
import { useState, useRef, useEffect } from "react";
import useSound from "../hooks/useSound";
import { useContext } from "react";
import { GlobalContext } from "./GlobalContext.jsx";
import { THEMES } from "../constants/constants.jsx";

const HIT_AREA_RADIUS = 30;

export default function MainScreen({ solvePuzzle, solved, solvedTrigger }) {
  const { I18n, appSettings: config } = useContext(GlobalContext);
  const [pattern, setPattern] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isError, setIsError] = useState(false);
  const containerRef = useRef(null);
  const dotsRef = useRef([]);
  const errorSound = useSound("/sounds/wrong.wav");
  const winSound = useSound("/sounds/win_sound.mp3");

  /* Using default 3 if not present. Note: user config uses 'row' (singular) and 'cols' (plural) */
  const rows = config.row || 3;
  const cols = config.cols || 3;
  const totalDots = rows * cols;
  const isPhone = config.skin === THEMES.PHONE;

  // Calculate lines between selected dots
  useEffect(() => {
    if (pattern.length < 2) {
      setLines([]);
      return;
    }

    const newLines = [];
    for (let i = 0; i < pattern.length - 1; i++) {
      const start = getDotCenter(pattern[i]);
      const end = getDotCenter(pattern[i + 1]);
      if (start && end) {
        newLines.push({ start, end });
      }
    }
    setLines(newLines);
  }, [pattern]);

  useEffect(() => {
    if (solvedTrigger > 0 && !solved) {
      setIsError(true);
      errorSound.play();
      const timer = setTimeout(() => {
        setIsError(false);
        setPattern([]);
        setLines([]);
      }, 500);
      return () => clearTimeout(timer);
    } else if (solvedTrigger > 0 && solved) {
      winSound.play();
    }
  }, [solvedTrigger, solved]);

  const getDotCenter = (index) => {
    const dot = dotsRef.current[index];
    if (!dot) return null;
    const rect = dot.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  };

  const getDotIndexFromPoint = (x, y) => {
    if (!containerRef.current) return -1;
    const containerRect = containerRef.current.getBoundingClientRect();

    // Relative coordinates
    const relX = x - containerRect.left;
    const relY = y - containerRect.top;

    for (let i = 0; i < totalDots; i++) {
      const center = getDotCenter(i);
      if (!center) continue;
      const dist = Math.sqrt(
        Math.pow(relX - center.x, 2) + Math.pow(relY - center.y, 2)
      );
      if (dist < HIT_AREA_RADIUS) {
        return i;
      }
    }
    return -1;
  };

  const handleStart = (e) => {
    if (isError || solved) return;
    e.preventDefault(); // Prevent scroll
    setIsDrawing(true);
    setPattern([]);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    updateCurrentPos(clientX, clientY);

    const index = getDotIndexFromPoint(clientX, clientY);
    if (index !== -1) {
      setPattern([index]);
    }
  };

  const handleMove = (e) => {
    if (!isDrawing || isError || solved) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    updateCurrentPos(clientX, clientY);

    const index = getDotIndexFromPoint(clientX, clientY);
    if (index !== -1 && !pattern.includes(index)) {

      setPattern((prev) => [...prev, index]);
    }
  };

  const handleEnd = () => {
    if (isError || solved) return;
    setIsDrawing(false);
    if (pattern.length > 0) {
      if (solvePuzzle && !solved) {
        const solutionString = pattern.map(i => i + 1).join(';');
        solvePuzzle(solutionString);
      }
    }
  };

  const updateCurrentPos = (clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCurrentPos({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  return (
    <div className="mainScreen">
      <div
        style={{ backgroundImage: "none" }}
        className={`pattern-container ${isError ? 'error' : ''}`}
        ref={containerRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Background Layers for Transition */}
        {isPhone && (
          <>
            <div
              className="bg-layer locked visible"
              style={{ backgroundImage: `url(${config.phoneImg})` }}
            />
            <div
              className={`bg-layer unlocked ${solved ? 'visible' : ''}`}
              style={{ backgroundImage: `url(images/phone_unlocked.png)` }}
            />
          </>
        )}
        {(!isPhone || (isPhone && !solved)) && <><div
          className="dots-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {[...Array(totalDots)].map((_, i) => (
            <div
              key={i}
              className={`dot-wrapper ${pattern.includes(i) ? 'active' : ''}`}
              ref={el => dotsRef.current[i] = el}
            >
              <div className="dot" />
            </div>
          ))}
        </div>

          <svg className="pattern-lines">
            {lines.map((line, i) => (
              <line
                key={i}
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                className="line"
              />
            ))}
            {isDrawing && pattern.length > 0 && (() => {
              const start = getDotCenter(pattern[pattern.length - 1]);
              if (!start) return null;
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={currentPos.x}
                  y2={currentPos.y}
                  className="line active-drag"
                />
              );
            })()}
          </svg></>}
        {!isPhone && solved && <div className="success-message">{I18n.getTrans("i.unlocked")}</div>}
      </div>
    </div>
  );
}
