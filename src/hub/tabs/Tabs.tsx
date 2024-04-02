import AutoEditor from "./AutoEditor";
import PathEditor from "./PathEditor";
import React from "react";

export interface TabProps {
  active: boolean;
}

export interface Tab {
  name: string;
  id: string;
  component: React.FC<TabProps>;
}

// First tab will be active by default
export const tabList: Tab[] = [AutoEditor, PathEditor];
