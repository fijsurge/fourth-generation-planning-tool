import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRoles } from "../../src/hooks/useRoles";
import { colors } from "../../src/theme/colors";
import { spacing, borderRadius } from "../../src/theme/spacing";

export default function EditRoleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { roles, isLoading, updateRole, deleteRole } = useRoles();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const role = roles.find((r) => r.id === id);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
    }
  }, [role?.id]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!role) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Role not found.</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateRole({ ...role, name: name.trim(), description: description.trim() });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      setSaving(true);
      try {
        await deleteRole(role.id);
        router.back();
      } catch {
        setSaving(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete role "${role.name}"? Goals assigned to it will become unassigned.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Role",
        `Delete "${role.name}"? Goals assigned to it will become unassigned.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.label}>Role Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Role name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="What does this role mean to you?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={saving}
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.deleteText}>Delete Role</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  deleteText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
