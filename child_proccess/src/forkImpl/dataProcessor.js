import { createReadStream } from "node:fs";

import { pipeline } from "node:stream/promises";
import { Transform, Writable } from "node:stream";

import csvToJson from "csvtojson";
import { setTimeout } from "node:timers/promises";

const arg = process.argv[2];

async function searchRepeatedItem(searchable) {
  const readable = createReadStream(arg, {
    encoding: "utf-8",
  });

  const firstTime = [];

  await pipeline(
    readable,
    csvToJson(),
    Transform({
      objectMode: true,
      transform: (chunk, enc, next) => {
        const data = JSON.parse(chunk);
        //Se não for o que estou querendo procurar então continua o fluxo
        if (data.Name !== searchable.Name) return next();

        //Sempre que um item já tiver sido encontrado irá passar ele para o próximo fluxo
        if (firstTime.includes(searchable.Name)) {
          return next(null, data.Name);
        }

        firstTime.push(data.Name);
        next();
      },
    }),
    Writable({
      objectMode: true,
      write(chunk, enc, cb) {
        if (!chunk) return cb();
        //Envia para o processo pai o item repetido
        process.send(chunk);

        cb();
      },
    })
  );
}

//Ouve a ordem do processo pai
process.on("message", searchRepeatedItem);

await setTimeout(5000);

process.channel.unref();
