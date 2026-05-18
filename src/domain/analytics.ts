import { DashboardSnapshot, Handoff, TeamModule } from './models';

const countStates = (modules: TeamModule[]) => ({
  blocked: modules.filter((module) => module.state === 'blocked').length,
  atRisk: modules.filter((module) => module.state === 'at-risk').length,
  onTrack: modules.filter((module) => module.state === 'on-track').length,
});

const pendingHandoffs = (handoffs: Handoff[]) =>
  handoffs.filter((handoff) => handoff.status === 'ready' || handoff.status === 'awaiting-response').length;

export const createDashboardSummary = (snapshot: DashboardSnapshot) => {
  const stateCounts = countStates(snapshot.modules);
  const completedChecklistItems = snapshot.checklist.filter((item) => item.complete).length;
  const completionRate =
    snapshot.checklist.length === 0 ? 0 : Math.round((completedChecklistItems / snapshot.checklist.length) * 100);

  return {
    moduleCount: snapshot.modules.length,
    blockedModules: stateCounts.blocked,
    atRiskModules: stateCounts.atRisk,
    onTrackModules: stateCounts.onTrack,
    pendingHandoffs: pendingHandoffs(snapshot.handoffs),
    completionRate,
  };
};
