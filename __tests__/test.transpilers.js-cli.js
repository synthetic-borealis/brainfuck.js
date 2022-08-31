const fsPromises = require('fs/promises');
const fs = require('fs');
const util = require('util');
const childProcess = require('child_process');
const {
  WrongInputTypeError,
  BracketMismatchError,
  transpileToJsCli,
} = require('../lib');

const exec = util.promisify(childProcess.exec);

const helloWorldCode = fs.readFileSync('assets/bf/hello-world.bf').toString();
const bracketMismatchCode = '>>+++[[<-->]';
const userInputCode = ',.';
const numberArray = [2, 4, 8, 16];
const sourceFile = 'test_js.js';

function checkGeneratedCode(codeToCheck) {
  beforeAll(() => fsPromises.writeFile(sourceFile, codeToCheck));
  it('Generates valid & correct code', () => exec(`node ${sourceFile}`)
    .then(({ stdout }) => {
      expect(stdout.trim()).toBe('Hello World!');
    }));
  afterAll(() => fsPromises.unlink(sourceFile));
}

describe('JavaScript (cli) transpiler', () => {
  describe('Error handling', () => {
    it('Throws WrongInputTypeError when given input of wrong type', () => {
      // noinspection JSCheckFunctionSignatures
      expect(() => transpileToJsCli(numberArray)).toThrow(WrongInputTypeError);
    });
    it('Throws BracketMismatchError when there\'s a bracket mismatch', () => {
      expect(() => transpileToJsCli(bracketMismatchCode)).toThrow(BracketMismatchError);
    });
  });
  describe('Code generation (dynamic array)', () => {
    checkGeneratedCode(transpileToJsCli(helloWorldCode));
  });
  describe('Code generation (fixed array)', () => {
    checkGeneratedCode(transpileToJsCli(helloWorldCode, false));
  });
  describe('Code generation (with user input)', () => {
    beforeAll(() => {
      const outputCode = transpileToJsCli(userInputCode);
      return fsPromises.writeFile(sourceFile, outputCode);
    });
    afterAll(() => fsPromises.unlink(sourceFile));
    it('Generates valid & correct code', () => {
      const inputChar = 'a';
      const wrapper = () => new Promise((resolve, reject) => {
        const child = childProcess.exec(`node ${sourceFile}`, (error, stdout) => {
          if (error) {
            reject(error);
          }
          resolve(stdout);
        });
        child.stdin.write(`${inputChar}\n`);
      });
      return wrapper()
        .then((out) => {
          expect(out).toBe(inputChar);
        });
    });
  });
});
