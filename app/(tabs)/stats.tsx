import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { useGoalStats, WeekStats } from "../../src/hooks/useGoalStats";
import { formatWeekRange } from "../../src/utils/dates";
import { QUADRANT_LABELS, getQuadrantColors } from "../../src/utils/constants";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { Quadrant } from "../../src/models/WeeklyGoal";

export default function StatsScreen() {
  const colors = useThemeColors();
  const QUADRANT_COLORS = getQuadrantColors(colors);
  const { isLoading, error, weekHistory, overallPct, overallComplete, overallTotal, refresh } =
    useGoalStats();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.lg,
        },
        errorText: {
          fontSize: 14,
          color: colors.danger,
          textAlign: "center",
          marginBottom: spacing.md,
        },
        retryText: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: "600",
        },
        emptyText: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
        },
        scrollContent: {
          padding: spacing.md,
        },
        overallCard: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        overallTitle: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.textMuted,
          letterSpacing: 0.6,
          marginBottom: spacing.sm,
        },
        overallPct: {
          fontSize: 48,
          fontWeight: "700",
          color: colors.text,
          lineHeight: 56,
        },
        overallSubtext: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: spacing.md,
        },
        fullBarTrack: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
          overflow: "hidden",
        },
        fullBarFill: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        sectionHeader: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textMuted,
          letterSpacing: 0.8,
          marginBottom: spacing.sm,
          marginTop: spacing.xs,
        },
        weekCard: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        weekCardHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.sm,
        },
        weekLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
          flex: 1,
        },
        weekCount: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        weekBarTrack: {
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: "hidden",
          marginBottom: spacing.sm,
        },
        weekBarFill: {
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
        },
        quadrantRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 3,
          gap: spacing.sm,
        },
        dot: {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          flexShrink: 0,
        },
        quadrantRowLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          flex: 1,
        },
        quadrantCount: {
          fontSize: 12,
          color: colors.textMuted,
          minWidth: 36,
          textAlign: "right",
        },
        quadrantBarTrack: {
          width: 60,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: colors.border,
          overflow: "hidden",
        },
        quadrantBarFill: {
          height: 5,
          borderRadius: 2.5,
        },
        quadrantPct: {
          fontSize: 12,
          color: colors.textMuted,
          width: 30,
          textAlign: "right",
        },
        emptyQuadrant: {
          fontSize: 12,
          color: colors.textMuted,
          width: 96,
          textAlign: "right",
        },
        reflectionToggle: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        reflectionToggleLabel: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          letterSpacing: 0.6,
        },
        reflectionBody: {
          marginTop: spacing.sm,
          gap: spacing.sm,
        },
        reflectionFieldLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          marginBottom: 2,
        },
        reflectionFieldValue: {
          fontSize: 13,
          color: colors.text,
          lineHeight: 18,
        },
        noReflectionText: {
          fontSize: 12,
          color: colors.textMuted,
          fontStyle: "italic",
          marginTop: spacing.xs,
        },
      }),
    [colors]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (weekHistory.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No goals recorded yet.</Text>
      </View>
    );
  }

  const displayedWeeks = weekHistory.slice().reverse();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Overall Card */}
      <View style={styles.overallCard}>
        <Text style={styles.overallTitle}>ALL-TIME SUCCESS RATE</Text>
        <Text style={styles.overallPct}>{overallPct}%</Text>
        <Text style={styles.overallSubtext}>
          {overallComplete} of {overallTotal} goals complete
        </Text>
        <View style={styles.fullBarTrack}>
          <View style={[styles.fullBarFill, { width: `${overallPct}%` as any }]} />
        </View>
      </View>

      {/* Week by Week */}
      <Text style={styles.sectionHeader}>WEEK BY WEEK</Text>

      {displayedWeeks.map((week) => (
        <WeekCard
          key={week.weekStartDate}
          week={week}
          styles={styles}
          quadrantColors={QUADRANT_COLORS}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}

function WeekCard({
  week,
  styles,
  quadrantColors,
  colors,
}: {
  week: WeekStats;
  styles: any;
  quadrantColors: Record<Quadrant, string>;
  colors: any;
}) {
  const weekDate = parseISO(week.weekStartDate);
  const label = formatWeekRange(weekDate);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const r = week.reflection;

  return (
    <View style={styles.weekCard}>
      <View style={styles.weekCardHeader}>
        <Text style={styles.weekLabel}>{label}</Text>
        <Text style={styles.weekCount}>
          {week.complete}/{week.total}
        </Text>
      </View>

      <View style={styles.weekBarTrack}>
        <View style={[styles.weekBarFill, { width: `${week.pct}%` as any }]} />
      </View>

      {week.byQuadrant.map((qs) => (
        <View key={qs.quadrant} style={styles.quadrantRow}>
          <View style={[styles.dot, { backgroundColor: quadrantColors[qs.quadrant] }]} />
          <Text style={styles.quadrantRowLabel} numberOfLines={1}>
            {QUADRANT_LABELS[qs.quadrant]}
          </Text>
          {qs.total === 0 ? (
            <Text style={styles.emptyQuadrant}>—</Text>
          ) : (
            <>
              <Text style={styles.quadrantCount}>
                {qs.complete}/{qs.total}
              </Text>
              <View style={styles.quadrantBarTrack}>
                <View
                  style={[
                    styles.quadrantBarFill,
                    {
                      width: `${qs.pct}%` as any,
                      backgroundColor: quadrantColors[qs.quadrant],
                    },
                  ]}
                />
              </View>
              <Text style={styles.quadrantPct}>{qs.pct}%</Text>
            </>
          )}
        </View>
      ))}

      {/* Reflection toggle — only shown for past weeks */}
      <Pressable
        style={({ pressed }) => [styles.reflectionToggle, pressed && { opacity: 0.6 }]}
        onPress={() => setReflectionOpen((v) => !v)}
      >
        <Text style={styles.reflectionToggleLabel}>REFLECTION</Text>
        <Ionicons
          name={reflectionOpen ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textMuted}
        />
      </Pressable>

      {reflectionOpen && (
        <View style={styles.reflectionBody}>
          {!r ? (
            <Text style={styles.noReflectionText}>No reflection recorded for this week.</Text>
          ) : (
            <>
              {r.wentWell ? (
                <View>
                  <Text style={styles.reflectionFieldLabel}>WHAT WENT WELL</Text>
                  <Text style={styles.reflectionFieldValue}>{r.wentWell}</Text>
                </View>
              ) : null}
              {r.didntGoWell ? (
                <View>
                  <Text style={styles.reflectionFieldLabel}>WHAT DIDN'T GO WELL</Text>
                  <Text style={styles.reflectionFieldValue}>{r.didntGoWell}</Text>
                </View>
              ) : null}
              {r.intentions ? (
                <View>
                  <Text style={styles.reflectionFieldLabel}>INTENTIONS FOR NEXT WEEK</Text>
                  <Text style={styles.reflectionFieldValue}>{r.intentions}</Text>
                </View>
              ) : null}
              {!r.wentWell && !r.didntGoWell && !r.intentions && (
                <Text style={styles.noReflectionText}>Reflection was saved with no text.</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
