import { NumberVal, RuntimeVal, MK_NULL, ObjectVal, NativeFnValue, FunctionValue, MK_NUMBER, ReturnValue, MK_STRING, MK_ARRAY, ArrayVal } from "./../values";
import { AssignmentExpr, BinaryExpr, CallExpr, Identifier, ObjectLiteral, ArrayLiteral, MemberExpr } from "../../ast"
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

/*
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
*/

export function evaluate_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);

    // String concatenation
    if (lhs.type === "string" || rhs.type === "string") {
        if (binop.operator === "+") {
            const l = (lhs as any).value ?? "null";
            const r = (rhs as any).value ?? "null";
            return MK_STRING(String(l) + String(r));
        }
        if (binop.operator === "==") return MK_NUMBER((lhs as any).value === (rhs as any).value ? 1 : 0);
        if (binop.operator === "!=") return MK_NUMBER((lhs as any).value !== (rhs as any).value ? 1 : 0);
    }

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

/*
export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeVal {
	if(node.assign.kind != "Identifier") {
		throw `Invalid LHS inside assignment expr ${JSON.stringify(node.assign)}`;
	}

	const varname = (node.assign as Identifier).symbol;
	return env.assignVar(varname, evaluate(node.value, env));
}
*/

export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    // Plain variable assignment: x = 5
    if(node.assign.kind === "Identifier") {
        const varname = (node.assign as Identifier).symbol;
        return env.assignVar(varname, evaluate(node.value, env));
    }

    // Array/object member assignment: arr[0] = 5 or obj.key = 5
    if(node.assign.kind === "MemberExpr") {
        const member = node.assign as MemberExpr;
        const obj = evaluate(member.object, env);
        const newValue = evaluate(node.value, env);

        if(obj.type === "array") {
            const arr = obj as ArrayVal;
            const index = (evaluate(member.property, env) as NumberVal).value;
            arr.elements[index] = newValue;
            return newValue;
        }

        if(obj.type === "object") {
            const object = obj as ObjectVal;
            const key = member.computed
                ? String((evaluate(member.property, env) as any).value)
                : (member.property as Identifier).symbol;
            object.properties.set(key, newValue);
            return newValue;
        }
    }

    throw `Invalid left-hand side in assignment: ${JSON.stringify(node.assign)}`;
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

export function eval_member_expr(node: MemberExpr, env: Environment): RuntimeVal {
    const obj = evaluate(node.object, env);

    if(obj.type === "array") {
        const arr = obj as ArrayVal;
        const index = evaluate(node.property, env) as NumberVal;
        return arr.elements[index.value] ?? MK_NULL();
    }

    if(obj.type === "object") {
        const object = obj as ObjectVal;
        const key = node.computed
            ? (evaluate(node.property, env) as any).value
            : (node.property as Identifier).symbol;
        return object.properties.get(String(key)) ?? MK_NULL();
    }

    return MK_NULL();
}

export function eval_array_literal(node: ArrayLiteral, env: Environment): RuntimeVal {
    const elements = node.elements.map(el => evaluate(el, env));
    return MK_ARRAY(elements);
}
