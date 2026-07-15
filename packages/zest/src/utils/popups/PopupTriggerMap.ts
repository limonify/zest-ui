/**
 * Keeps track of popup trigger nodes by their ids.
 *
 * Ported from upstream, with `Element` widened to `unknown`: a React Native
 * trigger is a native node, and the map only ever stores and hands it back — the
 * same way the popup stores already carry `triggerNode`.
 *
 * Lookups iterate the id map; trigger counts are single digits, so linear scans
 * on event-frequency paths are cheaper than maintaining a parallel Set.
 */
export class PopupTriggerMap {
  private idMap = new Map<string, unknown>();

  /**
   * Adds a trigger node under the given id.
   *
   * The node is assumed not to be registered under multiple ids.
   */
  public add(id: string, node: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      for (const [existingId, existingNode] of this.idMap) {
        if (existingNode === node && existingId !== id) {
          throw new Error(
            'Zest: A trigger cannot be registered under multiple ids in PopupTriggerMap.',
          );
        }
      }
    }

    this.idMap.set(id, node);
  }

  public delete(id: string) {
    this.idMap.delete(id);
  }

  public getById(id: string): unknown {
    return this.idMap.get(id);
  }

  public entries(): IterableIterator<[string, unknown]> {
    return this.idMap.entries();
  }

  public get size(): number {
    return this.idMap.size;
  }
}
