import {
  coreServices,
  createBackendModule,
  resolveSafeChildPath,
} from '@backstage/backend-plugin-api';
import {
  createTemplateAction,
  scaffolderActionsExtensionPoint,
} from '@backstage/plugin-scaffolder-node';
import { stringifyEntityRef } from '@backstage/catalog-model';
import fs from 'fs-extra';
import path from 'node:path';
import { templatePublications } from './platformMetrics';

const serviceNamePattern = /^[a-z][a-z0-9-]{2,48}$/;

function createLocalPublishAction({ outputRoot }: { outputRoot: string }) {
  return createTemplateAction({
    id: 'platform:publishLocal',
    description:
      'Persists a generated service into the configured local developer-platform workspace.',
    schema: {
      input: {
        name: z =>
          z.string({
            description: 'Validated service name used as the generated directory name.',
          }),
      },
      output: {
        servicePath: z => z.string(),
        catalogInfoUrl: z => z.string(),
        entityRef: z => z.string(),
      },
    },
    async handler(ctx) {
      if (!serviceNamePattern.test(ctx.input.name)) {
        throw new Error('Service name is not safe for a local generated workspace');
      }

      const servicePath = resolveSafeChildPath(outputRoot, ctx.input.name);
      if (await fs.pathExists(servicePath)) {
        throw new Error(
          `Generated service already exists at ${servicePath}; choose a new name or clean the local workspace.`,
        );
      }

      await fs.ensureDir(outputRoot);
      await fs.copy(ctx.workspacePath, servicePath, {
        errorOnExist: true,
        preserveTimestamps: true,
      });

      const catalogInfoPath = path.join(servicePath, 'catalog-info.yaml');
      if (!(await fs.pathExists(catalogInfoPath))) {
        await fs.remove(servicePath);
        throw new Error('Generated service is missing catalog-info.yaml');
      }

      ctx.output('servicePath', servicePath);
      ctx.output('catalogInfoUrl', 'catalog://generated-service-provider');
      ctx.output(
        'entityRef',
        stringifyEntityRef({
          kind: 'Component',
          namespace: 'default',
          name: ctx.input.name,
        }),
      );
      templatePublications.inc({ template: 'local-golden-path' });
      ctx.logger.info(`Published generated service to ${servicePath}`);
    },
  });
}

export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'platform-local-publish',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        scaffolder: scaffolderActionsExtensionPoint,
      },
      async init({ config, scaffolder }) {
        const configuredRoot = config.getOptionalString(
          'platform.generatedServiceRoot',
        );
        const outputRoot = path.resolve(
          process.cwd(),
          configuredRoot ?? 'generated',
        );
        scaffolder.addActions(
          createLocalPublishAction({ outputRoot }),
        );
      },
    });
  },
});
