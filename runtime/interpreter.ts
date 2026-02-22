import { NumberVal, ValueType, RuntimeVal, MK_NULL } from "./values"
import { AssignmentExpr, BinaryExpr, CallExpr, FunctionDeclaration, Identifier, NodeType, NumericLiteral, ObjectLiteral, Program, Stmt, VarDeclaration, ReturnStmt, ExprStmt, IfStmt, WhileStmt } from "../ast"
import Environment from "./environment";
import { eval_program, eval_var_declaration, eval_function_declaration, eval_return_stmt, eval_if_stmt, eval_while_stmt } from "./eval/staments";
import { eval_identifier, evaluate_binary_expr, eval_assignment, eval_object_expr, eval_call_expr } from "./eval/expressions";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
	switch(astNode.kind) {
		case "NumericLiteral":
			return { 
				value: (astNode as NumericLiteral).value,
				type: "number",
			} as NumberVal;
		case "Identifier":
			return eval_identifier(astNode as Identifier, env);
		case "ObjectLiteral":
			return eval_object_expr(astNode as ObjectLiteral, env)
		case "CallExpr":
			return eval_call_expr(astNode as CallExpr, env)
		case "AssignmentExpr":
			return eval_assignment(astNode as AssignmentExpr, env)
		case "BinaryExpr":
			return evaluate_binary_expr(astNode as BinaryExpr, env);
		case "Program":
			return eval_program(astNode as Program, env);
		// Handle Statements
		case "VarDeclaration":
			return eval_var_declaration(astNode as VarDeclaration, env);
		case "FunctionDeclaration":
			return eval_function_declaration(astNode as FunctionDeclaration, env);
		case "IfStmt":
  			return eval_if_stmt(astNode as IfStmt, env);
		case "ReturnStmt":
                        return eval_return_stmt(astNode as ReturnStmt, env);
		case "ExprStmt":
			return evaluate((astNode as ExprStmt).expr, env);
		case "WhileStmt":
    			return eval_while_stmt(astNode as WhileStmt, env);
		// Handles unimplemented ast types as error.
		default:
		    console.error("This AST Node has not yet been setup for interpertation.", astNode);
                    return MK_NULL();
			//process.exit(0);
	}
}
