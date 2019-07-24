'use strict';
const chai = require('chai');
const expect = chai.expect;
const Promisie = require('promisie');
const MOCKS = require('../mocks');
const path = require('path');
const CREATE_EVALUATOR = require(path.join(__dirname, '../../lib')).create;

chai.use(require('chai-spies'));

describe('calculations module', function () {
  describe('basic assumptions', function () {
    it('should have a create method that is a function', () => {
      expect(CREATE_EVALUATOR).to.be.a('function');
    });
    it('should accept a segment as an arguments and generate an evaluator', () => {
      let evaluator = CREATE_EVALUATOR(MOCKS.DEFAULT);
      expect(evaluator).to.be.a('function');
    });
  });
  describe('evaluation of a boolean calculation', function () {
    let evaluation;
    before(done => {
      evaluation = CREATE_EVALUATOR(MOCKS.DEFAULT, false, '1');
      done();
    });
    it('should return booleans', async function () {
      let result = await evaluation({ age: 21, });
      expect(result).to.be.an('object');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.DEFAULT.name);
      expect(result.calculations).to.have.property('calc_number_one');
      expect(result.calculations['calc_number_one']).to.equal(false);
    });
  });
  describe('evaluation of a numerical calculation', function () {
    let evaluation;
    before(done => {
      evaluation = CREATE_EVALUATOR(MOCKS.NUMERICAL, false, '1');
      done();
    });
    it('should calculate numbers', async function () {
      let result = await evaluation({ age: 21, });
      expect(result).to.be.an('object');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.NUMERICAL.name);
      expect(result.calculations).to.have.property('calc_number_two');
      expect(result.calculations['calc_number_two']).to.equal(4);
    });
  })
  describe('evaluation of a string calculation', function () {
    let evaluation;
    before(done => {
      evaluation = CREATE_EVALUATOR(MOCKS.CONDITIONAL, false, '1');
      done();
    });
    it('should handle string conditionals and if/else statements', async function () {
      let result = await evaluation({ age: 21, });
      expect(result).to.be.an('object');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.CONDITIONAL.name);
      expect(result.calculations).to.have.property('calc_number_three');
      expect(result.calculations[ 'calc_number_three' ]).to.equal(4);
      let result2 = await evaluation({ age: 19, });
      expect(result2).to.be.an('object');
      expect(result2.calculations).to.be.an('object');
      expect(result2.type).to.equal('Calculations');
      expect(result2.segment).to.equal(MOCKS.CONDITIONAL.name);
      expect(result2.calculations).to.have.property('calc_number_three');
      expect(result2.calculations[ 'calc_number_three' ]).to.equal(92);
    });
  })
  describe('evaluation of calculations involving other variables', function () {
    let evaluation;
    before(done => {
      evaluation = CREATE_EVALUATOR(MOCKS.VARIABLES, false, '1');
      done();
    });
    it('should properly use variable values from the global state', async function () {
      let result = await evaluation({ age: 21, predicted_life_span: 79  });
      expect(result).to.be.an('object');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.VARIABLES.name);
      expect(result.calculations).to.have.property('calc_number_four');
      expect(result.calculations[ 'calc_number_four' ]).to.equal(50);
    });
    it('should return an error in a result object if a variable being used in a calculation does not exist global state', async function () {
      evaluation = await CREATE_EVALUATOR(MOCKS.VARIABLES, false, '1');
      let result = await evaluation({ age: 21 });
      expect(result).to.be.an('object');
      expect(result).to.have.property('error');
      expect(result.error).to.be.a('string');
      expect(result.error).to.not.equal('');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.VARIABLES.name);
      expect(result.calculations).to.have.property('calc_number_four');
      expect(result.calculations[ 'calc_number_four' ]).to.equal(null);
    });
  })
  describe('evaluation of multiple calculations', function () {
    let evaluation;
    before(done => {
      evaluation = CREATE_EVALUATOR(MOCKS.MULTIPLE, false, '1');
      done();
    });
    it('should set all variables properly according to their associated calculations', async function () {
      let result = await evaluation({ age: 21, predicted_life_span: 79 });
      expect(result).to.be.an('object');
      expect(result.calculations).to.be.an('object');
      expect(result.type).to.equal('Calculations');
      expect(result.segment).to.equal(MOCKS.MULTIPLE.name);
      expect(result.calculations).to.have.property('calc_number_one');
      expect(result.calculations).to.have.property('calc_number_two');
      expect(result.calculations).to.have.property('calc_number_four');
      expect(result.calculations[ 'calc_number_one' ]).to.equal(false);
      expect(result.calculations[ 'calc_number_two' ]).to.equal(4);
      expect(result.calculations[ 'calc_number_four' ]).to.equal(50);
    });
  })
});