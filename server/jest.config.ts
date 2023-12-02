import type {Config} from 'jest';

const config: Config = {
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[t]sx?$',
};

export default config;
