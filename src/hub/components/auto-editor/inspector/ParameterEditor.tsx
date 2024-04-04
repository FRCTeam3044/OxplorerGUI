import React, { useEffect, useRef } from "react";
import {
  AutoCommand,
  AutoCondition,
  CommandTemplate,
  ConditionalTemplate,
  Template,
} from "../../../../utils/structures";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";

export interface ParameterEditorProps {
  setModified: () => void;
  step: AutoCommand | AutoCondition;
  templateList: Template[];
}
const ParameterEditor: React.FC<ParameterEditorProps> = ({
  setModified,
  step,
  templateList,
}) => {
  const [template, setTemplate] = React.useState<
    CommandTemplate | ConditionalTemplate | undefined
  >();
  const [shouldDisplay, setShouldDisplay] = React.useState<boolean>(false);

  const jsonEditor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let template;
    if ("type" in step) {
      template = templateList.find((t) => t.id === step.id) as CommandTemplate;
    } else {
      template = templateList.find(
        (t) => t.id === step.id
      ) as ConditionalTemplate;
    }
    setTemplate(template);
    if (template && Object.keys(template.parameters).length > 0) {
      setShouldDisplay(true);
    }
  }, [step, templateList]);

  useEffect(() => {
    if (shouldDisplay && jsonEditor.current) {
      const options: JSONEditorOptions = {
        onChangeJSON: (json) => {
          if (!("parameters" in step)) return;
          step.parameters = json;
          setModified();
        },
        history: false,
        mode: Object.values(template.parameters).some(Array.isArray)
          ? "tree"
          : "form",
        mainMenuBar: false,
        name: "Parameters",
      };
      const editor = new JSONEditor(jsonEditor.current, options);
      editor.set(step.parameters);
      return () => {
        editor.destroy();
      };
    }
  }, [shouldDisplay, jsonEditor.current, step, template]);

  return (
    <>
      {shouldDisplay && <div id="jsoneditor" ref={jsonEditor}></div>}
      {!shouldDisplay && (
        <span style={{ color: "red" }}>
          No template found for this condition
        </span>
      )}
    </>
  );
};

export default ParameterEditor;
