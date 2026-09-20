import type { Entity } from '@backstage/catalog-model';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import fs from 'fs-extra';
import path from 'node:path';

export type ScorecardCheck = {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  remediation: string;
};

export type ScorecardResult = {
  entityRef: string;
  status: 'READY' | 'BLOCKED';
  score: number;
  passed: number;
  total: number;
  checks: ScorecardCheck[];
};

const serviceNamePattern = /^[a-z][a-z0-9-]{2,48}$/;

async function fileContains(filePath: string, fragments: string[]): Promise<boolean> {
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    return fragments.every(fragment => contents.includes(fragment));
  } catch {
    return false;
  }
}

function entityString(entity: Entity, key: string): string | undefined {
  const value = (entity.spec as Record<string, unknown> | undefined)?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function evaluateEntity(
  entity: Entity,
  generatedRoot: string,
): Promise<ScorecardResult> {
  const annotations = entity.metadata.annotations ?? {};
  const serviceName = entity.metadata.name;
  const generatedPath = serviceNamePattern.test(serviceName)
    ? resolveSafeChildPath(generatedRoot, serviceName)
    : undefined;
  const check = (
    id: string,
    title: string,
    passed: boolean,
    evidence: string,
    remediation: string,
  ): ScorecardCheck => ({
    id,
    title,
    status: passed ? 'PASS' : 'FAIL',
    evidence,
    remediation,
  });

  const checks: ScorecardCheck[] = [
    check(
      'ownership',
      'Ownership is declared',
      Boolean(entityString(entity, 'owner')),
      entityString(entity, 'owner') ?? 'No spec.owner value found.',
      'Assign an owning Backstage group in spec.owner.',
    ),
    check(
      'system',
      'System relationship is declared',
      Boolean(entityString(entity, 'system')),
      entityString(entity, 'system') ?? 'No spec.system value found.',
      'Assign the component to a Backstage system in spec.system.',
    ),
    check(
      'techdocs',
      'TechDocs source is declared',
      Boolean(annotations['backstage.io/techdocs-ref']),
      annotations['backstage.io/techdocs-ref'] ?? 'No TechDocs annotation found.',
      'Add backstage.io/techdocs-ref and a MkDocs documentation source.',
    ),
    check(
      'health-contract',
      'Readiness contract is declared',
      annotations['platform.example/health-readiness'] === '/ready',
      annotations['platform.example/health-readiness'] ?? 'No readiness annotation found.',
      'Expose /ready and declare platform.example/health-readiness: /ready.',
    ),
    check(
      'generated-artifact',
      'Generated service artifact exists',
      Boolean(generatedPath && (await fs.pathExists(generatedPath))),
      generatedPath ?? 'Service name is not safe for generated artifact lookup.',
      'Create or import a service through an approved golden path.',
    ),
    check(
      'ci',
      'Service CI workflow exists',
      Boolean(
        generatedPath &&
          (await fs.pathExists(path.join(generatedPath, '.github/workflows/ci.yml'))),
      ),
      generatedPath
        ? `${path.join(generatedPath, '.github/workflows/ci.yml')}`
        : 'No generated workspace is available.',
      'Add a tested CI workflow for the service.',
    ),
    check(
      'docs',
      'Service documentation source exists',
      Boolean(
        generatedPath &&
          (await fs.pathExists(path.join(generatedPath, 'mkdocs.yml'))) &&
          (await fs.pathExists(path.join(generatedPath, 'docs/index.md'))),
      ),
      generatedPath ? 'Checked mkdocs.yml and docs/index.md.' : 'No generated workspace is available.',
      'Add mkdocs.yml and an owned service documentation page.',
    ),
    check(
      'health-implementation',
      'Health and readiness endpoints are implemented',
      Boolean(
        generatedPath &&
          (await fileContains(path.join(generatedPath, 'app/main.py'), [
            '"/health"',
            '"/ready"',
          ])),
      ),
      generatedPath ? 'Checked generated app/main.py.' : 'No generated workspace is available.',
      'Implement /health and /ready before marking the service production-ready.',
    ),
    check(
      'container-security',
      'Container runs as a non-root user',
      Boolean(
        generatedPath &&
          (await fileContains(path.join(generatedPath, 'Dockerfile'), ['USER 10001'])),
      ),
      generatedPath ? 'Checked generated Dockerfile for USER 10001.' : 'No generated workspace is available.',
      'Run the workload as a non-root user in the Dockerfile.',
    ),
    check(
      'deployment-security',
      'Deployment has safe workload defaults',
      Boolean(
        generatedPath &&
          (await fileContains(
            path.join(generatedPath, 'deploy/helm/service/templates/deployment.yaml'),
            ['runAsNonRoot: true', 'allowPrivilegeEscalation: false', 'resources:'],
          )),
      ),
      generatedPath
        ? 'Checked Helm deployment for non-root, privilege, and resource controls.'
        : 'No generated workspace is available.',
      'Add non-root, no-privilege-escalation, and resource request/limit defaults.',
    ),
  ];

  const passed = checks.filter(item => item.status === 'PASS').length;
  return {
    entityRef: `${entity.kind.toLowerCase()}:default/${serviceName}`,
    status: passed === checks.length ? 'READY' : 'BLOCKED',
    score: Math.round((passed / checks.length) * 100),
    passed,
    total: checks.length,
    checks,
  };
}
