import {
  Auto,
  AutoCondition,
  AutoStep,
  Template,
} from "../../utils/structures";
import Toastify from "toastify-js";
import "jsoneditor/dist/jsoneditor.css";
import { Tab, TabProps } from "./Tabs";
import React, { useEffect, useRef, useState } from "react";
import "./AutoEditor.css";
import GoDiagram from "../components/auto-editor/GoDiagram";
import FileSelect from "../components/auto-editor/FileSelect";
import Inspector from "../components/auto-editor/Inspector";

let undoList: Auto[] = [];
let redoList: Auto[] = [];

let open: () => void | undefined;
let newHandler: () => void | undefined;
let save: () => void | undefined;
let saveAs: () => void | undefined;
let importTemplates: (templates: Template[]) => void;
let undo: () => void;
let redo: () => void;

const AutoEditor: React.FC<TabProps> = ({ active }) => {
  const [selectingFile, setSelectingFile] = useState(true);
  const [currentAutoData, setCurrentAutoData] = useState<Auto>();
  const [currentAutoPath, setCurrentAutoPath] = useState<string>();
  const [selectedNode, setSelectedNode] = useState<{
    step: AutoStep | AutoCondition;
    parent: AutoStep[] | AutoCondition[];
  }>();
  const [unsaved, setUnsaved] = useState(false);
  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const skipUndo = useRef(false);
  const currentAutoDataRef = useRef(currentAutoData);
  const currentAutoPathRef = useRef(currentAutoPath);

  useEffect(() => {
    currentAutoDataRef.current = currentAutoData;
  }, [currentAutoData]);

  useEffect(() => {
    currentAutoPathRef.current = currentAutoPath;
  }, [currentAutoPath]);

  // Load Templates
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplateList(await window.util.getTemplates());
    };
    loadTemplates();
  }, []);
  // Create methods for exporting
  useEffect(() => {
    importTemplates = (commands: Template[]) => {
      setTemplateList(commands);
    };
    open = async () => {
      try {
        let file = await window.files.openFile();
        if (file) {
          setCurrentAutoData(JSON.parse(file.data) as Auto);
          setCurrentAutoPath(file.path);
          setSelectedNode(undefined);
          undoList = [];
        }
      } catch (e) {
        console.error(e);
        Toastify({
          text: "Unable to load file: " + e.message.split("Error: ")[1] ?? e,
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "red",
        }).showToast();
      }
    };
    newHandler = async () => {
      try {
        let file = await window.files.newFile();
        if (file) {
          setCurrentAutoData(JSON.parse(file.data) as Auto);
          setCurrentAutoPath(file.path);
          setSelectedNode(undefined);
          undoList = [];
        }
      } catch (e) {
        Toastify({
          text: "Unable to create file: " + e.message.split("Error: ")[1],
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "red",
        }).showToast();
      }
    };
    saveAs = async () => {
      try {
        let path = await window.files.saveFileAs(
          JSON.stringify(currentAutoDataRef.current, null, 2)
        );
        if (path) {
          setCurrentAutoPath(path);
          setUnsaved(false);
        }
      } catch (e) {
        Toastify({
          text: "Unable to save file: " + e.message.split("Error: ")[1],
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "red",
        }).showToast();
      }
    };
    save = async () => {
      if (currentAutoPathRef.current) {
        try {
          await window.files.saveFile(
            JSON.stringify(currentAutoDataRef.current, null, 2),
            currentAutoPathRef.current
          );
          setUnsaved(false);
        } catch (e) {
          Toastify({
            text: "Unable to save file: " + e.message.split("Error: ")[1],
            duration: 3000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "red",
          }).showToast();
        }
      } else {
        saveAs();
      }
    };
    undo = () => {
      if (undoList.length > 0) {
        setCurrentAutoData((prevAutoData) => {
          redoList.push(JSON.parse(JSON.stringify(prevAutoData)));
          const newAutoData = JSON.parse(
            JSON.stringify(undoList[undoList.length - 1])
          );
          undoList.pop();
          skipUndo.current = true;
          return newAutoData;
        });
        setSelectedNode(undefined);
      }
    };

    redo = () => {
      if (redoList.length > 0) {
        setCurrentAutoData((prevAutoData) => {
          undoList.push(JSON.parse(JSON.stringify(prevAutoData)));
          skipUndo.current = true;
          const newAutoData = JSON.parse(JSON.stringify(redoList.pop()));
          return newAutoData;
        });
        setSelectedNode(undefined);
      }
    };
  }, [currentAutoData]);
  // Set up the diagram

  // Update window title
  useEffect(() => {
    const update = async () => {
      window.util.updateWindowState({
        tab: "editor",
        filename: currentAutoPath
          ? currentAutoPath.split(await window.files.getFileSeperator()).pop()
          : undefined,
        unsaved,
      });
    };
    if (active) {
      update();
    }
  }, [currentAutoPath, unsaved, active]);

  return (
    <div id="autoeditor" className={"tab" + (active ? " active" : "")}>
      <div id="auto-editor-startup">
        <FileSelect
          selectingFile={selectingFile}
          open={open}
          newHandler={newHandler}
          setCurrentAutoData={setCurrentAutoData}
          setCurrentAutoPath={setCurrentAutoPath}
        />
      </div>
      <div
        className="auto-editor-content"
        style={selectingFile ? { display: "none" } : undefined}
      >
        <GoDiagram
          currentAutoData={currentAutoData}
          setSelectedNode={setSelectedNode}
          refreshCount={refreshCount}
          skipUndo={skipUndo}
          undoList={undoList}
          undo={undo}
          redo={redo}
          save={save}
          saveAs={saveAs}
          templateList={templateList}
          setRefreshCount={setRefreshCount}
          selectingFile={selectingFile}
          setSelectingFile={setSelectingFile}
          setUnsaved={setUnsaved}
        />
        <div id="inspector">
          <h2>Inspector</h2>
          <div className="divider"></div>
          <Inspector
            selectedNode={selectedNode}
            setUnsaved={setUnsaved}
            setRefreshCount={setRefreshCount}
            templateList={templateList}
            currentAutoData={currentAutoData}
          />
          <div className="divider"></div>
          <div className="graph-buttons">
            <button
              id="autos-new-command"
              onClick={() => {
                let firstCommand = templateList.find(
                  (t) => t.type === "command"
                );
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
                currentAutoData.push({
                  type: "command",
                  id: firstCommand.id ?? "new_command",
                  name: "New Command",
                  parameters: {},
                });
                setRefreshCount((refresh) => refresh + 1);
                setUnsaved(true);
              }}
            >
              New Command
            </button>
            <button
              id="autos-new-group"
              onClick={() => {
                let firstGroup = templateList.find((t) => t.type === "group");
                if (!firstGroup) {
                  Toastify({
                    text: "No group template found. Create a template first!",
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
                currentAutoData.push({
                  type: "group",
                  id: firstGroup.id ?? "new_group",
                  name: "New Group",
                  children: [],
                });
                setUnsaved(true);
                setRefreshCount((refresh) => refresh + 1);
              }}
            >
              New Group
            </button>
            <button
              id="autos-new-conditional"
              onClick={() => {
                currentAutoData.push({
                  type: "if",
                  name: "New Condition",
                  condition: {
                    id: "new_condition",
                    children: [],
                    name: "New Condition",
                    parameters: {},
                  },
                  child: {
                    type: "group",
                    id: "new_group",
                    name: "New Group",
                    children: [],
                  },
                });
                setUnsaved(true);
                setRefreshCount((refresh) => refresh + 1);
              }}
            >
              New Conditional
            </button>
          </div>
          <div className="divider"></div>
          <div className="save-buttons">
            <button id="autos-save" onClick={save}>
              Save
            </button>
            <button id="autos-save-as" onClick={saveAs}>
              Save As
            </button>
            <button id="autos-inspector-new" onClick={newHandler}>
              New
            </button>
            <button id="autos-inspector-open" onClick={open}>
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const data: Tab = {
  name: "Auto Editor",
  id: "autoeditor",
  component: AutoEditor,
};

export default data;

export { open, newHandler as new, save, saveAs, undo, redo, importTemplates };
