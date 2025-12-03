import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ImageBackground,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { COLORS, SIZES, FONTS, SHADOWS, TEXTS } from '../../constants';
import { Logo } from '../../components';
import { validationUtils } from '../../utils';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Navegar para tela principal se autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated, navigation]);

  // Limpar erro quando componente é montado
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const validation = validationUtils.validateRegisterForm(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword
    );
    
    let formErrors = { ...validation.errors };
    
    // Validar termos de uso
    if (!acceptedTerms) {
      formErrors.terms = 'Você deve aceitar os termos de uso';
    }
    
    setErrors(formErrors);
    return validation.isValid && acceptedTerms;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: 'user',
      };
      
      await dispatch(registerUser(userData)).unwrap();
      // Navegação será feita pelo useEffect quando isAuthenticated mudar
    } catch (error) {
      // Erro será mostrado pelo useEffect
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleTermsPress = () => {
    // Aqui você pode abrir uma modal ou navegar para tela de termos
    Alert.alert(
      'Termos de Uso',
      'Esta funcionalidade será implementada em breve.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7D4105" />
      
      <ImageBackground
        source={require('../../../assets/Gemini_Generated_Image_tyzn4ftyzn4ftyzn.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              
              <Logo
                size="large"
                variant="icon-only"
                animated={true}
              />
              
              <Text style={styles.title}>Crie sua conta no <Text style={styles.brandText}>Leiaê</Text></Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError,
                  ]}
                  placeholder="Seu nome"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
                    placeholder="********"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <View style={[styles.checkboxBox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms && <Text style={styles.checkboxIcon}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    Eu aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e a {' '}
                    <Text style={styles.termsLink}>Política de Privacidade</Text>
                  </Text>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerButtonText}>{isLoading ? 'Criando...' : 'Criar Conta'}</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Já tem conta? </Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.lg,
    // display: 'none', // revertido
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  brandText: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.lg,
    // display: 'none', // revertido
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  input: {
    height: SIZES.button,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: SIZES.button,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingRight: 50,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  eyeButton: {
    position: 'absolute',
    right: SIZES.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
  },
  checkbox: {
    marginRight: SIZES.sm,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxError: {
    borderColor: COLORS.error,
  },
  checkboxIcon: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: FONTS.weights.bold,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    height: SIZES.button,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    ...SHADOWS.medium,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  registerButtonText: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.gray[500],
    marginHorizontal: SIZES.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default RegisterScreen;