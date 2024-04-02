import React, { useEffect } from "react";
import * as go from "gojs";
import {
  Auto,
  AutoCondition,
  AutoConditionalStep,
  AutoStep,
  Template,
} from "../../../utils/structures";
import Toastify from "toastify-js";
import "./GoDiagram.css";

const $ = go.GraphObject.make;

let diagram: go.Diagram;

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

interface GoDiagramProps {
  undo: () => void;
  redo: () => void;
  save: () => void;
  saveAs: () => void;
  templateList: Template[];
  currentAutoData: Auto;
  refreshCount: number;
  setRefreshCount: React.Dispatch<React.SetStateAction<number>>;
  selectingFile: boolean;
  setSelectingFile: React.Dispatch<React.SetStateAction<boolean>>;
  skipUndo: React.MutableRefObject<boolean>;
  setUnsaved: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedNode: React.Dispatch<
    React.SetStateAction<{
      step: AutoStep | AutoCondition;
      parent: AutoStep[] | AutoCondition[];
    }>
  >;
  undoList: Auto[];
}

const GoDiagram: React.FC<GoDiagramProps> = ({
  undo,
  redo,
  save,
  saveAs,
  templateList,
  currentAutoData,
  refreshCount,
  setRefreshCount,
  selectingFile,
  setSelectingFile,
  skipUndo,
  setUnsaved,
  setSelectedNode,
  undoList,
}) => {
  useEffect(() => {
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
  useEffect(() => {
    diagram.commandHandler.doKeyDown = function () {
      let e = diagram.lastInput;
      let control = e.control || e.meta;
      if (control && e.key === "Z") {
        undo();
      } else if (control && e.key === "Y") {
        redo();
      } else if (e.shift && control && e.key === "S") {
        saveAs();
      } else if (control && e.key === "S") {
        save();
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
        new go.Binding("fill", "color")
      ),
      $(
        go.TextBlock,
        new go.Binding("text", "text"),
        new go.Binding("margin", "isRoot", function (isRoot: boolean) {
          return isRoot
            ? new go.Margin(8, 18, 8, 8)
            : new go.Margin(5, 8, 15, 8);
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
              $(go.TextBlock, { margin: 4 }, "Add command after")
            ),
          },
          new go.Binding(
            "visible",
            "parentCondition",
            (parentCondition: boolean) => !parentCondition
          )
        )
      ),
      {
        click: function (e: any, obj: any) {
          let node = obj.part;
          let step = node.data.step as AutoStep;
          setSelectedNode({ step, parent: node.data.parent });
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
        })
      ), // increased border thickness
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
                  (t) => t.type === "command"
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
                  }
                )
              )
            ),
          },
          new go.Binding(
            "visible",
            "parentCondition",
            (parentCondition: boolean) => !parentCondition
          )
        )
      ),
      {
        click: function (e: any, obj: any) {
          let node = obj.part;
          let step = node.data.step as AutoStep | AutoCondition;
          setSelectedNode({ step, parent: node.data.parent });
        },
      }
    );
  }, [templateList, currentAutoData]);
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
          current.parentIf
        );
      }
    }

    function processStep(
      step: AutoStep | AutoCondition,
      parent: Auto | AutoCondition[],
      index: number,
      parentKey: number | null,
      parentCondition?: boolean,
      parentIf?: boolean
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

  return <div id="gojs"></div>;
};

export default GoDiagram;
