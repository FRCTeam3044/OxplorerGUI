import java, { vertexToJava } from "./javaUtils";
import { Vertex } from "./structures";

let Field = java.import("me.nabdev.pathfinding.utilities.FieldLoader$Field");

export const generatePath = (start: Vertex, end: Vertex) => {
  let pathfinderBuilder = java.newInstanceSync(
    "me.nabdev.pathfinding.PathfinderBuilder",
    Field.CRESCENDO_2024
  );
  let pathfinder = null;
  let path = null;

  pathfinder = pathfinderBuilder.buildSync();

  let pathRaw = pathfinder.generatePathSync(
    vertexToJava(start),
    vertexToJava(end)
  );
  let pathDoubleArr = pathRaw.toDoubleArraySync();

  path = [];

  // TODO: Why is this necessary?
  pathDoubleArr[0] = pathRaw.getStartSync().x;

  for (let i = 0; i < pathDoubleArr.length; i += 3) {
    path.push({ x: pathDoubleArr[i], y: pathDoubleArr[i + 1] });
  }
  return path;
};
