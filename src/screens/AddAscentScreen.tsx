import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AscentCategory, AscentStyle, ASCENT_CATEGORIES, ClimbingSession } from '../types';
import { insertAscent, getAscentById, updateAscent } from '../database/ascentRepository';
import { getRouteById } from '../database/routeRepository';
import { getActiveSessionSummary, getRecentSessions, SessionSummary } from '../database/sessionRepository';
import { AscentStylePicker } from '../components/AscentStylePicker';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';

export function AddAscentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddAscent'>>();
  const { routeId, ascentId } = route.params;
  const isEditing = !!ascentId;

  const [routeName, setRouteName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [style, setStyle] = useState<AscentStyle>('redpoint');
  const [category, setCategory] = useState<AscentCategory>('');
  const [success, setSuccess] = useState(true);
  const [notes, setNotes] = useState('');
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null);
  const [availableSessions, setAvailableSessions] = useState<ClimbingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    getRouteById(routeId).then((r) => {
      if (r) setRouteName(`${r.name} (${r.grade})`);
    });
    Promise.all([getActiveSessionSummary(), getRecentSessions(5)]).then(([active, recent]) => {
      setActiveSession(active);
      setAvailableSessions(
        recent.filter((session, index, array) => array.findIndex((item) => item.id === session.id) === index)
      );
      if (!ascentId) {
        setSelectedSessionId(active?.id ?? null);
      }
    });
    if (ascentId) {
      getAscentById(ascentId).then((a) => {
        if (a) {
          setDate(a.date);
          setStyle(a.style);
          setCategory(a.category);
          setSelectedSessionId(a.session_id);
          setSuccess(a.success);
          setNotes(a.notes);
        }
        setLoaded(true);
      });
    }
  }, [routeId, ascentId]);

  const handleSave = async () => {
    if (!date.trim()) {
      Alert.alert('Chyba', 'Zadejte datum.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && ascentId) {
        await updateAscent(ascentId, { date, style, category, session_id: selectedSessionId, success, notes: notes.trim() });
      } else {
        await insertAscent({
          route_id: routeId,
          date,
          style,
          category,
          session_id: selectedSessionId,
          success,
          notes: notes.trim(),
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save ascent error:', error);
      Alert.alert('Chyba', `Nepodařilo se uložit: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedDate = parseStoredDate(date);

  const handleDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (event.type === 'dismissed') {
        setShowIosDatePicker(false);
        return;
      }
      if (pickedDate) {
        setDate(formatDateForStorage(pickedDate));
      }
      return;
    }

    if (event.type === 'set' && pickedDate) {
      setDate(formatDateForStorage(pickedDate));
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        is24Hour: true,
        onChange: handleDateChange,
      });
      return;
    }

    setShowIosDatePicker((current) => !current);
  };

  if (!loaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>Načítání...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.routeInfo}>
        <Text style={styles.routeLabel}>Cesta</Text>
        <Text style={styles.routeName}>{routeName}</Text>
      </View>
      {activeSession ? (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionInfoLabel}>Aktivní session</Text>
          <Text style={styles.sessionInfoName}>{activeSession.name}</Text>
          <Text style={styles.sessionInfoMeta}>
            Nový výstup se přiřadí do této session. Záznamů: {activeSession.ascentCount}
          </Text>
          {activeSession.notes ? <Text style={styles.sessionInfoMeta}>{activeSession.notes}</Text> : null}
        </View>
      ) : null}

      <Text style={styles.label}>Session</Text>
      <View style={styles.categoryRow}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedSessionId === null && styles.categoryChipActive]}
          onPress={() => setSelectedSessionId(null)}
        >
          <Text style={[styles.categoryChipText, selectedSessionId === null && styles.categoryChipTextActive]}>
            Bez session
          </Text>
        </TouchableOpacity>
        {availableSessions.map((session) => {
          const active = selectedSessionId === session.id;
          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedSessionId(session.id)}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {session.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Datum</Text>
      <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
        <Text style={styles.dateButtonLabel}>Vybrané datum</Text>
        <Text style={styles.dateButtonValue}>{formatDateForDisplay(selectedDate)}</Text>
        <Text style={styles.dateButtonMeta}>{date}</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIosDatePicker ? (
        <View style={styles.iosDatePickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            onChange={handleDateChange}
          />
        </View>
      ) : null}

      <AscentStylePicker value={style} onChange={setStyle} />

      <Text style={styles.label}>Kategorie</Text>
      <View style={styles.categoryRow}>
        {ASCENT_CATEGORIES.map((item) => {
          const active = category === item.value;
          return (
            <TouchableOpacity
              key={item.value || 'uncategorized'}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategory(item.value)}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Slezeno</Text>
        <Switch
          value={success}
          onValueChange={setSuccess}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={success ? colors.textOnDark : colors.surface}
        />
        <Text style={styles.switchText}>{success ? '✅ Slezeno' : '🔄 Pokus'}</Text>
      </View>

      <Text style={styles.label}>Poznámky</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Jak to šlo? Klíčové momenty, podmínky..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Ukládám...' : isEditing ? 'Uložit změny' : 'Zaznamenat výstup'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  routeInfo: {
    backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  sessionInfo: {
    backgroundColor: colors.primarySoft, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
  },
  routeLabel: { fontSize: 12, color: colors.textMuted },
  routeName: { fontSize: 17, fontWeight: '700', color: colors.primaryDark, marginTop: 2 },
  sessionInfoLabel: { fontSize: 12, color: colors.textMuted },
  sessionInfoName: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  sessionInfoMeta: { fontSize: 12, color: colors.primaryDark, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12, color: colors.text,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dateButtonMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primaryDark,
    fontFamily: 'monospace',
  },
  iosDatePickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.textOnDark,
  },
  textArea: { minHeight: 80 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  switchText: { fontSize: 14, color: colors.textMuted },
  saveButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.textOnDark, fontSize: 17, fontWeight: '700' },
});

function parseStoredDate(value: string): Date {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function formatDateForStorage(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value: Date): string {
  return value.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
