import { Component, type ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = Readonly<{ children: ReactNode }>;
type State = Readonly<{ error: Error | null }>;

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SOMETHING WENT WRONG</Text>
          <Text style={styles.title}>Your companion is still safe.</Text>
          <Text style={styles.body}>
            Tamagoochi hit an unexpected error. Try loading the current screen
            again.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try loading Tamagoochi again"
            style={styles.button}
            onPress={this.retry}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.canvas,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: colors.paper,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: colors.muted,
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  body: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.moss,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
