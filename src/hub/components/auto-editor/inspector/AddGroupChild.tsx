import React, { useMemo, useState } from "react";
import {
  AutoCommand,
  AutoCondition,
  AutoGroup,
  CommandTemplate,
  Template,
} from "../../../../utils/structures";
import Toastify from "toastify-js";

export interface AddGroupChildProps {
  setModified: () => void;
  step: AutoGroup | AutoCondition;
  templateList: Template[];
}
const AddGroupChild: React.FC<AddGroupChildProps> = ({
  setModified,
  step,
  templateList,
}) => {
  const [firstCommand, setFirstCommand] = useState<
    CommandTemplate | undefined
  >();

  useMemo(() => {
    setFirstCommand(
      templateList.find((t) => t.type === "command") as CommandTemplate
    );
  }, [templateList]);

  return (
    <button
      className="form-button"
      onClick={() => {
        if (!("type" in step) || step.type !== "group") return;
        if (!firstCommand) {
          Toastify({
            text: "No command template found. Create a template first!",
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
        step.children.push({
          type: "command",
          id: firstCommand.id ?? "new_command",
          name: "New Command",
          parameters: {},
        } as AutoCommand);
        setModified();
      }}
    >
      + Add Child
    </button>
  );
};

export default AddGroupChild;
