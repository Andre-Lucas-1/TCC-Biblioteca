import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7D4105" />
      
      <ImageBackground
        source={require('../../../assets/Gemini_Generated_Image_tyzn4ftyzn4ftyzn.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Logo e Título */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Logo
            size="large"
            variant="vertical"
            textStyle={styles.logoTextStyle}
            animated={true}
          />

          <Text style={styles.subtitle}>
            Descubra, leia e conquiste no <Text style={styles.brandText}>Leiaê</Text>
          </Text>
        </Animated.View>



        {/* Botões */}
        <Animated.View 
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Criar Conta</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.footerText}>
            Ao continuar, você concorda com nossos{' '}
            <Text style={styles.linkText}>Termos de Uso</Text>
            {' '}e{' '}
            <Text style={styles.linkText}>Política de Privacidade</Text>
          </Text>
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.xxl,
    marginBottom: SIZES.xl,
    // display: 'none', // revertido
  },

  logoTextStyle: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.xxxl,
    marginTop: SIZES.md,
  },

  subtitle: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: FONTS.weights.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  brandText: {
    color: COLORS.primary,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  horizontalTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.lg,
  },
  horizontalText: {
    fontSize: SIZES.fontSize.xl,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  decorativeElements: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.xl,
  },
  decorativeIcon: {
    fontSize: 32,
    marginHorizontal: SIZES.sm,
  },
  sparkleContainer: {
    position: 'relative',
    width: '100%',
    height: 60,
    marginTop: SIZES.md,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
  },
  sparkle1: {
    top: 10,
    left: '20%',
  },
  sparkle2: {
    top: 5,
    right: '25%',
  },
  sparkle3: {
    bottom: 15,
    left: '15%',
  },
  sparkle4: {
    bottom: 10,
    right: '20%',
  },
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: SIZES.lg,
    // display: 'none', // revertido
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.large,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButtonText: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: SIZES.lg,
    // display: 'none', // revertido
  },
  footerText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: FONTS.weights.medium,
  },
});

export default WelcomeScreen;