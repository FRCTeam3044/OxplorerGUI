import React, { useMemo, useState } from "react";
import {
  Template,
  AutoStep,
  AutoCondition,
  AutoCommand,
  AutoGroup,
  AutoConditionalStep,
} from "../../../utils/structures";
import GroupInspector from "./inspector/GroupInspector";
import CommandInspector from "./inspector/CommandInspector";
import ConditionalStepInspector from "./inspector/ConditionalStepInspector";
import ConditionInspector from "./inspector/ConditionInspector";

export interface InspectorProps {
  selectedNode: {
    step: AutoStep | AutoCondition;
    parent: AutoStep[] | AutoCondition[];
  };
  setUnsaved: (unsaved: boolean) => void;
  setRefreshCount: React.Dispatch<React.SetStateAction<number>>;
  templateList: Template[];
}
const Inspector: React.FC<InspectorProps> = ({
  selectedNode,
  setUnsaved,
  setRefreshCount,
  templateList,
}) => {
  const [inspector, setInspector] = useState<JSX.Element | undefined>();
  const [stepChange, setStepChange] = useState(0);
  function setModified() {
    setUnsaved(true);
    setRefreshCount((refresh) => refresh + 1);
    setStepChange((stepChange) => stepChange + 1);
  }
  useMemo(() => {
    if (selectedNode === undefined) {
      setInspector(undefined);
      return;
    }
    let type;
    if ("type" in selectedNode.step) {
      type = selectedNode.step.type;
    } else {
      type = "condition";
    }

    let elem;
    if (type === "group") {
      elem = (
        <GroupInspector
          setModified={setModified}
          step={selectedNode.step as AutoGroup}
          parent={selectedNode.parent as AutoStep[]}
          templateList={templateList}
        />
      );
    } else if (type === "command" || type === "macro") {
      elem = (
        <CommandInspector
          key={type}
          setModified={setModified}
          step={selectedNode.step as AutoCommand}
          parent={selectedNode.parent as AutoStep[]}
          templateList={templateList}
          stepChange={stepChange}
        />
      );
    } else if (type === "if" || type === "while") {
      elem = (
        <ConditionalStepInspector
          setModified={setModified}
          step={selectedNode.step as AutoConditionalStep}
          parent={selectedNode.parent as AutoStep[]}
          templateList={templateList}
        />
      );
    } else if (type === "condition") {
      elem = (
        <ConditionInspector
          setModified={setModified}
          step={selectedNode.step as AutoCondition}
          templateList={templateList}
          parent={selectedNode.parent as AutoCondition[]}
          stepChange={stepChange}
        />
      );
    } else {
      elem = undefined;
    }
    setInspector(elem);
  }, [selectedNode, stepChange]);

  return <div id="form">{inspector !== undefined && inspector}</div>;
};

export default Inspector;
