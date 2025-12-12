import { StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenPadding: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    ...SHADOWS.medium,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  chip: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.full,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...SHADOWS.light,
  },
  chipText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  headerTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
});
