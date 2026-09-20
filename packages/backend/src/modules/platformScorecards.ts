import { coreServices, createBackendPlugin } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import path from 'node:path';
import { evaluateEntity } from './scorecardEvaluator';
import { scorecardEvaluations } from './platformMetrics';

const entitySegment = /^[a-z][a-z0-9-]{0,62}$/;

export default createBackendPlugin({
  pluginId: 'platform-scorecards',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ catalog, config, httpAuth, httpRouter }) {
        const configuredRoot = config.getOptionalString(
          'platform.generatedServiceRoot',
        );
        const generatedRoot = path.resolve(
          process.cwd(),
          configuredRoot ?? 'generated',
        );

        httpRouter.use(async (req, res, next) => {
          const match = req.path.match(
            /^\/entities\/([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)$/,
          );
          if (!match) {
            next();
            return;
          }
          const [, kind, namespace, name] = match;
          if (![kind, namespace, name].every(value => entitySegment.test(value))) {
            res.status(400).json({ error: 'Invalid entity reference' });
            return;
          }

          const credentials = await httpAuth.credentials(req, { allow: ['user'] });
          const entity = await catalog.getEntityByRef(
            `${kind}:${namespace}/${name}`,
            { credentials },
          );
          if (!entity) {
            res.status(404).json({ error: 'Catalog entity not found' });
            return;
          }
          const result = await evaluateEntity(entity, generatedRoot);
          scorecardEvaluations.inc({ status: result.status });
          res.json(result);
        });
      },
    });
  },
});
