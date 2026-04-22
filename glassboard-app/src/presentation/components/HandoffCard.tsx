import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppUser } from '../../domain/auth';
import { saveProofUrl, updateHandoffStatus, writeAuditEvent } from '../../data/firebase/firestoreService';
import { Handoff } from '../../domain/models';
import { colors, radius, spacing } from '../theme/tokens';

const handoffLabel: Record<Handoff['status'], string> = {
  ready: 'Ready to send',
  'awaiting-response': 'Awaiting response',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const statusColor: Record<Handoff['status'], string> = {
  ready: colors.textMuted,
  'awaiting-response': colors.warning,
  accepted: colors.success,
  rejected: colors.danger,
};

type ProofFile = {
  uri: string;
  name: string;
};

type Props = {
  handoff: Handoff;
  currentUser: AppUser;
  receiverModuleNames: Set<string>;
  onStatusChange: (handoffId: string, status: 'accepted' | 'rejected') => void;
};

export const HandoffCard = ({ handoff, currentUser, receiverModuleNames, onStatusChange }: Props) => {
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState<ProofFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAct =
    handoff.status === 'awaiting-response' &&
    currentUser.role === 'module_head' &&
    receiverModuleNames.has(handoff.toModule);

  const handlePickProof = async () => {
    setError(null);
    try {
      if (handoff.proofType === 'photo') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setProof({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg' });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setProof({ uri: asset.uri, name: asset.name });
        }
      }
    } catch {
      setError('Could not pick file. Please try again.');
    }
  };

  const handleAccept = async () => {
    if (!proof) {
      setError('Please attach proof before accepting.');
      return;
    }

    try {
      setBusy(true);
      setError(null);

      // Save local URI directly to Firestore (no upload needed)
      await saveProofUrl(handoff.id, proof.uri);
      await updateHandoffStatus(handoff.id, 'accepted');
      await writeAuditEvent({
        actor: currentUser.name,
        action: 'Accepted handoff with proof',
        target: `${handoff.fromModule} → ${handoff.toModule}`,
      });

      onStatusChange(handoff.id, 'accepted');
    } catch {
      setError('Failed to update handoff. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    try {
      setBusy(true);
      setError(null);

      await updateHandoffStatus(handoff.id, 'rejected');
      await writeAuditEvent({
        actor: currentUser.name,
        action: 'Rejected handoff',
        target: `${handoff.fromModule} → ${handoff.toModule}`,
      });

      onStatusChange(handoff.id, 'rejected');
    } catch {
      setError('Failed to reject handoff. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {handoff.fromModule} → {handoff.toModule}
          </Text>
          <Text style={styles.subtitle}>
            {handoff.artifact} • Proof: {handoff.proofType}
          </Text>
        </View>
        <Text style={[styles.status, { color: statusColor[handoff.status] }]}>
          {handoffLabel[handoff.status]}
        </Text>
      </View>

      <Text style={styles.meta}>
        Requested {handoff.requestedAt} • Due {handoff.dueAt}
      </Text>

      {canAct && (
        <View style={styles.actionArea}>
          <Pressable onPress={handlePickProof} style={styles.proofPicker} disabled={busy}>
            <Text style={styles.proofPickerText}>
              {proof ? `✓ ${proof.name}` : `Attach ${handoff.proofType === 'photo' ? 'photo' : 'document'} proof`}
            </Text>
          </Pressable>

          {busy ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={styles.actions}>
              <Pressable
                onPress={handleAccept}
                style={[styles.actionButton, styles.acceptButton]}
                disabled={busy}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                style={[styles.actionButton, styles.rejectButton]}
                disabled={busy}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: 4,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
  },
  actionArea: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  proofPicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  proofPickerText: {
    color: colors.accent,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptButton: {
    borderColor: colors.success,
    backgroundColor: 'rgba(125, 241, 167, 0.08)',
  },
  rejectButton: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 124, 114, 0.08)',
  },
  acceptText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});