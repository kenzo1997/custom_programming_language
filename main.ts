import * as fs from "fs";
import Parser from "./parser";
import { createGlobalEnv } from "./runtime/environment";
import { evaluate } from "./runtime/interpreter";

const args = process.argv.slice(2);

if (args.length > 0) {
	runFile(args[0]);
} else {
	repl();
}

function runFile(filename: string) {
	const parser = new Parser();
	const env = createGlobalEnv();

	const input = fs.readFileSync(filename, "utf-8");
	const program = parser.produceAST(input);

	evaluate(program, env);
}

function repl() {
	const parser = new Parser();
	const env = createGlobalEnv();

	console.log("\nRepl v0.1");
	while (true) {
		process.stdout.write("> ");
		const input = fs.readFileSync(0, "utf-8").trim();

		if (!input || input === "exit") {
			process.exit(0);
		}

		const program = parser.produceAST(input);
		const result = evaluate(program, env);
		console.log(result);
	}
}
