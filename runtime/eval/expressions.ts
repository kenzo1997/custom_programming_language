import { NumberVal, RuntimeVal, MK_NULL, ObjectVal, NativeFnValue, FunctionValue, MK_NUMBER, ReturnValue } from "./../values";
import { AssignmentExpr, BinaryExpr, CallExpr, Identifier, ObjectLiteral } from "../../ast"
import { evaluate } from "./../interpreter";
import Environment from "./../environment";

function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, operator: string): NumberVal {
	let result: number;

	if(operator == "+") {
		result = lhs.value + rhs.value;
	} else if(operator == "-") {
		result = lhs.value - rhs.value;
	} else if(operator == "*") {
		result = lhs.value * rhs.value;
	} else if(operator == "/") {
		result = lhs.value / rhs.value;
	} else if(operator == "%") {
		result = lhs.value % rhs.value;
	} else {
		throw "Unknown numeric operator " + operator;
	}

	return MK_NUMBER(result);
}

export function evaluate_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
	const lhs = evaluate(binop.left, env);
	const rhs = evaluate(binop.right, env);

	if (lhs.type === "number" && rhs.type === "number") {

		const left = lhs as NumberVal;
		const right = rhs as NumberVal;

		// Arithmetic
		if (["+", "-", "*", "/", "%"].includes(binop.operator)) {
			return eval_numeric_binary_expr(left, right, binop.operator);
		}

		// Comparison
		switch (binop.operator) {
			case ">":
				return MK_NUMBER(left.value > right.value ? 1 : 0);
			case "<":
				return MK_NUMBER(left.value < right.value ? 1 : 0);
			case ">=":
				return MK_NUMBER(left.value >= right.value ? 1 : 0);
			case "<=":
				return MK_NUMBER(left.value <= right.value ? 1 : 0);
			case "==":
				return MK_NUMBER(left.value === right.value ? 1 : 0);
			case "!=":
				return MK_NUMBER(left.value !== right.value ? 1 : 0);
		}
	}

	return MK_NULL();
}

export function eval_identifier(ident: Identifier, env: Environment): RuntimeVal {
	const val = env.lookupVar(ident.symbol);
	return val;
}

export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeVal {
	if(node.assign.kind != "Identifier") {
		throw `Invalid LHS inside assignment expr ${JSON.stringify(node.assign)}`;
	}

	const varname = (node.assign as Identifier).symbol;
	return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(obj: ObjectLiteral, env: Environment): RuntimeVal {
	const object = { type: "object", properties: new Map() } as ObjectVal;
	for(const { key, value } of obj.properties) {
		const runtimeval = (value == undefined) 
			? env.lookupVar(key) 
			: evaluate(value, env);

		object.properties.set(key, runtimeval);
	}

	return object;
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
	const args = expr.args.map(arg => evaluate(arg, env));
	const fn = evaluate(expr.caller, env);

	if(fn.type == "native-fn") {
		const results = (fn as NativeFnValue).call(args, env);
		return results;
	} 

	if(fn.type == "function") {
		const func = fn as FunctionValue;
		const scope = new Environment(func.declarationEnv);

		// Create the variables for the parameters list
		for(let i = 0; i < func.parameters.length; i++) {
			// TODO: Check the bounds here.
			// verify arity of function
			const varname = func.parameters[i];
			scope.declareVar(varname, args[i], false);
		}
	        
		let result: RuntimeVal = MK_NULL();

		for (const stmt of func.body) {
			const evaluated = evaluate(stmt, scope);

			if (evaluated.type === "return") {
				return (evaluated as ReturnValue).value;
			}

			result = evaluated;
		}

		return result;	

	} 

	throw "Cannot call value that is not a function " + JSON.stringify(fn);
}
