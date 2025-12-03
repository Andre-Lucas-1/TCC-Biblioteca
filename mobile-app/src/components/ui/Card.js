import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  onPress,
  variant = 'default', // default, elevated, outlined, flat
  padding = 'medium', // none, small, medium, large
  style,
  headerStyle,
  contentStyle,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'flat':
        baseStyle.push(styles.flat);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    // Padding styles
    switch (padding) {
      case 'none':
        baseStyle.push(styles.paddingNone);
        break;
      case 'small':
        baseStyle.push(styles.paddingSmall);
        break;
      case 'large':
        baseStyle.push(styles.paddingLarge);
        break;
      default:
        baseStyle.push(styles.paddingMedium);
    }
    
    return baseStyle;
  };
  
  const renderHeader = () => {
    if (!title && !subtitle && !headerAction) {
      return null;
    }
    
    return (
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
        {headerAction && (
          <View style={styles.headerAction}>
            {headerAction}
          </View>
        )}
      </View>
    );
  };
  
  const CardContent = () => (
    <View style={[getCardStyle(), style]} {...props}>
      {renderHeader()}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }
  
  return <CardContent />;
};

// Card subcomponents
Card.Header = ({ children, style, ...props }) => (
  <View style={[styles.cardHeader, style]} {...props}>
    {children}
  </View>
);

Card.Content = ({ children, style, ...props }) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

Card.Footer = ({ children, style, ...props }) => (
  <View style={[styles.cardFooter, style]} {...props}>
    {children}
  </View>
);

Card.Actions = ({ children, style, align = 'right', ...props }) => (
  <View 
    style={[
      styles.cardActions, 
      align === 'left' && styles.cardActionsLeft,
      align === 'center' && styles.cardActionsCenter,
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.md,
  },
  
  // Variant styles
  default: {
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  elevated: {
    backgroundColor: COLORS.white,
    ...SHADOWS.heavy,
  },
  outlined: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  flat: {
    backgroundColor: COLORS.surface,
  },
  
  // Padding styles
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: SIZES.sm,
  },
  paddingMedium: {
    padding: SIZES.md,
  },
  paddingLarge: {
    padding: SIZES.lg,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  
  headerContent: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  title: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  
  subtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  // Touchable styles
  touchable: {
    borderRadius: SIZES.radius.md,
  },
  
  // Subcomponent styles
  cardHeader: {
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    marginBottom: SIZES.md,
  },
  
  cardContent: {
    flex: 1,
  },
  
  cardFooter: {
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: SIZES.md,
  },
  
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: SIZES.sm,
    marginTop: SIZES.md,
  },
  
  cardActionsLeft: {
    justifyContent: 'flex-start',
  },
  
  cardActionsCenter: {
    justifyContent: 'center',
  },
});

export default Card;