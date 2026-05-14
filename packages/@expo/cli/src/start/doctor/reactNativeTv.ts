import { getVersionedNativeModulesAsync } from './dependencies/bundledNativeModules';
import type { IncorrectDependency } from './dependencies/validateDependenciesVersions';

export const REACT_NATIVE_TVOS_PACKAGE_NAME = 'react-native-tvos';

/**
 * Detects whether the project's `package.json` declares `react-native` as an
 * npm alias for `react-native-tvos` (e.g. `"react-native": "npm:react-native-tvos@0.83.0-0"`).
 *
 * The installed version reported from `node_modules/react-native/package.json` is the
 * upstream `react-native-tvos` version (`"0.83.0-0"`), so the alias is the only reliable
 * signal that this is a TV project.
 */
export function reactNativeTvPresentInPackageDependencies(
  dependencies: Record<string, string> | undefined
): boolean {
  const reactNativeSpec = dependencies?.['react-native'];
  return !!reactNativeSpec && reactNativeSpec.startsWith(`npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}`);
}

export async function correctReactNativeTvVersion(
  projectRoot: string,
  sdkVersion: string
): Promise<string> {
  const bundledNativeModules = await getVersionedNativeModulesAsync(projectRoot, sdkVersion);
  const version = bundledNativeModules[REACT_NATIVE_TVOS_PACKAGE_NAME];
  if (!version) {
    throw new Error(
      `This SDK version has no bundledNativeModules entry for ${REACT_NATIVE_TVOS_PACKAGE_NAME}`
    );
  }
  return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${version}`;
}

export async function modifyIncorrectDependenciesForTV(
  projectRoot: string,
  sdkVersion: string,
  incorrectDependencies: IncorrectDependency[]
) {
  const correctVersion = await correctReactNativeTvVersion(projectRoot, sdkVersion);
  const modifiedIncorrectDependencies: IncorrectDependency[] = [];
  incorrectDependencies.forEach((dep) => {
    if (dep.packageName === 'react-native') {
      modifiedIncorrectDependencies.push({
        ...dep,
        expectedVersionOrRange: correctVersion,
      });
    } else {
      modifiedIncorrectDependencies.push(dep);
    }
  });
  return modifiedIncorrectDependencies;
}
