/**
 * Behavior Tree implementation for AI decision-making.
 * Supports Selector (fallback), Sequence, and Action nodes.
 */

export type Status = 'success' | 'failure' | 'running';

export interface BehaviorNode {
  execute(delta: number): Status;
}

/** Selector: tries children in order, returns on first success/running */
export class Selector implements BehaviorNode {
  children: BehaviorNode[];
  constructor(...children: BehaviorNode[]) {
    this.children = children;
  }
  execute(delta: number): Status {
    for (const child of this.children) {
      const status = child.execute(delta);
      if (status !== 'failure') return status;
    }
    return 'failure';
  }
}

/** Sequence: runs children in order, fails on first failure */
export class Sequence implements BehaviorNode {
  children: BehaviorNode[];
  constructor(...children: BehaviorNode[]) {
    this.children = children;
  }
  execute(delta: number): Status {
    for (const child of this.children) {
      const status = child.execute(delta);
      if (status !== 'success') return status;
    }
    return 'success';
  }
}

/** Action node: wraps a function that returns Status */
export class Action implements BehaviorNode {
  private fn: (delta: number) => Status;
  constructor(fn: (delta: number) => Status) {
    this.fn = fn;
  }
  execute(delta: number): Status {
    return this.fn(delta);
  }
}