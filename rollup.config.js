import typescript from "rollup-plugin-typescript2";
import del from "rollup-plugin-delete";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      esModule: false,
      sourcemap: false
    },
    plugins: [
      del({
        targets: ["./dist/*"]
      }),
      typescript({
        typescript: require("typescript")
      })
    ]
  }
];
