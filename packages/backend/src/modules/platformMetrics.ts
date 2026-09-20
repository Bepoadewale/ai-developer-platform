import { coreServices, createBackendPlugin } from '@backstage/backend-plugin-api';
import { Counter, Gauge, Registry } from 'prom-client';

export const platformRegistry = new Registry();

export const templatePublications = new Counter({
  name: 'developer_platform_template_publications_total',
  help: 'Generated service workspaces successfully published by the local Scaffolder action.',
  labelNames: ['template'] as const,
  registers: [platformRegistry],
});

export const generatedCatalogEntities = new Gauge({
  name: 'developer_platform_generated_catalog_entities',
  help: 'Generated Backstage entities reconciled from the local generated-service workspace.',
  registers: [platformRegistry],
});

export const scorecardEvaluations = new Counter({
  name: 'developer_platform_scorecard_evaluations_total',
  help: 'Evidence-based readiness scorecard evaluations.',
  labelNames: ['status'] as const,
  registers: [platformRegistry],
});

export default createBackendPlugin({
  pluginId: 'platform-metrics',
  register(env) {
    env.registerInit({
      deps: { httpRouter: coreServices.httpRouter },
      async init({ httpRouter }) {
        httpRouter.addAuthPolicy({ path: '/metrics', allow: 'unauthenticated' });
        httpRouter.use(async (req, res, next) => {
          if (req.path !== '/metrics') {
            next();
            return;
          }
          res.setHeader('Content-Type', platformRegistry.contentType);
          res.send(await platformRegistry.metrics());
        });
      },
    });
  },
});
