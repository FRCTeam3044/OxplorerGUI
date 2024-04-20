import React, { useMemo, useState } from "react";
import {
  AutoCondition,
  AutoGroup,
  ConditionalTemplate,
  Template,
} from "../../../../utils/structures";
import { toast } from "sonner";

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
      templateList.find((t) => t.type === "conditional") as ConditionalTemplate,
    );
  }, [templateList]);

  useMemo(() => {
    setTemplate(
      templateList.find((t) => t.id === step.id) as ConditionalTemplate,
    );
  }, [templateList, step]);

  return (
    <button
      className="form-button"
      onClick={() => {
        if (!("children" in step)) return;
        if (!firstCondition) {
          toast.error(
            "No conditional template found. Create a template first!",
          );
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
          toast.warning("Max children reached");
        }
      }}
    >
      + Add Child
    </button>
  );
};

export default AddConditionalChild;
