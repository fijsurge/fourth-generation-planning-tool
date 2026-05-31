import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSettings } from "../../contexts/SettingsContext";
import { useRoles } from "../../hooks/useRoles";
import { useAuth } from "../../auth/AuthContext";
import { useThemeColors } from "../../theme/useThemeColors";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { elevation } from "../../theme/elevation";
import { Logo } from "../Logo";
import { WeeklyGoal } from "../../models/WeeklyGoal";
import { addWeeklyGoal } from "../../api/googleSheets";
import { getWeekStart } from "../../utils/dates";
import { generateId } from "../../utils/uuid";
import {
  SAMPLE_MISSION,
  SAMPLE_ROLES,
  SAMPLE_GOALS,
  GENERIC_SAMPLE_GOAL,
} from "./samples";

type StepKey = "welcome" | "mission" | "roles" | "quadrants" | "goal" | "done";
const STEP_SEQUENCE: StepKey[] = [
  "welcome",
  "mission",
  "roles",
  "quadrants",
  "goal",
  "done",
];
const STEP_PROGRESS: Record<StepKey, number | null> = {
  welcome: 1,
  mission: 2,
  roles: 3,
  quadrants: 4,
  goal: 5,
  done: null,
};
const TOTAL_STEPS = 5;

export function WalkthroughModal() {
  const colors = useThemeColors();
  const {
    onboardingModalOpen,
    onboardingPreviewMode,
    shouldAutoLaunchOnboarding,
    markOnboardingAutoLaunched,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    setMissionStatement,
  } = useSettings();
  const { roles, addRole } = useRoles();
  const { getValidAccessToken } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [missionDraft, setMissionDraft] = useState("");
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [customRoleName, setCustomRoleName] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [goalRoleName, setGoalRoleName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-launch on first sign-in. The effect itself records the launch so it
  // only fires once per device, regardless of how many times the user signs in.
  useEffect(() => {
    if (shouldAutoLaunchOnboarding) {
      markOnboardingAutoLaunched();
      openOnboarding();
    }
  }, [shouldAutoLaunchOnboarding, markOnboardingAutoLaunched, openOnboarding]);

  // Reset all draft state whenever the modal becomes visible.
  useEffect(() => {
    if (onboardingModalOpen) {
      setStepIndex(0);
      setMissionDraft("");
      setSelectedRoleNames([]);
      setCustomRoleName("");
      setGoalDraft("");
      setGoalRoleName("");
      setSubmitting(false);
    }
  }, [onboardingModalOpen]);

  const currentStep: StepKey = STEP_SEQUENCE[stepIndex];
  const progress = STEP_PROGRESS[currentStep];

  const advance = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEP_SEQUENCE.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleSkipAll = useCallback(() => {
    closeOnboarding();
  }, [closeOnboarding]);

  const handleFinish = useCallback(async () => {
    if (onboardingPreviewMode) {
      closeOnboarding();
      return;
    }
    await completeOnboarding();
  }, [onboardingPreviewMode, closeOnboarding, completeOnboarding]);

  // ── Step submit handlers ──────────────────────────────────

  const submitMission = useCallback(async () => {
    const trimmed = missionDraft.trim();
    if (!trimmed) {
      advance();
      return;
    }
    if (onboardingPreviewMode) {
      advance();
      return;
    }
    setSubmitting(true);
    try {
      await setMissionStatement(trimmed);
    } finally {
      setSubmitting(false);
      advance();
    }
  }, [missionDraft, onboardingPreviewMode, setMissionStatement, advance]);

  const submitRoles = useCallback(async () => {
    const names = selectedRoleNames.filter(Boolean);
    if (names.length === 0) {
      advance();
      return;
    }
    if (onboardingPreviewMode) {
      advance();
      return;
    }
    setSubmitting(true);
    try {
      // Sequential to keep sortOrder stable in the optimistic state.
      for (const name of names) {
        const sample = SAMPLE_ROLES.find((r) => r.name === name);
        const description = sample?.description || "";
        await addRole(name, description);
      }
    } catch {
      // Silent fail — banner stays so she can re-run later.
    } finally {
      setSubmitting(false);
      advance();
    }
  }, [selectedRoleNames, onboardingPreviewMode, addRole, advance]);

  const submitGoal = useCallback(async () => {
    const text = goalDraft.trim();
    if (!text || !goalRoleName) {
      advance();
      return;
    }
    if (onboardingPreviewMode) {
      advance();
      return;
    }
    setSubmitting(true);
    try {
      const matchingRole = roles.find((r) => r.name === goalRoleName);
      if (!matchingRole) {
        // Role didn't make it into context (rare — addRole failed silently).
        // Bail gracefully — she can add a goal manually later.
        return;
      }
      const token = await getValidAccessToken();
      const weekStart = format(getWeekStart(new Date()), "yyyy-MM-dd");
      const now = new Date().toISOString();
      const goal: WeeklyGoal = {
        id: generateId(),
        weekStartDate: weekStart,
        roleId: matchingRole.id,
        goalText: text,
        quadrant: 2,
        status: "not_started",
        notes: "",
        createdAt: now,
        updatedAt: now,
        isBigRock: true,
      };
      await addWeeklyGoal(token, goal);
    } catch {
      // Silent fail — onboarding doesn't block the user on backend errors.
    } finally {
      setSubmitting(false);
      advance();
    }
  }, [goalDraft, goalRoleName, onboardingPreviewMode, roles, getValidAccessToken, advance]);

  // ── Step renderers ────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.stepBody}>
      <Logo size={64} />
      <Text style={[styles.h1, { color: colors.text }]}>
        Welcome to your weekly planner
      </Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        This is a weekly planning tool based on Stephen Covey's 7 Habits.
        We'll spend about 5 minutes setting up the basics: what matters to you,
        who you want to show up for, and what you want to get done this week.
      </Text>
      <View style={styles.buttonRowVertical}>
        <PrimaryButton label="Take the tour" onPress={advance} colors={colors} />
        <SecondaryButton
          label="Skip — I'll explore on my own"
          onPress={handleSkipAll}
          colors={colors}
        />
      </View>
    </View>
  );

  const renderMission = () => (
    <View style={styles.stepBody}>
      <Text style={[styles.h2, { color: colors.text }]}>Mission statement</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Your mission is your North Star — a sentence about what you want your
        life to be about. It's stable; it doesn't change week to week.
      </Text>
      <View
        style={[
          styles.sampleCard,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sampleLabel, { color: colors.textMuted }]}>
          EXAMPLE
        </Text>
        <Text style={[styles.sampleText, { color: colors.text }]}>
          {SAMPLE_MISSION}
        </Text>
        <Pressable
          onPress={() => setMissionDraft(SAMPLE_MISSION)}
          style={({ pressed }) => [
            styles.linkButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Use this as a starting point
          </Text>
        </Pressable>
      </View>
      <TextInput
        value={missionDraft}
        onChangeText={setMissionDraft}
        placeholder="Write yours (or edit the example above)..."
        placeholderTextColor={colors.textMuted}
        multiline
        style={[
          styles.textInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
    </View>
  );

  const renderRoles = () => {
    const toggleRole = (name: string) => {
      setSelectedRoleNames((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      );
    };
    const addCustom = () => {
      const name = customRoleName.trim();
      if (!name) return;
      if (!selectedRoleNames.includes(name)) {
        setSelectedRoleNames((prev) => [...prev, name]);
      }
      setCustomRoleName("");
    };
    return (
      <View style={styles.stepBody}>
        <Text style={[styles.h2, { color: colors.text }]}>Your roles</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Roles are the hats you wear — the people and responsibilities you
          care about. Most people have 4-7. Tap to select; you can edit any of
          these later.
        </Text>
        <View style={styles.chipRow}>
          {SAMPLE_ROLES.map((role) => {
            const selected = selectedRoleNames.includes(role.name);
            return (
              <Pressable
                key={role.name}
                onPress={() => toggleRole(role.name)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.primaryLight
                      : colors.surface,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? colors.primary : colors.text },
                  ]}
                >
                  {role.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.customRoleRow}>
          <TextInput
            value={customRoleName}
            onChangeText={setCustomRoleName}
            placeholder="+ Add your own role"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInputInline,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <Pressable
            onPress={addCustom}
            style={({ pressed }) => [
              styles.addButton,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderQuadrants = () => (
    <ScrollView
      style={styles.stepBody}
      contentContainerStyle={{ paddingBottom: spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.h2, { color: colors.text }]}>The four quadrants</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Covey sorts everything you do into four boxes by{" "}
        <Text style={{ fontWeight: "700" }}>urgent</Text> and{" "}
        <Text style={{ fontWeight: "700" }}>important</Text>. The goal of this
        app is to help you spend more time in Q2 — that's where the good stuff
        lives.
      </Text>
      <View style={styles.quadrantGrid}>
        <QuadrantCell
          label="Q1"
          title="Urgent + Important"
          subtitle="Crises, deadlines"
          colors={colors}
        />
        <QuadrantCell
          label="Q2"
          title="Important, Not Urgent"
          subtitle="Planning, growth, relationships"
          highlight
          colors={colors}
        />
        <QuadrantCell
          label="Q3"
          title="Urgent, Not Important"
          subtitle="Interruptions, busywork"
          colors={colors}
        />
        <QuadrantCell
          label="Q4"
          title="Neither"
          subtitle="Most distractions"
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderGoal = () => {
    const availableRoles =
      selectedRoleNames.length > 0 ? selectedRoleNames : ["Self"];
    const activeRoleName = goalRoleName || availableRoles[0];
    const sample = SAMPLE_GOALS[activeRoleName] ?? GENERIC_SAMPLE_GOAL;
    return (
      <View style={styles.stepBody}>
        <Text style={[styles.h2, { color: colors.text }]}>
          Your first goal (and a Big Rock)
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Pick one Q2 goal for this week — small, specific, and doable in 7
          days. Covey calls these "Big Rocks": the important things you protect
          time for first, before the small stuff fills up your week.
        </Text>
        {availableRoles.length > 1 && (
          <View style={styles.chipRow}>
            {availableRoles.map((name) => {
              const selected = name === activeRoleName;
              return (
                <Pressable
                  key={name}
                  onPress={() => setGoalRoleName(name)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.primaryLight
                        : colors.surface,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <View
          style={[
            styles.sampleCard,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sampleLabel, { color: colors.textMuted }]}>
            EXAMPLE FOR {activeRoleName.toUpperCase()}
          </Text>
          <Text style={[styles.sampleText, { color: colors.text }]}>
            {sample.goalText}
          </Text>
          <Pressable
            onPress={() => {
              setGoalDraft(sample.goalText);
              setGoalRoleName(activeRoleName);
            }}
            style={({ pressed }) => [
              styles.linkButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Use this example
            </Text>
          </Pressable>
        </View>
        <TextInput
          value={goalDraft}
          onChangeText={(t) => {
            setGoalDraft(t);
            if (!goalRoleName) setGoalRoleName(activeRoleName);
          }}
          placeholder="Write your goal..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
        <Text style={[styles.helperText, { color: colors.textMuted }]}>
          You can schedule this on your calendar from the Calendar tab once
          the tour is done.
        </Text>
      </View>
    );
  };

  const renderDone = () => (
    <View style={styles.stepBody}>
      <Logo size={64} />
      <Text style={[styles.h1, { color: colors.text }]}>You're set up</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        You can re-run this tour any time from Settings. The app will guide you
        through anything new as you go.
      </Text>
      <View style={styles.buttonRowVertical}>
        <PrimaryButton label="Open the app" onPress={handleFinish} colors={colors} />
      </View>
    </View>
  );

  // ── Footer (back / skip / continue) ───────────────────────

  const showBack = stepIndex > 0 && currentStep !== "welcome" && currentStep !== "done";
  const showSkipStep = currentStep !== "welcome" && currentStep !== "done";

  const onContinue = () => {
    switch (currentStep) {
      case "mission":
        return submitMission();
      case "roles":
        return submitRoles();
      case "quadrants":
        return advance();
      case "goal":
        return submitGoal();
      default:
        return advance();
    }
  };

  const continueLabel = useMemo(() => {
    if (currentStep === "goal") {
      return goalDraft.trim() ? "Save & continue" : "Skip goal";
    }
    return "Continue";
  }, [currentStep, goalDraft]);

  const showFooter = currentStep !== "welcome" && currentStep !== "done";

  return (
    <Modal
      visible={onboardingModalOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkipAll}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              ...elevation.lg,
            },
          ]}
        >
          {onboardingPreviewMode && (
            <View
              style={[
                styles.previewBadge,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="eye-outline" size={14} color={colors.primary} />
              <Text style={[styles.previewBadgeText, { color: colors.primary }]}>
                Preview mode · nothing will be saved
              </Text>
            </View>
          )}
          {progress !== null && <ProgressDots total={TOTAL_STEPS} current={progress} colors={colors} />}

          {currentStep === "welcome" && renderWelcome()}
          {currentStep === "mission" && renderMission()}
          {currentStep === "roles" && renderRoles()}
          {currentStep === "quadrants" && renderQuadrants()}
          {currentStep === "goal" && renderGoal()}
          {currentStep === "done" && renderDone()}

          {showFooter && (
            <View style={styles.footer}>
              {showBack ? (
                <Pressable
                  onPress={goBack}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.footerButton,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={[styles.footerButtonText, { color: colors.textSecondary }]}>
                    Back
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.footerButton} />
              )}
              {showSkipStep && (
                <Pressable
                  onPress={advance}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.footerButton,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>
                    Skip
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onContinue}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.footerContinue,
                  { backgroundColor: colors.primary },
                  (pressed || submitting) && { opacity: 0.8 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={[styles.footerContinueText, { color: colors.onPrimary }]}>
                    {continueLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {currentStep !== "welcome" && currentStep !== "done" && (
            <Pressable
              onPress={handleSkipAll}
              style={({ pressed }) => [
                styles.exitLink,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.exitLinkText, { color: colors.textMuted }]}>
                Exit tour
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Sub-components ────────────────────────────────────────────

function PrimaryButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primary },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProgressDots({
  total,
  current,
  colors,
}: {
  total: number;
  current: number;
  colors: any;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i + 1 <= current ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

function QuadrantCell({
  label,
  title,
  subtitle,
  highlight,
  colors,
}: {
  label: string;
  title: string;
  subtitle: string;
  highlight?: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.quadrantCell,
        {
          backgroundColor: highlight
            ? colors.primaryLight
            : colors.background,
          borderColor: highlight ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.quadrantLabel,
          { color: highlight ? colors.primary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.quadrantTitle,
          { color: highlight ? colors.primary : colors.text },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.quadrantSubtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  previewBadgeText: {
    ...typography.micro,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepBody: {
    gap: spacing.md,
    alignItems: "center",
    flexGrow: 0,
  },
  h1: {
    ...typography.h1,
    textAlign: "center",
  },
  h2: {
    ...typography.h2,
    textAlign: "center",
  },
  bodyText: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  sampleCard: {
    width: "100%",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sampleLabel: {
    ...typography.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  sampleText: {
    ...typography.body,
    fontStyle: "italic",
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  linkText: {
    ...typography.body,
    fontWeight: "600",
  },
  textInput: {
    width: "100%",
    minHeight: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    ...typography.body,
    textAlignVertical: "top",
  },
  textInputInline: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    ...typography.body,
    fontWeight: "500",
  },
  customRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    ...typography.caption,
    textAlign: "center",
  },
  quadrantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    width: "100%",
  },
  quadrantCell: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    minHeight: 96,
  },
  quadrantLabel: {
    ...typography.micro,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  quadrantTitle: {
    ...typography.body,
    fontWeight: "700",
  },
  quadrantSubtitle: {
    ...typography.caption,
    lineHeight: 16,
  },
  buttonRowVertical: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  footerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 60,
    alignItems: "center",
  },
  footerButtonText: {
    ...typography.body,
    fontWeight: "500",
  },
  footerContinue: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  footerContinueText: {
    ...typography.body,
    fontWeight: "600",
  },
  exitLink: {
    alignSelf: "center",
    padding: spacing.xs,
  },
  exitLinkText: {
    ...typography.caption,
  },
});
