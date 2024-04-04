import React, { useMemo, useState } from "react";
import {
  AutoCondition,
  AutoGroup,
  ConditionalTemplate,
  Template,
} from "../../../../utils/structures";
import Toastify from "toastify-js";

export interface AddConditionalChildProps {
  setModified: () => void;
  step: AutoGroup | AutoCondition;
  templateList: Template[];
}
const AddConditionalChild: React.FC<AddConditionalChildProps> = ({
  setModified,
  step,
  templateList,
}) => {
  const [firstCondition, setFirstCondition] = useState<
    ConditionalTemplate | undefined
  >();
  const [template, setTemplate] = useState<ConditionalTemplate | undefined>();

  useMemo(() => {
    setFirstCondition(
      templateList.find((t) => t.type === "conditional") as ConditionalTemplate
    );
  }, [templateList]);

  useMemo(() => {
    setTemplate(
      templateList.find((t) => t.id === step.id) as ConditionalTemplate
    );
  }, [templateList, step]);

  return (
    <button
      className="form-button"
      onClick={() => {
        if (!("children" in step)) return;
        if (!firstCondition) {
          Toastify({
            text: "No conditional template found. Create a template first!",
            duration: 3000,
            gravity: "bottom",
            position: "right",
            style: {
              color: "black",
              background: "red",
            },
          }).showToast();
          return;
        }
        if (
          template === undefined ||
          step.children.length < (template.maxChildren ?? -1) ||
          (template.maxChildren ?? -1) === -1
        ) {
          (step as AutoCondition).children.push({
            id: firstCondition.id ?? "new_conditon",
            name: "New Condition",
            parameters: {},
            children: [],
          } as AutoCondition);
          setModified();
        } else {
          Toastify({
            text: "Max children reached",
            duration: 3000,
            gravity: "bottom",
            position: "right",
            style: {
              color: "black",
              background: "yellow",
            },
          }).showToast();
        }
      }}
    >
      + Add Child
    </button>
  );
};

export default AddConditionalChild;
