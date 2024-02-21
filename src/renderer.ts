import "./index.css";
import {
  Auto,
  AutoCommand,
  AutoGroup,
  AutoStep,
  SnapMode,
  Vertex,
} from "./javaUtils/structures";
import { CRESCENDO_2024 } from "./constants";
import { convert } from "./utils/units";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import * as go from "gojs";

declare global {
  interface Window {
    api: {
      generatePath: (start: Vertex, target: Vertex) => Promise<Vertex[]>;
      setPointSpacing: (spacing: number) => void;
      setCornerPointSpacing: (spacing: number) => void;
      setCornerDist: (distance: number) => void;
      setInjectPoints: (inject: boolean) => void;
      setNormalizeCorners: (normalize: boolean) => void;
      setCornerSplitPercent: (percent: number) => void;
      setRobotLength: (height: number) => void;
      setRobotWidth: (width: number) => void;
      setCornerCutDist: (dist: number) => void;
      setSnapMode: (snap: SnapMode) => void;
      getCornerPointSpacing: () => Promise<number>;
      getPointSpacing: () => Promise<number>;
      getCornerDist: () => Promise<number>;
      getInjectPoints: () => Promise<boolean>;
      getNormalizeCorners: () => Promise<boolean>;
      getCornerSplitPercent: () => Promise<number>;
      getSnapMode: () => Promise<SnapMode>;
    };
  }
}

const tabButtons = document.querySelectorAll(
  ".tab-button"
) as NodeListOf<HTMLButtonElement>;
const tabs = document.querySelectorAll(".tab");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.tabTarget);

    tabs.forEach((tab) => tab.classList.remove("active"));
    tabButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");
    target.classList.add("active");
  });
});

const canvas = document.querySelector(".field-canvas") as HTMLCanvasElement;
const container = document.querySelector(".canvas-container") as HTMLDivElement;
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
const snapModeSelect = document.querySelector("#snapMode") as HTMLSelectElement;
const cornerCutDistInput = document.querySelector(
  "#cornerCutDist"
) as HTMLInputElement;
injectPointsCheckbox.onchange = () => {
  try {
    window.api.setInjectPoints(injectPointsCheckbox.checked);
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

normalizeCornersCheckbox.onchange = () => {
  try {
    window.api.setNormalizeCorners(normalizeCornersCheckbox.checked);
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

robotLengthInput.onchange = () => {
  try {
    window.api.setRobotLength(parseFloat(robotLengthInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

robotWidthInput.onchange = () => {
  try {
    window.api.setRobotWidth(parseFloat(robotWidthInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

straightawayPointSpacingInput.onchange = () => {
  try {
    window.api.setPointSpacing(parseFloat(straightawayPointSpacingInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

cornerPointSpacingInput.onchange = () => {
  try {
    window.api.setCornerPointSpacing(parseFloat(cornerPointSpacingInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

cornerSizeInput.onchange = () => {
  try {
    window.api.setCornerDist(parseFloat(cornerSizeInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

cornerCutDistInput.onchange = () => {
  try {
    window.api.setCornerCutDist(parseFloat(cornerCutDistInput.value));
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

snapModeSelect.onchange = () => {
  try {
    window.api.setSnapMode(snapModeSelect.value as SnapMode);
  } catch (e) {
    handleError(e);
  }
  regeneratePath();
};

splitPercentSlider.oninput = () => {
  splitPercentValueSpan.innerText = (parseFloat(splitPercentSlider.value) * 100)
    .toFixed(0)
    .toString();
  try {
    window.api.setCornerSplitPercent(parseFloat(splitPercentSlider.value));
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
  context.fillStyle = "#202020";
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
    currentPath = await window.api.generatePath(currentStart, currentEnd);
  } catch (e) {
    handleError(e);
  }
}

async function updateInputs() {
  straightawayPointSpacingInput.value = (
    await window.api.getPointSpacing()
  ).toString();
  cornerPointSpacingInput.value = (
    await window.api.getCornerPointSpacing()
  ).toString();
  cornerSizeInput.value = (await window.api.getCornerDist()).toString();
  injectPointsCheckbox.checked = await window.api.getInjectPoints();
  normalizeCornersCheckbox.checked = await window.api.getNormalizeCorners();
  splitPercentSlider.value = (
    await window.api.getCornerSplitPercent()
  ).toString();
  snapModeSelect.value = (await window.api.getSnapMode()).toString();
}

updateInputs();
regeneratePath();
function handleError(e: Error) {
  Toastify({
    text: "Failed to generate path: " + e.message,
    duration: 3000,
    gravity: "bottom",
    position: "right",
    backgroundColor: "red",
  }).showToast();
}

// GRAPH
let auto = JSON.parse(`[
  {
    "type": "group",
    "id": "deadline",
    "name": "Drive Until Note",
    "children": [
      {
        "name": "Wait for Note",
        "type": "command",
        "id": "wait_for_note",
        "parameters": {}
      },
      {
        "name": "Go to and Track Point",
        "type": "command",
        "id": "go_to_and_track_point",
        "parameters": {
          "targetX": 3,
          "targetY": 0,
          "trackX": 0,
          "trackY": 3
        }
      },
      {
    "type": "group",
    "id": "deadline",
    "name": "Drive Until Note",
    "children": [
      {
        "name": "Wait for Note",
        "type": "command",
        "id": "wait_for_note",
        "parameters": {}
      },
      {
        "name": "Go to and Track Point",
        "type": "command",
        "id": "go_to_and_track_point",
        "parameters": {
          "targetX": 3,
          "targetY": 0,
          "trackX": 0,
          "trackY": 3
        }
      }
    ]
  }
    ]
  },
  {
    "name": "Go to Note",
    "type": "command",
    "id": "go_to_note",
    "parameters": {}
  }
]`) as Auto;

let $ = go.GraphObject.make;
let diagram = $(go.Diagram, "gojs", {
  "undoManager.isEnabled": true,
  "animationManager.isEnabled": false,
  //layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 }),
  // layout: $(go.LayeredDigraphLayout, {
  //   columnSpacing: 10,
  //   layerSpacing: 10,
  // }),
  layout: $(go.LayeredDigraphLayout, {
    columnSpacing: 10,
    layerSpacing: 10,
  }),
});

diagram.nodeTemplate = $(
  go.Node,
  "Auto",
  $(
    go.Shape,
    "Rectangle",
    { fill: "white", stroke: "black" },
    new go.Binding("fill", "color")
  ),
  $(go.TextBlock, { margin: 8 }, new go.Binding("text", "text")),
  // Add a plus button to add children to the auto, then regenerate the graph
  $(
    go.Panel,
    "Auto",
    {
      alignment: go.Spot.BottomCenter,
      // If the node is in a group, bottom center. If it is in the outermost layer, right center

      padding: new go.Margin(30, 0, 0, 0),
    },
    new go.Binding("alignment", "isRoot", function (isRoot: boolean) {
      return isRoot ? go.Spot.RightCenter : go.Spot.BottomCenter;
    }),
    $(go.Shape, "PlusLine", {
      width: 10,
      height: 10,
      margin: 4,
      click: function (e: any, obj: any) {
        let node = obj.part;
        let step = node.data.step as AutoStep;
        let newStep = {
          type: "command",
          id: "new_command",
          name: "New Command",
          parameters: {},
        };
        console.log(step, node.data.step, node.data.step.children);
        if (step.type === "group") {
          node.data.step.children.push(newStep);
        } else {
          let parent = node.data.parent;
          let index = parent.indexOf(step);
          parent.splice(index + 1, 0, newStep);
        }
        console.log(auto);
        regenerateGraph();
      },
    })
  ),
  // add click event to the node to update the inputs
  {
    click: function (e: any, obj: any) {
      let node = obj.part;
      let step = node.data.step as AutoStep;
      updateGraphInputs(step, node.data.parent);
    },
  }
);

diagram.linkTemplate = $(
  go.Link,
  { routing: go.Link.Normal, corner: 5 },
  $(
    go.Shape,
    { strokeWidth: 3, stroke: "black" },
    new go.Binding("stroke", "color")
  ), // this is the link shape
  $(
    go.Shape,
    { toArrow: "Standard", stroke: "black", fill: "black" },
    new go.Binding("stroke", "color"),
    new go.Binding("fill", "color")
  ) // this is the arrow at the end of the link
);

diagram.groupTemplate = $(
  go.Group,
  "Auto",
  { layout: $(go.LayeredDigraphLayout, { direction: 90 }) },
  $(go.Shape, "Rectangle", {
    fill: "transparent",
    stroke: "gray",
    strokeWidth: 3,
  }), // increased border thickness
  $(go.Placeholder, { padding: new go.Margin(30, 5, 20, 5) }),
  $(
    go.TextBlock, // this is the text
    {
      alignment: go.Spot.Top,
      font: "Bold 12pt Sans-Serif",
      margin: new go.Margin(10, 0, 0, 0),
    }, // added top margin
    new go.Binding("text", "text")
  ),
  $(
    go.Panel,
    "Auto",
    {
      alignment: go.Spot.BottomCenter,
      padding: new go.Margin(30, 10, 0, 10),
    },
    $(go.Shape, "PlusLine", {
      width: 10,
      height: 10,
      margin: 4,
      click: function (e: any, obj: any) {
        let node = obj.part;
        let step = node.data.step as AutoStep;
        let newStep = {
          type: "command",
          id: "new_command",
          name: "New Command",
          parameters: {},
        };
        let parent = node.data.parent;
        let index = parent.indexOf(step);
        parent.splice(index + 1, 0, newStep);
        regenerateGraph();
      },
    })
  ),
  {
    click: function (e: any, obj: any) {
      let node = obj.part;
      let step = node.data.step as AutoStep;
      updateGraphInputs(step, node.data.parent);
    },
  }
);

type NodeData = {
  key: number;
  text: string;
  color: string;
  step: AutoStep;
  index: number;
  parent: AutoStep[];
  isGroup: boolean;
  group?: number;
  isRoot?: boolean;
};

type LinkData = {
  from: number;
  to: number;
  color?: string;
};

let nodeDataArray: NodeData[] = [];
let linkDataArray: LinkData[] = [];

let key = 0;
let toProcess = [{ auto, parent: null }] as {
  auto: Auto;
  parent: number | null;
}[];
function processStep(
  step: AutoStep,
  parent: Auto,
  index: number,
  parentKey: number | null
) {
  let currentKey = key++;
  nodeDataArray.push({
    key: currentKey,
    text: `${step.name} (${step.id})`,
    color: step.type === "group" ? "lightblue" : "lightgreen",
    step,
    index,
    parent,
    isGroup: step.type === "group",
    group: parentKey !== null ? parentKey : undefined,
    isRoot: parentKey === null,
  });
  if (index < parent.length - 1) {
    linkDataArray.push({
      from: currentKey,
      to: key,
    });
  }
  if (parentKey !== null) {
    // linkDataArray.push({
    //   from: parentKey,
    //   to: currentKey,
    //   color: "gray",
    // });
  }
  if (step.type === "group") {
    toProcess.push({ auto: step.children, parent: currentKey });
  }
}

function regenerateGraph() {
  key = 0;
  nodeDataArray = [];
  linkDataArray = [];
  // clear the graph
  toProcess = [{ auto, parent: null }] as {
    auto: Auto;
    parent: number | null;
  }[];
  while (toProcess.length > 0) {
    let current = toProcess.pop();
    for (let i = 0; i < current.auto.length; i++) {
      processStep(
        current.auto[i],
        current.auto,
        i,
        //i == 0 ? current.parent : null
        current.parent
      );
    }
  }

  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
}

let form = document.querySelector("#form");

function updateGraphInputs(step: AutoStep, parent: AutoStep[]) {
  form.innerHTML = "";
  let nameInput = document.createElement("input");
  let nameLabel = document.createElement("label");
  nameInput.value = step.name;
  nameLabel.className = "form-label";
  nameLabel.innerText = "Name: ";
  form.appendChild(nameLabel);
  nameInput.onchange = () => {
    step.name = nameInput.value;
    regenerateGraph();
  };
  form.appendChild(nameInput);
  form.appendChild(document.createElement("br"));
  let idInput = document.createElement("input");
  let idLabel = document.createElement("label");
  idInput.value = step.id;
  idLabel.className = "form-label";
  idLabel.innerText = "ID: ";
  form.appendChild(idLabel);
  idInput.onchange = () => {
    step.id = idInput.value;
    regenerateGraph();
  };
  form.appendChild(idInput);
  form.appendChild(document.createElement("br"));
  let typeInput = document.createElement("select");
  let typeLabel = document.createElement("label");
  typeLabel.className = "form-label";
  typeLabel.innerText = "Type: ";
  form.appendChild(typeLabel);
  let types = ["command", "group"];
  for (let type of types) {
    let option = document.createElement("option");
    option.value = type;
    option.innerText = type;
    typeInput.appendChild(option);
  }
  typeInput.value = step.type;
  typeInput.onchange = () => {
    step.type = typeInput.value as "command" | "group";
    if (step.type === "group" && !step.children) {
      step.children = [];
    } else if (step.type === "command" && !step.parameters) {
      step.parameters = {};
    }
    regenerateGraph();
    updateGraphInputs(step, parent);
  };
  form.appendChild(typeInput);
  form.appendChild(document.createElement("br"));
  if (step.type === "group") {
    let addCommandButton = document.createElement("button");
    addCommandButton.innerText = "+ Add Child";
    addCommandButton.className = "form-button";
    addCommandButton.onclick = () => {
      step.children.push({
        type: "command",
        id: "new_command",
        name: "New Command",
        parameters: {},
      } as AutoCommand);
      regenerateGraph();
    };
    form.appendChild(addCommandButton);
    form.appendChild(document.createElement("br"));
    /*     for (let i = 0; i < step.children.length; i++) {
      let child = step.children[i];
      let childDiv = document.createElement("div");
      let removeButton = document.createElement("button");
      removeButton.innerText = "Remove";
      removeButton.onclick = () => {
        step.children.splice(i, 1);
        regenerateGraph();
      };
      childDiv.appendChild(removeButton);
      form.appendChild(childDiv);
      updateGraphInputs(child);
    } */
  }

  let removeButton = document.createElement("button");
  removeButton.innerText = "- Remove";
  removeButton.className = "form-button";
  removeButton.onclick = () => {
    let index = parent.indexOf(step);
    parent.splice(index, 1);
    regenerateGraph();
  };
  form.appendChild(removeButton);
}
regenerateGraph();
