import {Stmt, Program, Expr, BinaryExpr, AssignmentExpr, NumericLiteral, Identifier, VarDeclaration, Property, ObjectLiteral, CallExpr, MemberExpr, FunctionDeclaration, ReturnStmt, ExprStmt, IfStmt, WhileStmt, StringLiteral, ArrayLiteral} from "./ast";
import { tokenize, Token, TokenType } from "./lexer";

export default class Parser {
	private tokens: Token[] = [];

	private not_eof(): boolean {
		return this.tokens[0].type != TokenType.EOF;
	}

	// Logical OR: ||
        private parse_logical_or_expr(): Expr {
            let left = this.parse_logical_and_expr();
        
            while(this.at().type === TokenType.Or) { // ||
                const operator = this.eat().value;
                const right = this.parse_logical_and_expr();
                left = { kind: "BinaryExpr", left, right, operator } as BinaryExpr;
            }
        
            return left;
        }
        
        // Logical AND: &&
        private parse_logical_and_expr(): Expr {
            let left = this.parse_equality_expr();
        
            while(this.at().type === TokenType.And) { // &&
                const operator = this.eat().value;
                const right = this.parse_equality_expr();
                left = { kind: "BinaryExpr", left, right, operator } as BinaryExpr;
            }
        
            return left;
        }
        
        // Equality: ==, !=
        private parse_equality_expr(): Expr {
            let left = this.parse_comparison_expr();
        
            while(this.at().type === TokenType.Equal || this.at().type === TokenType.NotEqual) {
                const operator = this.eat().value;
                const right = this.parse_comparison_expr();
                left = { kind: "BinaryExpr", left, right, operator } as BinaryExpr;
            }
        
            return left;
        }
        
        // Comparison: <, >, <=, >=
        private parse_comparison_expr(): Expr {
            let left = this.parse_additive_expr();
        
            while(["<", ">", "<=", ">="].includes(this.at().value)) {
                const operator = this.eat().value;
                const right = this.parse_additive_expr();
                left = { kind: "BinaryExpr", left, right, operator } as BinaryExpr;
            }
        
            return left;
        }

        private parse_stmt(): Stmt {
        	switch (this.at().type) {
        		case TokenType.let:
        		case TokenType.Const:
        			return this.parse_var_declaration();
        
        		case TokenType.Fn:
        			return this.parse_fn_declaration();

			case TokenType.If:
  				return this.parse_if_stmt();
        
        		case TokenType.Return:
        			return this.parse_return_stmt();
			case TokenType.While:
    				return this.parse_while_stmt();
        		default: {
        			const expr = this.parse_expr();
        
        			// Only require semicolon if we're not ending a block/
        			if (
        				this.at().type !== TokenType.Semicolon &&
        				this.at().type !== TokenType.CloseBrace &&
					this.at().type !== TokenType.EOF
        			) {
        				this.expect(
        					TokenType.Semicolon,
        					"Expected semicolon after expression"
        				);
        			} else if (this.at().type === TokenType.Semicolon) {
        				this.eat();
        			}
        
				return {
  					kind: "ExprStmt",
  					expr,
				} as ExprStmt;
        		}
        	}
        }

	private parse_fn_declaration(): Stmt {
		this.eat(); // eat fn keyword 
		const name = this.expect(TokenType.Identifier, "Expected function name following fn keyword.").value;
		const args = this.parse_args();
		const params: string[] = [];

		for(const arg of args) {
			if(arg.kind !== "Identifier") {
				console.log(arg);
				throw "Inside function declaration expected parameters expected to be of type string";
			}
			
			params.push((arg as Identifier).symbol);
		}

		this.expect(TokenType.OpenBrace, "Expected function body following declaration");
		const body: Stmt[] = [];
		
		while(this.at().type !== TokenType.EOF && this.at().type !== TokenType.CloseBrace) {
			body.push(this.parse_stmt());
		}

		this.expect(TokenType.CloseBrace, "Closing brace expected inside function declaration");
		const fn = {
			body, name, parameters: params, kind: "FunctionDeclaration"
		} as FunctionDeclaration;

		return fn;
	}

	private parse_var_declaration(): Stmt {
		const isConstant = this.eat().type == TokenType.Const;
		const identifier = this.expect(
			TokenType.Identifier, 
			"Expected identiefier name following let | const keyword"
		).value;

		if(this.at().type == TokenType.Semicolon) {
			this.eat(); // expect semicolon
			if(isConstant) {
				throw "must assign value to constant expression. Vo value provided";
			}

			return {
				kind: "VarDeclaration", 
				identifier, 
				constant: false, 
			} as VarDeclaration;
		}

		this.expect(
			TokenType.Equals, 
			"Expected equals token following identifier in var declaration"
		);

		const declaration = {
			kind: "VarDeclaration",
			value: this.parse_expr(),
			identifier,
			constant: isConstant,
		} as VarDeclaration;

		this.expect(
			TokenType.Semicolon, 
			"Variable declaration statement must end with semicolon"
		);

		return declaration;
		
	}
	
	private parse_object_expr(): Expr {
		// { props[] }
		if(this.at().type !== TokenType.OpenBrace ) {
			return this.parse_additive_expr();
		}

		this.eat(); // advance past open brace.
		const properties = new Array<Property>();

		while(this.not_eof() && this.at().type != TokenType.CloseBrace) {
			const key = this.expect(TokenType.Identifier, "Object literal key expected").value;
			
			// Allows shothand key: pair -> key,
			if(this.at().type == TokenType.Comma) {
				this.eat(); // Advance past the comma
				properties.push({ key, kind: "Property" } as Property);
				continue;
			} else if(this.at().type == TokenType.CloseBrace ) {
				properties.push({ key, kind: "Property" });
				continue;
			}

			this.expect(TokenType.Colon, "Missing colon following identifier in ObjectExpr");
			const value = this.parse_expr();

			properties.push({ kind: "Property", value, key });
			if(this.at().type != TokenType.CloseBrace) {
				this.expect(TokenType.Comma, "Expected comma or closing bracket following property");
			}
		}

		this.expect(TokenType.CloseBrace, "Object lteral missing closing Brace.");
		return { kind: 'ObjectLiteral', properties } as ObjectLiteral;
	}

	private parse_assignment_expr(): Expr {
		// const left = this.parse_object_expr();
		const left = this.parse_logical_or_expr();
		
		if(this.at().type == TokenType.Equals) {
			this.eat(); // Advance past equals
			const value = this.parse_assignment_expr();
			return { value, assign: left, kind: "AssignmentExpr" } as AssignmentExpr
		}

		return left;
	}

	private parse_expr(): Expr {
		//return this.parse_logical_or_expr();
		return this.parse_assignment_expr();
	}
	
	private parse_additive_expr(): Expr {
		let left = this.parse_multiplicitave_expr();

		while(this.at().value == "+" || this.at().value == "-") {
			const operator = this.eat().value;
			const right = this.parse_multiplicitave_expr();
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator
			} as BinaryExpr;
		}

		return left;
	}

	private parse_multiplicitave_expr(): Expr {
		let left = this.parse_call_member_expr();

		while(this.at().value == "/" || this.at().value == "*" || this.at().value == "%") {
			const operator = this.eat().value;
			const right = this.parse_call_member_expr();
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator
			} as BinaryExpr;
		}

		return left;
	}

	private parse_call_member_expr(): Expr {
		const member = this.parse_member_expr();

		if(this.at().type == TokenType.OpenParen) {
			return this.parse_call_expr(member);
		}

		return member;
	}

	private parse_call_expr(caller: Expr): Expr {
		let call_expr: Expr = {
			kind: "CallExpr",
			caller,
			args: this.parse_args(),
		}	as CallExpr;

		if(this.at().type == TokenType.OpenParen) {
			call_expr = this.parse_call_expr(call_expr);
		}

		return call_expr;
	}

	private parse_args(): Expr[] {
		this.expect(TokenType.OpenParen, "Expected open parenthesis");
		const args = this.at().type == TokenType.CloseParen
			? []
			: this.parse_arguments_list();
	
		this.expect(TokenType.CloseParen, "Missing closing parenthesis inisde arguments list");
		return args;
	}
	
	private parse_arguments_list(): Expr[] {
		// const args = [this.parse_assignment_expr()];
		const args = [this.parse_expr()];

		while(this.at().type == TokenType.Comma && this.eat()) {
			//args.push(this.parse_assignment_expr());
			args.push(this.parse_expr());
		}

		return args;
	}

	private parse_member_expr(): Expr {
		let object = this.parse_primary_expr();

		while(this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
			const operator = this.eat();
			let property: Expr;
			let computed: boolean;

			// non-computed values aka dot.expr
			if(operator.type == TokenType.Dot) {
				computed = false;
				// get identifier
				property = this.parse_primary_expr();

				if(property.kind != "Identifier") {
					throw "Cannot use dot operator without right hand side being an identifier";
				}
			} else {
				computed = true;
				property = this.parse_expr();
				this.expect(TokenType.CloseBracket, "Missing closing bracket in computed value");
			}
			
			object = {
				kind: "MemberExpr",
				object,
				property,
				computed
			} as MemberExpr;
		}

		return object;
	}


	private parse_primary_expr(): Expr {
		const tk = this.at().type;

		switch(tk) {
			case TokenType.Identifier:
				return { kind: "Identifier", symbol: this.eat().value } as Identifier;
			case TokenType.Number:
				return { 
					kind: "NumericLiteral",
					value: parseFloat(this.eat().value),
				} as NumericLiteral;
			case TokenType.OpenParen:
				this.eat(); // eat the opening parem
				const value = this.parse_expr();
				this.expect(
					TokenType.CloseParen, 
					"Unexpected toekn found inside parenthesised expression. Expected closing paranthesis."
				); // closing parem 
				return value;
			case TokenType.OpenBrace: 
				return this.parse_object_expr();
			case TokenType.OpenBracket: 
    				this.eat(); // consume '['
   				const elements: Expr[] = [];

			        while(this.at().type !== TokenType.CloseBracket && this.not_eof()) {
			            elements.push(this.parse_expr());
			            if(this.at().type === TokenType.Comma) {
			                this.eat(); // consume ','
			            }
			        }
			    
			        this.expect(TokenType.CloseBracket, "Expected ']' after array elements");
			        return { kind: "ArrayLiteral", elements } as ArrayLiteral;
			case TokenType.String:
   				return {
   			     	    kind: "StringLiteral",
   			     	    value: this.eat().value,
   			 	} as StringLiteral;
			default:
				console.log("Unexpected token found during parsing", this.at());
				throw new Error("Unexpected token: " + JSON.stringify(this.at()));
				//process.exit();
		}
	}

	private parse_if_stmt(): Stmt {
          this.eat(); // consume 'if'
        
          // condition
          const condition = this.parse_expr();
        
          this.expect(TokenType.OpenBrace, "Expected '{' after if condition");
        
          const thenBranch: Stmt[] = [];
          while (this.at().type !== TokenType.CloseBrace && this.not_eof()) {
            thenBranch.push(this.parse_stmt());
          }
          this.expect(TokenType.CloseBrace, "Expected '}' after if block");
        
          let elseBranch: Stmt[] | undefined;
        
          if (this.at().type === TokenType.Else) {
            this.eat(); // consume else
            this.expect(TokenType.OpenBrace, "Expected '{' after else");
        
            elseBranch = [];
            while (this.at().type !== TokenType.CloseBrace && this.not_eof()) {
              elseBranch.push(this.parse_stmt());
            }
            this.expect(TokenType.CloseBrace, "Expected '}' after else block");
          }
        
          return {
            kind: "IfStmt",
            condition,
            thenBranch,
            elseBranch,
          } as IfStmt;
        }

	private parse_return_stmt(): ReturnStmt {
  		this.eat(); // consume 'return'

  		let value = undefined;

  		// If the next token is not a semicolon or closing brace,
  		// parse an expression
		if ( this.at().type !== TokenType.Semicolon && this.at().type !== TokenType.CloseBrace) {
			value = this.parse_expr();
		}

  		return {
   	 		kind: "ReturnStmt",
    			value,
  		};
	}


	private parse_while_stmt(): Stmt {
	    this.eat(); // consume 'while'
	
	    const condition = this.parse_expr();
	
	    this.expect(TokenType.OpenBrace, "Expected '{' after while condition");
	
	    const body: Stmt[] = [];
	    while (this.at().type !== TokenType.CloseBrace && this.not_eof()) {
	        body.push(this.parse_stmt());
	    }
	
	    this.expect(TokenType.CloseBrace, "Expected '}' after while body");
	
	    return {
	        kind: "WhileStmt",
	        condition,
	        body,
	    } as WhileStmt;
	}

	private at() {
		return this.tokens[0] as Token;
	}

	private eat() {
		const prev = this.tokens.shift() as Token;
		return prev;
	}

	private expect(type: TokenType, err: any) {
		const prev = this.tokens.shift() as Token;
		if(!prev || prev.type != type ) {
			console.log("Parser Error:\n", err, prev, " - Expecting: ", type);
			// process.exit();
		}

		return prev;
	}

	public produceAST(sourceCode: string): Program {
		this.tokens = tokenize(sourceCode);

		const program: Program = {
			kind: "Program",
			body: [],
		};
		
		// Parse until end of line
		while(this.not_eof()) {
			program.body.push(this.parse_stmt());
		}

		return program;
	}
}
