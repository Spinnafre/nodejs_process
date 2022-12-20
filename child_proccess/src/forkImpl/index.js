import { createReadStream } from "node:fs";

import { spawn, fork } from "node:child_process";

import { Writable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import csvToJson from "csvtojson";
//Meu processo filho
const processor = "./dataProcessor.js";
//Irá ser passado como argumento para o arquivo
const dataPath = "./data/Light_Pokemon.csv";

const MAX_PROCESSES = 3;

const processes = new Map();

const repeated = [];

for (let index = 0; index < MAX_PROCESSES; index++) {
  const childProcess = fork(processor, [dataPath]);

  childProcess.on("message", (msg) => {
    //Caso o mesmo nome de pokemon seja enviado para os outros processos,
    // no caso só basta ter um registro dos repetidos e só avisar uma vez.
    if (repeated.includes(msg)) return;
    console.log(
      `[process ${childProcess.pid}] - MESSAGE - Item repetido  : `,
      msg
    );
    repeated.push(msg);
  });

  childProcess.on("exit", (signal) => {
    console.log(
      `[EXIT] -👷‍♂️ Fechando processo filho ${childProcess.pid} com sinal ${signal}`
    );
    //Remover processo terminado da lista de processos registrados
    processes.delete(childProcess.pid);
  });

  childProcess.on("error", (signal) => {
    console.log(
      `Erro no processo filho ${childProcess.pid}, fechando com sinal ${signal}`
    );
    //Remover processo da lista de processos registrados
    processes.delete(childProcess.pid);
  });

  processes.set(childProcess.pid, childProcess);
}

//Retornar sempre os mesmos processos
function getOnlyProcessRunning(array, index = 0) {
  return function () {
    if (index >= array.length) index = 0;

    return array[index++];
  };
}

const getProcess = getOnlyProcessRunning([...processes.values()]);

console.log(`Starting with ${processes.size} processes`);

await pipeline(
  createReadStream(dataPath, {
    encoding: "utf-8",
  }),
  csvToJson(),
  Writable({
    objectMode: true,
    write(chunk, enc, next) {
      const child = getProcess();
      child.send(JSON.parse(chunk));
      next();
    },
  })
);

process.on("beforeExit", (code) => {
  // Can make asynchronous calls
  setTimeout(() => {
    console.log(`👌 Fechando processo pai com código : ${code}`);
    process.exit(code);
  }, 100);
});
