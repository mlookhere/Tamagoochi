import { companionStorage } from './device';
import { createCompanionSession } from './queue';

export const companionSession = createCompanionSession(companionStorage);
