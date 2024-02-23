import { CRESCENDO_2024 } from "../utils/constants";
import { SnapMode, Vertex } from "../utils/structures";
import { convert } from "../utils/units";
import Toastify from "toastify-js";

export function onFocus() {
  window.util.updateWindowState({ tab: "path" });
}
export function initialize() {
  const canvas = document.querySelector(".field-canvas") as HTMLCanvasElement;
  const container = document.querySelector(
    ".canvas-container"
  ) as HTMLDivElement;
  const fieldSelect = document.querySelector("#field") as HTMLSelectElement;
  const injectPointsCheckbox = document.querySelector(
    "#injectPoints"
  ) as HTMLInputElement;
  const normalizeCornersCheckbox = document.querySelector(
    "#normalizeCorners"
  ) as HTMLInputElement;
  const robotLengthInput = document.querySelector(
    "#robotLength"
  ) as HTMLInputElement;

  const startXInput = document.querySelector("#startX") as HTMLInputElement;
  const startYInput = document.querySelector("#startY") as HTMLInputElement;
  const straightawayPointSpacingInput = document.querySelector(
    "#straightawayPointSpacing"
  ) as HTMLInputElement;
  const splitPercentSlider = document.querySelector(
    "#splitPercent"
  ) as HTMLInputElement;
  const splitPercentValueSpan = document.querySelector(
    "#splitPercentValue"
  ) as HTMLSpanElement;

  const robotWidthInput = document.querySelector(
    "#robotWidth"
  ) as HTMLInputElement;
  const targetXInput = document.querySelector("#targetX") as HTMLInputElement;
  const targetYInput = document.querySelector("#targetY") as HTMLInputElement;
  const cornerPointSpacingInput = document.querySelector(
    "#cornerPointSpacing"
  ) as HTMLInputElement;
  const cornerSizeInput = document.querySelector(
    "#cornerSize"
  ) as HTMLInputElement;
  const robotColorInput = document.querySelector(
    "#robotColor"
  ) as HTMLInputElement;
  const snapModeSelect = document.querySelector(
    "#snapMode"
  ) as HTMLSelectElement;
  const cornerCutDistInput = document.querySelector(
    "#cornerCutDist"
  ) as HTMLInputElement;
  let exportButton = document.querySelector("#export") as HTMLButtonElement;
  exportButton.onclick = async () => {
    let config = `new PathfinderBuilder(Field.CRESCENDO_2024)
.setRobotLength(${robotLengthInput.value})
.setRobotWidth(${robotWidthInput.value})
.setPointSpacing(${straightawayPointSpacingInput.value})
.setCornerPointSpacing(${cornerPointSpacingInput.value})
.setCornerDist(${cornerSizeInput.value})
.setInjectPoints(${injectPointsCheckbox.checked})
.setNormalizeCorners(${normalizeCornersCheckbox.checked})
.setCornerSplitPercent(${splitPercentSlider.value})
.setCornerCutDist(${cornerCutDistInput.value})
.build();
`;
    // Copy to clipboard
    navigator.clipboard.writeText(config);
    Toastify({
      text: `Config copied to clipboard! You can paste it into your robot code. To use your selected snap mode, use PathfindSnapMode.${snapModeSelect.value} when generating paths.`,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "green",
    }).showToast();
  };
  injectPointsCheckbox.onchange = () => {
    try {
      window.java.setInjectPoints(injectPointsCheckbox.checked);
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  normalizeCornersCheckbox.onchange = () => {
    try {
      window.java.setNormalizeCorners(normalizeCornersCheckbox.checked);
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  robotLengthInput.onchange = () => {
    try {
      window.java.setRobotLength(parseFloat(robotLengthInput.value));
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  robotWidthInput.onchange = () => {
    try {
      window.java.setRobotWidth(parseFloat(robotWidthInput.value));
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  straightawayPointSpacingInput.onchange = () => {
    try {
      window.java.setPointSpacing(
        parseFloat(straightawayPointSpacingInput.value)
      );
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  cornerPointSpacingInput.onchange = () => {
    try {
      window.java.setCornerPointSpacing(
        parseFloat(cornerPointSpacingInput.value)
      );
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  cornerSizeInput.onchange = () => {
    try {
      window.java.setCornerDist(parseFloat(cornerSizeInput.value));
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  cornerCutDistInput.onchange = () => {
    try {
      window.java.setCornerCutDist(parseFloat(cornerCutDistInput.value));
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  snapModeSelect.onchange = () => {
    try {
      window.java.setSnapMode(snapModeSelect.value as SnapMode);
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  splitPercentSlider.oninput = () => {
    splitPercentValueSpan.innerText = (
      parseFloat(splitPercentSlider.value) * 100
    )
      .toFixed(0)
      .toString();
    try {
      window.java.setCornerSplitPercent(parseFloat(splitPercentSlider.value));
    } catch (e) {
      handleError(e);
    }
    regeneratePath();
  };

  let pathInputs = [startXInput, startYInput, targetXInput, targetYInput];
  for (let input of pathInputs) {
    input.onchange = () => {
      currentStart = new Vertex(
        parseFloat(startXInput.value),
        parseFloat(startYInput.value)
      );
      currentEnd = new Vertex(
        parseFloat(targetXInput.value),
        parseFloat(targetYInput.value)
      );
      regeneratePath();
    };
  }

  const context = canvas.getContext("2d");
  const image = document.createElement("img");
  canvas.appendChild(image);
  image.src = "../main_window/static/img/2024.png";

  const gameData = CRESCENDO_2024;
  let currentStart = new Vertex(4, 3);
  let currentEnd = new Vertex(14, 6);
  let currentPath: Vertex[] = [];

  image.onload = () => {
    setInterval(render, 1000 / 60);
  };
  function render() {
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.style.width = width.toString() + "px";
    canvas.style.height = height.toString() + "px";
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#e9e9e9";
    // if dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      context.fillStyle = "#202020";
    }
    context.rect(0, 0, width, height);
    context.fill();
    canvas.style.transform = "translate(-50%, -50%)";

    let fieldWidth = gameData.bottomRight[0] - gameData.topLeft[0];
    let fieldHeight = gameData.bottomRight[1] - gameData.topLeft[1];

    let topMargin = gameData.topLeft[1];
    let bottomMargin = image.height - gameData.bottomRight[1];
    let leftMargin = gameData.topLeft[0];
    let rightMargin = image.width - gameData.bottomRight[0];

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
      image.width * imageScalar, // Width
      image.height * imageScalar, // Height
    ];
    context.drawImage(
      image,
      renderValues[0],
      renderValues[1],
      renderValues[4],
      renderValues[5]
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
      alwaysFlipped = false
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
    context.strokeStyle = "#eb9800";
    context.lineWidth = 2.5 * pixelsPerInch;
    context.beginPath();
    for (let v of currentPath) {
      //drawCircle(calcCoordinates([v.x, v.y]), 3 * pixelsPerInch, "red");
      context.lineTo(...calcCoordinates([v.x, v.y]));
    }
    context.stroke();
    for (let v of currentPath) {
      drawCircle(calcCoordinates([v.x, v.y]), 2.5 * pixelsPerInch, "red");
    }
  }

  function drawCircle(
    center: [number, number],
    radius: number,
    color: string,
    fill = true
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

  async function regeneratePath() {
    try {
      currentPath = await window.java.generatePath(currentStart, currentEnd);
    } catch (e) {
      handleError(e);
    }
  }

  async function updateInputs() {
    straightawayPointSpacingInput.value = (
      await window.java.getPointSpacing()
    ).toString();
    cornerPointSpacingInput.value = (
      await window.java.getCornerPointSpacing()
    ).toString();
    cornerSizeInput.value = (await window.java.getCornerDist()).toString();
    injectPointsCheckbox.checked = await window.java.getInjectPoints();
    normalizeCornersCheckbox.checked = await window.java.getNormalizeCorners();
    splitPercentSlider.value = (
      await window.java.getCornerSplitPercent()
    ).toString();
    snapModeSelect.value = (await window.java.getSnapMode()).toString();
  }

  updateInputs();
  regeneratePath();
}

function handleError(e: Error) {
  Toastify({
    text: "Failed to generate path: " + e.message,
    duration: 3000,
    gravity: "bottom",
    position: "right",
    backgroundColor: "red",
  }).showToast();
}
