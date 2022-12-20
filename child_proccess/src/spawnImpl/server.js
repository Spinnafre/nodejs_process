import { randomUUID } from "crypto";
import { createServer } from "http";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import path from "path";

async function handler(req, res) {
  console.log("Recebendo requisição");
  const filename = `file-${randomUUID()}.csv`;

  const write = createWriteStream(path.join("tmp", "csv") + "/" + filename);

  await pipeline(req, write);

  res.end(`Success to upload file ${filename} ❤️`);
}

const server = createServer(handler).listen(3000, () =>
  console.log("Server running in http://localhost:3000")
);

// Graceful shutdown
function terminateServer(server, option = { coredump: false, timeout: 500 }) {
  const exitFunc = (code) => {
    return option.coredump ? process.abort() : process.exit(code);
  };

  return (code, message) => (err, promise) => {
    console.log(message);
    if (err && err instanceof Error) {
      console.error(err.message, err.stack);
    }
    //Corta as conexões com o servidor para ninguém ficar mais esperando por resposta do server para depois desligar o servidor
    // por completo.
    server.close(exitFunc);

    setTimeout(exitFunc, option.timeout).unref();
  };
}

const errorHandler = terminateServer(server, {
  coredump: false,
  timeout: 500,
});

process.on("beforeExit", (code) => {
  // Can make asynchronous calls
  setTimeout(() => {
    console.log(`Process will exit with code: ${code}`);
    process.exit(code);
  }, 100);
});

process.on("uncaughtException", errorHandler(1, "Unexpected Error"));

process.on("unhandledRejection", errorHandler(1, "Unexpected Error"));

process.on("SIGTERM", errorHandler(0, "Turning off server with SIGTERM"));

process.on("SIGINT", errorHandler(0, "Turning off server with SIGINT"));

process.on("exit", (code) => {
  // Only synchronous calls
  console.log(`Process exited with code: ${code}`);
});
