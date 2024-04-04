import React from "react";
import {
  AutoConditionalStep,
  AutoStep,
  Template,
} from "../../../../utils/structures";
import NameInput from "./NameInput";
import TypeSelect from "./TypeSelect";
import RemoveButton from "./RemoveButton";

export interface ConditionalStepInspectorProps {
  setModified: () => void;
  step: AutoConditionalStep;
  parent: AutoStep[];
  templateList: Template[];
}
const ConditionalStepInspector: React.FC<ConditionalStepInspectorProps> = ({
  setModified,
  step,
  parent,
  templateList,
}) => {
  return (
    <>
      <NameInput setModified={setModified} step={step} />
      <br />
      <TypeSelect
        setModified={setModified}
        step={step}
        templateList={templateList}
      />
      <br />
      <RemoveButton setModified={setModified} step={step} parent={parent} />
    </>
  );
};

export default ConditionalStepInspector;
