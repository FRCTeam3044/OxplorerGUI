import React from "react";
import { AutoGroup, AutoStep, Template } from "../../../../utils/structures";
import NameInput from "./NameInput";
import IDSelect from "./IdSelect";
import TypeSelect from "./TypeSelect";
import AddGroupChild from "./AddGroupChild";
import RemoveButton from "./RemoveButton";

export interface GroupInspectorProps {
  setModified: () => void;
  step: AutoGroup;
  parent: AutoStep[];
  templateList: Template[];
}
const GroupInspector: React.FC<GroupInspectorProps> = ({
  setModified,
  step,
  templateList,
  parent,
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
      <AddGroupChild
        setModified={setModified}
        step={step}
        templateList={templateList}
      />
      <br />
      <RemoveButton setModified={setModified} step={step} parent={parent} />
    </>
  );
};

export default GroupInspector;
