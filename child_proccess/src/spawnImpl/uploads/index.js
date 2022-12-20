import { spawn } from "child_process";

async function requestPythonFile() {
  const filename = "uploader.py";
  const command = "python3";

  const args = {
    path: "my-data.csv",
    url: "http://localhost:3000",
  };

  const serializedArgs = JSON.stringify(args);

  const data = spawn(command, [filename, serializedArgs]);

  const responses = [];

  for await (const res of data.stdout) {
    responses.push(res.toString());
  }

  return responses;
  // Erro na execução do comando
  /*data.on("error", (err) => {
    console.error(`😢 Erro na execução do processo python. ${err.message}`);
  });

  // Quando o comando finalizar (Thread finalizar)
  data.on("close", (code, signal) => {
    console.log(
      `Child process exited with code ${code} and signal ${signal}. 👌`
    );
    
  });*/
}

const result = await requestPythonFile();
console.log(result);
