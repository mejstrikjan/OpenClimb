import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, Modal, TextInput, Keyboard, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ascent, ClimbingRoute } from '../types';
import { getAllAscents } from '../database/ascentRepository';
import { getRouteById } from '../database/routeRepository';
import { endActiveSession, getActiveSessionSummary, SessionSummary, startSession } from '../database/sessionRepository';
import { AscentCard } from '../components/AscentCard';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';

interface AscentWithRoute extends Ascent {
  routeName: string;
  routeGrade: string;
}

interface LogbookSection {
  title: string;
  dateKey: string;
  data: AscentWithRoute[];
}

export function LogbookScreen() {
  const [ascents, setAscents] = useState<AscentWithRoute[]>([]);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionNotes, setNewSessionNotes] = useState('');
  const [sessionModalKeyboardHeight, setSessionModalKeyboardHeight] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([loadAscents(), loadSession()]);
  };

  const loadAscents = async () => {
    const all = await getAllAscents();
    const routeCache: Record<string, ClimbingRoute | null> = {};
    const enriched: AscentWithRoute[] = [];
    for (const a of all) {
      if (!routeCache[a.route_id]) {
        routeCache[a.route_id] = await getRouteById(a.route_id);
      }
      const r = routeCache[a.route_id];
      enriched.push({
        ...a,
        routeName: r?.name ?? 'Smazaná cesta',
        routeGrade: r?.grade ?? '',
      });
    }
    setAscents(enriched);
  };

  const loadSession = async () => {
    const session = await getActiveSessionSummary();
    setActiveSession(session);
  };

  const handleSessionAction = async () => {
    if (activeSession) {
      await endActiveSession();
      await loadData();
      return;
    }
    setNewSessionName('');
    setNewSessionNotes('');
    setSessionModalVisible(true);
  };

  const handleStartSession = async () => {
    Keyboard.dismiss();
    await startSession({ name: newSessionName, notes: newSessionNotes });
    setSessionModalVisible(false);
    await loadData();
  };

  useEffect(() => {
    if (!sessionModalVisible) {
      setSessionModalKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setSessionModalKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setSessionModalKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [sessionModalVisible]);

  const closeSessionModal = useCallback(() => {
    Keyboard.dismiss();
    setSessionModalVisible(false);
  }, []);

  const sessionModalBottomInset = sessionModalKeyboardHeight > 0 ? sessionModalKeyboardHeight + 12 : 0;

  const sections: LogbookSection[] = ascents.reduce<LogbookSection[]>((grouped, ascent) => {
    const existingSection = grouped.find((section) => section.dateKey === ascent.date);
    if (existingSection) {
      existingSection.data.push(ascent);
      return grouped;
    }

    grouped.push({
      dateKey: ascent.date,
      title: formatSectionDate(ascent.date),
      data: [ascent],
    });
    return grouped;
  }, []);

  return (
    <View style={styles.container}>
      <SectionList
        ListHeaderComponent={
          <View style={styles.sessionPanel}>
            <View>
              <Text style={styles.sessionPanelTitle}>
                {activeSession ? 'Aktivní session' : 'Žádná aktivní session'}
              </Text>
              <Text style={styles.sessionPanelText}>
                {activeSession
                  ? `${activeSession.name} · ${activeSession.ascentCount} záznamů`
                  : 'Spusťte session a nové výstupy se do ní budou řadit automaticky.'}
              </Text>
              {activeSession?.notes ? <Text style={styles.sessionPanelNote}>{activeSession.notes}</Text> : null}
            </View>
            <TouchableOpacity style={styles.sessionButton} onPress={handleSessionAction}>
              <Text style={styles.sessionButtonText}>{activeSession ? 'Ukončit' : 'Spustit'}</Text>
            </TouchableOpacity>
          </View>
        }
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AscentCard
            ascent={item}
            routeName={item.routeName}
            routeGrade={item.routeGrade}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.route_id })}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.data.length} {section.data.length === 1 ? 'záznam' : section.data.length < 5 ? 'záznamy' : 'záznamů'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>Deník je prázdný</Text>
            <Text style={styles.emptySubtext}>Zaznamenejte svůj první výstup z detailu cesty</Text>
          </View>
        }
        contentContainerStyle={ascents.length === 0 ? styles.emptyList : styles.list}
        stickySectionHeadersEnabled={false}
      />
      <Modal
        visible={sessionModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSessionModal}
      >
        <View style={[styles.modalOverlay, { paddingBottom: sessionModalBottomInset }]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Spustit session</Text>
            <TextInput
              style={styles.modalInput}
              value={newSessionName}
              onChangeText={setNewSessionName}
              placeholder="Název session"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={newSessionNotes}
              onChangeText={setNewSessionNotes}
              placeholder="Poznámka k session"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={closeSessionModal}>
                <Text style={styles.modalSecondaryButtonText}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleStartSession}>
                <Text style={styles.modalPrimaryButtonText}>Spustit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatSectionDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: 8 },
  sessionPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sessionPanelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sessionPanelText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 220,
  },
  sessionPanelNote: {
    marginTop: 6,
    fontSize: 12,
    color: colors.primaryDark,
    maxWidth: 220,
  },
  sessionButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sessionButtonText: {
    color: colors.textOnDark,
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    paddingTop: 32,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
  },
  modalTextArea: {
    minHeight: 84,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: colors.textOnDark,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  sectionMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.textMuted },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});
