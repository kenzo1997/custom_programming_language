// Tutorial: https://www.youtube.com/watch?v=8VB5TY1sIRo

export enum TokenType {
	Number,
	Identifier,
	Equals,
	Semicolon,
	Comma,
	Dot,
	Colon,
	OpenParen, 
	CloseParen,
	OpenBrace,
	CloseBrace,
	OpenBracket,
	CloseBracket,
	BinaryOperator,
	let,
	Const,
	Fn,
	Return,
	If,
	Else,
	Equal,       
        NotEqual,     
        LessThan,     
        GreaterThan,  
        LessEq,       
        GreaterEq,    
        And,          
        Or,          
        Not,
	While,
	EOF, // Signified the end of file}
}

const KEYWORDS: Record<string, TokenType> = {
	let: TokenType.let,
	const: TokenType.Const,
	fn: TokenType.Fn,
	return: TokenType.Return,
	if: TokenType.If,
	else: TokenType.Else,
	while: TokenType.While,
}

export interface Token {
	value: string,
	type: TokenType,
}

function token(value = "", type: TokenType): Token {
	return { value, type };
}

function isalpha(src: string): boolean {
	return src.toUpperCase() != src.toLowerCase();
}

function isint(str: string) {
	const c = str.charCodeAt(0);
	const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
	return c >= bounds[0] && c <= bounds[1] 
}

function isSkippable(str: string) {
	return str == ' ' || str == '\n'|| str == '\t' || str == '\r';
}

export function tokenize(sourceCode: string): Token[] {
	const tokens = new Array<Token>();
	const src = sourceCode.split("");

	while(src.length > 0) {
		const current = src[0];
		const next = src[1] ?? "";

		// Handle parentheses, braces, etc.
		if(current == '(') {
			tokens.push(token(src.shift(), TokenType.OpenParen));
		} else if(current == ')') {
			tokens.push(token(src.shift(), TokenType.CloseParen));
		} else if(current == '{') {
			tokens.push(token(src.shift(), TokenType.OpenBrace));
		} else if(current == '}') {
			tokens.push(token(src.shift(), TokenType.CloseBrace));
		} else if(current == '[') {
			tokens.push(token(src.shift(), TokenType.OpenBracket));
		} else if(current == ']') {
			tokens.push(token(src.shift(), TokenType.CloseBracket));
		} else if(current == ';') {
			tokens.push(token(src.shift(), TokenType.Semicolon));
		} else if(current == ',') {
			tokens.push(token(src.shift(), TokenType.Comma));
		} else if(current == ':') {
			tokens.push(token(src.shift(), TokenType.Colon));
		} else if(current == '.') {
			tokens.push(token(src.shift(), TokenType.Dot));

		// Handle multi-character operators first
		} else if(current == '=' && next == '=') {
			src.shift(); src.shift();
			tokens.push(token('==', TokenType.Equal));
		} else if(current == '!' && next == '=') {
			src.shift(); src.shift();
			tokens.push(token('!=', TokenType.NotEqual));
		} else if(current == '<' && next == '=') {
			src.shift(); src.shift();
			tokens.push(token('<=', TokenType.LessEq));
		} else if(current == '>' && next == '=') {
			src.shift(); src.shift();
			tokens.push(token('>=', TokenType.GreaterEq));
		} else if(current == '&' && next == '&') {
			src.shift(); src.shift();
			tokens.push(token('&&', TokenType.And));
		} else if(current == '|' && next == '|') {
			src.shift(); src.shift();
			tokens.push(token('||', TokenType.Or));
		} else if(current == '=') {   // 👈 ADD THIS
    			tokens.push(token(src.shift(), TokenType.Equals));

		// Handle single-character operators
		} else if(['+', '-', '*', '/', '%', '<', '>', '!'].includes(current)) {
			tokens.push(token(src.shift(), TokenType.BinaryOperator));

		// Handle numbers
		} else if(isint(current)) {
			let num = "";
			while(src.length > 0 && isint(src[0])) num += src.shift();
			tokens.push(token(num, TokenType.Number));

		// Handle identifiers / keywords
		} else if(isalpha(current)) {
			let ident = "";
			while(src.length > 0 && isalpha(src[0])) ident += src.shift();
			const reserved = KEYWORDS[ident];
			tokens.push(token(ident, typeof reserved === "number" ? reserved : TokenType.Identifier));

		// Skip whitespace
		} else if(isSkippable(current)) {
			src.shift();

		} else {
			console.log("Unrecognized character found in source: ", current);
			src.shift();
		}
	}

	tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
	return tokens;
}
