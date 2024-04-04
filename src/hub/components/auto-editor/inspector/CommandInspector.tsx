import React, { useEffect } from "react";
import { AutoCommand, AutoStep, Template } from "../../../../utils/structures";
import NameInput from "./NameInput";
import IDSelect from "./IdSelect";
import TypeSelect from "./TypeSelect";
import ParameterEditor from "./ParameterEditor";
import RemoveButton from "./RemoveButton";

export interface CommandInspectorProps {
  setModified: () => void;
  step: AutoCommand;
  stepChange: number;
  parent: AutoStep[];
  templateList: Template[];
}
const CommandInspector: React.FC<CommandInspectorProps> = ({
  setModified,
  step,
  stepChange,
  parent,
  templateList,
}) => {
  return (
    <>
      <NameInput setModified={setModified} step={step} />
      <br />
      <IDSelect
        setModified={setModified}
        step={step}
        templateList={templateList}
      />
      <br />
      <TypeSelect
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

export default CommandInspector;
