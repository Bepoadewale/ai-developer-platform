import { InfoCard, Progress, StatusError, StatusOK } from '@backstage/core-components';
import { discoveryApiRef, fetchApiRef, useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useEffect, useState } from 'react';

type ScorecardCheck = {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  remediation: string;
};

type ScorecardResult = {
  status: 'READY' | 'BLOCKED';
  score: number;
  passed: number;
  total: number;
  checks: ScorecardCheck[];
};

export function ScorecardCard() {
  const { entity } = useEntity();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [result, setResult] = useState<ScorecardResult>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('platform-scorecards');
        const namespace = entity.metadata.namespace ?? 'default';
        const response = await fetchApi.fetch(
          `${baseUrl}/entities/${entity.kind.toLowerCase()}/${namespace}/${entity.metadata.name}`,
        );
        if (!response.ok) {
          throw new Error(`Scorecard request failed with ${response.status}`);
        }
        const value = (await response.json()) as ScorecardResult;
        if (mounted) {
          setResult(value);
        }
      } catch (cause) {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [discoveryApi, entity, fetchApi]);

  if (error) {
    return <InfoCard title="Production readiness">Scorecard unavailable: {error}</InfoCard>;
  }
  if (!result) {
    return <Progress />;
  }

  return (
    <InfoCard title="Production readiness">
      <p>
        {result.status === 'READY' ? <StatusOK /> : <StatusError />}
        {' '}
        <strong>{result.status}</strong> — {result.passed}/{result.total} controls passed ({result.score}%).
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {result.checks.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                {item.status === 'PASS' ? '✅' : '❌'} {item.title}
              </td>
              <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                <code>{item.evidence}</code>
                {item.status === 'FAIL' && <div>Remediation: {item.remediation}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </InfoCard>
  );
}
