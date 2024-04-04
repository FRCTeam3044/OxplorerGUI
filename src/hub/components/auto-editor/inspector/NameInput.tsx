import React from "react";
import {
  AutoCommand,
  AutoConditionalStep,
  AutoGroup,
} from "../../../../utils/structures";

export interface NameInputProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoConditionalStep;
}
const NameInput: React.FC<NameInputProps> = ({ setModified, step }) => {
  return (
    <>
      <label className="form-label">Name: </label>
      <input
        type="text"
        value={step.name}
        onChange={(e) => {
          step.name = e.target.value;
          setModified();
        }}
      />
    </>
  );
};

export default NameInput;
