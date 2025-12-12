import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: object;
};

export const Skeleton: React.FC<Props> = ({ height = 12, width = '100%', radius = 8, style }) => {
  return <View style={[styles.base, { height, width, borderRadius: radius }, style]} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
});

