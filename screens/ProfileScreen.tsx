import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Text,
  Button,
  Avatar,
  Card,
  Divider,
  TextInput,
  Portal,
  Modal,
  useTheme,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth, USER_TYPES } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation }) => {
  const { userProfile, updateUserProfile, uploadProfileImage, signOut, trackEvent } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const theme = useTheme();

  // Form states
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  
  // Student specific states
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [major, setMajor] = useState(userProfile?.major || '');
  const [graduationYear, setGraduationYear] = useState(userProfile?.graduationYear || '');
  const [studentId, setStudentId] = useState(userProfile?.studentId || '');
  
  // Professional specific states
  const [company, setCompany] = useState(userProfile?.company || '');
  const [jobTitle, setJobTitle] = useState(userProfile?.jobTitle || '');
  const [experience, setExperience] = useState(userProfile?.experience?.toString() || '');
  const [industry, setIndustry] = useState(userProfile?.industry || '');

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        toast.error('Permission to access media library is required');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setIsLoading(true);
        try {
          await uploadProfileImage(result.assets[0].uri);
          trackEvent('updated_profile_image');
          toast.success('Profile picture updated successfully');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error('Error selecting image');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      handleSaveProfile();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      const updatedData = {
        displayName,
        phone,
      };
      
      // Add data based on user type
      if (userProfile?.userType === USER_TYPES.STUDENT) {
        Object.assign(updatedData, {
          institution,
          major,
          graduationYear,
          studentId,
        });
      } else {
        Object.assign(updatedData, {
          company,
          jobTitle,
          experience: experience ? Number(experience) : 0,
          industry,
        });
      }
      
      await updateUserProfile(updatedData);
      trackEvent('updated_profile');
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      trackEvent('signed_out');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
      setShowSignOutModal(false);
    }
  };

  // Render different sections based on user type
  const renderUserTypeSpecificFields = () => {
    if (!isEditing) {
      if (userProfile?.userType === USER_TYPES.STUDENT) {
        return (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Educational Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Institution:</Text>
                <Text style={styles.infoValue}>{userProfile?.institution || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Major:</Text>
                <Text style={styles.infoValue}>{userProfile?.major || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Graduation Year:</Text>
                <Text style={styles.infoValue}>{userProfile?.graduationYear || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Student ID:</Text>
                <Text style={styles.infoValue}>{userProfile?.studentId || 'Not specified'}</Text>
              </View>
            </Card.Content>
          </Card>
        );
      } else {
        return (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Professional Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company:</Text>
                <Text style={styles.infoValue}>{userProfile?.company || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Job Title:</Text>
                <Text style={styles.infoValue}>{userProfile?.jobTitle || 'Not specified'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Experience:</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.experience ? `${userProfile.experience} years` : 'Not specified'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Industry:</Text>
                <Text style={styles.infoValue}>{userProfile?.industry || 'Not specified'}</Text>
              </View>
            </Card.Content>
          </Card>
        );
      }
    } else {
      // Edit mode fields
      if (userProfile?.userType === USER_TYPES.STUDENT) {
        return (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Educational Information</Text>
              <TextInput
                label="Institution"
                value={institution}
                onChangeText={setInstitution}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Major / Field of Study"
                value={major}
                onChangeText={setMajor}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Graduation Year"
                value={graduationYear}
                onChangeText={setGraduationYear}
                mode="outlined"
                style={styles.input}
                keyboardType="number-pad"
              />
              <TextInput
                label="Student ID (Optional)"
                value={studentId}
                onChangeText={setStudentId}
                mode="outlined"
                style={styles.input}
              />
            </Card.Content>
          </Card>
        );
      } else {
        return (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Professional Information</Text>
              <TextInput
                label="Company"
                value={company}
                onChangeText={setCompany}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Job Title"
                value={jobTitle}
                onChangeText={setJobTitle}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Years of Experience"
                value={experience}
                onChangeText={setExperience}
                mode="outlined"
                style={styles.input}
                keyboardType="number-pad"
              />
              <TextInput
                label="Industry"
                value={industry}
                onChangeText={setIndustry}
                mode="outlined"
                style={styles.input}
              />
            </Card.Content>
          </Card>
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setShowSignOutModal(true)}>
            <Feather name="log-out" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Profile Banner */}
        <View style={styles.profileBanner}>
          <LinearGradient
            colors={['#03449e', '#0967d2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              onPress={handleSelectImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : (
                <>
                  <Avatar.Image 
                    size={100} 
                    source={{ uri: userProfile?.photoURL || 'https://api.a0.dev/assets/image?text=User&aspect=1:1&seed=123' }}
                    style={styles.avatar}
                  />
                  <View style={styles.cameraOverlay}>
                    <MaterialIcons name="camera-alt" size={24} color="white" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Basic Info Card */}
        <Card style={styles.basicInfoCard}>
          <Card.Content>
            {!isEditing ? (
              <>
                <View style={styles.nameContainer}>
                  <Text style={styles.displayName}>{userProfile?.displayName || 'User'}</Text>
                  <Text style={styles.userType}>
                    {userProfile?.userType === USER_TYPES.STUDENT ? 'Student' : 'Professional'}
                  </Text>
                </View>
                <Text style={styles.email}>{userProfile?.email}</Text>
                <Text style={styles.phone}>{userProfile?.phone || 'No phone number provided'}</Text>
              </>
            ) : (
              <>
                <TextInput
                  label="Full Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Email"
                  value={email}
                  disabled
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </>
            )}
          </Card.Content>
        </Card>
        
        {/* Specific User Type Info */}
        {renderUserTypeSpecificFields()}
        
        {/* Referral Code Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Referral Information</Text>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralLabel}>Your Referral Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.referralCode}>{userProfile?.referralCode || 'DEVGNAN123'}</Text>
                <IconButton
                  icon="content-copy"
                  size={20}
                  onPress={() => {
                    toast.success('Referral code copied to clipboard');
                  }}
                />
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile?.referralsGenerated || 0}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProfile?.successfulReferrals || 0}</Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹{userProfile?.totalRewards || 0}</Text>
                <Text style={styles.statLabel}>Rewards</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Edit/Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleToggleEdit}
            loading={isLoading}
            disabled={isLoading}
            icon={isEditing ? "content-save" : "pencil"}
            style={styles.editButton}
          >
            {isEditing ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Portal>
        <Modal
          visible={showSignOutModal}
          onDismiss={() => setShowSignOutModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalText}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowSignOutModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSignOut}
                loading={isLoading}
                style={[styles.modalButton, styles.signOutButton]}
              >
                Sign Out
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileBanner: {
    height: 140,
    position: 'relative',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    alignSelf: 'center',
  },
  avatar: {
    borderWidth: 4,
    borderColor: 'white',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  basicInfoCard: {
    marginHorizontal: 16,
    marginTop: 60,
    borderRadius: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#334e68',
  },
  userType: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#0967d2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  email: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#627d98',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#627d98',
  },
  infoValue: {
    fontSize: 16,
    color: '#334e68',
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  referralCodeContainer: {
    marginBottom: 16,
  },
  referralLabel: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0967d2',
    letterSpacing: 1,
  },
  divider: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0967d2',
  },
  statLabel: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 4,
  },
  buttonContainer: {
    margin: 24,
  },
  editButton: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 24,
    borderRadius: 12,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#334e68',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#627d98',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  signOutButton: {
    backgroundColor: '#e53e3e',
  },
});

export default ProfileScreen;