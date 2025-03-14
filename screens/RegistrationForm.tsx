import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth, USER_TYPES } from '../context/AuthContext';
// import { useAuth, USER_TYPES } from './firebase-auth-provider';

// Import the Picker from community package or use the one from React Native
// Option 1: If you're using Expo or have installed @react-native-picker/picker
// import { Picker } from '@react-native-picker/picker';
// Option 2: For a simpler approach without external dependencies, use SelectList

const RegistrationForm = ({ navigation }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState(USER_TYPES.STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Student specific fields
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [studentId, setStudentId] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  
  // Professional specific fields
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [industry, setIndustry] = useState('');
  
  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    // Validate user type specific fields
    if (userType === USER_TYPES.STUDENT) {
      if (!institution || !major) {
        setError('Institution and major are required for students');
        return false;
      }
    } else if (userType === USER_TYPES.PROFESSIONAL) {
      if (!company || !jobTitle) {
        setError('Company and job title are required for professionals');
        return false;
      }
    }
    
    setError('');
    return true;
  };
  
  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Prepare additional data based on user type
      let additionalData = {
        displayName,
      };
      
      if (userType === USER_TYPES.STUDENT) {
        additionalData = {
          ...additionalData,
          institution,
          major,
          graduationYear,
          studentId,
          currentSemester
        };
      } else {
        additionalData = {
          ...additionalData,
          company,
          jobTitle,
          experience,
          industry,
          skills: [] // This could be populated from a multi-select component
        };
      }
      
      await signUp(email, password, userType, additionalData);
      // Navigate to home or onboarding screen
      navigation.replace('Home');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render different form sections based on user type
  const renderUserTypeSpecificFields = () => {
    if (userType === USER_TYPES.STUDENT) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Institution/University"
            value={institution}
            onChangeText={setInstitution}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Major/Course"
            value={major}
            onChangeText={setMajor}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Expected Graduation Year"
            value={graduationYear}
            onChangeText={setGraduationYear}
            keyboardType="number-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Student ID (optional)"
            value={studentId}
            onChangeText={setStudentId}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Current Semester/Year (optional)"
            value={currentSemester}
            onChangeText={setCurrentSemester}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Company/Organization"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Job Title"
            value={jobTitle}
            onChangeText={setJobTitle}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Years of Experience"
            value={experience}
            onChangeText={setExperience}
            keyboardType="number-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Industry"
            value={industry}
            onChangeText={setIndustry}
          />
          
          {/* Skills component could be added here with multi-select */}
        </View>
      );
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Create Account</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          <Text style={styles.label}>I am a:</Text>
          <View style={styles.pickerContainer}>
            {/* Replace Picker with simple TouchableOpacity buttons for user type selection */}
            <View style={styles.userTypeButtons}>
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  userType === USER_TYPES.STUDENT && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType(USER_TYPES.STUDENT)}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === USER_TYPES.STUDENT && styles.userTypeButtonTextActive
                ]}>Student</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  userType === USER_TYPES.PROFESSIONAL && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType(USER_TYPES.PROFESSIONAL)}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === USER_TYPES.PROFESSIONAL && styles.userTypeButtonTextActive
                ]}>Working Professional</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {renderUserTypeSpecificFields()}
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  userTypeButtonActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  userTypeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  userTypeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4285F4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#4285F4',
    fontSize: 16,
  },
});

export default RegistrationForm;