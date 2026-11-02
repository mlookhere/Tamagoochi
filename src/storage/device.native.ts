import * as FileSystem from 'expo-file-system/legacy';
import type { CompanionStorage } from './device';

function saveUri(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('App document storage unavailable');
  }
  return FileSystem.documentDirectory + 'companion-v2.json';
}

export const companionStorage: CompanionStorage = {
  async read() {
    const uri = saveUri();
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? FileSystem.readAsStringAsync(uri) : null;
  },
  async write(data) {
    await FileSystem.writeAsStringAsync(saveUri(), data);
  },
};
