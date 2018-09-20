import 'jest-preset-angular';
import './jest-global-mocks';

(global as any).jestLog = console.log;

const enableTestLogs = false;

if (!enableTestLogs) {
  const logFunction = function() {};
  console.log = logFunction;
  console.debug = logFunction;
  console.info = logFunction;
  console.warn = logFunction;

  // do not deactivate the error log because if we have a runtime error at a
  // component/service we will just get a silent error
  /* console.error = logFunction; */
}
