import React, { useEffect, useMemo, useState } from "react";
import {
  AutoCommand,
  AutoConditionalStep,
  AutoGroup,
  Template,
} from "../../../../utils/structures";

export interface TypeSelectProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoConditionalStep;
  stepChange?: number;
  templateList: Template[];
}
const types = ["command", "group", "macro", "if", "while"];
const TypeSelect: React.FC<TypeSelectProps> = ({
  setModified,
  step,
  stepChange,
  templateList,
}) => {
  const [defaultGroup, setDefaultGroup] = useState("");
  const [defaultCommand, setDefaultCommand] = useState("");
  const [defaultMacro, setDefaultMacro] = useState("");
  const [defaultIf, setDefaultIf] = useState("");
  useEffect(() => {
    if (!templateList) return;
    const group = templateList.find((template) => template.type === "group");
    if (group) setDefaultGroup(group.id);
    const command = templateList.find(
      (template) => template.type === "command",
    );
    if (command) setDefaultCommand(command.id);
    const macro = templateList.find((template) => template.type === "macro");
    if (macro) setDefaultMacro(macro.id);
    const conditional = templateList.find(
      (template) => template.type === "conditional",
    );
    if (conditional) setDefaultIf(conditional.id);
  }, [templateList]);

  useEffect(() => {
    if (type !== step.type) setType(step.type);
  }, [step.type, stepChange]);

  const [type, setType] = useState(step.type);
  useEffect(() => {
    if (step.type === type) return;
    step.type = type;
    if (step.type === "group") {
      step.id = defaultGroup;
      if (!step.children) step.children = [];
    } else if (step.type === "command" || step.type === "macro") {
      if (!step.parameters) step.parameters = {};
      step.id = step.type === "command" ? defaultCommand : defaultMacro;
    } else if (step.type === "if" || step.type === "while") {
      if (!step.condition) {
        step.condition = {
          id: defaultIf,
          children: [],
          name: "New Condition",
          parameters: {},
        };
      }
      if (!step.child) {
        step.child = {
          type: "group",
          id: defaultGroup,
          name: "New Group",
          children: [],
        };
      }
    }
    setModified();
  }, [type, defaultIf, defaultCommand, defaultGroup, defaultMacro]);
  return (
    <>
      <label className="form-label">Type: </label>
      <select
        value={type}
        onChange={(e) => {
          setType(
            e.target.value as "command" | "group" | "macro" | "if" | "while",
          );
        }}
      >
        {types.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>
    </>
  );
};

export default TypeSelect;
