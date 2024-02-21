import * as go from "gojs";
import { Auto, AutoCommand, AutoStep } from "../utils/structures";

export default function initialize() {
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
}
