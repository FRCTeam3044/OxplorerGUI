import React from "react";
import {
  AutoCommand,
  AutoCondition,
  AutoGroup,
  Template,
} from "../../../../utils/structures";

export interface IDSelectProps {
  setModified: () => void;
  step: AutoCommand | AutoGroup | AutoCondition;
  templateList: Template[];
}
const IDSelect: React.FC<IDSelectProps> = ({
  setModified,
  step,
  templateList,
}) => {
  const [options, setOptions] = React.useState<string[]>([]);
  React.useEffect(() => {
    if ("type" in step) {
      setOptions(
        templateList
          .filter((template) => template.type == step.type)
          .map((template) => template.id),
      );
    } else {
      setOptions(
        templateList
          .filter((template) => template.type == "conditional")
          .map((template) => template.id),
      );
    }
  }, [templateList]);
  return (
    <>
      <label className="form-label">ID: </label>
      <select
        value={step.id}
        onChange={(e) => {
          step.id = e.target.value;
          setModified();
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
