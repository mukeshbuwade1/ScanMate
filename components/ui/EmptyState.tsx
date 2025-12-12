import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export const EmptyState: React.FC<Props> = ({ title, description, icon }) => (
  <View style={styles.container}>
    {icon}
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.desc}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 6 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  desc: { color: '#9ca3af', textAlign: 'center' },
});

