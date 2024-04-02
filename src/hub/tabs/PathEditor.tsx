import { SnapMode, Vertex } from "../../utils/structures";
import { convert } from "../../utils/units";
import Toastify from "toastify-js";
import React, { useEffect, useRef, useState } from "react";
import { Tab, TabProps } from "./Tabs";
import { FIELD_DATA } from "../../utils/constants";
import { useWindowSize } from "@uidotdev/usehooks";
import "./PathEditor.css";

const PathEditor: React.FC<TabProps> = ({ active }) => {
  const [injectPoints, setInjectPoints] = useState(false);
  const [normalizeCorners, setNormalizeCorners] = useState(true);
  const [robotLength, setRobotLength] = useState(0.7);
  const [robotWidth, setRobotWidth] = useState(0.7);
  const [straightawayPointSpacing, setStraightawayPointSpacing] =
    useState(0.15);
  const [splitPercent, setSplitPercent] = useState(0.45);
  const [cornerPointSpacing, setCornerPointSpacing] = useState(0.08);
  const [cornerSize, setCornerSize] = useState(0.6);
  const [cornerCutDist, setCornerCutDist] = useState(0.01);
  const [snapMode, setSnapMode] = useState<SnapMode>("NONE");
  const [start, setStart] = useState({ x: 4, y: 3 });
  const [target, setTarget] = useState({ x: 14, y: 6 });
  const [field, setField] = useState("2024");
  const [gameData, setGameData] = useState(FIELD_DATA[field]);
  const [currentPath, setCurrentPath] = useState<Vertex[]>([]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const fieldBackground = useRef<HTMLImageElement>(null);
  const pixelsToCoordinates =
    useRef<
      (
        translation: [number, number],
        alwaysFlipped?: boolean,
      ) => [number, number]
    >();
  const size = useWindowSize();

  useEffect(() => {
    const updateInputs = async () => {
      setStraightawayPointSpacing(await window.java.getPointSpacing());
      setCornerPointSpacing(await window.java.getCornerPointSpacing());
      setCornerSize(await window.java.getCornerDist());
      setInjectPoints(await window.java.getInjectPoints());
      setNormalizeCorners(await window.java.getNormalizeCorners());
      setSplitPercent(await window.java.getCornerSplitPercent());
      setSnapMode(await window.java.getSnapMode());
    };
    updateInputs();
  }, []);
  useEffect(() => {
    if (active) {
      window.util.updateWindowState({ tab: "path" });
    }
  }, [active]);
  useEffect(() => {
    setGameData(FIELD_DATA[field]);
  }, [field]);
  useEffect(() => {
    if (!gameData || !canvas.current || !container.current) return;
    console.log("Rendering path");
    const context = canvas.current.getContext("2d");
    let width = container.current.clientWidth;
    let height = container.current.clientHeight;
    console.log(width, height);
    canvas.current.style.width = width.toString() + "px";
    canvas.current.style.height = height.toString() + "px";
    canvas.current.width = width * window.devicePixelRatio;
    canvas.current.height = height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#e9e9e9";
    // if dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      context.fillStyle = "#202020";
    }
    context.rect(0, 0, width, height);
    context.fill();
    canvas.current.style.transform = "translate(-50%, -50%)";

    let fieldWidth = gameData.bottomRight[0] - gameData.topLeft[0];
    let fieldHeight = gameData.bottomRight[1] - gameData.topLeft[1];

    let topMargin = gameData.topLeft[1];
    let bottomMargin = fieldBackground.current.height - gameData.bottomRight[1];
    let leftMargin = gameData.topLeft[0];
    let rightMargin = fieldBackground.current.width - gameData.bottomRight[0];

    let margin = Math.min(topMargin, bottomMargin, leftMargin, rightMargin);
    let extendedFieldWidth = fieldWidth + margin * 2;
    let extendedFieldHeight = fieldHeight + margin * 2;
    let constrainHeight =
      width / height > extendedFieldWidth / extendedFieldHeight;
    let imageScalar: number;
    if (constrainHeight) {
      imageScalar = height / extendedFieldHeight;
    } else {
      imageScalar = width / extendedFieldWidth;
    }
    let fieldCenterX = fieldWidth * 0.5 + gameData.topLeft[0];
    let fieldCenterY = fieldHeight * 0.5 + gameData.topLeft[1];
    let renderValues = [
      Math.floor(width * 0.5 - fieldCenterX * imageScalar), // X (normal)
      Math.floor(height * 0.5 - fieldCenterY * imageScalar), // Y (normal)
      Math.ceil(width * -0.5 - fieldCenterX * imageScalar), // X (flipped)
      Math.ceil(height * -0.5 - fieldCenterY * imageScalar), // Y (flipped)
      fieldBackground.current.width * imageScalar, // Width
      fieldBackground.current.height * imageScalar, // Height
    ];
    context.drawImage(
      fieldBackground.current,
      renderValues[0],
      renderValues[1],
      renderValues[4],
      renderValues[5],
    );

    let canvasFieldLeft = renderValues[0] + gameData.topLeft[0] * imageScalar;
    let canvasFieldTop = renderValues[1] + gameData.topLeft[1] * imageScalar;
    let canvasFieldWidth = fieldWidth * imageScalar;
    let canvasFieldHeight = fieldHeight * imageScalar;
    let pixelsPerInch =
      (canvasFieldHeight / gameData.heightInches +
        canvasFieldWidth / gameData.widthInches) /
      2;

    // Convert translation to pixel coordinates

    let calcCoordinates = (
      translation: [number, number],
      alwaysFlipped = false,
    ): [number, number] => {
      if (!gameData) return [0, 0];
      let positionInches = [
        convert(translation[0], "meters", "inches"),
        convert(translation[1], "meters", "inches"),
      ];

      positionInches[1] *= -1; // Positive y is flipped on the canvas
      positionInches[1] += gameData.heightInches;
      let positionPixels: [number, number] = [
        positionInches[0] * (canvasFieldWidth / gameData.widthInches),
        positionInches[1] * (canvasFieldHeight / gameData.heightInches),
      ];
      if (alwaysFlipped) {
        positionPixels[0] =
          canvasFieldLeft + canvasFieldWidth - positionPixels[0];
        positionPixels[1] =
          canvasFieldTop + canvasFieldHeight - positionPixels[1];
      } else {
        positionPixels[0] += canvasFieldLeft;
        positionPixels[1] += canvasFieldTop;
      }
      return positionPixels;
    };

    pixelsToCoordinates.current = (
      translation: [number, number],
      alwaysFlipped = false,
    ): [number, number] => {
      if (!gameData) return [0, 0];
      let positionPixels: [number, number] = [
        translation[0] - canvasFieldLeft,
        translation[1] - canvasFieldTop,
      ];
      if (alwaysFlipped) {
        positionPixels[0] =
          canvasFieldWidth - (positionPixels[0] - canvasFieldLeft);
        positionPixels[1] =
          canvasFieldHeight - (positionPixels[1] - canvasFieldTop);
      }
      let positionInches: [number, number] = [
        positionPixels[0] * (gameData.widthInches / canvasFieldWidth),
        positionPixels[1] * (gameData.heightInches / canvasFieldHeight),
      ];
      positionInches[1] = gameData.heightInches - positionInches[1];
      positionInches[1] *= -1;
      return positionInches;
    };
    context.strokeStyle = "#eb9800";
    context.lineWidth = 2.5 * pixelsPerInch;
    context.beginPath();
    for (let v of currentPath) {
      //drawCircle(calcCoordinates([v.x, v.y]), 3 * pixelsPerInch, "red");
      context.lineTo(...calcCoordinates([v.x, v.y]));
    }
    context.stroke();
    for (let v of currentPath) {
      drawCircle(
        context,
        calcCoordinates([v.x, v.y]),
        2.5 * pixelsPerInch,
        "red",
      );
    }
  }, [
    currentPath,
    gameData,
    field,
    container.current,
    fieldBackground.current,
    canvas.current,
    active,
    size,
  ]);
  useEffect(() => {
    const regeneratePath = async () => {
      try {
        setCurrentPath(await window.java.generatePath(start, target));
      } catch (e) {
        handleError(e);
      }
    };
    regeneratePath();
  }, [
    start,
    target,
    injectPoints,
    normalizeCorners,
    robotLength,
    robotWidth,
    straightawayPointSpacing,
    splitPercent,
    cornerPointSpacing,
    cornerSize,
    cornerCutDist,
    snapMode,
    field,
  ]);

  function drawCircle(
    context: CanvasRenderingContext2D,
    center: [number, number],
    radius: number,
    color: string,
    fill = true,
  ) {
    context.beginPath();
    context.arc(center[0], center[1], radius, 0, Math.PI * 2);
    if (fill) {
      context.fillStyle = color;
      context.fill();
    } else {
      context.strokeStyle = color;
      context.stroke();
    }
    context.closePath();
  }

  return (
    <div id="patheditor" className={"tab" + (active ? " active" : "")}>
      <div className="container">
        <div className="field">
          <div
            className="canvas-container"
            style={{ position: "relative", zIndex: 3, userSelect: "none" }}
            ref={container}
          >
            <canvas
              ref={canvas}
              className="field-canvas"
              onMouseMove={(e) => {
                if (!canvas.current) return;
                let rect = canvas.current.getBoundingClientRect();
                let x = e.clientX - rect.left;
                let y = e.clientY - rect.top;
                let coords = pixelsToCoordinates.current([x, y]);
                let xCoord = coords[0];
                let yCoord = -coords[1];
                let xInch = convert(xCoord, "inches", "meters").toFixed(2);
                let yInch = convert(yCoord, "inches", "meters").toFixed(2);
                document.querySelector("#mouseX").innerHTML = xInch;
                document.querySelector("#mouseY").innerHTML = yInch;
              }}
            >
              <img
                ref={fieldBackground}
                src={`../main_window/static/img/${field}.png`}
              ></img>
            </canvas>
          </div>
        </div>

        <div className="mouseCoords">
          <p>
            (<span id="mouseX"></span>, <span id="mouseY"></span>)
          </p>
        </div>

        <table className="config">
          <thead>
            <tr>
              <td>
                <h3>Setup</h3>
              </td>
              <td>
                <h3>Point Spacing</h3>
              </td>
              <td>
                <h3>Corners</h3>
              </td>
              <td>
                <h3>Robot Setup</h3>
              </td>
              <td>
                <h3>Extras</h3>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <label htmlFor="field">Field</label>
                <select
                  id="field"
                  value={field}
                  onChange={(e) => {
                    setField(e.target.value);
                  }}
                >
                  <option value="2024">2024</option>
                </select>
              </td>
              <td>
                <label htmlFor="injectPoints">Inject Ponts</label>
                <input
                  onChange={() => {
                    try {
                      window.java.setInjectPoints(!injectPoints);
                      setInjectPoints(!injectPoints);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                  type="checkbox"
                  id="injectPoints"
                  checked={injectPoints}
                />
              </td>

              <td>
                <label htmlFor="normalizeCorners">Normalize Corners</label>
                <input
                  type="checkbox"
                  id="normalizeCorners"
                  checked={normalizeCorners}
                  onChange={() => {
                    try {
                      window.java.setNormalizeCorners(!normalizeCorners);
                      setNormalizeCorners(!normalizeCorners);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="robotLength">Robot Length</label>
                <input
                  type="number"
                  id="robotLength"
                  value={robotLength}
                  step="0.01"
                  onChange={(e) => {
                    try {
                      if (parseFloat(e.target.value) > 0) {
                        window.java.setRobotLength(parseFloat(e.target.value));
                      }
                      setRobotLength(parseFloat(e.target.value));
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="cornerCutDist">Corner Cutting Distance</label>
                <input
                  type="number"
                  id="cornerCutDist"
                  value={cornerCutDist}
                  step="0.001"
                  onChange={(e) => {
                    try {
                      window.java.setCornerCutDist(parseFloat(e.target.value));
                      setCornerCutDist(parseFloat(e.target.value));
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Start </label>
                (
                <input
                  type="number"
                  id="startX"
                  value={start.x.toString()}
                  onChange={(e) => {
                    setStart({
                      x: parseFloat(e.target.value),
                      y: start.y,
                    });
                  }}
                />
                ,
                <input
                  type="number"
                  id="startY"
                  value={start.y.toString()}
                  onChange={(e) => {
                    setStart({
                      x: start.x,
                      y: parseFloat(e.target.value),
                    });
                  }}
                />
                )
              </td>
              <td>
                <label htmlFor="straightawayPointSpacing">
                  Straightaway Point Spacing
                </label>
                <input
                  type="number"
                  id="straightawayPointSpacing"
                  value={straightawayPointSpacing}
                  step="0.01"
                  onChange={(e) => {
                    try {
                      let newVal = parseFloat(e.target.value);
                      if (newVal > 0) {
                        window.java.setPointSpacing(newVal);
                      }
                      setStraightawayPointSpacing(newVal);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="splitPercent">Split Percent</label>
                <div className="slidecontainer">
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={splitPercent}
                    className="slider"
                    id="splitPercent"
                    onInput={(e) => {
                      try {
                        let newVal = parseFloat(
                          (e.target as HTMLInputElement).value,
                        );
                        window.java.setCornerSplitPercent(newVal);
                        setSplitPercent(newVal);
                      } catch (e) {
                        handleError(e);
                      }
                    }}
                  />
                  <p>
                    <span id="splitPercentValue">{splitPercent}</span>%
                  </p>
                </div>
              </td>
              <td>
                <label htmlFor="robotWidth">Robot Width</label>
                <input
                  type="number"
                  id="robotWidth"
                  value={robotWidth}
                  step="0.01"
                  onChange={(e) => {
                    try {
                      let newVal = parseFloat(e.target.value);
                      if (newVal > 0) {
                        window.java.setRobotWidth(newVal);
                      }
                      setRobotWidth(newVal);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="snapMode">Snap Mode</label>
                <select
                  id="snapMode"
                  value={snapMode}
                  onChange={(e) => {
                    try {
                      window.java.setSnapMode(e.target.value as SnapMode);
                      setSnapMode(e.target.value as SnapMode);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                >
                  <option value="NONE">NONE</option>
                  <option value="SNAP_ALL">SNAP_ALL</option>
                  <option value="SNAP_START">SNAP_START</option>
                  <option value="SNAP_TARGET">SNAP_TARGET</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Target </label>
                (
                <input
                  type="number"
                  id="targetX"
                  value={target.x.toString()}
                  onChange={(e) => {
                    setTarget({
                      x: parseFloat(e.target.value),
                      y: target.y,
                    });
                  }}
                />
                ,
                <input
                  type="number"
                  id="targetY"
                  value={target.y.toString()}
                  onChange={(e) => {
                    setTarget({
                      x: target.x,
                      y: parseFloat(e.target.value),
                    });
                  }}
                />
                )
              </td>
              <td>
                <label htmlFor="cornerPointSpacing">Corner Point Spacing</label>
                <input
                  type="number"
                  id="cornerPointSpacing"
                  value={cornerPointSpacing}
                  step="0.01"
                  onChange={(e) => {
                    try {
                      let newVal = parseFloat(e.target.value);
                      if (newVal > 0) {
                        window.java.setCornerPointSpacing(newVal);
                      }
                      setCornerPointSpacing(newVal);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="cornerSize">Corner Size</label>
                <input
                  type="number"
                  id="cornerSize"
                  value={cornerSize}
                  step="0.01"
                  onChange={(e) => {
                    try {
                      let newVal = parseFloat(e.target.value);
                      if (newVal > 0) {
                        window.java.setCornerDist(newVal);
                      }
                      setCornerSize(newVal);
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                />
              </td>
              <td>
                <label htmlFor="robotColor">Robot Color</label>
                <input type="color" id="robotColor" defaultValue="#000000" />
              </td>
              <td>
                <button
                  className="form-button"
                  id="export"
                  onClick={async () => {
                    let config = `new PathfinderBuilder(Field.CRESCENDO_2024)
.setRobotLength(${robotLength})
.setRobotWidth(${robotWidth})
.setPointSpacing(${straightawayPointSpacing})
.setCornerPointSpacing(${cornerPointSpacing})
.setCornerDist(${cornerSize})
.setInjectPoints(${injectPoints})
.setNormalizeCorners(${normalizeCorners})
.setCornerSplitPercent(${splitPercent})
.setCornerCutDist(${cornerCutDist})
.build();
`;
                    // Copy to clipboard
                    navigator.clipboard.writeText(config);
                    Toastify({
                      text: `Config copied to clipboard! You can paste it into your robot code. To use your selected snap mode, use PathfindSnapMode.${snapMode} when generating paths.`,
                      duration: 3000,
                      gravity: "bottom",
                      position: "right",
                      backgroundColor: "green",
                    }).showToast();
                  }}
                >
                  Export
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const data: Tab = {
  name: "Path Editor",
  id: "patheditor",
  component: PathEditor,
};

export default data;

function handleError(e: Error) {
  Toastify({
    text: "Failed to generate path: " + e.message,
    duration: 3000,
    gravity: "bottom",
    position: "right",
    backgroundColor: "red",
  }).showToast();
}
