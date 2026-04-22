<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppSession } from '../../app/session/useAppSession';
import { AppUser } from '../../domain/auth';
import { createDashboardSummary } from '../../domain/analytics';
import { ChecklistItem, Handoff, TeamModule } from '../../domain/models';
import { MetricCard } from '../components/MetricCard';
import { SectionCard } from '../components/SectionCard';
import { useDashboardSnapshot } from '../hooks/useDashboardSnapshot';
=======
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { AppUser } from '../../domain/auth';
import { getFirebaseDb, hasFirebaseConfig } from '../../data/firebase/config';
import { dashboardSnapshot } from '../../data/mock/dashboard';
import { createDashboardSummary } from '../../domain/analytics';
import { AuditEvent, ChecklistItem, DashboardSnapshot, Handoff, TeamModule } from '../../domain/models';
import {
  AuditEventDocument,
  HandoffDocument,
  ModuleDocument,
  TaskDocument,
  collections,
} from '../../domain/database';
import { HandoffCard } from '../components/HandoffCard';
import { MetricCard } from '../components/MetricCard';
import { SectionCard } from '../components/SectionCard';
>>>>>>> Stashed changes
import { colors, radius, spacing, typography } from '../theme/tokens';

const stateLabel: Record<TeamModule['state'], string> = {
  'on-track': 'On track',
  'at-risk': 'At risk',
  blocked: 'Blocked',
  'pending-review': 'Pending review',
};

<<<<<<< Updated upstream
const handoffLabel: Record<Handoff['status'], string> = {
  ready: 'Ready to send',
  'awaiting-response': 'Awaiting response',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

=======
>>>>>>> Stashed changes
const checklistTone: Record<ChecklistItem['priority'], string> = {
  low: colors.textMuted,
  medium: colors.warning,
  high: colors.danger,
};

type HomeScreenProps = {
  currentUser: AppUser;
<<<<<<< Updated upstream
};

type HomeTab = 'overview' | 'handoffs' | 'audit';

const homeTabs: { key: HomeTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'handoffs', label: 'Handoffs' },
  { key: 'audit', label: 'Audit' },
];

=======
  onSignOut: () => void;
  onNavigateFiles: () => void; // Added new prop here
};

>>>>>>> Stashed changes
const roleLabel: Record<AppUser['role'], string> = {
  member: 'Team Member',
  module_head: 'Module Head',
  org_head: 'Organization Head',
};

<<<<<<< Updated upstream
export const HomeScreen = ({ currentUser }: HomeScreenProps) => {
  const { signOutCurrentUser } = useAppSession();
  const [activeTab, setActiveTab] = useState<HomeTab>('overview');
  const { snapshot, dataSource, status } = useDashboardSnapshot(currentUser);

  const summary = createDashboardSummary(snapshot);
  const isUsingMockData = dataSource === 'mock';
  const hasLiveData =
    snapshot.modules.length > 0 ||
    snapshot.checklist.length > 0 ||
    snapshot.handoffs.length > 0 ||
    snapshot.auditTrail.length > 0;
  const canSeeAudit = currentUser.role === 'org_head';

  useEffect(() => {
    if (activeTab === 'audit' && !canSeeAudit) {
      setActiveTab('overview');
    }
  }, [activeTab, canSeeAudit]);

  const renderOverviewTab = () => (
    <>
      <View style={styles.metricGrid}>
        <MetricCard label="Modules" value={String(summary.moduleCount)} />
        <MetricCard label="Blocked" value={String(summary.blockedModules)} tone="danger" />
        <MetricCard label="Pending handoffs" value={String(summary.pendingHandoffs)} tone="warning" />
        <MetricCard label="Checklist completion" value={`${summary.completionRate}%`} tone="success" />
      </View>

      <SectionCard
        title="Module Progress"
        subtitle="Each module owns its checklist, updates progress, and exposes only the context needed for the next handoff."
      >
        {snapshot.modules.length === 0 ? (
          <Text style={styles.metadataText}>
            {isUsingMockData ? 'Demo modules will appear here.' : 'No modules found in Firestore yet.'}
          </Text>
        ) : null}
        {snapshot.modules.map((module) => (
          <View key={module.id} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={styles.rowTitleBlock}>
                <Text style={styles.rowTitle}>{module.name}</Text>
                <Text style={styles.rowSubtitle}>
                  Owner: {module.owner}
                  {module.nextDependency ? `  •  Next: ${module.nextDependency}` : ''}
                </Text>
              </View>
              <Text style={styles.progressValue}>{module.progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${module.progress}%` }]} />
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataText}>{stateLabel[module.state]}</Text>
              <Text style={styles.metadataText}>
                {module.openTasks} open tasks • {module.blockers} blockers
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard
        title="Checklist Focus"
        subtitle="A lightweight checklist system keeps each team honest before they can initiate the next module handoff."
      >
        {snapshot.checklist.length === 0 ? (
          <Text style={styles.metadataText}>
            {isUsingMockData ? 'Demo checklist items will appear here.' : 'No task records found in Firestore yet.'}
          </Text>
        ) : null}
        {snapshot.checklist.map((item) => (
          <View key={item.id} style={styles.checklistRow}>
            <View style={[styles.checkIcon, item.complete ? styles.checkIconDone : styles.checkIconPending]}>
              <Text style={styles.checkIconText}>{item.complete ? 'OK' : '!'}</Text>
            </View>
            <View style={styles.rowTitleBlock}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={[styles.rowSubtitle, { color: checklistTone[item.priority] }]}>
                Priority: {item.priority.toUpperCase()} • Module: {item.moduleId}
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </>
  );

  const renderHandoffsTab = () => (
    <SectionCard
      title="Digital Handshakes"
      subtitle="Every transition is explicit: sender, receiver, proof of delivery, deadline, and response state."
    >
      {snapshot.handoffs.length === 0 ? (
        <Text style={styles.metadataText}>
          {isUsingMockData ? 'Demo handoffs will appear here.' : 'No handoff records found in Firestore yet.'}
        </Text>
      ) : null}
      {snapshot.handoffs.map((handoff) => (
        <View key={handoff.id} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitleBlock}>
              <Text style={styles.rowTitle}>
                {handoff.fromModule} → {handoff.toModule}
              </Text>
              <Text style={styles.rowSubtitle}>
                {handoff.artifact} • Proof: {handoff.proofType}
              </Text>
            </View>
            <Text style={styles.handoffStatus}>{handoffLabel[handoff.status]}</Text>
          </View>
          <Text style={styles.metadataText}>Requested {handoff.requestedAt} • Due {handoff.dueAt}</Text>
        </View>
      ))}
    </SectionCard>
  );

  const renderAuditTab = () => (
    <SectionCard
      title="Leadership Audit View"
      subtitle="Organization heads get the full trail without exposing unrelated sensitive detail across teams."
    >
      {snapshot.auditTrail.length === 0 ? (
        <Text style={styles.metadataText}>
          {isUsingMockData
            ? 'Demo audit events will appear here for organization heads.'
            : 'Audit events will appear here for organization heads once the Firestore collection is populated.'}
        </Text>
      ) : null}
      {snapshot.auditTrail.map((event) => (
        <View key={event.id} style={styles.auditRow}>
          <Text style={styles.auditActor}>{event.actor}</Text>
          <Text style={styles.auditText}>
            {event.action} on {event.target}
          </Text>
          <Text style={styles.auditTime}>{event.timestamp}</Text>
        </View>
      ))}
    </SectionCard>
  );
=======
const filterModulesForUser = (modules: TeamModule[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return modules;
  return modules.filter((m) => currentUser.moduleIds.includes(m.id));
};

const filterTasksForUser = (tasks: ChecklistItem[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return tasks;
  return tasks.filter((t) => currentUser.moduleIds.includes(t.moduleId));
};

const filterHandoffsForUser = (handoffs: Handoff[], visibleModules: TeamModule[], currentUser: AppUser) => {
  if (currentUser.role === 'org_head') return handoffs;
  const visibleNames = new Set(visibleModules.map((m) => m.name));
  return handoffs.filter((h) => visibleNames.has(h.fromModule) || visibleNames.has(h.toModule));
};

const buildSnapshotForUser = (base: DashboardSnapshot, currentUser: AppUser): DashboardSnapshot => {
  const visibleModules = filterModulesForUser(base.modules, currentUser);
  return {
    modules: visibleModules,
    checklist: filterTasksForUser(base.checklist, currentUser),
    handoffs: filterHandoffsForUser(base.handoffs, visibleModules, currentUser),
    auditTrail: currentUser.role === 'org_head' ? base.auditTrail : [],
  };
};

export const HomeScreen = ({ currentUser, onSignOut, onNavigateFiles }: HomeScreenProps) => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() =>
    buildSnapshotForUser(dashboardSnapshot, currentUser),
  );
  const [dataSource, setDataSource] = useState<'mock' | 'live'>('mock');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const liveData = useRef<{
    modules: TeamModule[];
    checklist: ChecklistItem[];
    handoffs: Handoff[];
    auditTrail: AuditEvent[];
  }>({
    modules: dashboardSnapshot.modules,
    checklist: dashboardSnapshot.checklist,
    handoffs: dashboardSnapshot.handoffs,
    auditTrail: dashboardSnapshot.auditTrail,
  });

  const rebuildSnapshot = () => {
    setSnapshot(buildSnapshotForUser(liveData.current, currentUser));
  };

  useEffect(() => {
    if (!hasFirebaseConfig()) return;

    setStatus('loading');
    const db = getFirebaseDb();
    let resolvedCount = 0;
    const totalListeners = 4;

    const onReady = () => {
      resolvedCount += 1;
      if (resolvedCount === totalListeners) {
        setStatus('idle');
        setDataSource('live');
      }
    };

    const unsubModules = onSnapshot(
      query(collection(db, collections.modules), orderBy('name')),
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as ModuleDocument) as unknown as TeamModule[];
        liveData.current.modules = docs.length > 0 ? docs : dashboardSnapshot.modules;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubTasks = onSnapshot(
      query(collection(db, collections.tasks), orderBy('priority')),
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as TaskDocument) as unknown as ChecklistItem[];
        liveData.current.checklist = docs.length > 0 ? docs : dashboardSnapshot.checklist;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubHandoffs = onSnapshot(
      query(collection(db, collections.handoffs), orderBy('requestedAt', 'desc')),
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as HandoffDocument) as unknown as Handoff[];
        liveData.current.handoffs = docs.length > 0 ? docs : dashboardSnapshot.handoffs;
        rebuildSnapshot();
        onReady();
      },
      () => { setStatus('error'); onReady(); },
    );

    const unsubAudit = currentUser.role === 'org_head'
      ? onSnapshot(
          query(collection(db, collections.auditEvents), orderBy('timestamp', 'desc')),
          (snap) => {
            liveData.current.auditTrail = snap.docs.map((d) => d.data() as AuditEvent);
            rebuildSnapshot();
            onReady();
          },
          () => { setStatus('error'); onReady(); },
        )
      : (() => { onReady(); return () => {}; })();

    return () => {
      unsubModules();
      unsubTasks();
      unsubHandoffs();
      unsubAudit();
    };
  }, [currentUser]);

  const receiverModuleNames = useMemo(
    () => new Set(snapshot.modules.map((m) => m.name)),
    [snapshot.modules],
  );

  const handleHandoffStatusChange = (_handoffId: string, _status: 'accepted' | 'rejected') => {};

  const summary = createDashboardSummary(snapshot);
>>>>>>> Stashed changes

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
<<<<<<< Updated upstream
        <View style={styles.heroShell}>
          <View style={styles.heroGlow} />
          <View style={styles.hero}>
=======
        <View style={styles.hero}>
>>>>>>> Stashed changes
          <Text style={styles.brand}>GLASSBOARD</Text>
          <View style={styles.sessionBar}>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionRole}>{roleLabel[currentUser.role]}</Text>
              <Text style={styles.sessionEmail}>{currentUser.email}</Text>
            </View>
<<<<<<< Updated upstream
            <Text onPress={signOutCurrentUser} style={styles.signOut}>
=======
            <Text onPress={onSignOut} style={styles.signOut}>
>>>>>>> Stashed changes
              Sign out
            </Text>
          </View>
          <Text style={styles.heroCopy}>
            Track every cross-team handoff with proof, timestamps, and visible accountability before small delays
            turn into organization-wide blind spots.
          </Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
<<<<<<< Updated upstream
              {isUsingMockData
                ? 'Demo mode with local sample data for module health, handoffs, and audit history'
                : hasLiveData
                  ? 'Live Firestore data connected for dashboard activity'
                  : 'Live Firestore connected. Add records to see the dashboard populate.'}
            </Text>
          </View>
          {!isUsingMockData && status === 'loading' ? <Text style={styles.statusText}>Syncing dashboard from Firestore...</Text> : null}
          {!isUsingMockData && status === 'error' ? (
            <Text style={styles.statusError}>Firestore sync failed. Check your Firebase config, auth, or collection rules.</Text>
          ) : null}
        </View>
        </View>

        <View style={styles.tabBar}>
          {homeTabs
            .filter((tab) => canSeeAudit || tab.key !== 'audit')
            .map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabChip, activeTab === tab.key ? styles.tabChipActive : undefined]}
              >
                <Text style={[styles.tabChipText, activeTab === tab.key ? styles.tabChipTextActive : undefined]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
        </View>

        {activeTab === 'overview' ? renderOverviewTab() : null}
        {activeTab === 'handoffs' ? renderHandoffsTab() : null}
        {activeTab === 'audit' ? renderAuditTab() : null}
=======
              {dataSource === 'live'
                ? '⬤  Live — syncing in real time from Firestore'
                : 'Mobile command view for module health, handoffs, and audit history'}
            </Text>
          </View>
          {status === 'loading' ? <Text style={styles.statusText}>Connecting to Firestore...</Text> : null}
          {status === 'error' ? <Text style={styles.statusError}>Firestore sync failed, showing local mock data.</Text> : null}
        </View>

        {/* New Shared Files Navigation Button */}
        <TouchableOpacity style={styles.filesButton} onPress={onNavigateFiles} activeOpacity={0.7}>
          <Text style={styles.filesButtonText}>Browse Shared Files</Text>
          <Text style={styles.filesButtonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.metricGrid}>
          <MetricCard label="Modules" value={String(summary.moduleCount)} />
          <MetricCard label="Blocked" value={String(summary.blockedModules)} tone="danger" />
          <MetricCard label="Pending handoffs" value={String(summary.pendingHandoffs)} tone="warning" />
          <MetricCard label="Checklist completion" value={`${summary.completionRate}%`} tone="success" />
        </View>

        <SectionCard
          title="Module Progress"
          subtitle="Each module owns its checklist, updates progress, and exposes only the context needed for the next handoff."
        >
          {snapshot.modules.map((module) => (
            <View key={module.id} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <View style={styles.rowTitleBlock}>
                  <Text style={styles.rowTitle}>{module.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    Owner: {module.owner}
                    {module.nextDependency ? `  •  Next: ${module.nextDependency}` : ''}
                  </Text>
                </View>
                <Text style={styles.progressValue}>{module.progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${module.progress}%` }]} />
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataText}>{stateLabel[module.state]}</Text>
                <Text style={styles.metadataText}>
                  {module.openTasks} open tasks • {module.blockers} blockers
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Digital Handshakes"
          subtitle="Every transition is explicit: sender, receiver, proof of delivery, deadline, and response state."
        >
          {snapshot.handoffs.map((handoff) => (
            <HandoffCard
              key={handoff.id}
              handoff={handoff}
              currentUser={currentUser}
              receiverModuleNames={receiverModuleNames}
              onStatusChange={handleHandoffStatusChange}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Checklist Focus"
          subtitle="A lightweight checklist system keeps each team honest before they can initiate the next module handoff."
        >
          {snapshot.checklist.map((item) => (
            <View key={item.id} style={styles.checklistRow}>
              <View style={[styles.checkIcon, item.complete ? styles.checkIconDone : styles.checkIconPending]}>
                <Text style={styles.checkIconText}>{item.complete ? 'OK' : '!'}</Text>
              </View>
              <View style={styles.rowTitleBlock}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: checklistTone[item.priority] }]}>
                  Priority: {item.priority.toUpperCase()} • Module: {item.moduleId}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Leadership Audit View"
          subtitle="Organization heads get the full trail without exposing unrelated sensitive detail across teams."
        >
          {snapshot.auditTrail.length === 0 ? (
            <Text style={styles.metadataText}>
              Audit events will appear here for organization heads once the collection is added.
            </Text>
          ) : null}
          {snapshot.auditTrail.map((event) => (
            <View key={event.id} style={styles.auditRow}>
              <Text style={styles.auditActor}>{event.actor}</Text>
              <Text style={styles.auditText}>
                {event.action} on {event.target}
              </Text>
              <Text style={styles.auditTime}>{event.timestamp}</Text>
            </View>
          ))}
        </SectionCard>
>>>>>>> Stashed changes
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 12,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
<<<<<<< Updated upstream
  heroShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 226, 255, 0.14)',
  },
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
  },
=======
  hero: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  // --- New Styles for Shared Files Button ---
  filesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  filesButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  filesButtonArrow: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  // ------------------------------------------
>>>>>>> Stashed changes
  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  sessionMeta: {
    gap: 2,
  },
  sessionRole: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sessionEmail: {
    color: colors.textMuted,
    fontSize: 14,
  },
  signOut: {
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
<<<<<<< Updated upstream
    backgroundColor: colors.surfaceStrong,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 1.1,
=======
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 1.5,
>>>>>>> Stashed changes
    fontFamily: typography.display,
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 25,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
<<<<<<< Updated upstream
    backgroundColor: colors.surfaceElevated,
=======
    backgroundColor: colors.surfaceStrong,
>>>>>>> Stashed changes
  },
  heroBadgeText: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 0.4,
  },
<<<<<<< Updated upstream
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accentStrong,
  },
  tabChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  tabChipTextActive: {
    color: colors.textPrimary,
  },
=======
>>>>>>> Stashed changes
  statusText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  statusError: {
    color: colors.warning,
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.sm,
<<<<<<< Updated upstream
    borderWidth: 1,
    borderColor: colors.border,
=======
>>>>>>> Stashed changes
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowTitleBlock: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  progressValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
<<<<<<< Updated upstream
    backgroundColor: colors.accentStrong,
=======
    backgroundColor: colors.accent,
>>>>>>> Stashed changes
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metadataText: {
    color: colors.textDim,
    fontSize: 12,
    flexShrink: 1,
  },
<<<<<<< Updated upstream
  handoffStatus: {
    color: colors.warning,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: 4,
  },
=======
>>>>>>> Stashed changes
  checklistRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  checkIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkIconDone: {
    backgroundColor: 'rgba(125, 241, 167, 0.1)',
    borderColor: colors.success,
  },
  checkIconPending: {
    backgroundColor: 'rgba(255, 124, 114, 0.08)',
    borderColor: colors.danger,
  },
  checkIconText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  auditRow: {
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  auditActor: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  auditText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  auditTime: {
    color: colors.textDim,
    fontSize: 12,
  },
<<<<<<< Updated upstream
});
=======
});
>>>>>>> Stashed changes
