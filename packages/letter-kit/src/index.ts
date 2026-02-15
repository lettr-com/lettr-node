import { defineCommand, runMain } from "citty";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";
import { pullCommand } from "./commands/pull.ts";

const main = defineCommand({
  meta: {
    name: "letter-kit",
    description: "CLI tool for managing Lettr email templates",
  },
  subCommands: {
    init: initCommand,
    list: listCommand,
    pull: pullCommand,
  },
});

runMain(main);
