import { loadEnvConfig } from "@next/env";
import { runPipeline } from "@/src/pipeline/run";

loadEnvConfig(process.cwd());

runPipeline()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
