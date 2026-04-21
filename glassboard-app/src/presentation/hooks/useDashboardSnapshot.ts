import { useEffect, useState } from 'react';

import { hasFirebaseConfig } from '../../data/firebase/config';
import { fetchDashboardSnapshot } from '../../data/firebase/firestoreService';
import { dashboardSnapshot } from '../../data/mock/dashboard';
import { AppUser } from '../../domain/auth';
import { DashboardSnapshot } from '../../domain/models';

const filterModulesForUser = (modules: DashboardSnapshot['modules'], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') {
    return modules;
  }

  return modules.filter((module) => currentUser.moduleIds.includes(module.id));
};

const filterTasksForUser = (tasks: DashboardSnapshot['checklist'], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') {
    return tasks;
  }

  return tasks.filter((task) => currentUser.moduleIds.includes(task.moduleId));
};

const filterHandoffsForUser = (
  handoffs: DashboardSnapshot['handoffs'],
  visibleModules: DashboardSnapshot['modules'],
  currentUser: AppUser,
) => {
  if (currentUser.role === 'org_head') {
    return handoffs;
  }

  const visibleModuleNames = new Set(visibleModules.map((module) => module.name));
  return handoffs.filter(
    (handoff) => visibleModuleNames.has(handoff.fromModule) || visibleModuleNames.has(handoff.toModule),
  );
};

const buildSnapshotForUser = (baseSnapshot: DashboardSnapshot, currentUser: AppUser): DashboardSnapshot => {
  const visibleModules = filterModulesForUser(baseSnapshot.modules, currentUser);

  return {
    modules: visibleModules,
    checklist: filterTasksForUser(baseSnapshot.checklist, currentUser),
    handoffs: filterHandoffsForUser(baseSnapshot.handoffs, visibleModules, currentUser),
    auditTrail: currentUser.role === 'org_head' ? baseSnapshot.auditTrail : [],
  };
};

type DashboardLoadState = {
  dataSource: 'mock' | 'live';
  snapshot: DashboardSnapshot;
  status: 'idle' | 'loading' | 'error';
};

export const useDashboardSnapshot = (currentUser: AppUser): DashboardLoadState => {
  const [state, setState] = useState<DashboardLoadState>({
    snapshot: buildSnapshotForUser(dashboardSnapshot, currentUser),
    dataSource: 'mock',
    status: 'idle',
  });

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!hasFirebaseConfig()) {
        if (!active) {
          return;
        }

        setState({
          snapshot: buildSnapshotForUser(dashboardSnapshot, currentUser),
          dataSource: 'mock',
          status: 'idle',
        });
        return;
      }

      try {
        setState((existingState) => ({ ...existingState, status: 'loading', dataSource: 'live' }));
        const liveSnapshot = await fetchDashboardSnapshot();

        if (!active) {
          return;
        }

        setState({
          snapshot: buildSnapshotForUser(liveSnapshot, currentUser),
          dataSource: 'live',
          status: 'idle',
        });
      } catch {
        if (!active) {
          return;
        }

        setState({
          snapshot: {
            modules: [],
            checklist: [],
            handoffs: [],
            auditTrail: [],
          },
          dataSource: 'live',
          status: 'error',
        });
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [currentUser]);

  return state;
};
