import React, { useEffect, useMemo, useState } from "react";
import {
  AutoCommand,
  AutoCondition,
  AutoGroup,
  Template,
} from "../../../../utils/structures";

export interface IDSelectProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoCondition;
  stepChange?: number;
  templateList: Template[];
}
const IDSelect: React.FC<IDSelectProps> = ({
  setModified,
  step,
  stepChange,
  templateList,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [id, setId] = useState(step.id);
  useMemo(() => {
    if ("type" in step) {
      setOptions(
        templateList
          .filter((template) => template.type === step.type)
          .map((template) => template.id)
      );
    } else {
      setOptions(
        templateList
          .filter((template) => template.type === "conditional")
          .map((template) => template.id)
      );
    }
  }, [templateList, stepChange]);
  useEffect(() => {
    if (step.id == id) return;
    step.id = id;
    setModified();
  }, [id]);
  useEffect(() => {
    if (id !== step.id) setId(step.id);
  }, [step.id, stepChange]);
  return (
    <>
      <label className="form-label">ID: </label>
      <select
        value={id}
        onChange={(e) => {
          setId(e.target.value);
        }}
      >
        {options.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </>
  );
};

export default IDSelect;
