import React, { useEffect, useMemo, useRef } from "react";
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
  stepChange: number;
  step: AutoCommand | AutoCondition;
  templateList: Template[];
}
const ParameterEditor: React.FC<ParameterEditorProps> = ({
  setModified,
  stepChange,
  step,
  templateList,
}) => {
  const [template, setTemplate] = React.useState<
    CommandTemplate | ConditionalTemplate | undefined
  >();
  const [shouldDisplay, setShouldDisplay] = React.useState<boolean>(false);

  const jsonEditor = useRef<HTMLDivElement>(null);

  useMemo(() => {
    let template;
    if ("type" in step) {
      template = templateList.find((t) => t.id === step.id) as CommandTemplate;
    } else {
      template = templateList.find(
        (t) => t.id === step.id,
      ) as ConditionalTemplate;
    }
    setTemplate(template);
    setShouldDisplay(template && Object.keys(template.parameters).length > 0);
  }, [step, templateList, stepChange]);

  useEffect(() => {
    if (shouldDisplay && jsonEditor.current) {
      let parameters = template.parameters;
      // Fill in any paramaters from step.parameters, leaving the rest as default
      for (let key in step.parameters) {
        if (key in parameters) parameters[key] = step.parameters[key];
      }
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
      editor.validate = () => {
        return Promise.resolve([]);
      };
      editor.set(parameters);
      if (step.parameters != parameters) {
        step.parameters = parameters;
        setModified();
      }
      return () => {
        editor.destroy();
      };
    }
  }, [shouldDisplay, jsonEditor.current, step, template]);

  return (
    <>
      {shouldDisplay && <div id="jsoneditor" ref={jsonEditor}></div>}
      {template === undefined && (
        <span style={{ color: "red" }}>
          No template found for this condition
        </span>
      )}
    </>
  );
};

export default ParameterEditor;
