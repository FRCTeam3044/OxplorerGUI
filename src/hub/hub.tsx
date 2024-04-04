import "../theme.css";
import "./hub.css";
import { Template } from "../utils/structures";
import "toastify-js/src/toastify.css";

import * as AutoEditor from "./tabs/AutoEditor";
import React, { useState } from "react";
import { tabList } from "./tabs/Tabs";

const Hub: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tabList[0].id);

  window.ipc.on("openFile", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.open();
    }
  });

  window.ipc.on("saveFile", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.save();
    }
  });

  window.ipc.on("newFile", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.new();
    }
  });

  window.ipc.on("saveFileAs", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.saveAs();
    }
  });

  window.ipc.on("importTemplates", async (commands: Template[]) => {
    if (activeTab === "autoeditor") {
      AutoEditor.importTemplates(commands);
    }
  });

  window.ipc.on("undo", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.undo();
    }
  });

  window.ipc.on("redo", async () => {
    if (activeTab === "autoeditor") {
      AutoEditor.redo();
    }
  });

  return (
    <>
      <div className="tab-buttons">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            className={"tab-button" + (activeTab === tab.id ? " active" : "")}
            onClick={() => {
              setActiveTab(tab.id);
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {tabList.map((tab) => (
        <tab.component key={tab.id} active={activeTab === tab.id} />
      ))}
    </>
  );
};

export default Hub;
