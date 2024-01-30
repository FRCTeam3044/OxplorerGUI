// Literal magic idek how this works
import java from "java";
import { Vertex } from "./structures";
java.classpath.push(__dirname + "/oxplorer-0.7.1-all.jar");

export default java;

export const vertexToJava = (vertex: Vertex) => {
  return java.newInstanceSync(
    "me.nabdev.pathfinding.structures.Vertex",
    vertex.x,
    vertex.y
  );
};
