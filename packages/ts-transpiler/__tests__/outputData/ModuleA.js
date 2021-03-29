import ModuleB from "./ModuleB.js";
const component = React.createElement("div", null, "Hello");
console.log(component);
const ModuleA = ModuleB;
export default ModuleA;
