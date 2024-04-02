import React, { useEffect, useState } from "react";
import { Auto } from "../../../utils/structures";
import Toastify from "toastify-js";
import "./FileSelect.css";

interface FileSelectProps {
  selectingFile: boolean;
  open: () => void;
  newHandler: () => void;
  setCurrentAutoData: (auto: Auto) => void;
  setCurrentAutoPath: (path: string) => void;
}

const FileSelect: React.FC<FileSelectProps> = ({
  selectingFile,
  open,
  newHandler,
  setCurrentAutoData,
  setCurrentAutoPath,
}) => {
  const [recents, setRecents] = useState<
    {
      name: string;
      path: string;
    }[]
  >([]);

  useEffect(() => {
    const loadRecents = async () => {
      let recentsTemp = [] as { name: string; path: string }[];
      let files = await window.files.getRecentFiles();
      for (let file of files) {
        let name = file.split(await window.files.getFileSeperator()).pop();
        recentsTemp.push({ name, path: file });
      }
      setRecents(recentsTemp);
    };
    loadRecents();
  }, []);

  return (
    <div id="file-select" style={selectingFile ? {} : { display: "none" }}>
      <div id="recent">
        <h3>Recent</h3>
        <div className="divider"></div>
        <div id="recent-files">
          {recents.map((file) => (
            <a
              key={file.path}
              onClick={async () => {
                try {
                  let fileContent = await window.files.openFileFromPath(
                    file.path,
                  );
                  if (fileContent) {
                    setCurrentAutoData(JSON.parse(fileContent) as Auto);
                    setCurrentAutoPath(file.path);
                  }
                } catch (e) {
                  Toastify({
                    text:
                      "Unable to load file: " + e.message.split("Error: ")[1],
                    duration: 3000,
                    gravity: "bottom",
                    position: "right",
                    backgroundColor: "red",
                  }).showToast();
                }
              }}
            >
              <span className="file-name-span">{file.name}</span>
              <span className="path-span">{file.path}</span>
            </a>
          ))}
        </div>
      </div>
      <div id="start">
        <button id="autos-open" onClick={open}>
          Open
        </button>
        <button id="autos-new" onClick={newHandler}>
          Create New
        </button>
        <div id="templates">
          <h3>Templates</h3>
          <div className="divider"></div>
          <p className="template">Coming soon!</p>
        </div>
      </div>
    </div>
  );
};
export default FileSelect;
