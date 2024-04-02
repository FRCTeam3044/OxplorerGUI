import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import React, { useEffect, useRef } from "react";
import {
  CommandTemplate,
  Template,
  AutoGroup,
  AutoStep,
  AutoCondition,
  AutoCommand,
  ConditionalTemplate,
  Auto,
} from "../../../utils/structures";
import Toastify from "toastify-js";

export interface InspectorProps {
  selectedNode: {
    step: AutoStep | AutoCondition;
    parent: AutoStep[] | AutoCondition[];
  };
  setUnsaved: (unsaved: boolean) => void;
  setRefreshCount: React.Dispatch<React.SetStateAction<number>>;
  templateList: Template[];
  currentAutoData: Auto;
}
const Inspector: React.FC<InspectorProps> = ({
  selectedNode,
  setUnsaved,
  setRefreshCount,
  templateList,
  currentAutoData,
}) => {
  const form = useRef<HTMLDivElement>(null);
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
  return <div id="form" ref={form}></div>;
};

export default Inspector;
