import { test, expect } from 'vitest';
import Logger from "../src/modules/logger";
import  collator  from "../src/modules/collator"
 
test('collator', () => {
  const logger = new Logger
  expect(collator(logger, ['baby','zebra','apple'], [], [])).toEqual(['apple','baby','zebra']);
});
