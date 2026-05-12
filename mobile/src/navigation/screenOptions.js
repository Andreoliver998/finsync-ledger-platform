import { theme } from '@theme/index';

export const defaultStackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
  headerShadowVisible: false,
  headerTitleStyle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 18
  },
  contentStyle: { backgroundColor: theme.colors.background },
  animation: 'slide_from_right'
};
