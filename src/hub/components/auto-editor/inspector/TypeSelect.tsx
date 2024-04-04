import React from "react";
import {
  AutoCommand,
  AutoConditionalStep,
  AutoGroup,
} from "../../../../utils/structures";

export interface TypeSelectProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoConditionalStep;
}
const types = ["command", "group", "macro", "if", "while"];
const TypeSelect: React.FC<TypeSelectProps> = ({ setModified, step }) => {
  return (
    <>
      <label className="form-label">Type: </label>
      <select
        value={step.type}
        onChange={(e) => {
          step.type = e.target.value as
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
          setModified();
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
