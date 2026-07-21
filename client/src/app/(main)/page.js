"use client";

import Image from "next/image";

import React, { useState, useEffect } from "react";

import { Space_Mono } from "next/font/google";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";

const spmono = Space_Mono({
  subsets: ["latin"],

  weight: ["400", "700"],
});

export default function Home() {
  const { submitGameResult, settings, user } = useAuth();
  const { theme } = useTheme();
  const [mode, setMode] = useState("encode");

  const [type, setType] = useState("a-z");

  const [length, setLength] = useState("10");

  const [morseInput, setMorseInput] = useState("");

  const [spacebarStartTime, setSpacebarStartTime] = useState(null);

  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

  const [encodeCurrentCharIndex, setEncodeCurrentCharIndex] = useState(0);

  const [decodeCurrentCharIndex, setDecodeCurrentCharIndex] = useState(0);

  const [encodeWordIndex, setEncodeWordIndex] = useState(0);

  const [encodeLetterInWordIndex, setEncodeLetterInWordIndex] = useState(0);

  const [decodeWordIndex, setDecodeWordIndex] = useState(0);

  const [decodeLetterInWordIndex, setDecodeLetterInWordIndex] = useState(0);

  // Session tracking for data collection
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [firstInputTime, setFirstInputTime] = useState(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [sessionCompletedTime, setSessionCompletedTime] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [lastReactionTime, setLastReactionTime] = useState(null);

  // Session tracking functions
  const startSession = () => {
    const now = Date.now();
    setSessionStartTime(now);
    setFirstInputTime(null);
    setMistakeCount(0);
    setTotalAttempts(0);
    setSessionCompletedTime(null);
    setSessionDetails([]);
    setLastReactionTime(now);
  };

  const recordFirstInput = () => {
    if (!firstInputTime) {
      setFirstInputTime(Date.now());
    }
  };

  const recordMistake = () => {
    setMistakeCount(prev => prev + 1);
    setTotalAttempts(prev => prev + 1);
  };

  const recordAttempt = () => {
    setTotalAttempts(prev => prev + 1);
  };

  const recordDetail = (questionText, userAnswerText, correctAnswerText, isCorrectFlag) => {
    const now = Date.now();
    const rt = lastReactionTime ? now - lastReactionTime : 0;

    setSessionDetails(prev => {
      const isDuplicateCorrect = isCorrectFlag && prev.length > 0 && prev[prev.length - 1].isCorrect && prev[prev.length - 1].question === questionText && prev[prev.length - 1].correctAnswer === correctAnswerText;
      if (isDuplicateCorrect) return prev; // Avoid logging the same correct answer multiple times if React double-fires
      return [...prev, {
        question: questionText || '',
        userAnswer: userAnswerText || '',
        correctAnswer: correctAnswerText || '',
        isCorrect: isCorrectFlag,
        responseTime: Math.round(rt),
        orderIndex: prev.length + 1
      }];
    });

    setLastReactionTime(now);
  };

  const calculateMetrics = () => {
    console.log('🔍 calculateMetrics check:', {
      firstInputTime,
      sessionCompletedTime,
      currentCharIndex,
      totalAttempts,
      mistakeCount,
      mode,
      type
    });

    if (!firstInputTime || !sessionCompletedTime) {
      console.log('❌ calculateMetrics returning null - missing timing data');
      return null;
    }

    const timeTaken = (sessionCompletedTime - firstInputTime) / 1000; // in seconds
    const minutesElapsed = timeTaken / 60;

    // Calculate characters/words completed
    let charactersCompleted = 0;
    if (type === "word") {
      if (mode === "encode") {
        charactersCompleted = encodeWordIndex * 5 + encodeLetterInWordIndex; // rough estimate
      } else {
        charactersCompleted = decodeWordIndex * 5 + decodeLetterInWordIndex; // rough estimate
      }
    } else {
      charactersCompleted = currentCharIndex;
    }

    const wpm = minutesElapsed > 0 ? Math.round((charactersCompleted / 5) / minutesElapsed) : 0;
    const accuracy = totalAttempts > 0 ? Math.round(((totalAttempts - mistakeCount) / totalAttempts) * 100) : 100;

    // Map frontend states to backend IDs
    const modeMapping = { "encode": 1, "decode": 2 };
    const symbolMapping = { "a-z": 1, "word": 2 };
    const difficultyMapping = { "10": 1, "15": 2, "50": 3, "100": 4 };

    const modeId = modeMapping[mode] || 1;
    const symbolId = symbolMapping[type] || 1;
    const diffStr = length.toString();
    const difficultyId = difficultyMapping[diffStr] || 1;

    return {
      modeId,
      difficultyId,
      symbolId,
      accuracy,
      wpm,
      mistakeCount,
      timeTaken: Math.round(timeTaken),
      details: sessionDetails.map((detail) => ({
        ...detail,
        symbolId
      }))
    };
  };

  const submitSessionData = async () => {
    console.log('🎮 Submitting session data...');
    const metrics = calculateMetrics();
    if (metrics) {
      console.log('📊 Metrics calculated:', metrics);
      try {
        await submitGameResult(metrics);
        console.log('✅ Game result submitted successfully:', metrics);
      } catch (error) {
        console.error('❌ Failed to submit game result:', error);
      }
    } else {
      console.log('❌ No metrics to submit');
    }
  };

  // Use the appropriate index based on current mode

  const currentCharIndex =
    mode === "encode" ? encodeCurrentCharIndex : decodeCurrentCharIndex;

  const setCurrentCharIndex =
    mode === "encode" ? setEncodeCurrentCharIndex : setDecodeCurrentCharIndex;

  // Reset current mode's progress when switching away from it

  const [previousMode, setPreviousMode] = useState(mode);

  const [previousType, setPreviousType] = useState(type);

  React.useEffect(() => {
    if (previousMode !== mode) {
      if (previousMode === "encode") {
        setEncodeCurrentCharIndex(0);

        setEncodeWordIndex(0);

        setEncodeLetterInWordIndex(0);
      } else {
        setDecodeCurrentCharIndex(0);

        setDecodeWordIndex(0);

        setDecodeLetterInWordIndex(0);
      }

      setPreviousMode(mode);
    }

    if (previousType !== type) {
      setEncodeWordIndex(0);

      setEncodeLetterInWordIndex(0);

      setDecodeWordIndex(0);

      setDecodeLetterInWordIndex(0);

      setPreviousType(type);
    }

    setCurrentLine(0);
    setDecodeCurrentLine(0);
  }, [mode, previousMode, type, previousType]);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [successDisplay, setSuccessDisplay] = useState("");

  const [inputTimeout, setInputTimeout] = useState(null);

  // Audio context for continuous morse code sounds
  // Use refs so AudioContext and oscillator are created once and never recreated on re-render.
  // Creating `new AudioContext()` on every render hits the browser's ~6 context limit
  // and causes sound to stop after a few characters.
  const audioContextRef = React.useRef(null);
  const currentOscillatorRef = React.useRef(null);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const stopMorseSound = () => {
    if (currentOscillatorRef.current) {
      currentOscillatorRef.current.stop();
      currentOscillatorRef.current.disconnect();
      currentOscillatorRef.current = null;
    }
  };

  const startMorseSound = (frequency = 600) => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Resume context if suspended due to browser autoplay policy
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Stop any existing sound
    if (currentOscillatorRef.current) {
      currentOscillatorRef.current.stop();
      currentOscillatorRef.current.disconnect();
      currentOscillatorRef.current = null;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime((settings?.soundVolume || 50) / 100 * 0.3, audioContext.currentTime);

    oscillator.start();
    currentOscillatorRef.current = oscillator;
  };

  const [isCompleted, setIsCompleted] = useState(false);

  const [isFading, setIsFading] = useState(false);
  const [charInput, setCharInput] = useState("");

  // Backend content state
  const [fetchedEncodeArray, setFetchedEncodeArray] = useState(null);
  const [fetchedDecodeArray, setFetchedDecodeArray] = useState(null);
  const [fetchedWordList, setFetchedWordList] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const containerRef = React.useRef(null);
  const innerWrapRef = React.useRef(null);

  const mobileInputRef = React.useRef(null);

  // State for 2-line sliding window
  const [currentLine, setCurrentLine] = useState(0);
  const [decodeCurrentLine, setDecodeCurrentLine] = useState(0);

  // Effect to update current line based on actual DOM positions
  React.useEffect(() => {
    const measureCurrentLine = () => {
      if (!innerWrapRef.current) return 0;
      const children = innerWrapRef.current.children;
      if (!children || children.length === 0) return 0;

      const firstChild = children[0];
      const lineHeight = firstChild.offsetHeight;
      if (lineHeight === 0) return 0;

      // For a-z mode: each child is a letter <p>, index matches currentCharIndex
      // For word mode: children include letters and gap spans, but we only need line of current char
      const targetChild = children[currentCharIndex] || children[children.length - 1];
      const relativeTop = targetChild.offsetTop - firstChild.offsetTop;
      const lineNumber = Math.round(relativeTop / lineHeight);
      return lineNumber;
    };

    const lineNumber = measureCurrentLine();
    setCurrentLine(lineNumber);
    setDecodeCurrentLine(lineNumber);
  }, [currentCharIndex, mode]);

  // Morse code mappings (moved up so they can be used for content parsing)

  const morseCodeMap = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
  };

  const reverseMorseMap = Object.fromEntries(
    Object.entries(morseCodeMap).map(([k, v]) => [v, k])
  );

  // Helper: shuffle an array (Fisher-Yates)
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Helper: generate random letters A-Z
  const allAZLetters = Object.keys(morseCodeMap); // A-Z
  const generateRandomLetters = (count) => {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(allAZLetters[Math.floor(Math.random() * allAZLetters.length)]);
    }
    return result;
  };

  // Word bank for random generation when backend has no content
  const WORD_BANK = [
    "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HAD",
    "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS",
    "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "WAY", "WHO", "BOY", "DID",
    "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE", "CAT", "DOG", "RUN",
    "SUN", "FUN", "BIG", "RED", "BLUE", "GREEN", "CODE", "MORE", "SOME",
    "COME", "HOME", "LIVE", "LOVE", "WORK", "WORD", "LONG", "TIME", "GOOD",
    "MUCH", "MUST", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "THEY",
    "THIS", "WITH", "FROM", "HAVE", "BEEN", "WERE", "WHAT", "WHEN", "WILL",
    "YOUR", "ABOUT", "AFTER", "AGAIN", "BEFORE", "EVERY", "FIRST", "OTHER",
    "RIGHT", "SOUND", "STILL", "THREE", "WATER", "WHERE", "WHICH", "WORLD",
    "WRITE", "LETTER", "NUMBER", "LITTLE", "PEOPLE", "THINK", "THING", "PLACE",
  ];

  // Fetch content from backend API when mode/type/length changes
  const modeMapping = { "encode": 1, "decode": 2 };
  const symbolMapping = { "a-z": 1, "word": 2 };
  const difficultyMapping = { "10": 1, "15": 2, "50": 3, "100": 4 };

  const fetchContent = async () => {
    const numItems = parseInt(length, 10);
    const modeId = modeMapping[mode];
    const symbolId = symbolMapping[type];
    const difficultyId = difficultyMapping[length];

    if (!modeId || !symbolId || !difficultyId) return;

    setContentLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/contents?modeId=${modeId}&difficultyId=${difficultyId}&symbolId=${symbolId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].content) {
          const contentStr = data[0].content.trim();

          if (type === "word") {
            const words = contentStr.split(/\s+/).filter(Boolean).map(w => w.toUpperCase());
            setFetchedWordList(shuffleArray(words));
            setContentLoading(false);
            return;
          } else {
            const letters = contentStr.split(/\s+/).filter(Boolean).map(c => c.toUpperCase());
            const shuffled = shuffleArray(letters);
            if (mode === "encode") {
              setFetchedEncodeArray(shuffled);
            } else {
              const morseArr = shuffled.map(l => morseCodeMap[l]).filter(Boolean);
              setFetchedDecodeArray(morseArr);
            }
            setContentLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch content from backend:', err);
    }

    // Backend returned no content — generate random content client-side
    if (type === "word") {
      const shuffled = shuffleArray(WORD_BANK);
      setFetchedWordList(shuffled.slice(0, numItems));
    } else {
      const randomLetters = generateRandomLetters(numItems);
      if (mode === "encode") {
        setFetchedEncodeArray(randomLetters);
      } else {
        const morseArr = randomLetters.map(l => morseCodeMap[l]).filter(Boolean);
        setFetchedDecodeArray(morseArr);
      }
    }
    setContentLoading(false);
  };

  useEffect(() => {
    // Reset fetched content to null when settings change
    setFetchedEncodeArray(null);
    setFetchedDecodeArray(null);
    setFetchedWordList(null);

    fetchContent();
  }, [mode, type, length]);

  const fullEncodeArray = [
    "loading...",
  ];

  const fullDecodeArray = [
    "loading...",
  ];

  // Use fetched content if available, otherwise use hardcoded fallback

  const targetLettersEncode = fetchedEncodeArray || fullEncodeArray.slice(0, parseInt(length));

  const targetLettersDecode = fetchedDecodeArray || fullDecodeArray.slice(0, parseInt(length));

  const targetLetters =
    mode === "encode" ? targetLettersEncode : targetLettersDecode;

  // morseCodeMap is defined above (before useEffect)

  // Word mode: use fetched word list or fallback to hardcoded list

  const FALLBACK_WORD_LIST = [
    "loading...",
    // "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HAD",
    // "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS",
    // "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "WAY", "WHO", "BOY", "DID",
    // "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE", "CAT", "DOG", "RUN",
    // "SUN", "FUN", "BIG", "RED", "BLUE", "GREEN", "CODE", "MORE", "SOME",
    // "COME", "HOME", "LIVE", "LOVE", "WORK", "WORD", "LONG", "TIME", "GOOD",
    // "MUCH", "MUST", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "THEY",
    // "THIS", "WITH", "FROM", "HAVE", "BEEN", "WERE", "WHAT", "WHEN", "WILL",
    // "YOUR", "ABOUT", "AFTER", "AGAIN", "BEFORE", "EVERY", "FIRST", "OTHER",
    // "RIGHT", "SOUND", "STILL", "THREE", "WATER", "WHERE", "WHICH", "WORLD",
    // "WRITE", "LETTER", "NUMBER", "LITTLE", "PEOPLE", "THINK", "THING", "PLACE",
  ];

  const numWords = parseInt(length, 10);

  const WORD_LIST = fetchedWordList || FALLBACK_WORD_LIST.slice(0, Math.min(numWords, FALLBACK_WORD_LIST.length));

  const targetWordsEncode = WORD_LIST;

  const targetWordsDecode = targetWordsEncode.map((word) => {
    if (word === "loading...") {
      return ["loading..."];
    }
    return word
      .split("")
      .map((c) => morseCodeMap[c])
      .filter(Boolean);
  });

  const encodeCurrentWord = targetWordsEncode[encodeWordIndex] ?? "";

  const encodeCurrentLetter =
    encodeCurrentWord[encodeLetterInWordIndex] ?? null;

  const decodeCurrentWordMorse = targetWordsDecode[decodeWordIndex] ?? [];

  const decodeCurrentMorse =
    decodeCurrentWordMorse[decodeLetterInWordIndex] ?? null;

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !isSpacebarPressed) {
        e.preventDefault();

        setIsSpacebarPressed(true);

        setSpacebarStartTime(Date.now());

        // Play continuous morse sound in encode mode
        if (mode === "encode") {
          startMorseSound();
        }

        // Record first input time and start session tracking
        recordFirstInput();

        if (inputTimeout) {
          clearTimeout(inputTimeout);

          setInputTimeout(null);
        }
      } else if (e.code === "Enter") {
        e.preventDefault();

        setMorseInput("");

        setCharInput("");

        setEncodeCurrentCharIndex(0);

        setDecodeCurrentCharIndex(0);

        setEncodeWordIndex(0);

        setEncodeLetterInWordIndex(0);

        setDecodeWordIndex(0);

        setDecodeLetterInWordIndex(0);

        setIsError(false);

        setIsSuccess(false);

        setSuccessDisplay("");

        setIsCompleted(false);

        // Start new session tracking
        startSession();

        if (inputTimeout) {
          clearTimeout(inputTimeout);

          setInputTimeout(null);
        }
      } else if (
        mode === "decode" &&
        e.key.length === 1 &&
        e.key.match(/[a-zA-Z]/)
      ) {
        const newCharInput = e.key.toUpperCase();
        recordFirstInput();

        setCharInput(newCharInput);

        // Record first input time and start session tracking
        recordFirstInput();

        if (type === "word") {
          if (
            decodeWordIndex < targetWordsDecode.length &&
            decodeLetterInWordIndex < decodeCurrentWordMorse.length
          ) {
            const currentMorse = decodeCurrentMorse;

            const expectedLetter = Object.keys(morseCodeMap).find(
              (key) => morseCodeMap[key] === currentMorse,
            );

            if (expectedLetter && expectedLetter === newCharInput) {
              recordDetail(currentMorse, newCharInput, expectedLetter, true);
              recordAttempt();
              setIsSuccess(true);

              setSuccessDisplay(newCharInput);

              setMorseInput("");

              setCharInput("");

              const isLastLetterInWord =
                decodeLetterInWordIndex === decodeCurrentWordMorse.length - 1;

              const isLastWord =
                decodeWordIndex === targetWordsDecode.length - 1;

              if (isLastLetterInWord) {
                setDecodeWordIndex((prev) => prev + 1);

                setDecodeLetterInWordIndex(0);

                if (isLastWord) setIsCompleted(true);
              } else {
                setDecodeLetterInWordIndex((prev) => prev + 1);
              }

              setTimeout(() => {
                setIsSuccess(false);
                setSuccessDisplay("");
              }, 500);
            } else {
              recordDetail(currentMorse, newCharInput, expectedLetter || '', false);
              recordMistake();
              setIsError(true);

              setTimeout(() => {
                setIsError(false);
                setMorseInput("");
                setCharInput("");
              }, 500);
            }
          }
        } else if (currentCharIndex < targetLetters.length) {
          const currentMorse = targetLetters[currentCharIndex];

          const expectedLetter = Object.keys(morseCodeMap).find(
            (key) => morseCodeMap[key] === currentMorse,
          );

          if (expectedLetter && expectedLetter === newCharInput) {
            recordDetail(currentMorse, newCharInput, expectedLetter, true);
            setIsSuccess(true);

            setSuccessDisplay(newCharInput);

            setCurrentCharIndex((prev) => prev + 1);

            setMorseInput("");

            setCharInput("");

            recordAttempt();

            setTimeout(() => {
              setIsSuccess(false);

              setSuccessDisplay("");

              if (currentCharIndex + 1 === targetLetters.length)
                setIsCompleted(true);
            }, 500);
          } else {
            // Error - wrong character

            recordDetail(currentMorse, newCharInput, expectedLetter || '', false);
            setIsError(true);
            recordMistake();

            setTimeout(() => {
              setIsError(false);

              setMorseInput("");

              setCharInput("");
            }, 500);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space" && isSpacebarPressed) {
        e.preventDefault();

        const pressDuration = Date.now() - spacebarStartTime;

        // Stop morse sound when spacebar is released
        if (mode === "encode") {
          stopMorseSound();
        }

        const morseChar = pressDuration >= 150 ? "-" : ".";

        const newInput = morseInput + morseChar;

        setMorseInput(newInput);

        // Clear any existing timeout

        if (inputTimeout) {
          clearTimeout(inputTimeout);

          setInputTimeout(null);
        }

        if (mode === "encode") {
          if (type === "word") {
            if (
              encodeWordIndex < targetWordsEncode.length &&
              encodeCurrentLetter
            ) {
              const expectedMorse = morseCodeMap[encodeCurrentLetter];

              if (!expectedMorse.startsWith(newInput)) {
                recordDetail(encodeCurrentLetter, newInput, expectedMorse, false);
                setIsError(true);
                recordMistake();

                setTimeout(() => {
                  setIsError(false);
                  setMorseInput("");
                }, 500);
              } else if (newInput === expectedMorse) {
                recordDetail(encodeCurrentLetter, newInput, expectedMorse, true);
                setIsSuccess(true);

                setSuccessDisplay(newInput);

                recordAttempt();

                const isLastLetterInWord =
                  encodeLetterInWordIndex === encodeCurrentWord.length - 1;

                const isLastWord =
                  encodeWordIndex === targetWordsEncode.length - 1;

                if (isLastLetterInWord) {
                  setEncodeWordIndex((prev) => prev + 1);

                  setEncodeLetterInWordIndex(0);

                  if (isLastWord) setIsCompleted(true);
                } else {
                  setEncodeLetterInWordIndex((prev) => prev + 1);
                }

                setMorseInput("");

                setTimeout(() => {
                  setIsSuccess(false);
                  setSuccessDisplay("");
                }, 500);
              } else {
                const timeout = setTimeout(() => {
                  recordDetail(encodeCurrentLetter, newInput, expectedMorse, false);
                  setIsError(true);
                  recordMistake();

                  setTimeout(() => {
                    setIsError(false);
                    setMorseInput("");
                  }, 500);
                }, 1000);

                setInputTimeout(timeout);
              }
            }
          } else if (currentCharIndex < targetLetters.length) {
            const currentLetter = targetLetters[currentCharIndex];

            const expectedMorse = morseCodeMap[currentLetter];

            if (!expectedMorse.startsWith(newInput)) {
              recordDetail(currentLetter, newInput, expectedMorse, false);
              setIsError(true);
              recordMistake();

              setTimeout(() => {
                setIsError(false);
                setMorseInput("");
              }, 500);
            } else if (newInput === expectedMorse) {
              recordDetail(currentLetter, newInput, expectedMorse, true);
              setIsSuccess(true);

              setSuccessDisplay(newInput);

              recordAttempt();

              const isLastChar = currentCharIndex === targetLetters.length - 1;

              setCurrentCharIndex((prev) => prev + 1);

              setMorseInput("");

              setTimeout(() => {
                setIsSuccess(false);

                setSuccessDisplay("");

                if (isLastChar)
                  setIsCompleted(true);
              }, 500);
            } else {
              const timeout = setTimeout(() => {
                recordDetail(currentLetter, newInput, expectedMorse, false);
                setIsError(true);
                recordMistake();

                setTimeout(() => {
                  setIsError(false);
                  setMorseInput("");
                }, 500);
              }, 1000);

              setInputTimeout(timeout);
            }
          }
        }

        setIsSpacebarPressed(false);

        setSpacebarStartTime(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("keyup", handleKeyUp);

      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
    };
  }, [
    isSpacebarPressed,

    spacebarStartTime,

    morseInput,

    currentCharIndex,

    targetLetters,

    morseCodeMap,

    inputTimeout,

    mode,

    type,

    setCurrentCharIndex,

    targetWordsEncode,

    targetWordsDecode,

    encodeWordIndex,

    encodeLetterInWordIndex,

    encodeCurrentWord,

    encodeCurrentLetter,

    decodeWordIndex,

    decodeLetterInWordIndex,

    decodeCurrentWordMorse,

    decodeCurrentMorse,
  ]);

  // Handle session completion and API submission
  React.useEffect(() => {
    console.log('🎯 Game completion check:', { isCompleted, sessionCompletedTime });
    if (isCompleted && !sessionCompletedTime) {
      console.log('🏁 Game completed, setting session time and submitting...');
      const now = Date.now();
      setSessionCompletedTime(now);
      console.log('⏰ Session completed time set to:', now);
      // Submit will be triggered in the next useEffect cycle
    }
  }, [isCompleted, sessionCompletedTime]);

  // Separate useEffect to handle submission after sessionCompletedTime is set
  React.useEffect(() => {
    if (isCompleted && sessionCompletedTime) {
      console.log('📤 Ready to submit session data...');
      submitSessionData();
    }
  }, [isCompleted, sessionCompletedTime]);

  // Control bar position (configurable in settings: top | left | right | bottom)
  const menuPosition = settings?.menuPosition || 'top';
  const isVerticalMenu = menuPosition === 'left' || menuPosition === 'right';

  const horizontalMenuWrapper =
    menuPosition === 'bottom'
      ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 min-h-[65px] px-4 justify-center items-center gap-1 shadow-2xl'
      : 'w-full max-w-[705px] min-h-[65px] px-2 sm:px-4 justify-between items-center gap-1 sm:gap-2 mt-14';

  const verticalMenuWrapper =
    (menuPosition === 'left' ? 'fixed left-4 ' : 'fixed right-4 ') +
    'top-1/2 -translate-y-1/2 z-40 flex-col px-2 py-2 justify-center items-stretch gap-1 shadow-2xl';

  // Groups of selectable options rendered in the desktop control bar
  const menuGroups = [
    [
      { value: 'decode', active: mode === 'decode', onClick: () => setMode('decode') },
      { value: 'encode', active: mode === 'encode', onClick: () => setMode('encode') },
    ],
    [
      { value: 'a-z', active: type === 'a-z', onClick: () => setType('a-z') },
      { value: 'word', active: type === 'word', onClick: () => setType('word') },
    ],
    ['10', '15', '50', '100'].map((len) => ({
      value: len,
      active: length === len,
      onClick: () => setLength(len),
    })),
  ];

  return (
    <div className="flex flex-col items-center px-4 w-full">
      {!isCompleted && (
        <>
          {/* Mobile/tablet: 3 dropdowns */}
          <div
            className={`${spmono.className} md:hidden font-bold w-full max-w-[705px] px-4 py-4 rounded-xl flex flex-wrap justify-center sm:justify-between items-center gap-3 sm:gap-4 mt-14 transition-colors duration-300`}
            style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}
          >
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={`${spmono.className} font-bold rounded-lg px-4 py-3 cursor-pointer focus:outline-none focus:ring-2 transition-colors min-w-[120px]`}
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                '--tw-ring-color': 'var(--primary)'
              }}
              aria-label="Mode"
            >
              <option value="decode">decode</option>
              <option value="encode">encode</option>
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${spmono.className} font-bold rounded-lg px-4 py-3 cursor-pointer focus:outline-none focus:ring-2 transition-colors min-w-[120px]`}
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                '--tw-ring-color': 'var(--primary)'
              }}
              aria-label="Type"
            >
              <option value="a-z">a-z</option>
              <option value="word">word</option>
            </select>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className={`${spmono.className} font-bold rounded-lg px-4 py-3 cursor-pointer focus:outline-none focus:ring-2 transition-colors min-w-[100px]`}
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                '--tw-ring-color': 'var(--primary)'
              }}
              aria-label="Length"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          {/* Desktop: position-aware control bar (top / left / right / bottom) */}
          <div
            className={`${spmono.className} hidden md:flex font-bold rounded-xl transition-all duration-300 ${isVerticalMenu ? verticalMenuWrapper : horizontalMenuWrapper}`}
            style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', border: '1px solid var(--border)' }}
          >
            {menuGroups.map((group, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && (
                  isVerticalMenu ? (
                    <div className="w-full h-px my-1" style={{ backgroundColor: 'var(--foreground)', opacity: 0.15 }} />
                  ) : (
                    <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>|</p>
                  )
                )}
                <div className={isVerticalMenu ? 'flex flex-col w-full' : 'flex'}>
                  {group.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={opt.onClick}
                      className={`transition-colors duration-300 ${isVerticalMenu ? 'px-5 py-2 text-center rounded-lg' : 'px-4 py-4'}`}
                      style={{ color: opt.active ? 'var(--primary)' : 'var(--foreground)', opacity: opt.active ? 1 : 0.7 }}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {isCompleted ? (
        <div className="flex flex-col items-center mt-20 sm:mt-40 animate-fadeIn px-4">
          <div>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div>
                <p
                  className={`${spmono.className} font-bold text-[20px]`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  wpm
                </p>

                <p className={`${spmono.className} text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`} style={{ color: 'var(--primary)' }}>
                  {calculateMetrics()?.wpm || 0}
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} font-bold text-[20px]`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  accuracy
                </p>

                <p className={`${spmono.className} text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`} style={{ color: 'var(--primary)' }}>
                  {calculateMetrics()?.accuracy || 0}%
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} font-bold text-[20px]`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  time
                </p>

                <p className={`${spmono.className} text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`} style={{ color: 'var(--primary)' }}>
                  {calculateMetrics()?.timeTaken || 0}s
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 mt-6">
              <div>
                <p
                  className={`${spmono.className} font-bold text-[20px]`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  mode
                </p>

                <p className={`${spmono.className} text-[20px]`} style={{ color: 'var(--primary)' }}>
                  {mode} {type}
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} font-bold text-[20px]`}
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  date
                </p>

                <p className={`${spmono.className} text-[20px]`} style={{ color: 'var(--primary)' }}>
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Image
            src="/reset-svgrepo-com 1.svg"
            width={14}
            height={14}
            alt=""
            className="mt-12 cursor-pointer hover:opacity-70 transition-opacity mt-20"
            onClick={() => {
              setMorseInput("");

              setCharInput("");

              setEncodeCurrentCharIndex(0);

              setDecodeCurrentCharIndex(0);

              setCurrentLine(0);
              setDecodeCurrentLine(0);

              setEncodeWordIndex(0);

              setEncodeLetterInWordIndex(0);

              setDecodeWordIndex(0);

              setDecodeLetterInWordIndex(0);

              setIsError(false);

              setIsSuccess(false);

              setSuccessDisplay("");

              setIsCompleted(false);

              setIsFading(false);

              // Fetch new random content
              fetchContent();

              // Reset session tracking
              startSession();

              if (inputTimeout) {
                clearTimeout(inputTimeout);

                setInputTimeout(null);
              }
            }}
          />
          {!user && (
            <div className="mt-8 p-6 rounded-xl text-center max-w-md transition-all duration-300" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className={`${spmono.className} text-base font-bold`} style={{ color: 'var(--foreground)' }}>
                ต้องการบันทึกสถิติและประวัติการเล่นของคุณไหม?
              </p>
              <p className={`${spmono.className} text-xs mt-2`} style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                คุณกำลังเล่นในโหมดผู้เยี่ยมชม (Guest)
              </p>
              <a href="/login" className={`${spmono.className} inline-block mt-4 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 hover:scale-105`} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                เข้าสู่ระบบ (Login)
              </a>
            </div>
          )}
        </div>
      ) : mode === "decode" ? (
        <div
          className={`${isFading ? "animate-fadeOut" : ""
            } flex flex-col items-center px-4`}
        >
          <div
            className="flex flex-wrap justify-center mt-20 sm:mt-40 max-w-7xl relative px-4 h-[120px] sm:h-[159px] overflow-hidden"
          >
            <div
              ref={innerWrapRef}
              className="flex flex-wrap justify-center"
              style={{
                transform: `translateY(-${Math.max(0, decodeCurrentLine - 1) * (() => {
                  if (!innerWrapRef.current) {
                    const width = typeof window !== 'undefined' ? window.innerWidth : 768;
                    if (width < 640) return 40;
                    if (width < 1024) return 45;
                    return 53;
                  }
                  const firstChild = innerWrapRef.current.children[0];
                  return firstChild ? firstChild.offsetHeight : 53;
                })()}px)`,
                transition: "transform 0.3s ease",
              }}
            >
              {type === "word"
                ? targetWordsDecode.map((wordMorse, wIdx) => (
                  <React.Fragment key={`dw-${wIdx}`}>
                    {wordMorse.map((morse, lIdx) => {
                      const isPast = wIdx < decodeWordIndex || (wIdx === decodeWordIndex && lIdx < decodeLetterInWordIndex);
                      const isCurrent = wIdx === decodeWordIndex && lIdx === decodeLetterInWordIndex;

                      return (
                        <p
                          key={`dw-${wIdx}-${lIdx}`}
                          className={`${spmono.className
                            } text-3xl sm:text-4xl md:text-[48px] font-bold transition-colors duration-300 ${isCurrent && isError ? "text-red-500 animate-shake" : ""}`}
                          style={{ margin: "0 0.25rem", color: isCurrent && isError ? undefined : isPast ? (theme === 'theme-light' ? '#000000' : 'white') : (theme === 'theme-light' ? '#9CA3AF' : '#5a5e61') }}
                        >
                          {morse}
                        </p>
                      );
                    })}
                    {wIdx < targetWordsDecode.length - 1 && (
                      <span key={`dw-gap-${wIdx}`} className="inline-block w-6" />
                    )}
                  </React.Fragment>
                ))
                : targetLetters.map((letter, index) => {
                  const isPast = index < currentCharIndex;
                  const isCurrent = index === currentCharIndex;

                  return (
                    <p
                      key={index}
                      className={`${spmono.className
                        } text-3xl sm:text-4xl md:text-[48px] font-bold transition-colors duration-300 ${isCurrent && isError ? "text-red-500 animate-shake" : ""}`}
                      style={{ margin: "0 1rem", color: isCurrent && isError ? undefined : isPast ? (theme === 'theme-light' ? '#000000' : 'white') : (theme === 'theme-light' ? '#9CA3AF' : '#5a5e61') }}
                    >
                      {letter}
                    </p>
                  );
                })}
            </div>

            {type === "word" && targetWordsDecode.length > 0 && (
              <p
                className={`${spmono.className} text-[#9CA3AF] text-sm mt-2 w-full text-center`}
              >
                word {decodeWordIndex + 1} of {targetWordsDecode.length}
              </p>
            )}
          </div>

          <Image
            src="/reset-svgrepo-com 1.svg"
            width={14}
            height={14}
            alt=""
            className="mt-10 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => {
              setMorseInput("");

              setCharInput("");

              setEncodeCurrentCharIndex(0);

              setDecodeCurrentCharIndex(0);

              setCurrentLine(0);
              setDecodeCurrentLine(0);

              setIsError(false);

              setIsSuccess(false);

              setSuccessDisplay("");

              setIsCompleted(false);

              setIsFading(false);

              // Fetch new random content
              fetchContent();

              if (inputTimeout) {
                clearTimeout(inputTimeout);

                setInputTimeout(null);
              }
            }}
          />

          <p
            className={`${spmono.className} text-3xl sm:text-4xl md:text-[48px] font-bold mt-20 transition-colors duration-300`}
            style={{
              color: isError
                ? 'var(--error)'
                : isSuccess
                  ? 'var(--success)'
                  : 'var(--foreground)'
            }}
          >
            {isSuccess
              ? successDisplay
              : charInput || (
                <span className="text-lg sm:text-xl md:text-[24px]" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  <span className="hidden md:inline">type</span>
                  <span className="md:hidden">tap below to type</span>
                </span>
              )}
          </p>

          {/* Hidden input for mobile keyboard - decode mode */}
          <input
            ref={mobileInputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            style={{ position: 'fixed', opacity: 0, width: '1px', height: '1px', top: '-100px' }}
            onInput={(e) => {
              const val = e.target.value;
              if (val.length > 0) {
                const key = val.charAt(val.length - 1);
                if (key.match(/[a-zA-Z]/)) {
                  window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: key,
                    code: `Key${key.toUpperCase()}`,
                    bubbles: true
                  }));
                }
                e.target.value = '';
              }
            }}
          />

          {/* Tap to type button for mobile/tablet */}
          <div
            className="md:hidden w-full max-w-[300px] h-24 bg-[#1E2332] rounded-xl flex items-center justify-center mt-6 select-none cursor-pointer active:bg-[#2A3247] transition-colors"
            onClick={() => mobileInputRef.current?.focus()}
          >
            <p className={`${spmono.className} font-bold text-[#9CA3AF] text-lg select-none pointer-events-none`}>
              tap to type
            </p>
          </div>

          <div className="mt-30 px-4">
            <div className="bg-[#717171] text-[11px]">
              <p
                className={`${spmono.className} font-bold text-[#141720] mx-1`}
              >
                <span className="hidden md:inline">type - to input</span>
                <span className="md:hidden">tap button - to type</span>
              </p>
            </div>

            <div className="bg-[#717171] text-[11px]">
              <p
                className={`${spmono.className} font-bold text-[#141720] mx-1 mt-3`}
              >
                <span className="hidden md:inline">enter - to reset</span>
                <span className="md:hidden">tap reset icon above</span>
              </p>
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="flex flex-col items-center mt-20 sm:mt-40 animate-fadeIn px-4">
          <div>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div>
                <p
                  className={`${spmono.className} text-[#9CA3AF] font-bold text-[20px]`}
                >
                  wpm
                </p>

                <p className={`${spmono.className} text-[#EF4444] text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`}>
                  53
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} text-[#9CA3AF] font-bold text-[20px]`}
                >
                  accuracy
                </p>

                <p className={`${spmono.className} text-[#EF4444] text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`}>
                  90%
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} text-[#9CA3AF] font-bold text-[20px]`}
                >
                  time
                </p>

                <p className={`${spmono.className} text-[#EF4444] text-[48px] sm:text-6xl md:text-8xl lg:text-[96px]`}>
                  99s
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 mt-6">
              <div>
                <p
                  className={`${spmono.className} text-[#9CA3AF] font-bold text-[20px]`}
                >
                  mode
                </p>

                <p className={`${spmono.className} text-[#EF4444] text-[20px]`}>
                  {mode} {type}
                </p>
              </div>

              <div className="sm:ml-10">
                <p
                  className={`${spmono.className} text-[#9CA3AF] font-bold text-[20px]`}
                >
                  date
                </p>

                <p className={`${spmono.className} text-[#EF4444] text-[20px]`}>
                  56/87/21%
                </p>
              </div>
            </div>
          </div>

          <Image
            src="/reset-svgrepo-com 1.svg"
            width={14}
            height={14}
            alt=""
            className="mt-12 cursor-pointer hover:opacity-70 transition-opacity mt-20"
            onClick={() => {
              setMorseInput("");

              setCurrentCharIndex(0);

              setIsError(false);

              setIsSuccess(false);

              setSuccessDisplay("");

              setIsCompleted(false);

              // Fetch new random content
              fetchContent();

              if (inputTimeout) {
                clearTimeout(inputTimeout);

                setInputTimeout(null);
              }
            }}
          />
        </div>
      ) : (
        <>
          <div
            className={`flex flex-wrap mt-20 sm:mt-40 max-w-7xl relative px-4 ${type === "word" ? "justify-center" : ""
              } h-[120px] sm:h-[159px] overflow-hidden`}
          >
            <div
              ref={innerWrapRef}
              className={`flex flex-wrap ${type === "word" ? "justify-center" : ""}`}
              style={{
                transform: `translateY(-${Math.max(0, currentLine - 1) * (() => {
                  if (!innerWrapRef.current) {
                    const width = typeof window !== 'undefined' ? window.innerWidth : 768;
                    if (width < 640) return 40;
                    if (width < 1024) return 45;
                    return 53;
                  }
                  const firstChild = innerWrapRef.current.children[0];
                  return firstChild ? firstChild.offsetHeight : 53;
                })()}px)`,
                transition: "transform 0.3s ease",
              }}
            >
              {type === "word"
                ? targetWordsEncode.map((word, wIdx) => (
                  <React.Fragment key={`ew-${wIdx}`}>
                    {word.split("").map((letter, lIdx) => {
                      const isPast = wIdx < encodeWordIndex || (wIdx === encodeWordIndex && lIdx < encodeLetterInWordIndex);
                      const isCurrent = wIdx === encodeWordIndex && lIdx === encodeLetterInWordIndex;

                      return (
                        <p
                          key={`ew-${wIdx}-${lIdx}`}
                          className={`${spmono.className
                            } text-3xl sm:text-4xl md:text-[48px] font-bold transition-colors duration-300 ${isCurrent && isError ? "text-red-500 animate-shake" : ""}`}
                          style={{ margin: "0 0.25rem", color: isCurrent && isError ? undefined : isPast ? (theme === 'theme-light' ? '#000000' : 'white') : (theme === 'theme-light' ? '#9CA3AF' : '#5a5e61') }}
                        >
                          {letter}
                        </p>
                      );
                    })}
                    {wIdx < targetWordsEncode.length - 1 && (
                      <span key={`ew-gap-${wIdx}`} className="inline-block w-6" />
                    )}
                  </React.Fragment>
                ))
                : targetLettersEncode.map((letter, index) => {
                  const isPast = index < currentCharIndex;
                  const isCurrent = index === currentCharIndex;

                  return (
                    <p
                      key={index}
                      className={`${spmono.className
                        } text-3xl sm:text-4xl md:text-[48px] font-bold transition-colors duration-300 ${isCurrent && isError ? "text-red-500 animate-shake" : ""}`}
                      style={{ margin: "0 1rem", color: isCurrent && isError ? undefined : isPast ? (theme === 'theme-light' ? '#000000' : 'white') : (theme === 'theme-light' ? '#9CA3AF' : '#5a5e61') }}
                    >
                      {letter}
                    </p>
                  );
                })}
            </div>

            {type === "word" && targetWordsEncode.length > 0 && (
              <p
                className={`${spmono.className} text-[#9CA3AF] text-sm mt-2 w-full text-center`}
              >
                word {encodeWordIndex + 1} of {targetWordsEncode.length}
              </p>
            )}
          </div>

          <Image
            src="/reset-svgrepo-com 1.svg"
            width={14}
            height={14}
            alt=""
            className="mt-10 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => {
              setMorseInput("");

              setEncodeCurrentCharIndex(0);

              setDecodeCurrentCharIndex(0);

              setCurrentLine(0);
              setDecodeCurrentLine(0);

              setEncodeWordIndex(0);

              setEncodeLetterInWordIndex(0);

              setDecodeWordIndex(0);

              setDecodeLetterInWordIndex(0);

              setIsError(false);

              setIsSuccess(false);

              setSuccessDisplay("");

              setIsCompleted(false);

              // Fetch new random content
              fetchContent();

              if (inputTimeout) {
                clearTimeout(inputTimeout);

                setInputTimeout(null);
              }
            }}
          />

          <p
            className={`${spmono.className
              } text-3xl sm:text-4xl md:text-[48px] font-bold mt-20 transition-colors duration-300 ${isError
                ? "text-red-500 animate-shake"
                : isSuccess
                  ? "text-green-500"
                  : ""
              }`}
            style={(!isError && !isSuccess) ? { color: theme === 'theme-light' ? 'var(--foreground)' : 'white' } : {}}
          >
            {isSuccess
              ? successDisplay
              : morseInput || (
                <span className="text-lg sm:text-xl md:text-[24px] text-[#9CA3AF]">
                  <span className="hidden md:inline">press spacebar</span>
                  <span className="md:hidden">hold button below</span>
                </span>
              )}
          </p>

          {/* Touch input button for mobile/tablet */}
          <div
            className={`md:hidden w-full max-w-[300px] h-24 rounded-xl flex items-center justify-center mt-6 select-none transition-colors ${isSpacebarPressed ? 'bg-[#EF4444]' : 'bg-[#1E2332] active:bg-[#2A3247]'}`}
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
            }}
          >
            <p className={`${spmono.className} font-bold text-lg select-none pointer-events-none ${isSpacebarPressed ? 'text-white' : 'text-[#9CA3AF]'}`}>
              {isSpacebarPressed ? '...' : 'hold to input'}
            </p>
          </div>

          <div className="mt-30 px-4">
            <div className="bg-[#717171] text-[11px]">
              <p
                className={`${spmono.className} font-bold text-[#141720] mx-1`}
              >
                <span className="hidden md:inline">spacebar - to input</span>
                <span className="md:hidden">hold - dot / long hold - dash</span>
              </p>
            </div>

            <div className="bg-[#717171] text-[11px]">
              <p
                className={`${spmono.className} font-bold text-[#141720] mx-1 mt-3 text-center`}
              >
                <span className="hidden md:inline">enter - to reset</span>
                <span className="md:hidden">tap reset icon above</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}