import * as go from "gojs";
import {
  Auto,
  AutoCommand,
  AutoStep,
  CommandTemplate,
  Template,
} from "../utils/structures";
import Toastify from "toastify-js";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";

let currentAuto: Auto;
let currentAutoPath: string;
let unsaved = false;
let templateList: Template[];

let open;
let newHandler;
let save;
let saveAs;
let form = document.querySelector("#form") as HTMLDivElement;

export function importTemplates(commands: Template[]) {
  templateList = commands;
  form.innerHTML = "";
}
export async function onFocus() {
  window.util.updateWindowState({
    tab: "editor",
    filename: currentAutoPath
      ? currentAutoPath.split(await window.files.getFileSeperator()).pop()
      : undefined,
    unsaved,
  });
}
export async function initialize() {
  templateList = await window.util.getTemplates();
  let fileSelect = document.querySelector(
    "#auto-editor-startup"
  ) as HTMLSelectElement;
  let mainContent = document.querySelector(
    ".auto-editor-content"
  ) as HTMLDivElement;
  let openBtn = document.querySelector("#autos-open") as HTMLButtonElement;
  let newBtn = document.querySelector("#autos-new") as HTMLButtonElement;
  let inspectorOpenBtn = document.querySelector(
    "#autos-inspector-open"
  ) as HTMLButtonElement;
  let inspectorNewBtn = document.querySelector(
    "#autos-inspector-new"
  ) as HTMLButtonElement;
  let saveBtn = document.querySelector("#autos-save") as HTMLButtonElement;
  let saveAsBtn = document.querySelector("#autos-save-as") as HTMLButtonElement;
  let recentDiv = document.querySelector("#recent-files") as HTMLDivElement;
  let newCommandBtn = document.querySelector(
    "#autos-new-command"
  ) as HTMLButtonElement;
  let newGroupBtn = document.querySelector(
    "#autos-new-group"
  ) as HTMLButtonElement;
  open = async () => {
    try {
      let file = await window.files.openFile();
      if (file) {
        currentAuto = JSON.parse(file.data) as Auto;
        currentAutoPath = file.path;
        form.innerHTML = "";
        regenerateGraph();
      }
    } catch (e) {
      Toastify({
        text: "Unable to load file: " + e.message.split("Error: ")[1],
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "red",
      }).showToast();
    }
  };
  openBtn.onclick = open;
  inspectorOpenBtn.onclick = open;
  newHandler = async () => {
    try {
      let file = await window.files.newFile();
      if (file) {
        currentAuto = JSON.parse(file.data) as Auto;
        currentAutoPath = file.path;
        form.innerHTML = "";
        regenerateGraph();
      }
    } catch (e) {
      Toastify({
        text: "Unable to create file: " + e.message.split("Error: ")[1],
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "red",
      }).showToast();
    }
  };
  newBtn.onclick = newHandler;
  inspectorNewBtn.onclick = newHandler;
  save = async () => {
    console.log(currentAutoPath, currentAuto);
    if (currentAutoPath) {
      try {
        await window.files.saveFile(
          JSON.stringify(currentAuto, null, 2),
          currentAutoPath
        );
        unsaved = false;
        onFocus();
      } catch (e) {
        Toastify({
          text: "Unable to save file: " + e.message.split("Error: ")[1],
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "red",
        }).showToast();
      }
    } else {
      saveAsBtn.click();
    }
  };
  saveBtn.onclick = save;
  saveAs = async () => {
    try {
      let path = await window.files.saveFileAs(
        JSON.stringify(currentAuto, null, 2)
      );
      if (path) {
        currentAutoPath = path;
        unsaved = false;
        onFocus();
      }
    } catch (e) {
      Toastify({
        text: "Unable to save file: " + e.message.split("Error: ")[1],
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "red",
      }).showToast();
    }
  };
  saveAsBtn.onclick = saveAs;
  newCommandBtn.onclick = () => {
    currentAuto.push({
      type: "command",
      id: templateList.find((t) => t.type === "command").id ?? "new_command",
      name: "New Command",
      parameters: {},
    });
    unsaved = true;
    regenerateGraph();
  };

  newGroupBtn.onclick = () => {
    currentAuto.push({
      type: "group",
      id: templateList.find((t) => t.type === "group").id ?? "new_group",
      name: "New Group",
      children: [],
    });
    unsaved = true;
    regenerateGraph();
  };
  const loadRecents = async () => {
    let files = await window.files.getRecentFiles();
    recentDiv.innerHTML = "";
    for (let file of files) {
      let btn = document.createElement("a");
      let fileNameSpan = document.createElement("span");

      fileNameSpan.innerText = file
        .split(await window.files.getFileSeperator())
        .pop();
      fileNameSpan.className = "file-name-span";
      let pathSpan = document.createElement("span");
      pathSpan.innerText = file;
      pathSpan.className = "path-span";
      btn.appendChild(fileNameSpan);
      btn.appendChild(pathSpan);
      btn.onclick = async () => {
        try {
          let fileContent = await window.files.openFileFromPath(file);
          if (fileContent) {
            currentAuto = JSON.parse(fileContent) as Auto;
            currentAutoPath = file;
            regenerateGraph();
          }
        } catch (e) {
          Toastify({
            text: "Unable to load file: " + e.message.split("Error: ")[1],
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "red",
          }).showToast();
        }
      };
      recentDiv.appendChild(btn);
    }
  };
  loadRecents();

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

  diagram.toolManager.hoverDelay = 75;
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    $(
      go.Shape,
      "Rectangle",
      { stroke: "black" },
      new go.Binding("fill", "color")
    ),
    $(
      go.TextBlock,
      new go.Binding("text", "text"),
      new go.Binding("margin", "isRoot", function (isRoot: boolean) {
        return isRoot ? new go.Margin(8, 18, 8, 8) : new go.Margin(5, 8, 12, 8);
      })
    ),
    $(
      go.Panel,
      "Auto",
      {},
      new go.Binding("alignment", "isRoot", function (isRoot: boolean) {
        return isRoot ? go.Spot.RightCenter : go.Spot.BottomCenter;
      }),
      new go.Binding("padding", "isRoot", function (isRoot: boolean) {
        return isRoot ? new go.Margin(0, 0, 0, 0) : new go.Margin(20, 0, 0, 0);
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
            id:
              templateList.find((t) => t.type === "command").id ??
              "new_command",
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
          unsaved = true;
          regenerateGraph();
        },
        toolTip: $(
          go.Adornment,
          "Auto",
          $(go.Shape, { fill: "#FFFFCC" }),
          $(go.TextBlock, { margin: 4 }, "Add command after")
        ),
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
      // Semi transparent grey fill
      fill: "rgba(150,150,150,0.4)",
      stroke: "gray",
      strokeWidth: 3,
    }), // increased border thickness
    $(
      go.Placeholder,
      new go.Binding("padding", "isRoot", function (isRoot: boolean) {
        return isRoot
          ? new go.Margin(30, 30, 20, 5)
          : new go.Margin(30, 5, 20, 5);
      })
    ),
    $(
      go.TextBlock, // this is the text
      {
        alignment: go.Spot.Top,
        font: "Bold 12pt Sans-Serif",
        margin: new go.Margin(10, 10, 0, 10),
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
      new go.Binding("alignment", "isRoot", function (isRoot: boolean) {
        return isRoot ? go.Spot.RightCenter : go.Spot.BottomCenter;
      }),
      new go.Binding("padding", "isRoot", function (isRoot: boolean) {
        return isRoot
          ? new go.Margin(10, 10, 10, 10)
          : new go.Margin(30, 10, 0, 10);
      }),
      $(go.Shape, "PlusLine", {
        width: 15,
        height: 15,
        margin: new go.Margin(4, 0, 4, 0),
        strokeWidth: 2,
        click: function (e: any, obj: any) {
          let node = obj.part;
          let step = node.data.step as AutoStep;
          let newStep = {
            type: "command",
            id:
              templateList.find((t) => t.type === "command").id ??
              "new_command",
            name: "New Command",
            parameters: {},
          };
          let parent = node.data.parent;
          let index = parent.indexOf(step);
          parent.splice(index + 1, 0, newStep);
          unsaved = true;
          regenerateGraph();
        },
        toolTip: $(
          go.Adornment,
          "Auto",
          $(go.Shape, { fill: "#FFFFCC" }),
          $(go.TextBlock, { margin: 4 }, "Add command after")
        ),
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
  let toProcess = [] as {
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
      text:
        step.name !== undefined
          ? `${step.name}${step.type === "group" ? " " : "\n"}(${step.id})`
          : step.id,
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
    onFocus();
    if (currentAuto === undefined) return;
    mainContent.style.display = "block";
    fileSelect.style.display = "none";
    // clear the graph
    toProcess = [{ auto: currentAuto, parent: null }] as {
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
      unsaved = true;
      regenerateGraph();
    };
    form.appendChild(nameInput);
    form.appendChild(document.createElement("br"));
    let idInput = document.createElement("select");
    let idLabel = document.createElement("label");
    idLabel.className = "form-label";
    idLabel.innerText = "ID: ";
    form.appendChild(idLabel);
    idInput.onchange = () => {
      step.id = idInput.value;
      unsaved = true;
      regenerateGraph();
      updateGraphInputs(step, parent);
    };
    for (let template of templateList) {
      if (template.type !== step.type) continue;
      let option = document.createElement("option");
      option.value = template.id;
      option.innerText = template.id;
      idInput.appendChild(option);
    }
    idInput.value = step.id;
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
      unsaved = true;
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
          id:
            templateList.find((t) => t.type === "command").id ?? "new_command",
          name: "New Command",
          parameters: {},
        } as AutoCommand);
        unsaved = true;
        regenerateGraph();
      };
      form.appendChild(addCommandButton);
      form.appendChild(document.createElement("br"));
    } else {
      let template = templateList.find(
        (t) => t.id === step.id
      ) as CommandTemplate;
      if (!template) {
        let error = document.createElement("span");
        error.innerText = "No template found for this command";
        error.style.color = "red";
        form.appendChild(error);
      } else {
        // for (let key in template.parameters) {
        //   let input = document.createElement("input");
        //   let label = document.createElement("label");
        //   label.className = "form-label";
        //   label.innerText = key + ": ";
        //   input.value = step.parameters[key] ?? template.parameters[key];
        //   input.onchange = () => {
        //     step.parameters[key] = input.value;
        //     unsaved = true;
        //   };
        //   form.appendChild(label);
        //   form.appendChild(input);
        //   form.appendChild(document.createElement("br"));
        // }
        // if template parameters has no properties, dont create a json editor
        let parameters = template.parameters;
        // Fill in any paramaters from step.parameters, leaving the rest as default
        for (let key in step.parameters) {
          parameters[key] = step.parameters[key];
        }

        if (Object.keys(template.parameters).length !== 0) {
          let jsoneditor = document.createElement("div");
          jsoneditor.id = "jsoneditor";
          form.appendChild(jsoneditor);
          let containsArray = Object.values(template.parameters).some(
            Array.isArray
          );
          console.log(containsArray);
          const options: JSONEditorOptions = {
            onChangeJSON: (json) => {
              step.parameters = json;
              unsaved = true;
              regenerateGraph();
            },
            mode: containsArray ? "tree" : "form",
            mainMenuBar: false,
            name: "Parameters",
          };
          const editor = new JSONEditor(jsoneditor, options);
          editor.set(parameters);
        }
      }
    }

    let removeButton = document.createElement("button");
    removeButton.innerText = "Remove";
    removeButton.className = "form-button";
    removeButton.onclick = () => {
      let index = parent.indexOf(step);
      parent.splice(index, 1);
      unsaved = true;
      regenerateGraph();
      form.innerHTML = "";
    };
    form.appendChild(removeButton);
  }
  regenerateGraph();
}

export { open, newHandler as new, save, saveAs };
