import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorState: React.FC<Props> = ({ title = 'Something went wrong', message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.desc}>{message}</Text> : null}
    {onRetry ? (
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 6 },
  title: { color: '#fecdd3', fontSize: 16, fontWeight: '700' },
  desc: { color: '#fda4af', textAlign: 'center' },
  btn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f87171',
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});

