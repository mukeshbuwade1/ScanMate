import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.warn('ErrorBoundary caught', error, info);
  }

  handleReset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          {this.state.message ? <Text style={styles.message}>{this.state.message}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0b1015' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  message: { color: '#9ca3af', textAlign: 'center', marginBottom: 12 },
  btn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});

