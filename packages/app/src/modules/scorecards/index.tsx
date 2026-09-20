import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

const productionReadinessCard = EntityCardBlueprint.make({
  name: 'production-readiness',
  params: {
    filter: { kind: 'component' },
    loader: () =>
      import('./ScorecardCard').then(module => <module.ScorecardCard />),
  },
});

export const scorecardsModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [productionReadinessCard],
});
