import { RuntimeVal, MK_NULL, FunctionValue, MK_RETURN, NumberVal, BooleanVal, ArrayVal } from "./../values";
import { FunctionDeclaration, Program, VarDeclaration, ReturnStmt, IfStmt, WhileStmt, ForInStmt } from "../../ast"
import { evaluate } from "./../interpreter";
import Environment from "./../environment";

export function eval_program(program: Program, env: Environment): RuntimeVal {
	let lastEvaluated: RuntimeVal = MK_NULL();

	for(const statement of program.body) {
		lastEvaluated = evaluate(statement, env);
	}

	return lastEvaluated;
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
	const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
	return env.declareVar(declaration.identifier, value, declaration.constant);
}

export function eval_function_declaration(
  declaration: FunctionDeclaration,
  env: Environment
) {
  const fn = {
    type: "function",
    name: declaration.name,
    parameters: declaration.parameters,
    declarationEnv: env, // 👈 closure
    body: declaration.body,
  } as FunctionValue;

  // 👇 store function in current scope
  env.declareVar(declaration.name, fn, false);

  return MK_NULL();
}

export function eval_return_stmt(stmt: ReturnStmt, env: Environment) {
  const value = stmt.value
    ? evaluate(stmt.value, env)
    : MK_NULL();

  return MK_RETURN(value);
}

export function isTruthy(val: RuntimeVal): boolean {
  switch (val.type) {
    case "number":
      return (val as NumberVal).value !== 0;
    case "boolean":
      return (val as BooleanVal).value;
    case "null":
      return false;
    default:
      return true;
  }
}

export function eval_if_stmt(stmt: IfStmt, env: Environment): RuntimeVal {
  const condition = evaluate(stmt.condition, env);

  if (isTruthy(condition)) {
    const scope = new Environment(env);
    let result: RuntimeVal = MK_NULL();

    for (const s of stmt.thenBranch) {
      result = evaluate(s, scope);
    }

    return result;
  }

  if (stmt.elseBranch) {
    const scope = new Environment(env);
    let result: RuntimeVal = MK_NULL();

    for (const s of stmt.elseBranch) {
      result = evaluate(s, scope);
    }

    return result;
  }

  return MK_NULL();
}

export function eval_while_stmt(stmt: WhileStmt, env: Environment): RuntimeVal {
    let result: RuntimeVal = MK_NULL();

    while (isTruthy(evaluate(stmt.condition, env))) {
        const scope = new Environment(env);

        for (const s of stmt.body) {
            const evaluated = evaluate(s, scope);

            if (evaluated.type === "return") {
                return evaluated; // bubble return up through loops
            }

            result = evaluated;
        }
    }

    return result;
}

export function eval_for_in_stmt(stmt: ForInStmt, env: Environment): RuntimeVal {
    const iterable = evaluate(stmt.iterable, env);

    if(iterable.type !== "array") {
        throw `For-in loop expected an array, got '${iterable.type}'`;
    }

    const arr = iterable as ArrayVal;
    let result: RuntimeVal = MK_NULL();

    for(const element of arr.elements) {
        const scope = new Environment(env);
        scope.declareVar(stmt.identifier, element, false);

        for(const s of stmt.body) {
            const evaluated = evaluate(s, scope);

            if(evaluated.type === "return") {
                return evaluated; // bubble return up
            }

            result = evaluated;
        }
    }

    return result;
}
