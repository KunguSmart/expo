import type { IncorrectDependency } from '../dependencies/validateDependenciesVersions';
import {
  correctReactNativeTvVersion,
  modifyIncorrectDependenciesForTV,
  reactNativeTvPresentInPackageDependencies,
} from '../reactNativeTv';

jest.mock('../dependencies/bundledNativeModules', () => ({
  getVersionedNativeModulesAsync: jest.fn(),
}));

const { getVersionedNativeModulesAsync } = jest.requireMock('../dependencies/bundledNativeModules');

const projectRoot = '/test-project';
const sdkVersion = '55.0.0';

const incorrectReactNativeDep: IncorrectDependency = {
  packageName: 'react-native',
  packageType: 'dependencies',
  expectedVersionOrRange: '0.85.3',
  actualVersion: '0.83.0-0',
};

const unrelatedIncorrectDep: IncorrectDependency = {
  packageName: 'expo-splash-screen',
  packageType: 'dependencies',
  expectedVersionOrRange: '~1.2.3',
  actualVersion: '1.0.0',
};

describe(reactNativeTvPresentInPackageDependencies, () => {
  it('returns true when react-native is aliased to react-native-tvos', () => {
    expect(
      reactNativeTvPresentInPackageDependencies({
        'react-native': 'npm:react-native-tvos@0.83.0-0',
      })
    ).toBe(true);
  });

  it('returns false when react-native is a plain version', () => {
    expect(reactNativeTvPresentInPackageDependencies({ 'react-native': '0.85.3' })).toBe(false);
  });

  it('returns false when react-native is aliased to a different package', () => {
    expect(
      reactNativeTvPresentInPackageDependencies({
        'react-native': 'npm:some-other-fork@1.2.3',
      })
    ).toBe(false);
  });

  it('returns false when react-native is missing from the dependency map', () => {
    expect(reactNativeTvPresentInPackageDependencies({ expo: '55.0.0' })).toBe(false);
  });

  it('returns false for an empty map', () => {
    expect(reactNativeTvPresentInPackageDependencies({})).toBe(false);
  });

  it('returns false when dependencies is undefined', () => {
    expect(reactNativeTvPresentInPackageDependencies(undefined)).toBe(false);
  });
});

describe(correctReactNativeTvVersion, () => {
  beforeEach(() => {
    jest.mocked(getVersionedNativeModulesAsync).mockReset();
  });

  it('returns an npm: specifier built from the bundled react-native-tvos version', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({
      'react-native': '0.85.3',
      'react-native-tvos': '0.85.3-0',
    });

    await expect(correctReactNativeTvVersion(projectRoot, sdkVersion)).resolves.toBe(
      'npm:react-native-tvos@0.85.3-0'
    );
    expect(getVersionedNativeModulesAsync).toHaveBeenCalledWith(projectRoot, sdkVersion);
  });

  it('throws when bundledNativeModules has no react-native-tvos entry', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({
      'react-native': '0.85.3',
    });

    await expect(correctReactNativeTvVersion(projectRoot, sdkVersion)).rejects.toThrow(
      /no bundledNativeModules entry for react-native-tvos/
    );
  });
});

describe(modifyIncorrectDependenciesForTV, () => {
  beforeEach(() => {
    jest.mocked(getVersionedNativeModulesAsync).mockReset();
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValue({
      'react-native': '0.85.3',
      'react-native-tvos': '0.85.3-0',
    });
  });

  it('rewrites only the react-native entry to point at react-native-tvos', async () => {
    const result = await modifyIncorrectDependenciesForTV(projectRoot, sdkVersion, [
      incorrectReactNativeDep,
      unrelatedIncorrectDep,
    ]);

    expect(result).toEqual([
      {
        ...incorrectReactNativeDep,
        expectedVersionOrRange: 'npm:react-native-tvos@0.85.3-0',
      },
      unrelatedIncorrectDep,
    ]);
  });

  it('preserves list length and order', async () => {
    const input = [unrelatedIncorrectDep, incorrectReactNativeDep];
    const result = await modifyIncorrectDependenciesForTV(projectRoot, sdkVersion, input);
    expect(result.map((d) => d.packageName)).toEqual(['expo-splash-screen', 'react-native']);
  });

  it('does not mutate the input array entries', async () => {
    const input: IncorrectDependency[] = [{ ...incorrectReactNativeDep }];
    const originalExpected = input[0].expectedVersionOrRange;
    await modifyIncorrectDependenciesForTV(projectRoot, sdkVersion, input);
    expect(input[0].expectedVersionOrRange).toBe(originalExpected);
  });

  it('propagates the error when no react-native-tvos entry is bundled', async () => {
    jest.mocked(getVersionedNativeModulesAsync).mockReset();
    jest.mocked(getVersionedNativeModulesAsync).mockResolvedValueOnce({
      'react-native': '0.85.3',
    });

    await expect(
      modifyIncorrectDependenciesForTV(projectRoot, sdkVersion, [incorrectReactNativeDep])
    ).rejects.toThrow(/no bundledNativeModules entry for react-native-tvos/);
  });
});
