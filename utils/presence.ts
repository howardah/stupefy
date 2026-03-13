const redis = require("redis") as {
  createClient(options: { host: string | undefined }): RedisClient;
};

interface RedisClient {
  hdel(
    key: string,
    field: string,
    callback: (err: unknown) => void
  ): void;
  hgetall(
    key: string,
    callback: (err: unknown, presence: Record<string, string> | null) => void
  ): void;
  hset(
    key: string,
    field: string,
    value: string,
    callback: (err: unknown) => void
  ): void;
}

interface PresenceEntry {
  connection: string;
  meta: Record<string, unknown>;
  when: number;
}

class Presence {
  client: RedisClient;

  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_ENDPOINT,
    });
  }

  upsert(connectionId: string, meta: Record<string, unknown>): void {
    this.client.hset(
      "presence",
      connectionId,
      JSON.stringify({
        meta,
        when: Date.now(),
      }),
      function (err: unknown) {
        if (err) {
          console.error("[presence] Failed to store presence in Redis.", err);
        }
      }
    );
  }

  remove(connectionId: string): void {
    this.client.hdel("presence", connectionId, function (err: unknown) {
      if (err) {
        console.error("[presence] Failed to remove presence from Redis.", err);
      }
    });
  }

  list(returnPresent: (presence: PresenceEntry[]) => void): void {
    const active: PresenceEntry[] = [];
    const dead: PresenceEntry[] = [];
    const now = Date.now();

    this.client.hgetall(
      "presence",
      (err: unknown, presence: Record<string, string> | null) => {
        if (err) {
          console.error("[presence] Failed to load presence from Redis.", err);
          returnPresent([]);
          return;
        }

        for (const connection in presence ?? {}) {
          const details = JSON.parse(presence?.[connection] ?? "{}") as Omit<
            PresenceEntry,
            "connection"
          >;
          const entry: PresenceEntry = {
            connection,
            meta: details.meta ?? {},
            when: details.when ?? 0,
          };

          if (now - entry.when > 8000) {
            dead.push(entry);
          } else {
            active.push(entry);
          }
        }

        if (dead.length) {
          this._clean(dead);
        }

        returnPresent(active);
      }
    );
  }

  _clean(toDelete: PresenceEntry[]): void {
    console.info("[presence] Cleaning expired presences.", {
      count: toDelete.length,
    });
    for (const presence of toDelete) {
      this.remove(presence.connection);
    }
  }
}

module.exports = new Presence();
