import type { Board, Case, Grant, Principal, Role, State, User } from '../shared/model.ts';
import { config } from './config.ts';

export function contactAllowed(principal:Pick<Principal,'verified'>){
  return config.CBS_TESTING_MODE||principal.verified;
}

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export function assert(condition: unknown, message: string, code = 'VALIDATION_ERROR', status = 400): asserts condition {
  if (!condition) throw new DomainError(code, message, status);
}
export function userFor(s: State, p: Principal | null): User {
  assert(p, 'Sign in to continue.', 'UNAUTHENTICATED', 401);
  const user = s.users.find(x => x.id === p.id);
  assert(user, 'Complete your profile first.', 'PROFILE_REQUIRED', 403);
  return user;
}
export function inScope(s: State, scope: string, jurisdiction: string): boolean {
  let current: string | null = jurisdiction;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    if (current === scope) return true;
    visited.add(current);
    current = s.geos.find(x => x.id === current)?.parentId ?? null;
  }
  return false;
}
export function activeGrant(s: State, user: User, grant: Grant, at = new Date().toISOString()): boolean {
  if (grant.startsAt > at || grant.endsAt <= at) return false;
  if (grant.role.startsWith('BOARD_')) {
    return s.appointments.some(a => a.userId === user.id && a.boardId === grant.boardId && a.position === grant.role && a.status === 'ACTIVE' && a.startsAt <= at && a.endsAt > at && s.boards.some(b => b.id === a.boardId && b.status === 'ACTIVE'));
  }
  return true;
}
export function has(s: State, p: Principal | null, roles: Role[], jurisdiction: string, boardId?: string, at?: string): boolean {
  if (!p || !contactAllowed(p) || (!config.CBS_TESTING_MODE&&!p.mfa)) return false;
  const user = s.users.find(x => x.id === p.id);
  return !!user?.grants.some(g => roles.includes(g.role) && activeGrant(s, user, g, at) && inScope(s, g.jurisdiction, jurisdiction) && (!g.boardId || g.boardId === boardId));
}
export function requireRole(s: State, p: Principal | null, roles: Role[], jurisdiction: string, boardId?: string): void {
  assert(has(s,p,roles,jurisdiction,boardId), 'This action requires an active appointment and permission in this jurisdiction, plus verified contact and MFA.', 'ACCESS_DENIED', 403);
}
export function boardFor(s: State, id: string): Board {
  const board = s.boards.find(x => x.id === id);
  assert(board, 'Board not found.', 'NOT_FOUND', 404);
  return board;
}
export function restricted(s: State, userId: string, matterId: string): boolean {
  return s.conflicts.some(c => c.userId === userId && c.matterId === matterId && c.status === 'RESTRICTED');
}
export function canReadCase(s: State, p: Principal | null, c: Case): boolean {
  if (!p) return false;
  if (c.reporterId === p.id) return true;
  if (restricted(s,p.id,c.id)) return false;
  if (c.classification === 'HIGHLY_RESTRICTED') return c.assigneeId === p.id && has(s,p,['SECURITY_HANDLER'],c.jurisdiction,c.boardId);
  if (c.boardCode === 'CONDUCT') return has(s,p,['ETHICS_REVIEWER'],c.jurisdiction);
  return (c.assigneeId === p.id && has(s,p,['BOARD_MEMBER','BOARD_SECRETARY','BOARD_CHAIR','LGA_COORDINATOR'],c.jurisdiction,c.boardId)) || has(s,p,['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY'],c.jurisdiction,c.boardId);
}
export function caseOfficer(s: State, p: Principal, c: Case): void {
  assert(canReadCase(s,p,c) && c.reporterId !== p.id, 'An independent authorized handler is required.', 'ACCESS_DENIED',403);
  if (c.classification === 'HIGHLY_RESTRICTED') requireRole(s,p,['SECURITY_HANDLER'],c.jurisdiction,c.boardId);
  else if (c.boardCode === 'CONDUCT') requireRole(s,p,['ETHICS_REVIEWER'],c.jurisdiction);
  else requireRole(s,p,['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY','BOARD_MEMBER'],c.jurisdiction,c.boardId);
}
export function canUseEvidenceTarget(s:State,p:Principal|null,type:'CASE'|'PROJECT',id:string,write=false):boolean {
  if(!p||!contactAllowed(p))return false;
  if(type==='CASE'){const c=s.cases.find(c=>c.id===id);return !!c&&(canReadCase(s,p,c)||(write&&c.desk?.voice===true&&c.desk.facilitatorId===p.id&&has(s,p,['DESK_FACILITATOR'],c.jurisdiction)));}
  const project=s.projects.find(x=>x.id===id);if(!project||restricted(s,p.id,id))return false;
  const roles:Role[]=write?['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY','BOARD_MEMBER']:['LGA_COORDINATOR','BOARD_CHAIR','BOARD_SECRETARY','BOARD_MEMBER','AUDITOR'];
  return has(s,p,roles,project.jurisdiction)||s.boards.some(b=>b.code===project.boardCode&&inScope(s,b.jurisdiction,project.jurisdiction)&&has(s,p,roles,project.jurisdiction,b.id));
}
