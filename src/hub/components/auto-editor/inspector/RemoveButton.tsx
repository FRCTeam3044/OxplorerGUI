import React from "react";
import { AutoCondition, AutoStep } from "../../../../utils/structures";

export interface RemoveButtonProps {
  setModified: () => void;
  step: AutoStep | AutoCondition;
  parent: AutoStep[] | AutoCondition[];
}
const RemoveButton: React.FC<RemoveButtonProps> = ({
  setModified,
  step,
  parent,
}) => {
  return (
    <button
      className="form-button"
      onClick={() => {
        let index;
        if ("type" in step && "type" in parent[0]) {
          index = (parent as AutoStep[]).indexOf(step);
        } else {
          index = (parent as AutoCondition[]).indexOf(step as AutoCondition);
        }
        parent.splice(index, 1);
        setModified();
      }}
    >
      Remove
    </button>
  );
};

export default RemoveButton;
