import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { fileService } from '../../data/firebase/fileService';
import { SharedFile } from '../../domain/files';
import { FileCard } from '../components/FileCard';
import { colors, spacing, radius } from '../theme/tokens';
import { UserDocument } from '../../domain/database';

interface FilesScreenProps {
  user: UserDocument;
  onBack: () => void;
}

export const FilesScreen = ({ user, onBack }: FilesScreenProps) => {
  const [files, setFiles] = useState<SharedFile[]>([]);

  useEffect(() => {
    // Subscribe to files where this user's module is involved
    const unsub = fileService.subscribeToModuleFiles(user.moduleIds || [], setFiles);
    return () => unsub();
  }, [user.moduleIds]);

  const handleUploadNewFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];
        
        await fileService.uploadFileMetadata({
          name: fileAsset.name,
          uri: fileAsset.uri,
          moduleFrom: user.moduleIds[0] || 'Unassigned',
          moduleTo: 'Org', // Defaulting to Org, could be made selectable later
          uploadedBy: user.name,
          uploadedAt: Date.now(),
          version: 1,
          editHistory: []
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick or upload file');
    }
  };

  const handleNewVersion = async (file: SharedFile) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];
        
        await fileService.updateFileVersion(
          file.id,
          {
            editedBy: user.name,
            editedAt: Date.now(),
            note: 'Updated file version', // Hardcoded note for now to keep UI simple
          },
          fileAsset.uri
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update file');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shared Files</Text>
      </View>
      
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileCard 
            file={item} 
            // Only allow module heads or org heads to upload new versions
            canEdit={user.role === 'module_head' || user.role === 'org_head'} 
            onNewVersion={handleNewVersion} 
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No files shared with your modules yet.</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={handleUploadNewFile}>
        <Text style={styles.fabText}>+ Share File</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: spacing.xl * 1.5, // Padding for safe area / status bar
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  backButton: {
    marginRight: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xs,
  },
  backText: { 
    color: colors.accent, 
    fontWeight: '600',
    fontSize: 16
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: colors.textPrimary 
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 4, // Extra space at bottom so FAB doesn't block the last item
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: spacing.xl, 
    color: colors.textDim 
  },
  fab: { 
    position: 'absolute', 
    bottom: spacing.xl, 
    right: spacing.md, 
    backgroundColor: colors.accent, 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md, 
    borderRadius: radius.pill,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { 
    color: colors.background, 
    fontWeight: 'bold',
    fontSize: 16
  }
});