import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useAuth, USER_TYPES } from '../context/AuthContext';

const ProfessionalFindStudentsButton = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const theme = useTheme();

  // Only render the button if the user is a professional
  if (userProfile?.userType !== USER_TYPES.PROFESSIONAL) {
    return null;
  }

  const handlePress = () => {
    trackEvent('navigate_to_students_list');
    navigation.navigate('StudentList');
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="account-search"
        onPress={handlePress}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Find Students for Referrals
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: '#0967d2',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfessionalFindStudentsButton;