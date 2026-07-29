import { PopupTriggerMap } from './PopupTriggerMap';

describe('PopupTriggerMap', () => {
  it('stores and returns trigger nodes by id', () => {
    const map = new PopupTriggerMap();
    const nodeA = { id: 'a' };
    const nodeB = { id: 'b' };

    map.add('a', nodeA);
    map.add('b', nodeB);

    expect(map.getById('a')).toBe(nodeA);
    expect(map.getById('b')).toBe(nodeB);
    expect(map.size).toBe(2);
  });

  it('returns undefined for an unknown id', () => {
    const map = new PopupTriggerMap();

    expect(map.getById('missing')).toBeUndefined();
  });

  it('replaces the node registered under an id', () => {
    const map = new PopupTriggerMap();
    const first = { id: 'first' };
    const second = { id: 'second' };

    map.add('a', first);
    map.add('a', second);

    expect(map.getById('a')).toBe(second);
    expect(map.size).toBe(1);
  });

  it('deletes by id', () => {
    const map = new PopupTriggerMap();
    map.add('a', {});

    map.delete('a');

    expect(map.size).toBe(0);
    expect(map.getById('a')).toBeUndefined();
  });

  it('ignores deleting an id that was never added', () => {
    const map = new PopupTriggerMap();

    expect(() => map.delete('missing')).not.toThrow();
    expect(map.size).toBe(0);
  });

  it('exposes entries in insertion order', () => {
    const map = new PopupTriggerMap();
    const nodeA = { id: 'a' };
    const nodeB = { id: 'b' };
    map.add('a', nodeA);
    map.add('b', nodeB);

    expect([...map.entries()]).toEqual([
      ['a', nodeA],
      ['b', nodeB],
    ]);
  });

  // A node registered under two ids would make `getById` ambiguous — which of
  // the two anchors should an imperative open use? Dev builds refuse it.
  it('throws when one node is registered under two ids', () => {
    const map = new PopupTriggerMap();
    const node = { id: 'shared' };
    map.add('a', node);

    expect(() => map.add('b', node)).toThrow(/cannot be registered under multiple ids/);
  });

  it('allows re-registering the same node under the same id', () => {
    const map = new PopupTriggerMap();
    const node = { id: 'same' };
    map.add('a', node);

    expect(() => map.add('a', node)).not.toThrow();
    expect(map.size).toBe(1);
  });
});
