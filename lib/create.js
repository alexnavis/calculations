'use strict';
const vm = require('vm');
const numeric = require('numeric');
const string2json = require('string-to-json');

/**
 * This function coerces a value based on its data_type and returns the correctly typed value to be used during calculations
 * @param {*} value Value to be converted according to data_type
 * @param {*} data_type Type passed in to determine coercion function
 */
function coerceType(value, data_type) {
  try {
    switch (data_type) {
    case 'Date':
      value = new Date(value);
      break;
    case 'String':
      value = String(value);
      break;
    case 'Number':
      value = Number(value);
      break;
    case 'Boolean':
      value = Boolean(value);
      break;
    default:
      break;
    }
    return value;
  } catch (e) {
    return value;
  }
}

/**
 * This function generates the context of the VM where calculations will be run
 * @param {[Object]} variables Variable configurations to be calculated and returned in module
 */
var buildContext = function (variables) {
  let _global = {
    calculations: {},
    error: '',
  };
  let context = variables.reduce((result, current) => {
    result._global.calculations[ current.variable_name ] = null;
    return result;
  }, { _global, });
  return context;
};

/**
 * This function generates the calculation script to be run in context. Variables will be calculated and assigned on the global state in the VM
 * @param {[Object]} variables Variable configurations to be calculated and returned in module
 */
var buildScript = function (variables) {
	let allVars = variables.map(variable => variable.variable_name).filter((x, i, a) => a.indexOf(x) == i).join(',') || 'test';
	let script = variables.reduce((result, current) => {
		let fn = new Function(current.calculation_operation);
		let coerceFn = new Function(`return ${coerceType}`)();
		result += '\t';
		result += `${current.variable_name} = (${fn.toString()})();\r\n\t`;
		result += `_global.calculations['${current.variable_name}'] = ${coerceFn}(${current.variable_name}, '${current.variable_type}');\r\n`;
		return result;
	}, `"use strict";\r\ntry{\r\nlet ${allVars};\r\n`);
	script += '} catch(e){ \r\n\t _global.error = e.message \r\n}';
	return script;
};

/**
 * This function stages the context and calculation script for processing
 * @param {Object} state global state
 * @param {Object} sandbox initial vm context 
 * @param {String} script calculation script to be used for variable assignments in the vm
 */
var prepareCalculation = function (state, sandbox, script) {
  sandbox.numeric = numeric;
  sandbox._global = Object.assign({}, sandbox._global, state);
  sandbox = Object.assign({}, sandbox, state);
  let calculation = new vm.Script(script);
  vm.createContext(sandbox);
  return { sandbox, calculation, };
};

/**
 * This function returns a function which will process variable calculations when passed state
 * @param {Object} configuration Calculation configuration object
 * @param {String} module_name Name of calculation module
 */
var generateCalculation = function (configuration, module_name) {
  let context = buildContext(configuration.variables);
  let script = buildScript(configuration.variables);
  return function calculate(state) {
    let _state = Object.assign({}, state);
    let _context = Object.assign({}, context);
    let { sandbox, calculation, } = prepareCalculation(_state, _context, script, module_name);
    calculation.runInContext(sandbox);
    if (sandbox._global.error) state.error = {
      code: '',
      message: sandbox._global.error,
    };
    return {
      'type': 'Calculations',
      'name': module_name,
      segment: configuration.name,
      'calculations': string2json.convert(sandbox._global.calculations),
      'error': sandbox._global.error,
    };
  };
};

module.exports = generateCalculation;