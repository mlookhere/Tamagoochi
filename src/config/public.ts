export type AppEnvironment = 'development' | 'preview' | 'production';

export type PublicConfig = Readonly<{
  environment: AppEnvironment;
  buildLabel: string;
}>;

const allowedEnvironments = new Set<AppEnvironment>([
  'development',
  'preview',
  'production',
]);

export function getPublicConfig(
  env: Record<string, string | undefined> = process.env,
): PublicConfig {
  const environment = env.EXPO_PUBLIC_APP_ENV ?? 'development';

  if (!allowedEnvironments.has(environment as AppEnvironment)) {
    throw new Error(
      'EXPO_PUBLIC_APP_ENV must be development, preview, or production.',
    );
  }

  const buildLabel = env.EXPO_PUBLIC_BUILD_LABEL?.trim() || 'local';

  return {
    environment: environment as AppEnvironment,
    buildLabel,
  };
}
