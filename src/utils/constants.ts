export interface FieldData {
  topLeft: [number, number];
  bottomRight: [number, number];
  widthInches: number;
  heightInches: number;
}

// Taken from https://github.com/mechanical-advantage/AdvantageScope/
export const FIELD_2024: FieldData = {
  topLeft: [513, 78],
  bottomRight: [3327, 1475],
  widthInches: 651.25,
  heightInches: 323.25,
};

export const FIELD_2025: FieldData = {
      topLeft: [421, 91],
      bottomRight: [3352, 1437],
      widthInches: 690.875,
      heightInches: 317,
    }

export const FIELD_DATA: { [key: string]: FieldData } = {
  2024: FIELD_2024,
  2025: FIELD_2025,
};

export const OXPLORER_VERSION = "0.12.7";

export const REPOSITORY = "FRCTeam3044/OxplorerGUI";
export const GITHUB_BASE_URL = "https://github.com/" + REPOSITORY;

export const defaultTemplates = [
  {
    type: "group",
    id: "deadline",
  },
  {
    type: "group",
    id: "race",
  },
  {
    type: "group",
    id: "parallel",
  },
  {
    type: "group",
    id: "sequence",
  },
  {
    type: "conditional",
    id: "not",
    parameters: {},
    maxChildren: 1,
  },
  {
    type: "conditional",
    id: "and",
    parameters: {},
    maxChildren: -1,
  },
  {
    type: "conditional",
    id: "or",
    parameters: {},
    maxChildren: -1,
  },
];
