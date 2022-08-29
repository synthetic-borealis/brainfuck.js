const cppUtils = require('cpp-utils');
const fs = require('fs/promises');
const util = require('util');
const childProcess = require('child_process');
const {
  WrongInputTypeError,
  BracketMismatchError,
  transpileToC,
} = require('../lib');

const exec = util.promisify(childProcess.exec);

const helloWorldCode = '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.';
const bracketMismatchCode = '>>+++[[<-->]';
const userInputCode = ',.';
const numberArray = [2, 4, 8, 16];
const exeExtension = process.platform === 'win32' ? '.exe' : '';
const executableFile = `test_c${exeExtension}`;
const sourceFile = 'test_c.c';
const commandToRun = process.platform === 'win32' ? executableFile : `./${executableFile}`;

describe('C transpiler', () => {
  describe('Error handling', () => {
    it('Throws WrongInputTypeError when given input of wrong type', () => {
      // noinspection JSCheckFunctionSignatures
      expect(() => transpileToC(numberArray)).toThrow(WrongInputTypeError);
    });
    it('Throws BracketMismatchError when there\'s a bracket mismatch', () => {
      expect(() => transpileToC(bracketMismatchCode)).toThrow(BracketMismatchError);
    });
  });
  describe('Code generation', () => {
    beforeAll(() => {
      const outputCode = transpileToC(helloWorldCode);
      return fs.writeFile(sourceFile, outputCode);
    });
    afterAll(() => Promise.all([
      fs.unlink(sourceFile),
      fs.unlink(executableFile),
    ]));
    it('Generates valid code', () => cppUtils.compileWithGcc(sourceFile, executableFile, true)
      .then(() => {
        expect(true).toBeTruthy();
      }));
    it('Generates correct code', () => exec(commandToRun)
      .then(({ stdout }) => {
        expect(stdout.trim()).toBe('Hello World!');
      }));
  });
  describe('Code generation (with user input)', () => {
    beforeAll(() => {
      const outputCode = transpileToC(userInputCode);
      return fs.writeFile(sourceFile, outputCode);
    });
    // noinspection DuplicatedCode
    afterAll(() => Promise.all([
      fs.unlink(sourceFile),
      fs.unlink(executableFile),
    ]));
    it('Generates valid code', () => cppUtils.compileWithGcc(sourceFile, executableFile, true)
      .then(() => {
        expect(true).toBeTruthy();
      }));
    // noinspection DuplicatedCode
    it('Generates correct code', () => {
      const inputChar = 'a';
      const getPromise = () => new Promise((resolve, reject) => {
        const child = childProcess.exec(`${commandToRun}`, (error, stdout) => {
          if (error) {
            reject(error);
          }
          resolve(stdout.trim());
        });
        process.stdin.pipe(child.stdin);
        process.stdin.push(`${inputChar}\n`);
      });
      return getPromise()
        .then((out) => {
          expect(out).toBe(inputChar);
        });
    });
  });
});
