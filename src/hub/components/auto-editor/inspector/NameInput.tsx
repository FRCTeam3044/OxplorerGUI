import React, { useEffect, useState } from "react";
import {
  AutoCommand,
  AutoConditionalStep,
  AutoGroup,
} from "../../../../utils/structures";

export interface NameInputProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoConditionalStep;
  stepChange?: number;
}
const NameInput: React.FC<NameInputProps> = ({
  setModified,
  step,
  stepChange,
}) => {
  const [name, setName] = useState(step.name);
  useEffect(() => {
    if (name === step.name) return;
    setModified();
    step.name = name;
  }, [name]);
  useEffect(() => {
    if (name === step.name) return;
    setName(step.name);
  }, [step.name, stepChange]);
  return (
    <>
      <label className="form-label">Name: </label>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
    </>
  );
};

export default NameInput;
