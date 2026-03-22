import { useState, useCallback, useEffect } from "react";

interface StealthModeProps {
  onExit: () => void;
}

export default function StealthMode({ onExit }: StealthModeProps) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const SECRET_CODE = "911911";

  // Check for secret code
  useEffect(() => {
    if (display.replace(/[^0-9]/g, "").endsWith(SECRET_CODE)) {
      onExit();
    }
  }, [display, onExit]);

  const handleNumber = useCallback(
    (num: string) => {
      if (resetNext) {
        setDisplay(num);
        setResetNext(false);
      } else {
        setDisplay((d) => (d === "0" ? num : d + num));
      }
    },
    [resetNext]
  );

  const handleOp = useCallback(
    (operator: string) => {
      const current = parseFloat(display);
      if (prev !== null && op) {
        let result = 0;
        switch (op) {
          case "+":
            result = prev + current;
            break;
          case "-":
            result = prev - current;
            break;
          case "×":
            result = prev * current;
            break;
          case "÷":
            result = current !== 0 ? prev / current : 0;
            break;
        }
        setDisplay(String(result));
        setPrev(result);
      } else {
        setPrev(current);
      }
      setOp(operator);
      setResetNext(true);
    },
    [display, prev, op]
  );

  const handleEquals = useCallback(() => {
    if (prev !== null && op) {
      const current = parseFloat(display);
      let result = 0;
      switch (op) {
        case "+":
          result = prev + current;
          break;
        case "-":
          result = prev - current;
          break;
        case "×":
          result = prev * current;
          break;
        case "÷":
          result = current !== 0 ? prev / current : 0;
          break;
      }
      setDisplay(String(parseFloat(result.toFixed(8))));
      setPrev(null);
      setOp(null);
      setResetNext(true);
    }
  }, [display, prev, op]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setResetNext(false);
  }, []);

  const handleDecimal = useCallback(() => {
    if (!display.includes(".")) {
      setDisplay((d) => d + ".");
    }
  }, [display]);

  const handlePercent = useCallback(() => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
    setResetNext(true);
  }, [display]);

  const handleSign = useCallback(() => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  }, [display]);

  const buttons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const onButton = (btn: string) => {
    switch (btn) {
      case "C":
        handleClear();
        break;
      case "±":
        handleSign();
        break;
      case "%":
        handlePercent();
        break;
      case ".":
        handleDecimal();
        break;
      case "=":
        handleEquals();
        break;
      case "+":
      case "-":
      case "×":
      case "÷":
        handleOp(btn);
        break;
      default:
        handleNumber(btn);
    }
  };

  const isOp = (btn: string) => ["+", "-", "×", "÷"].includes(btn);
  const isFunc = (btn: string) => ["C", "±", "%"].includes(btn);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Display */}
      <div className="flex-1 flex items-end justify-end px-6 pb-4">
        <div className="text-right w-full">
          {prev !== null && op && (
            <p className="text-sm text-gray-500 mb-1">
              {prev} {op}
            </p>
          )}
          <p
            className="font-light text-white leading-none"
            style={{
              fontSize: display.length > 10 ? "2.5rem" : display.length > 7 ? "3rem" : "4rem",
            }}
          >
            {display}
          </p>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[9px] text-gray-800 mb-2">
        Enter 911911 to unlock SOS
      </p>

      {/* Buttons */}
      <div className="px-3 pb-8 space-y-2.5">
        {buttons.map((row, ri) => (
          <div key={ri} className="flex gap-2.5 justify-center">
            {row.map((btn) => {
              const isZero = btn === "0";
              return (
                <button
                  key={btn}
                  onClick={() => onButton(btn)}
                  className={`${
                    isZero ? "flex-[2] rounded-[2rem]" : "h-[72px] w-[72px] rounded-full"
                  } flex items-center justify-center text-2xl font-medium transition-all active:scale-90 active:opacity-70
                  ${
                    isOp(btn)
                      ? op === btn && !resetNext
                        ? "bg-white text-orange-500"
                        : "bg-orange-500 text-white"
                      : isFunc(btn)
                      ? "bg-neutral-700 text-white"
                      : "bg-neutral-800 text-white"
                  }`}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
