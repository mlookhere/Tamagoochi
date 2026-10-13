export type CompanionStorage = Readonly<{
  read: () => Promise<string | null>;
  write: (data: string) => Promise<void>;
}>;

const SAVE_KEY = 'tamagoochi.companion.v2';

export const companionStorage: CompanionStorage = {
  async read() {
    return globalThis.localStorage.getItem(SAVE_KEY);
  },
  async write(data) {
    globalThis.localStorage.setItem(SAVE_KEY, data);
  },
};
