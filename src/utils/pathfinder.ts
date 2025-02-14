import path from "path";
import { appendClasspath, ensureJvm, importClass } from "java-bridge";
import { SnapMode, Vertex } from "./structures";
import { OXPLORER_VERSION } from "./constants";

ensureJvm({
  isPackagedElectron: true,
  opts: ["-Dnohaljni=true"],
  // javaLibPath: path
  //   .join(
  //     app.getAppPath(),
  //     "node_modules/java-bridge/java-src/build/libs/JavaBridge-2.1.1.jar"
  //   )
  //   .replace("app.asar", "app.asar.unpacked"),
});
appendClasspath(
  path
    .join(__dirname, `java-libs/oxplorer-${OXPLORER_VERSION}-all.jar`)
    .replace("app.asar", "app.asar.unpacked"),
);
let JVertex = importClass("me.nabdev.pathfinding.structures.Vertex");
let Field = importClass("me.nabdev.pathfinding.utilities.FieldLoader$Field");
let PathfinderBuilder = importClass("me.nabdev.pathfinding.PathfinderBuilder");
let JSnapMode = importClass(
  "me.nabdev.pathfinding.Pathfinder$PathfindSnapMode",
);
let TrajectoryConfig = importClass(
  "edu.wpi.first.math.trajectory.TrajectoryConfig",
);
let Pose2d = importClass("edu.wpi.first.math.geometry.Pose2d");
let Rotation2d = importClass("edu.wpi.first.math.geometry.Rotation2d");

let pathfinderBuilder = new PathfinderBuilder(Field.REEFSCAPE_2025);
let pathfinder = pathfinderBuilder.buildSync();
let snapMode = JSnapMode.SNAP_ALL;
let useTrajectories = true;

export const generatePath = (start: Vertex, end: Vertex) => {
  let path = [];
  if (useTrajectories) {
    let startPose = new Pose2d(start.x, start.y, new Rotation2d(0));
    let endPose = new Pose2d(end.x, end.y, new Rotation2d(0));
    let config = new TrajectoryConfig(1, 1);
    let trajectory = pathfinder.generateTrajectorySync(
      startPose,
      endPose,
      snapMode,
      config,
    );
    let states = trajectory.getStatesSync();
    for (let i = 0; i < states.sizeSync(); i += 3) {
      let pose = states.getSync(i).poseMeters;
      path.push({ x: pose.getXSync(), y: pose.getYSync() });
    }
  } else {
    let pathRaw = pathfinder.generatePathSync(
      new JVertex(start.x, start.y),
      new JVertex(end.x, end.y),
      snapMode,
    );
    let pathDoubleArr = pathRaw.toDoubleArraySync();

    for (let i = 0; i < pathDoubleArr.length; i += 3) {
      path.push({ x: pathDoubleArr[i], y: pathDoubleArr[i + 1] });
    }
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

export const setCornerCutDist = (dist: number) => {
  pathfinderBuilder.setCornerCutDistSync(dist);
  pathfinder = pathfinderBuilder.buildSync();
};

export const setUseTrajectories = (use: boolean) => {
  useTrajectories = use;
};

export const setSnapMode = (snap: SnapMode) => {
  snapMode = JSnapMode[snap];
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

export const getSnapMode = () => {
  return snapMode.toString() as SnapMode;
};
