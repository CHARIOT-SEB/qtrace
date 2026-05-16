import { memo } from 'react';
import { Card, Elevation, Intent, Tag } from '@blueprintjs/core';
import type { GuinierResult } from '../types/saxs';

interface Props {
  result: GuinierResult;
  pointsUsed: number;
}

function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? n.toFixed(d) : '—';
}

export const StatsRow = memo(function StatsRow({ result, pointsUsed }: Props) {
  const qrgIntent = !Number.isFinite(result.qRgMax)
    ? Intent.DANGER
    : result.qRgMax <= 1.3
      ? Intent.SUCCESS
      : result.qRgMax <= 1.5
        ? Intent.WARNING
        : Intent.DANGER;

  return (
    <div className="stats-grid">
      <Card elevation={Elevation.ONE} className="stat-card">
        <div className="stat-label">Rg</div>
        <div className="stat-value">
          {fmt(result.Rg, 2)}
          <span className="stat-unit">Å</span>
        </div>
      </Card>

      <Card elevation={Elevation.ONE} className="stat-card">
        <div className="stat-label">I(0)</div>
        <div className="stat-value">{fmt(result.I0, 2)}</div>
      </Card>

      <Card elevation={Elevation.ONE} className="stat-card">
        <div className="stat-label">q · Rg max</div>
        <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {fmt(result.qRgMax, 2)}
          <Tag intent={qrgIntent} minimal style={{ fontSize: 9 }}>
            {qrgIntent === Intent.SUCCESS ? 'OK' : qrgIntent === Intent.WARNING ? 'WARN' : 'BAD'}
          </Tag>
        </div>
      </Card>

      <Card elevation={Elevation.ONE} className="stat-card">
        <div className="stat-label">R²</div>
        <div className="stat-value">{fmt(result.fit.r2, 4)}</div>
      </Card>

      <Card elevation={Elevation.ONE} className="stat-card">
        <div className="stat-label">Points used</div>
        <div className="stat-value">{pointsUsed}</div>
      </Card>
    </div>
  );
})
