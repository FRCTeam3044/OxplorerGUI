import React from "react";
import { AutoCondition, Template } from "../../../../utils/structures";
import AddConditionalChild from "./AddConditionalChild";
import IDSelect from "./IdSelect";
import ParameterEditor from "./ParameterEditor";
import RemoveButton from "./RemoveButton";

export interface ConditionInspectorProps {
  setModified: () => void;
  step: AutoCondition;
  stepChange: number;
  templateList: Template[];
  parent: AutoCondition[];
}
const ConditionInspector: React.FC<ConditionInspectorProps> = ({
  setModified,
  step,
  templateList,
  stepChange,
  parent,
}) => {
  return (
    <>
      <IDSelect
        setModified={setModified}
        step={step}
        templateList={templateList}
      />
      <br />
      <AddConditionalChild
        setModified={setModified}
        step={step}
        templateList={templateList}
      />
      <br />
      <ParameterEditor
        setModified={setModified}
        step={step}
        templateList={templateList}
        stepChange={stepChange}
      />
      <br />
      <RemoveButton setModified={setModified} step={step} parent={parent} />
    </>
  );
};

export default ConditionInspector;
