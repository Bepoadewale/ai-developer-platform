import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint,
  parseEntityYaml,
  type DeferredEntity,
  type EntityProvider,
  type EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generatedCatalogEntities } from './platformMetrics';

const providerName = 'generated-service-catalog-provider';

class GeneratedServiceCatalogProvider implements EntityProvider {
  private connection?: EntityProviderConnection;

  constructor(
    private readonly outputRoot: string,
    private readonly logger: { info(message: string): void; warn(message: string): void },
  ) {}

  getProviderName(): string {
    return providerName;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.run();
  }

  async run(): Promise<void> {
    if (!this.connection) {
      return;
    }

    const entities: DeferredEntity[] = [];
    try {
      const entries = await fs.readdir(this.outputRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        const catalogInfoPath = path.join(
          this.outputRoot,
          entry.name,
          'catalog-info.yaml',
        );
        try {
          const contents = await fs.readFile(catalogInfoPath);
          for (const parsed of parseEntityYaml(contents, {
            type: 'generated-service',
            target: catalogInfoPath,
          })) {
            if (parsed.type === 'entity') {
              const generatedLocation = `file:${catalogInfoPath}`;
              entities.push({
                entity: {
                  ...parsed.entity,
                  metadata: {
                    ...parsed.entity.metadata,
                    annotations: {
                      ...parsed.entity.metadata.annotations,
                      'backstage.io/managed-by-location': generatedLocation,
                      'backstage.io/managed-by-origin-location': generatedLocation,
                    },
                  },
                },
                locationKey: providerName,
              });
            }
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            this.logger.warn(
              `Skipping generated catalog descriptor ${catalogInfoPath}: ${String(error)}`,
            );
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    await this.connection.applyMutation({ type: 'full', entities });
    generatedCatalogEntities.set(entities.length);
    this.logger.info(`Reconciled ${entities.length} generated catalog entities`);
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'generated-service-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ catalog, config, logger, scheduler }) {
        const configuredRoot = config.getOptionalString(
          'platform.generatedServiceRoot',
        );
        const provider = new GeneratedServiceCatalogProvider(
          path.resolve(process.cwd(), configuredRoot ?? 'generated'),
          logger,
        );
        catalog.addEntityProvider(provider);
        await scheduler.scheduleTask({
          id: 'generated-service-catalog-reconciliation',
          frequency: { seconds: 5 },
          timeout: { seconds: 30 },
          scope: 'local',
          fn: async () => provider.run(),
        });
      },
    });
  },
});
