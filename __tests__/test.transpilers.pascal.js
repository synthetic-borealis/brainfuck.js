const pascalUtils = require('pascal-utils');
// noinspection DuplicatedCode
const fsPromises = require('fs/promises');
const fs = require('fs');
const util = require('util');
const childProcess = require('child_process');
const {
  WrongInputTypeError,
  BracketMismatchError,
  transpileToPascal,
} = require('../lib');

const exec = util.promisify(childProcess.exec);

const helloWorldCode = fs.readFileSync('assets/bf/hello-world.bf')
  .toString();
const bracketMismatchCode = '>>+++[[<-->]';
const userInputCode = ',.';
const exeExtension = process.platform === 'win32' ? '.exe' : '';
const executableFile = `test_pas${exeExtension}`;
const sourceFile = 'test_pas.pas';
const objectFile = 'test_pas.o';
const commandToRun = process.platform === 'win32' ? executableFile : `./${executableFile}`;

describe('Pascal transpiler', () => {
  describe('Error handling', () => {
    it('Throws WrongInputTypeError when given input of wrong type', () => {
      const numberArray = [2, 4, 8, 16];
      // noinspection JSCheckFunctionSignatures
      expect(() => transpileToPascal(numberArray))
        .toThrow(WrongInputTypeError);
    });
    it('Throws BracketMismatchError when there\'s a bracket mismatch', () => {
      expect(() => transpileToPascal(bracketMismatchCode))
        .toThrow(BracketMismatchError);
    });
  });
  describe('Code generation', () => {
    const outputCode = transpileToPascal(helloWorldCode, 'Test');
    beforeAll(() => fsPromises.writeFile(sourceFile, outputCode));
    afterAll(() => Promise.all([
      fsPromises.unlink(sourceFile),
      fsPromises.unlink(objectFile),
      fsPromises.unlink(executableFile),
    ]));
    it('Generates valid & correct code', () => pascalUtils.compile(sourceFile, executableFile)
      .then(() => exec(commandToRun))
      .then(({ stdout }) => {
        expect(stdout.trim())
          .toBe('Hello World!');
      }));
  });
  describe('Code generation (with user input)', () => {
    const inputChar = 'a';
    const wrapper = () => new Promise((resolve, reject) => {
      const child = childProcess.exec(`${commandToRun}`, (error, stdout) => {
        if (error) {
          reject(error);
        }
        resolve(stdout);
      });
      child.stdin.write(`${inputChar}\n`);
    });
    beforeAll(() => {
      const outputCode = transpileToPascal(userInputCode, 'Test');
      return fsPromises.writeFile(sourceFile, outputCode);
    });
    afterAll(() => Promise.all([
      fsPromises.unlink(sourceFile),
      fsPromises.unlink(objectFile),
      fsPromises.unlink(executableFile),
    ]));
    it('Generates valid & correct code', () => pascalUtils.compile(sourceFile, executableFile)
      .then(() => wrapper())
      .then((out) => expect(out)
        .toBe(inputChar)));
  });
});
