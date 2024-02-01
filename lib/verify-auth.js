import { execa } from "execa";
import normalizeUrl from "normalize-url";
import AggregateError from "aggregate-error";
import getError from "./get-error.js";
import getRegistry from "./get-registry.js";
import setNpmrcAuth from "./set-npmrc-auth.js";

export default async function (npmrc, pkg, context, packageManager) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = "https://registry.npmjs.org/", ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  await setNpmrcAuth(npmrc, registry, context);

  if (normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)) {
    try {
      const commandOptions = packageManager === 'npm'
        ? ["whoami", "--userconfig", npmrc, "--registry", registry]
        : ["whoami", "--registry", registry];
      console.log('>>', JSON.stringify(commandOptions));
      const whoamiResult = execa(packageManager, commandOptions, {
        cwd,
        env,
        preferLocal: true,
      });
      whoamiResult.stdout.pipe(stdout, { end: false });
      whoamiResult.stderr.pipe(stderr, { end: false });
      await whoamiResult;
    } catch(e) {
      console.log('!!', JSON.stringify(e));
      throw new AggregateError([getError("EINVALIDNPMTOKEN", { registry })]);
    }
  }
}
