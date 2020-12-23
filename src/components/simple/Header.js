import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme } from '../../core/theme';
import {Title} from 'react-native-paper';
type Props = {
  children: React.ReactNode;
};

const Header = ({ children }: Props) => (
  <Title style={styles.header}>{children}</Title>
);

const styles = StyleSheet.create({
  header: {
    fontSize: 29,
  //  color: theme.colors.primary,
    fontWeight: '900',
    paddingVertical: 14,
  },
});

export default memo(Header);
