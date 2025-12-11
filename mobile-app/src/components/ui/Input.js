import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';

const Input = forwardRef(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
  style,
  inputStyle,
  containerStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer];
    
    if (isFocused) {
      baseStyle.push(styles.inputContainerFocused);
    }
    
    if (error) {
      baseStyle.push(styles.inputContainerError);
    }
    
    if (!editable) {
      baseStyle.push(styles.inputContainerDisabled);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }
    
    if (!editable) {
      baseStyle.push(styles.inputDisabled);
    }
    
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[getInputContainerStyle(), style]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.secureToggle}
            onPress={toggleSecureEntry}
            activeOpacity={0.7}
          >
            <Text style={styles.secureToggleText}>
              {isSecure ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, errorStyle]}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={[styles.helperText, helperStyle]}>
          {helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  
  label: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    minHeight: SIZES.input,
  },
  
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  
  inputContainerError: {
    borderColor: COLORS.error,
  },
  
  inputContainerDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
  },
  
  input: {
    flex: 1,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    paddingVertical: SIZES.sm,
  },
  
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: SIZES.md,
    paddingBottom: SIZES.md,
  },
  
  inputDisabled: {
    color: COLORS.gray[500],
  },
  
  leftIconContainer: {
    marginRight: SIZES.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  rightIconContainer: {
    marginLeft: SIZES.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secureToggle: {
    marginLeft: SIZES.sm,
    padding: SIZES.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secureToggleText: {
    fontSize: SIZES.fontSize.lg,
  },
  
  errorText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.error,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
  
  helperText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
  },
});

Input.displayName = 'Input';

export default Input;