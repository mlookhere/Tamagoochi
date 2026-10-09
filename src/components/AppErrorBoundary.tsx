import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Props = Readonly<{ children: ReactNode }>;
type State = Readonly<{ error: Error | null }>;

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

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
            Tamagoochi hit an unexpected error. Try loading the current screen again.
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
    backgroundColor: '#F6F7ED',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#FBFCF4',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#718875',
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: '#253F32',
  },
  body: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: '#627368',
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#345E46',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
