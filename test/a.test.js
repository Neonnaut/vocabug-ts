import { test, expect } from 'vitest';
import Logger from "../src/modules/logger";
import { valid_weights } from "../src/modules/utilities";
import  collator  from "../src/modules/collator"
 
test('valid weights', () => {
  expect(valid_weights("a*6, c, d*6")).toBe(true);
});

test('collator', () => {
  const logger = new Logger
  expect(collator(logger, ['baby','zebra','apple'], [], [])).toEqual(['apple','baby','zebra']);
});
