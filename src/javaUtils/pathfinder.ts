import path from "path";
import { appendClasspath, ensureJvm, importClass } from "java-bridge";
import { Vertex } from "./structures";
appendClasspath(
  path
    .join(__dirname, "java-libs/oxplorer-0.9.0-all.jar")
    .replace("app.asar", "app.asar.unpacked")
);
ensureJvm({
  isPackagedElectron: true,
  // javaLibPath: path
  //   .join(
  //     app.getAppPath(),
  //     "node_modules/java-bridge/java-src/build/libs/JavaBridge-2.1.1.jar"
  //   )
  //   .replace("app.asar", "app.asar.unpacked"),
});
let JVertex = importClass("me.nabdev.pathfinding.structures.Vertex");
let Field = importClass("me.nabdev.pathfinding.utilities.FieldLoader$Field");
let PathfinderBuilder = importClass("me.nabdev.pathfinding.PathfinderBuilder");

let pathfinderBuilder = new PathfinderBuilder(Field.CRESCENDO_2024);
let pathfinder = pathfinderBuilder.buildSync();

export const generatePath = (start: Vertex, end: Vertex) => {
  let path = [];
  let pathRaw = pathfinder.generatePathSync(
    new JVertex(start.x, start.y),
    new JVertex(end.x, end.y)
  );
  let pathDoubleArr = pathRaw.toDoubleArraySync();

  for (let i = 0; i < pathDoubleArr.length; i += 3) {
    path.push({ x: pathDoubleArr[i], y: pathDoubleArr[i + 1] });
  }
  return path;
};

export const setPointSpacing = (spacing: number) => {
  pathfinder.setPointSpacingSync(spacing);
  pathfinderBuilder.setPointSpacingSync(spacing);
};

export const setCornerPointSpacing = (spacing: number) => {
  pathfinder.setCornerPointSpacingSync(spacing);
  pathfinderBuilder.setCornerPointSpacingSync(spacing);
};

export const setCornerDist = (distance: number) => {
  pathfinder.setCornerDistSync(distance);
  pathfinderBuilder.setCornerDistSync(distance);
};

export const setInjectPoints = (inject: boolean) => {
  pathfinder.setInjectPointsSync(inject);
  pathfinderBuilder.setInjectPointsSync(inject);
};

export const setNormalizeCorners = (normalize: boolean) => {
  pathfinder.setNormalizeCornersSync(normalize);
  pathfinderBuilder.setNormalizeCornersSync(normalize);
};

export const setCornerSplitPercent = (percent: number) => {
  pathfinder.setCornerSplitPercentSync(percent);
  pathfinderBuilder.setCornerSplitPercentSync(percent);
};

export const setRobotLength = (height: number) => {
  pathfinderBuilder.setRobotLengthSync(height);
  pathfinder = pathfinderBuilder.buildSync();
};

export const setRobotWidth = (width: number) => {
  pathfinderBuilder.setRobotWidthSync(width);
  pathfinder = pathfinderBuilder.buildSync();
};

export const getPointSpacing = () => {
  return pathfinder.getPointSpacingSync();
};

export const getCornerPointSpacing = () => {
  return pathfinder.getCornerPointSpacingSync();
};

export const getCornerDist = () => {
  return pathfinder.getCornerDistSync();
};

export const getInjectPoints = () => {
  return pathfinder.getInjectPointsSync();
};

export const getNormalizeCorners = () => {
  return pathfinder.getNormalizeCornersSync();
};

export const getCornerSplitPercent = () => {
  return pathfinder.getCornerSplitPercentSync();
};
