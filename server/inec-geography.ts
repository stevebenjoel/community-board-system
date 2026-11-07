import { readFileSync } from 'node:fs';
import type { Geo, State } from '../shared/model.ts';
import { fixedId } from './seed.ts';

type StateRow = { code: string; name: string };
type LgaRow = StateRow & { state_code: string };
type WardRow = LgaRow & { lga_code: string };

const version = '3cf617721aea519eef960681d3d86a4fad4325da';
const source = 'INEC CVR portal via saidiadegoke/nigeria-inec-geo';
function load<T>(name: string): T[] {
  return JSON.parse(readFileSync(new URL('../data/inec/' + name + '.json', import.meta.url), 'utf8')) as T[];
}
const states = load<StateRow>('states');
const lgas = load<LgaRow>('lgas');
const wards = load<WardRow>('wards');

function location(key: string, name: string, type: Geo['type'], parentId: string): Geo {
  return { id: fixedId(key), name, type, parentId, source, version,
    createdAt: '2026-08-11T00:00:00.000Z', updatedAt: '2026-08-11T00:00:00.000Z' };
}

const stateIds = new Map(states.map(state => [
  state.code,
  fixedId('state-' + (state.name === 'FCT' ? 'Federal Capital Territory' : state.name.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()))),
]));
export const KADUNA_SOUTH_ID=fixedId('inec-lga-18-10');
const lgaKey = (state: string, lga: string) => 'inec-lga-' + state + '-' + lga;
const catalog = [
  ...lgas.map(row => location(lgaKey(row.state_code, row.code), row.name, 'LGA', stateIds.get(row.state_code)!)),
  ...wards.map(row => location('inec-ward-' + row.state_code + '-' + row.lga_code + '-' + row.code, row.name, 'WARD', fixedId(lgaKey(row.state_code, row.lga_code)))),
];
export const inecGeoIds = new Set(catalog.map(geo => geo.id));

const settlementData = JSON.parse(readFileSync(new URL('../data/inec/grid3-communities.json', import.meta.url), 'utf8')) as {
  communities: Record<string, [number, string][]>;
};
const settlements = new Map<string, Geo>();
const settlementsByWard = new Map<string, Geo[]>();
for (const [ward, rows] of Object.entries(settlementData.communities)) {
  const parentId = fixedId('inec-ward-' + ward);
  const entries = rows.map(([fid, name]) => ({
    ...location('grid3-settlement-' + fid, name, 'COMMUNITY', parentId),
    source: 'GRID3 Settlement Names, CC BY 4.0, matched to INEC ward',
    version: '2021-03', createdAt: '2021-03-01T00:00:00.000Z', updatedAt: '2021-03-01T00:00:00.000Z',
  }));
  settlementsByWard.set(parentId, entries);
  for (const entry of entries) settlements.set(entry.id, entry);
}

export function isReferenceGeo(id: string) {
  return inecGeoIds.has(id) || settlements.has(id);
}

export function wardSettlements(state: State, wardId: string) {
  const recorded = state.geos.filter(geo => geo.type === 'COMMUNITY' && geo.parentId === wardId);
  const known = new Set(recorded.map(geo => geo.id));
  return [...recorded, ...(settlementsByWard.get(wardId) ?? []).filter(geo => !known.has(geo.id))];
}

export function includeSettlement(state: State, id: string) {
  const settlement = settlements.get(id);
  if (settlement && state.geos.some(geo => geo.id === settlement.parentId) && !state.geos.some(geo => geo.id === id)) {
    state.geos.push({ ...settlement });
  }
}

export function addInecGeography(state: State): State {
  const known = new Set(state.geos.map(geo => geo.id));
  for (const geo of catalog) {
    if (!known.has(geo.id) && geo.parentId && known.has(geo.parentId)) {
      state.geos.push({ ...geo });
      known.add(geo.id);
    }
  }
  const referenced = new Set([
    ...state.users.flatMap(user => user.grants.map(grant => grant.jurisdiction)),
    ...[...state.residencies, ...state.cases, ...state.projects, ...state.agencies, ...state.audits].map(record => record.jurisdiction),
  ]);
  for (const id of referenced) includeSettlement(state, id);
  return state;
}
