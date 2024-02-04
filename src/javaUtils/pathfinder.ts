import { appendClasspath, ensureJvm, importClass } from "java-bridge";
import { Vertex } from "./structures";
appendClasspath(__dirname + "/oxplorer-0.8.1-all.jar");
ensureJvm({
  isPackagedElectron: true,
});
let JVertex = importClass("me.nabdev.pathfinding.structures.Vertex");
let Field = importClass("me.nabdev.pathfinding.utilities.FieldLoader$Field");
let PathfinderBuilder = importClass("me.nabdev.pathfinding.PathfinderBuilder");

export const generatePath = (start: Vertex, end: Vertex) => {
  let pathfinderBuilder = new PathfinderBuilder(Field.CRESCENDO_2024);
  let pathfinder = null;
  let path = [];

  pathfinder = pathfinderBuilder.buildSync();

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
