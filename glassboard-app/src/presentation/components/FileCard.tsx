import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SharedFile } from '../../domain/files';
import { colors, spacing, radius } from '../theme/tokens';

interface FileCardProps {
  file: SharedFile;
  onNewVersion?: (file: SharedFile) => void;
  canEdit?: boolean;
}

export const FileCard = ({ file, onNewVersion, canEdit }: FileCardProps) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.title}>{file.name}</Text>
          <Text style={styles.subtitle}>
            v{file.version} • {file.moduleFrom} → {file.moduleTo}
          </Text>
          <Text style={styles.meta}>
            Uploaded by {file.uploadedBy} on {new Date(file.uploadedAt).toLocaleDateString()}
          </Text>
        </View>
        {canEdit && onNewVersion && (
          <TouchableOpacity style={styles.editButton} onPress={() => onNewVersion(file)}>
            <Text style={styles.editButtonText}>New Version</Text>
          </TouchableOpacity>
        )}
      </View>

      {file.editHistory && file.editHistory.length > 0 && (
        <TouchableOpacity 
          style={styles.historyToggle} 
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide Edit History' : `View Edit History (${file.editHistory.length})`}
          </Text>
        </TouchableOpacity>
      )}

      {showHistory && (
        <View style={styles.historyContainer}>
          {file.editHistory.map((record, index) => (
            <View key={index} style={styles.historyRecord}>
              <Text style={styles.historyNote}>"{record.note}"</Text>
              <Text style={styles.historyMeta}>
                {record.editedBy} • {new Date(record.editedAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textDim,
  },
  editButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  editButtonText: {
    color: colors.background, // Dark text on the bright accent color
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyToggle: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyToggleText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: spacing.sm,
  },
  historyRecord: {
    backgroundColor: colors.surfaceStrong,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  historyNote: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
});