import { runDomRulesInPage, getChecksCatalog } from '@surea11y/core';
import type { StrictEngineOptions } from '@surea11y/core';
import { runa11yCoreOnHtml } from '@surea11y/core/testing';
runDomRulesInPage('u', null, { strictOptions: true, lcoale: 'de' }, null);           // doc example: should be an error in TS
getChecksCatalog({ strictOptions: true, lcoale: 'de' });
runa11yCoreOnHtml('<p>', { engineOptions: { strictOptions: true, lcoale: 'de' } });
const o: StrictEngineOptions = { strictOptions: true, lcoale: 'de' };                   // explicit annotation
