import * as go from "gojs";
import {
  Auto,
  AutoCommand,
  AutoCondition,
  AutoConditionalStep,
  AutoGroup,
  AutoStep,
  CommandTemplate,
  ConditionalTemplate,
  Template,
} from "../../utils/structures";
import Toastify from "toastify-js";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import { Tab, TabProps } from "./Tabs";
import React, { useEffect, useRef, useState } from "react";
import "./AutoEditor.css";

const $ = go.GraphObject.make;

let undoList: Auto[] = [];
let redoList: Auto[] = [];

let open: () => void | undefined;
let newHandler: () => void | undefined;
let save: () => void | undefined;
let saveAs: () => void | undefined;
let importTemplates: (templates: Template[]) => void;
let undo: () => void;
let redo: () => void;

type NodeData = {
  key: number;
  text: string;
  color: string;
  step: AutoStep | AutoCondition;
  index: number;
  parent: AutoStep[] | AutoCondition[];
  isGroup: boolean;
  group?: number;
  isRoot?: boolean;
  parentCondition?: boolean;
  parentIf?: boolean;
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
  auto: Auto | AutoCondition[];
  parent: number | null;
  parentCondition?: boolean;
  parentIf?: boolean;
}[];

let diagram: go.Diagram;

const AutoEditor: React.FC<TabProps> = ({ active }) => {
  const [recents, setRecents] = useState<
    {
      name: string;
      path: string;
    }[]
  >([]);
  const [selectingFile, setSelectingFile] = useState(true);
  const [currentAutoData, setCurrentAutoData] = useState<Auto>();
  const [currentAutoPath, setCurrentAutoPath] = useState<string>();
  const [selectedNode, setSelectedNode] = useState<{
    step: AutoStep | AutoCondition;
    parent: AutoStep[] | AutoCondition[];
  }>();
  const [unsaved, setUnsaved] = useState(false);
  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const form = useRef<HTMLDivElement>(null);
  const skipUndo = useRef(false);

  // Load recents
  useEffect(() => {
    const loadRecents = async () => {
      let recentsTemp = [] as { name: string; path: string }[];
      let files = await window.files.getRecentFiles();
      for (let file of files) {
        let name = file.split(await window.files.getFileSeperator()).pop();
        recentsTemp.push({ name, path: file });
      }
      setRecents(recentsTemp);
    };
    loadRecents();
  }, []);
  // Load templates & Initialize diagram
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplateList(await window.util.getTemplates());
    };
    loadTemplates();
    diagram = $(go.Diagram, "gojs", {
      "undoManager.isEnabled": false,
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
  }, []);
  // Create methods for exporting
  useEffect(() => {
    importTemplates = (commands: Template[]) => {
      setTemplateList(commands);
    };
    open = async () => {
      try {
        let file = await window.files.openFile();
        if (file) {
          setCurrentAutoData(JSON.parse(file.data) as Auto);
          setCurrentAutoPath(file.path);
          form.current.innerHTML = "";
          undoList = [];
        }
      } catch (e) {
        console.error(e);
        Toastify({
          text: "Unable to load file: " + e.message.split("Error: ")[1] ?? e,
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "red",
        }).showToast();
      }
    };
    newHandler = async () => {
      try {
        let file = await window.files.newFile();
        if (file) {
          setCurrentAutoData(JSON.parse(file.data) as Auto);
          setCurrentAutoPath(file.path);
          form.current.innerHTML = "";
          undoList = [];
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
    saveAs = async () => {
      try {
        let path = await window.files.saveFileAs(
          JSON.stringify(currentAutoData, null, 2),
        );
        if (path) {
          setCurrentAutoPath(path);
          setUnsaved(false);
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
    save = async () => {
      if (currentAutoPath) {
        try {
          await window.files.saveFile(
            JSON.stringify(currentAutoData, null, 2),
            currentAutoPath,
          );
          setUnsaved(false);
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
        saveAs();
      }
    };
    undo = () => {
      if (undoList.length > 0) {
        redoList.push(JSON.parse(JSON.stringify(currentAutoData)));
        undoList.pop();
        skipUndo.current = true;
        setCurrentAutoData(
          JSON.parse(JSON.stringify(undoList[undoList.length - 1])),
        );
        setSelectedNode(undefined);
      }
    };

    redo = () => {
      if (redoList.length > 0) {
        undoList.push(JSON.parse(JSON.stringify(currentAutoData)));
        skipUndo.current = true;
        setCurrentAutoData(JSON.parse(JSON.stringify(redoList.pop())));
        setSelectedNode(undefined);
      }
    };
  }, [currentAutoData]);
  // Set up the diagram
  useEffect(() => {
    diagram.commandHandler.doKeyDown = function () {
      let e = diagram.lastInput;
      let control = e.control || e.meta;
      if (control && e.key === "Z") {
        undo();
      } else if (control && e.key === "Y") {
        redo();
      }
    };

    diagram.toolManager.hoverDelay = 75;

    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(
        go.Shape,
        "Rectangle",
        { stroke: "black" },
        new go.Binding("fill", "color"),
      ),
      $(
        go.TextBlock,
        new go.Binding("text", "text"),
        new go.Binding("margin", "isRoot", function (isRoot: boolean) {
          return isRoot
            ? new go.Margin(8, 18, 8, 8)
            : new go.Margin(5, 8, 15, 8);
        }),
      ),
      $(
        go.Panel,
        "Auto",
        {},
        new go.Binding("alignment", "isRoot", function (isRoot: boolean) {
          return isRoot ? go.Spot.RightCenter : go.Spot.BottomCenter;
        }),
        new go.Binding("padding", "isRoot", function (isRoot: boolean) {
          return isRoot
            ? new go.Margin(0, 0, 0, 0)
            : new go.Margin(20, 0, 0, 0);
        }),
        $(
          go.Shape,
          "PlusLine",
          {
            width: 10,
            height: 10,
            margin: 4,
            click: function (e: any, obj: any) {
              let node = obj.part;
              let step = node.data.step as AutoStep;
              let firstCommand = templateList.find((t) => t.type === "command");
              if (!firstCommand) {
                Toastify({
                  text: "No command template found. Create a template first!",
                  duration: 3000,
                  gravity: "bottom",
                  position: "right",
                  style: {
                    color: "black",
                    background: "red",
                  },
                }).showToast();
                return;
              }
              let newStep = {
                type: "command",
                id: firstCommand.id ?? "new_command",
                name: "New Command",
                parameters: {},
              };
              if (step.type === "group") {
                node.data.step.children.push(newStep);
              } else {
                let parent = node.data.parent;
                let index = parent.indexOf(step);
                parent.splice(index + 1, 0, newStep);
              }
              setUnsaved(true);
              setRefreshCount((refresh) => refresh + 1);
            },
            toolTip: $(
              go.Adornment,
              "Auto",
              $(go.Shape, { fill: "#FFFFCC" }),
              $(go.TextBlock, { margin: 4 }, "Add command after"),
            ),
          },
          new go.Binding(
            "visible",
            "parentCondition",
            (parentCondition: boolean) => !parentCondition,
          ),
        ),
      ),
      {
        click: function (e: any, obj: any) {
          let node = obj.part;
          let step = node.data.step as AutoStep;
          setSelectedNode({ step, parent: node.data.parent });
        },
      },
    );

    diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Normal, corner: 5 },
      $(
        go.Shape,
        { strokeWidth: 3, stroke: "black" },
        new go.Binding("stroke", "color"),
      ), // this is the link shape
      $(
        go.Shape,
        { toArrow: "Standard", stroke: "black", fill: "black" },
        new go.Binding("stroke", "color"),
        new go.Binding("fill", "color"),
      ), // this is the arrow at the end of the link
    );

    diagram.groupTemplate = $(
      go.Group,
      "Auto",
      {
        layout: $(go.LayeredDigraphLayout, { direction: 90 }),
      },
      new go.Binding("layout", "step", (step: AutoStep | AutoCondition) => {
        return "type" in step
          ? $(go.LayeredDigraphLayout, { direction: 90, columnSpacing: 10 })
          : $(go.LayeredDigraphLayout, {
              direction: 0,
              columnSpacing: 5,
            });
      }),
      $(
        go.Shape,
        "Rectangle",
        {
          // Semi transparent grey fill
          fill: "rgba(150,150,150,0.6)",
          stroke: "gray",
          strokeWidth: 3,
        },
        new go.Binding("stroke", "step", (step: AutoStep | AutoCondition) => {
          return "type" in step ? "gray" : "#222";
        }),
        new go.Binding("fill", "step", (step: AutoStep | AutoCondition) => {
          if ("type" in step) {
            if (step.type === "if" || step.type === "while") {
              return "rgba(170,75,225,0.5)";
            } else {
              return "rgba(100,100,100,0.6)";
            }
          } else {
            return "rgba(200,200,30,0.7)";
          }
        }),
      ), // increased border thickness
      $(
        go.Placeholder,
        new go.Binding("padding", "isRoot", function (isRoot: boolean) {
          return isRoot
            ? new go.Margin(30, 30, 20, 5)
            : new go.Margin(30, 5, 20, 5);
        }),
      ),
      $(
        go.TextBlock, // this is the text
        {
          alignment: go.Spot.Top,
          font: "Bold 12pt Sans-Serif",
          margin: new go.Margin(10, 10, 0, 10),
        }, // added top margin
        new go.Binding("text", "text"),
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
        $(
          go.Shape,
          "PlusLine",
          {
            width: 15,
            height: 15,
            margin: new go.Margin(4, 0),
            strokeWidth: 2,
            click: function (e: any, obj: any) {
              let data = obj.part.data;
              if ("type" in data.step) {
                let firstCommand = templateList.find(
                  (t) => t.type === "command",
                );
                if (!firstCommand) {
                  Toastify({
                    text: "No command template found. Create a template first!",
                    duration: 3000,
                    gravity: "bottom",
                    position: "right",
                    style: {
                      color: "black",
                      background: "red",
                    },
                  }).showToast();
                  return;
                }
                let step = data.step as AutoStep;
                let newStep = {
                  type: "command",
                  id: firstCommand.id ?? "new_command",
                  name: "New Command",
                  parameters: {},
                };
                let parent = data.parent;
                let index = parent.indexOf(step);
                parent.splice(index + 1, 0, newStep);
              } else {
                let condition = data.step as AutoCondition;
                let newStep = {
                  id: "new_condition",
                  children: [] as AutoCondition[],
                  name: "New Condition",
                  parameters: {},
                };
                let parent = data.parent;
                let index = parent.indexOf(condition);
                parent.splice(index + 1, 0, newStep);
              }
              setUnsaved(true);
              setRefreshCount((refresh) => refresh + 1);
            },
            toolTip: $(
              go.Adornment,
              "Auto",
              $(go.Shape, { fill: "#FFFFCC" }),
              $(
                go.TextBlock,
                { margin: 4 },
                new go.Binding(
                  "text",
                  "step",
                  (step: AutoStep | AutoCondition) => {
                    return "type" in step
                      ? "Add command after"
                      : "Add condition after";
                  },
                ),
              ),
            ),
          },
          new go.Binding(
            "visible",
            "parentCondition",
            (parentCondition: boolean) => !parentCondition,
          ),
        ),
      ),
      {
        click: function (e: any, obj: any) {
          let node = obj.part;
          let step = node.data.step as AutoStep | AutoCondition;
          setSelectedNode({ step, parent: node.data.parent });
        },
      },
    );
  }, [templateList, currentAutoData]);
  // Update window title
  useEffect(() => {
    const update = async () => {
      window.util.updateWindowState({
        tab: "editor",
        filename: currentAutoPath
          ? currentAutoPath.split(await window.files.getFileSeperator()).pop()
          : undefined,
        unsaved,
      });
    };
    if (active) {
      update();
    }
  }, [currentAutoPath, unsaved, active]);
  // Generate the diagram
  useEffect(() => {
    key = 0;
    nodeDataArray = [];
    linkDataArray = [];
    if (currentAutoData === undefined) return;
    // TODO: Undo/Redo
    if (!skipUndo.current) {
      undoList.push(JSON.parse(JSON.stringify(currentAutoData)));
      skipUndo.current = false;
    }
    setSelectingFile(false);
    // clear the graph
    toProcess = [{ auto: currentAutoData, parent: null }] as {
      auto: Auto | AutoCondition[];
      parent: number | null;
      parentCondition?: boolean;
      parentIf?: boolean;
    }[];
    while (toProcess.length > 0) {
      let current = toProcess.pop();
      for (let i = 0; i < current.auto.length; i++) {
        processStep(
          current.auto[i],
          current.auto,
          i,
          //i == 0 ? current.parent : null
          current.parent,
          current.parentCondition,
          current.parentIf,
        );
      }
    }

    function processStep(
      step: AutoStep | AutoCondition,
      parent: Auto | AutoCondition[],
      index: number,
      parentKey: number | null,
      parentCondition?: boolean,
      parentIf?: boolean,
    ) {
      let currentKey = key++;
      // If step is of type AutoStep
      if ("type" in step && "type" in parent[index]) {
        let displayId;
        if (
          step.type === "group" ||
          step.type === "command" ||
          step.type === "macro"
        ) {
          displayId = step.id;
        } else {
          displayId = step.type;
        }
        let isCondition = step.type === "if" || step.type === "while";
        nodeDataArray.push({
          key: currentKey,
          text:
            step.name !== undefined
              ? `${step.name}${step.type === "group" || isCondition ? " " : "\n"}` +
                (isCondition ? "" : `(${displayId})`)
              : displayId,
          color: step.type === "group" ? "lightblue" : "lightgreen",
          step,
          index,
          parent,
          isGroup: step.type === "group" || isCondition,
          group: parentKey !== null ? parentKey : undefined,
          isRoot: parentKey === null,
          parentCondition,
          parentIf: parentIf,
        });
        if (index < parent.length - 1) {
          linkDataArray.push({
            from: currentKey,
            to: key,
          });
        }
        if (step.type === "group") {
          toProcess.push({ auto: step.children, parent: currentKey });
        } else if (isCondition) {
          step = step as AutoConditionalStep;
          toProcess.push({
            auto: [step.child],
            parent: currentKey,
            parentCondition: true,
            parentIf: step.type === "if",
          });
          toProcess.push({
            auto: [step.condition],
            parent: currentKey,
            parentCondition: true,
            parentIf: step.type === "if",
          });
        }
      } else {
        // If step is of type AutoCondition
        let condition = step as AutoCondition;
        let text = condition.id;
        if (parentCondition) {
          text = `${parentIf ? "If" : "While"}: ${text}`;
        }
        nodeDataArray.push({
          key: currentKey,
          text,
          color: "lightpink",
          step,
          index,
          parent: parent,
          isGroup: true,
          group: parentKey !== null ? parentKey : undefined,
          isRoot: parentKey === null,
          parentCondition: parentCondition,
          parentIf: parentIf,
        });

        toProcess.push({ auto: condition.children, parent: currentKey });
      }
    }

    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  }, [currentAutoData, selectingFile, refreshCount]);
  // Handle the inspector
  useEffect(() => {
    if (selectedNode === undefined) {
      form.current.innerHTML = "";
      return;
    }
    form.current.innerHTML = "";
    let { step, parent } = selectedNode;
    if ("type" in step) {
      if (
        step.type === "if" ||
        step.type === "while" ||
        step.type === "group" ||
        step.type === "command" ||
        step.type === "macro"
      ) {
        let nameInput = document.createElement("input");
        let nameLabel = document.createElement("label");
        nameInput.value = step.name;
        nameLabel.className = "form-label";
        nameLabel.innerText = "Name: ";
        form.current.appendChild(nameLabel);
        nameInput.onchange = () => {
          step.name = nameInput.value;
          setUnsaved(true);
          setRefreshCount((refresh) => refresh + 1);
        };
        form.current.appendChild(nameInput);
        form.current.appendChild(document.createElement("br"));
      }
      if (
        step.type === "group" ||
        step.type === "command" ||
        step.type === "macro"
      ) {
        let idInput = document.createElement("select");
        let idLabel = document.createElement("label");
        idLabel.className = "form-label";
        idLabel.innerText = "ID: ";
        form.current.appendChild(idLabel);
        idInput.onchange = () => {
          (step as AutoGroup | AutoCommand).id = idInput.value;
          setUnsaved(true);
          setRefreshCount((refresh) => refresh + 1);
        };
        for (let template of templateList) {
          if (template.type !== step.type) continue;
          let option = document.createElement("option");
          option.value = template.id;
          option.innerText = template.id;
          idInput.appendChild(option);
        }
        idInput.value = step.id;
        form.current.appendChild(idInput);
        form.current.appendChild(document.createElement("br"));
      }
      let typeInput = document.createElement("select");
      let typeLabel = document.createElement("label");
      typeLabel.className = "form-label";
      typeLabel.innerText = "Type: ";
      form.current.appendChild(typeLabel);
      let types = ["command", "group", "macro", "if", "while"];
      for (let type of types) {
        let option = document.createElement("option");
        option.value = type;
        option.innerText = type;
        typeInput.appendChild(option);
      }
      typeInput.value = step.type;
      typeInput.onchange = () => {
        if (!("type" in step)) return;
        step.type = typeInput.value as
          | "command"
          | "group"
          | "macro"
          | "if"
          | "while";
        if (step.type === "group" && !step.children) {
          step.children = [];
        } else if (
          (step.type === "command" || step.type === "macro") &&
          !step.parameters
        ) {
          step.parameters = {};
        } else if (step.type === "if" || step.type === "while") {
          if (!step.condition) {
            step.condition = {
              id: "new_condition",
              children: [],
              name: "New Condition",
              parameters: {},
            };
          }
          if (!step.child) {
            step.child = {
              type: "group",
              id: "new_group",
              name: "New Group",
              children: [],
            };
          }
        }
        setUnsaved(true);
        setRefreshCount((refresh) => refresh + 1);
      };
      form.current.appendChild(typeInput);
      form.current.appendChild(document.createElement("br"));
      if (step.type === "group") {
        let addCommandButton = document.createElement("button");
        addCommandButton.innerText = "+ Add Child";
        addCommandButton.className = "form-button";
        addCommandButton.onclick = () => {
          if (!("type" in step) || step.type !== "group") return;
          let firstCommand = templateList.find((t) => t.type === "command");
          if (!firstCommand) {
            Toastify({
              text: "No command template found. Create a template first!",
              duration: 3000,
              gravity: "bottom",
              position: "right",
              style: {
                color: "black",
                background: "red",
              },
            }).showToast();
            return;
          }
          step.children.push({
            type: "command",
            id: firstCommand.id ?? "new_command",
            name: "New Command",
            parameters: {},
          } as AutoCommand);
          setUnsaved(true);
          setRefreshCount((refresh) => refresh + 1);
        };
        form.current.appendChild(addCommandButton);
        form.current.appendChild(document.createElement("br"));
      } else if (step.type === "command" || step.type == "macro") {
        let template = templateList.find(
          (t) => t.id === (step as AutoCommand).id,
        ) as CommandTemplate;
        if (!template) {
          let error = document.createElement("span");
          error.innerText = "No template found for this command";
          error.style.color = "red";
          form.current.appendChild(error);
          form.current.appendChild(document.createElement("br"));
        } else {
          // for (let key in template.parameters) {
          //   let input = document.createElement("input");
          //   let label = document.createElement("label");
          //   label.className = "form-label";
          //   label.innerText = key + ": ";
          //   input.value = step.parameters[key] ?? template.parameters[key];
          //   input.onchange = () => {
          //     step.parameters[key] = input.value;
          //     setUnsaved(true);
          //   };
          //   form.current.appendChild(label);
          //   form.current.appendChild(input);
          //   form.current.appendChild(document.createElement("br"));
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
            form.current.appendChild(jsoneditor);
            let containsArray = Object.values(template.parameters).some(
              Array.isArray,
            );
            const options: JSONEditorOptions = {
              onChangeJSON: (json) => {
                if (!("parameters" in step)) return;
                step.parameters = json;
                setUnsaved(true);
                setRefreshCount((refresh) => refresh + 1);
              },
              history: false,
              mode: containsArray ? "tree" : "form",
              mainMenuBar: false,
              name: "Parameters",
            };
            const editor = new JSONEditor(jsoneditor, options);
            editor.set(parameters);
          }
        }
      }
    } else {
      let idInput = document.createElement("select");
      let idLabel = document.createElement("label");
      idLabel.className = "form-label";
      idLabel.innerText = "ID: ";
      form.current.appendChild(idLabel);
      idInput.onchange = () => {
        if (!("id" in step)) return;
        step.id = idInput.value;
        setUnsaved(true);
        setRefreshCount((refresh) => refresh + 1);
      };
      for (let template of templateList) {
        if (template.type !== "conditional") continue;
        let option = document.createElement("option");
        option.value = template.id;
        option.innerText = template.id;
        idInput.appendChild(option);
      }
      idInput.value = step.id;
      form.current.appendChild(idInput);
      form.current.appendChild(document.createElement("br"));
      let addCommandButton = document.createElement("button");
      addCommandButton.innerText = "+ Add Child";
      addCommandButton.className = "form-button";

      let template = templateList.find(
        (t) => t.type === "conditional" && t.id === (step as AutoCondition).id,
      ) as ConditionalTemplate;
      addCommandButton.onclick = () => {
        if (!("children" in step)) return;
        if (
          template === undefined ||
          step.children.length < (template.maxChildren ?? -1) ||
          (template.maxChildren ?? -1) === -1
        ) {
          let firstCondition = templateList.find(
            (t) => t.type === "conditional",
          );
          if (!firstCondition) {
            Toastify({
              text: "No conditional template found. Create a template first!",
              duration: 3000,
              gravity: "bottom",
              position: "right",
              style: {
                color: "black",
                background: "red",
              },
            }).showToast();
            return;
          }
          (step as AutoCondition).children.push({
            id: firstCondition.id ?? "new_conditon",
            name: "New Condition",
            parameters: {},
            children: [],
          } as AutoCondition);
          setUnsaved(true);
          setRefreshCount((refresh) => refresh + 1);
        } else {
          Toastify({
            text: "Max children reached",
            duration: 3000,
            gravity: "bottom",
            position: "right",
            style: {
              color: "black",
              background: "yellow",
            },
          }).showToast();
        }
      };
      form.current.appendChild(addCommandButton);
      form.current.appendChild(document.createElement("br"));

      if (!template) {
        let error = document.createElement("span");
        error.innerText = "No template found for this condition";
        error.style.color = "red";
        form.current.appendChild(error);
        form.current.appendChild(document.createElement("br"));
      } else {
        let parameters = template.parameters;
        for (let key in step.parameters) {
          parameters[key] = step.parameters[key];
        }

        if (Object.keys(template.parameters).length !== 0) {
          let jsoneditor = document.createElement("div");
          jsoneditor.id = "jsoneditor";
          form.current.appendChild(jsoneditor);
          let containsArray = Object.values(template.parameters).some(
            Array.isArray,
          );
          const options: JSONEditorOptions = {
            onChangeJSON: (json) => {
              if (!("parameters" in step)) return;
              step.parameters = json;
              setUnsaved(true);
              setRefreshCount((refresh) => refresh + 1);
            },
            history: false,
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
      let index;
      if ("type" in step && "type" in parent[0]) {
        index = (parent as AutoStep[]).indexOf(step);
      } else {
        index = (parent as AutoCondition[]).indexOf(step as AutoCondition);
      }
      parent.splice(index, 1);
      setUnsaved(true);
      setRefreshCount((refresh) => refresh + 1);
      form.current.innerHTML = "";
    };
    form.current.appendChild(removeButton);
  }, [selectedNode, currentAutoData, templateList]);

  // Actually create the dom
  return (
    <div id="autoeditor" className={"tab" + (active ? " active" : "")}>
      <div id="auto-editor-startup">
        <div id="file-select" style={selectingFile ? {} : { display: "none" }}>
          <div id="recent">
            <h3>Recent</h3>
            <div className="divider"></div>
            <div id="recent-files">
              {recents.map((file) => (
                <a
                  key={file.path}
                  onClick={async () => {
                    try {
                      let fileContent = await window.files.openFileFromPath(
                        file.path,
                      );
                      if (fileContent) {
                        setCurrentAutoData(JSON.parse(fileContent) as Auto);
                        setCurrentAutoPath(file.path);
                      }
                    } catch (e) {
                      Toastify({
                        text:
                          "Unable to load file: " +
                          e.message.split("Error: ")[1],
                        duration: 3000,
                        gravity: "bottom",
                        position: "right",
                        backgroundColor: "red",
                      }).showToast();
                    }
                  }}
                >
                  <span className="file-name-span">{file.name}</span>
                  <span className="path-span">{file.path}</span>
                </a>
              ))}
            </div>
          </div>
          <div id="start">
            <button id="autos-open" onClick={open}>
              Open
            </button>
            <button id="autos-new" onClick={newHandler}>
              Create New
            </button>
            <div id="templates">
              <h3>Templates</h3>
              <div className="divider"></div>
              <p className="template">Coming soon!</p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="auto-editor-content"
        style={selectingFile ? { display: "none" } : undefined}
      >
        <div id="gojs"></div>
        <div id="inspector">
          <h2>Inspector</h2>
          <div className="divider"></div>
          <div id="form" ref={form}></div>
          <div className="divider"></div>
          <div className="graph-buttons">
            <button
              id="autos-new-command"
              onClick={() => {
                let firstCommand = templateList.find(
                  (t) => t.type === "command",
                );
                if (!firstCommand) {
                  Toastify({
                    text: "No command template found. Create a template first!",
                    duration: 3000,
                    gravity: "bottom",
                    position: "right",
                    style: {
                      color: "black",
                      background: "red",
                    },
                  }).showToast();
                  return;
                }
                currentAutoData.push({
                  type: "command",
                  id: firstCommand.id ?? "new_command",
                  name: "New Command",
                  parameters: {},
                });
                setRefreshCount((refresh) => refresh + 1);
                setUnsaved(true);
              }}
            >
              New Command
            </button>
            <button
              id="autos-new-group"
              onClick={() => {
                let firstGroup = templateList.find((t) => t.type === "group");
                if (!firstGroup) {
                  Toastify({
                    text: "No group template found. Create a template first!",
                    duration: 3000,
                    gravity: "bottom",
                    position: "right",
                    style: {
                      color: "black",
                      background: "red",
                    },
                  }).showToast();
                  return;
                }
                currentAutoData.push({
                  type: "group",
                  id: firstGroup.id ?? "new_group",
                  name: "New Group",
                  children: [],
                });
                setUnsaved(true);
                setRefreshCount((refresh) => refresh + 1);
              }}
            >
              New Group
            </button>
            <button
              id="autos-new-conditional"
              onClick={() => {
                currentAutoData.push({
                  type: "if",
                  name: "New Condition",
                  condition: {
                    id: "new_condition",
                    children: [],
                    name: "New Condition",
                    parameters: {},
                  },
                  child: {
                    type: "group",
                    id: "new_group",
                    name: "New Group",
                    children: [],
                  },
                });
                setUnsaved(true);
                setRefreshCount((refresh) => refresh + 1);
              }}
            >
              New Conditional
            </button>
          </div>
          <div className="divider"></div>
          <div className="save-buttons">
            <button id="autos-save" onClick={save}>
              Save
            </button>
            <button id="autos-save-as" onClick={saveAs}>
              Save As
            </button>
            <button id="autos-inspector-new" onClick={newHandler}>
              New
            </button>
            <button id="autos-inspector-open" onClick={open}>
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const data: Tab = {
  name: "Auto Editor",
  id: "autoeditor",
  component: AutoEditor,
};

export default data;

export { open, newHandler as new, save, saveAs, undo, redo, importTemplates };
