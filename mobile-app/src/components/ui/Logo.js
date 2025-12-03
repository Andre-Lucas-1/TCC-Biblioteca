import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';

const Logo = ({
  size = 'medium', // small, medium, large, xlarge, xxlarge
  variant = 'default', // default, horizontal, vertical, icon-only, text-only
  showText = true,
  onPress,
  style,
  imageStyle,
  textStyle,
  animated = true, // nova prop para controlar animação
  ...props
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const startBreathing = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1500, // 1.5 segundos para expandir
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 1500, // 1.5 segundos para contrair
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      startBreathing();
    }
  }, [animated, rotateAnim]);
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          imageSize: 40,
          fontSize: SIZES.fontSize.lg,
          spacing: SIZES.xs,
        };
      case 'large':
        return {
          imageSize: 150,
          fontSize: SIZES.fontSize.xxxl,
          spacing: SIZES.md,
        };
      case 'xlarge':
        return {
          imageSize: 160,
          fontSize: 36,
          spacing: SIZES.lg,
        };
      case 'xxlarge':
        return {
          imageSize: 200,
          fontSize: 42,
          spacing: SIZES.xl,
        };
      default: // medium
        return {
          imageSize: 60,
          fontSize: SIZES.fontSize.xxl,
          spacing: SIZES.sm,
        };
    }
  };

  const { imageSize, fontSize, spacing } = getSizeConfig();

  const breathe = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1], // escala de 100% para 110%
  });

  const renderLogo = () => {
    const logoImage = (
      <Animated.Image
        source={require('../../../assets/Gemini_Generated_Image_3zzytb3zzytb3zzy-removebg-preview.png')}
        style={[
          styles.logoImage,
          {
            width: imageSize,
            height: imageSize,
            transform: animated ? [{ scale: breathe }] : [],
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    );

    const logoText = showText && variant !== 'icon-only' && (
      <Text
        style={[
          styles.logoText,
          {
            fontSize: fontSize,
            marginLeft: variant === 'horizontal' ? spacing : 0,
            marginTop: variant === 'vertical' ? spacing : 0,
          },
          textStyle,
        ]}
      >
        Leiaê
      </Text>
    );

    const getContainerStyle = () => {
      const baseStyle = [styles.logoContainer];
      
      switch (variant) {
        case 'horizontal':
          baseStyle.push(styles.horizontal);
          break;
        case 'vertical':
          baseStyle.push(styles.vertical);
          break;
        case 'icon-only':
          baseStyle.push(styles.iconOnly);
          break;
        case 'text-only':
          baseStyle.push(styles.textOnly);
          break;
        default:
          baseStyle.push(styles.default);
      }
      
      return baseStyle;
    };

    return (
      <View style={[getContainerStyle(), style]} {...props}>
        {variant !== 'text-only' && logoImage}
        {logoText}
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderLogo()}
      </TouchableOpacity>
    );
  }

  return renderLogo();
};

// Componente de header com logo
Logo.Header = ({
  showBackButton = false,
  onBackPress,
  rightComponent,
  style,
  ...props
}) => {
  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.headerCenter}>
        <Logo
          size="small"
          variant="horizontal"
          {...props}
        />
      </View>
      
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </View>
  );
};

// Componente de splash/loading com logo
Logo.Splash = ({
  showLoadingText = true,
  loadingText = 'Carregando...',
  style,
  ...props
}) => {
  return (
    <View style={[styles.splashContainer, style]}>
      <Logo
        size="xlarge"
        variant="vertical"
        {...props}
      />
      {showLoadingText && (
        <Text style={styles.loadingText}>{loadingText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variant styles
  default: {
    flexDirection: 'column',
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconOnly: {
    flexDirection: 'row',
  },
  textOnly: {
    flexDirection: 'row',
  },
  
  logoImage: {
    borderRadius: SIZES.radius.sm,
  },
  
  logoText: {
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  backButton: {
    padding: SIZES.sm,
    borderRadius: SIZES.radius.sm,
  },
  
  backButtonText: {
    fontSize: SIZES.fontSize.xl,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  
  // Splash styles
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.lg,
  },
  
  loadingText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.xl,
    textAlign: 'center',
  },
});

export default Logo;