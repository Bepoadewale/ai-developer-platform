import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import type { Entity } from '@backstage/catalog-model';
import { evaluateEntity } from './scorecardEvaluator';

const root = path.join(os.tmpdir(), `scorecard-evaluator-${process.pid}`);

const generatedEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'payments-api',
    annotations: {
      'backstage.io/techdocs-ref': 'dir:.',
      'platform.example/health-readiness': '/ready',
    },
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'group:default/team-payments',
    system: 'system:default/commerce',
  },
};

async function writeCompliantService(): Promise<void> {
  const service = path.join(root, 'payments-api');
  await fs.outputFile(path.join(service, '.github/workflows/ci.yml'), 'name: ci\n');
  await fs.outputFile(path.join(service, 'mkdocs.yml'), 'site_name: Payments\n');
  await fs.outputFile(path.join(service, 'docs/index.md'), '# Payments\n');
  await fs.outputFile(
    path.join(service, 'app/main.py'),
    '@app.get("/health")\n@app.get("/ready")\n',
  );
  await fs.outputFile(path.join(service, 'Dockerfile'), 'USER 10001\n');
  await fs.outputFile(
    path.join(service, 'deploy/helm/service/templates/deployment.yaml'),
    'runAsNonRoot: true\nallowPrivilegeEscalation: false\nresources:\n',
  );
}

beforeEach(async () => {
  await fs.remove(root);
  await writeCompliantService();
});

afterAll(async () => {
  await fs.remove(root);
});

describe('evaluateEntity', () => {
  it('marks a golden-path service ready when required evidence exists', async () => {
    const result = await evaluateEntity(generatedEntity, root);

    expect(result.status).toBe('READY');
    expect(result.score).toBe(100);
    expect(result.checks.every(check => check.status === 'PASS')).toBe(true);
  });

  it('blocks a service after readiness metadata drifts', async () => {
    const drifted: Entity = {
      ...generatedEntity,
      metadata: {
        ...generatedEntity.metadata,
        annotations: { 'backstage.io/techdocs-ref': 'dir:.' },
      },
    };

    const result = await evaluateEntity(drifted, root);

    expect(result.status).toBe('BLOCKED');
    expect(result.checks.find(check => check.id === 'health-contract')).toMatchObject({
      status: 'FAIL',
      remediation: expect.stringContaining('/ready'),
    });
  });

  it('blocks a legacy component without generated-service evidence', async () => {
    const legacy: Entity = {
      ...generatedEntity,
      metadata: { name: 'legacy-api' },
      spec: {
        ...generatedEntity.spec,
        owner: 'team-payments',
        system: 'commerce',
      },
    };

    const result = await evaluateEntity(legacy, root);

    expect(result.status).toBe('BLOCKED');
    expect(result.checks.find(check => check.id === 'generated-artifact')).toMatchObject({
      status: 'FAIL',
    });
  });
});
