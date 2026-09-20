import {
  coreServices,
  createBackendPlugin,
  resolveSafeChildPath,
} from '@backstage/backend-plugin-api';
import fs from 'node:fs/promises';
import path from 'node:path';

const serviceNamePattern = /^[a-z][a-z0-9-]{2,48}$/;

/**
 * Serves only generated catalog descriptors. This lets the Catalog consume a
 * real local HTTP Location without permitting arbitrary filesystem URLs.
 */
export default createBackendPlugin({
  pluginId: 'platform-assets',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
      },
      async init({ config, httpRouter }) {
        // The Catalog URL reader fetches registered locations without an
        // interactive browser identity. This is intentionally limited to the
        // validated, read-only catalog descriptor path below.
        httpRouter.addAuthPolicy({
          path: '/generated/:service/catalog-info.yaml',
          allow: 'unauthenticated',
        });
        const configuredRoot = config.getOptionalString(
          'platform.generatedServiceRoot',
        );
        const outputRoot = path.resolve(
          process.cwd(),
          configuredRoot ?? 'generated',
        );
        httpRouter.use(async (req, res, next) => {
          const match = req.path.match(
            /^\/generated\/([a-z][a-z0-9-]{2,48})\/catalog-info\.yaml$/,
          );
          if (!match) {
            next();
            return;
          }

          const service = match[1];
          if (!serviceNamePattern.test(service)) {
            res.status(400).json({ error: 'Invalid service name' });
            return;
          }
          const catalogInfoPath = resolveSafeChildPath(
            outputRoot,
            `${service}/catalog-info.yaml`,
          );
          try {
            await fs.access(catalogInfoPath);
            res.type('application/yaml').sendFile(catalogInfoPath);
          } catch {
            res.status(404).json({ error: 'Generated catalog descriptor not found' });
          }
        });
      },
    });
  },
});
