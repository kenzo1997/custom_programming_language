import { MK_BOOL, MK_NULL, MK_NATIVE_FN, RuntimeVal, MK_NUMBER, ArrayVal, StringVal  } from "./values";

export function createGlobalEnv() {
	const env = new Environment();
	// Create Default Global Environment
	env.declareVar("true", MK_BOOL(true), true);
	env.declareVar("false", MK_BOOL(false), true);
	env.declareVar("null", MK_NULL(), true);
	
	// Define a native buildtin method
	env.declareVar(
		"print", 
		MK_NATIVE_FN((args, scope) => {
			console.log(...args);
			return MK_NULL();
		}), 
		true
	);

	// len(arr) - returns length of array or string
	env.declareVar(
	    "len",
	    MK_NATIVE_FN((args, scope) => {
	        const val = args[0];
	        if(val.type === "array") return MK_NUMBER((val as ArrayVal).elements.length);
	        if(val.type === "string") return MK_NUMBER((val as StringVal).value.length);
	        throw "len() expects an array or string";
	    }),
	    true
	);
	
	// push(arr, val) - appends value to end of array
	env.declareVar(
	    "push",
	    MK_NATIVE_FN((args, scope) => {
	        if(args[0].type !== "array") throw "push() expects an array as first argument";
	        const arr = args[0] as ArrayVal;
	        arr.elements.push(args[1]);
	        return arr;
	    }),
	    true
	);
	
	// pop(arr) - removes and returns last element
	env.declareVar(
	    "pop",
	    MK_NATIVE_FN((args, scope) => {
	        if(args[0].type !== "array") throw "pop() expects an array";
	        const arr = args[0] as ArrayVal;
	        return arr.elements.pop() ?? MK_NULL();
	    }),
	    true
	);
	
	// first(arr) - returns first element
	env.declareVar(
	    "first",
	    MK_NATIVE_FN((args, scope) => {
	        if(args[0].type !== "array") throw "first() expects an array";
	        const arr = args[0] as ArrayVal;
	        return arr.elements[0] ?? MK_NULL();
	    }),
	    true
	);
	
	// last(arr) - returns last element
	env.declareVar(
	    "last",
	    MK_NATIVE_FN((args, scope) => {
	        if(args[0].type !== "array") throw "last() expects an array";
	        const arr = args[0] as ArrayVal;
	        return arr.elements[arr.elements.length - 1] ?? MK_NULL();
	    }),
	    true
	);

	function timeFunction(args: RuntimeVal[], env: Environment) {
		return MK_NUMBER(Date.now());
	}

	env.declareVar("tine", MK_NATIVE_FN(timeFunction), true);

	return env;
}

export default class Environment {
	private parent?: Environment;
	private variables: Map<string, RuntimeVal>;
	private constants: Set<string>;

	constructor(parentENV?: Environment) {
		const global = parentENV ? true : false;
		this.parent = parentENV;
		this.variables = new Map();
		this.constants = new Set();
	}

	public declareVar(varname: string, value: RuntimeVal, isConstant: boolean): RuntimeVal {
		if(this.variables.has(varname)) {
			throw `Cannot declare variable ${varname}. As it already is defined`;
		}

		this.variables.set(varname, value);
		
		if(isConstant) {
			this.constants.add(varname);
		}

		return value;
	}

	public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
		const env = this.resolve(varname);

		// Cannot assign to constatn 
		if(env.constants.has(varname)) {
			throw `Cannot resign to variable &{varname} as it was declared constant.`
		}

		env.variables.set(varname, value);
		return value;
	}
	
	public lookupVar(varname: string): RuntimeVal {
		const env = this.resolve(varname);
		return env.variables.get(varname) as RuntimeVal;
	}

	public resolve(varname: string): Environment {
		if(this.variables.has(varname)) {
			return this;
		}	

		if(this.parent == undefined) {
			throw `Cannot resolve '${varname}' as it does not exsists`;
		}

		return this.parent.resolve(varname);
	}

	public updateVar(varname: string, value: RuntimeVal): RuntimeVal {
    		const env = this.resolve(varname);
    		env.variables.set(varname, value);
    		return value;
	}
}
