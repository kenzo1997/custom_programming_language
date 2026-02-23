import { NumberVal, ValueType, RuntimeVal, MK_NULL, StringVal, ArrayVal } from "./values"
import { AssignmentExpr, BinaryExpr, CallExpr, FunctionDeclaration, Identifier, NodeType, NumericLiteral, ObjectLiteral, Program, Stmt, VarDeclaration, ReturnStmt, ExprStmt, IfStmt, WhileStmt, StringLiteral, ArrayLiteral, MemberExpr, ForInStmt } from "../ast"
import Environment from "./environment";
import { eval_program, eval_var_declaration, eval_function_declaration, eval_return_stmt, eval_if_stmt, eval_while_stmt, eval_for_in_stmt } from "./eval/staments";
import { eval_identifier, evaluate_binary_expr, eval_assignment, eval_object_expr, eval_call_expr, eval_member_expr, eval_array_literal } from "./eval/expressions";

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
		case "ArrayLiteral":
    			return eval_array_literal(astNode as ArrayLiteral, env);
		case "MemberExpr":
    			return eval_member_expr(astNode as MemberExpr, env);
		case "ForInStmt":
    			return eval_for_in_stmt(astNode as ForInStmt, env);
		case "StringLiteral":
    			return {
        		    type: "string",
        		    value: (astNode as StringLiteral).value,
    			} as StringVal;
		// Handles unimplemented ast types as error.
		default:
		    console.error("This AST Node has not yet been setup for interpertation.", astNode);
                    return MK_NULL();
			//process.exit(0);
	}
}
