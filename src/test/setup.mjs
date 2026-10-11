import {JSDOM} from 'jsdom';
import {afterEach, expect} from 'bun:test';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','localStorage','HTMLElement','HTMLCanvasElement','Node','Event','MouseEvent','KeyboardEvent','MutationObserver','getComputedStyle']) Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
const matchers=await import('@testing-library/jest-dom/matchers'); expect.extend(matchers.default ?? matchers);
const {cleanup}=await import('@testing-library/react');
afterEach(cleanup);
