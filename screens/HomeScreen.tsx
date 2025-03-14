import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Share, TouchableOpacity, ImageBackground, Alert, Image, Platform } from 'react-native';
import { 
  Surface, 
  Text, 
  Button, 
  Avatar, 
  Title, 
  Chip, 
  ProgressBar,
  Switch,
  useTheme,
  Card,
  Appbar,
  IconButton,
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import ReferralCard from '../components/ReferralCard';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import StudentFindProfessionalsButton from './StudentFindProfessionalsButton';
import ProfessionalFindStudentsButton from './ProfessionalFindStudentsButton';
// Import the new buttons

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  const { user, userProfile, signOut, updateUserProfile, uploadProfileImage, createReferral, getReferrals, trackEvent } = useAuth();
  const [userType, setUserType] = useState(userProfile?.userType || 'professional');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.displayName || '');
  const [profileRole, setProfileRole] = useState(userProfile?.role || '');
  const [profileCompany, setProfileCompany] = useState(userProfile?.company || '');
  const [referralEmail, setReferralEmail] = useState('');
  const [referralName, setReferralName] = useState('');
  const [referralJobType, setReferralJobType] = useState('');
  
  const theme = useTheme();

  // Profile data based on user profile from Firestore
  const profileData = {
    name: userProfile?.displayName || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'user@example.com',
    avatar: userProfile?.photoURL || 'https://api.a0.dev/assets/image?text=professional%20indian%20person%20headshot&aspect=1:1&seed=123',
    role: userProfile?.role || (userType === 'professional' ? 'Professional' : 'Student'),
    company: userProfile?.company || (userType === 'professional' ? 'Company' : 'University'),
    referralCode: userProfile?.referralCode || 'DEVGNAN',
  };

  // Stats from user profile
  const referralStats = {
    total: userProfile?.referralsGenerated || 0,
    active: userProfile?.activeReferrals || 0,
    successful: userProfile?.successfulReferrals || 0,
    rewards: userProfile?.totalRewards || 0, // in INR
  };

  useEffect(() => {
    if (userProfile) {
      setUserType(userProfile.userType);
      loadReferrals();
    }
  }, [userProfile]);

  const loadReferrals = async () => {
    try {
      setIsRefreshing(true);
      const referrals = await getReferrals();
      
      // Convert Firestore data to component format
      const formattedReferrals = referrals.map((ref) => ({
        id: ref.id,
        name: ref.refereeName || ref.refereeEmail.split('@')[0],
        type: ref.jobType || 'Not specified',
        status: ref.status,
        date: ref.createdAt.toDate().toISOString().split('T')[0],
        avatar: `https://api.a0.dev/assets/image?text=indian%20professional%20headshot&aspect=1:1&seed=${ref.id.substring(0, 5)}`,
      }));
      
      setRecentReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleUserType = async () => {
    const newUserType = userType === 'professional' ? 'student' : 'professional';
    setUserType(newUserType);
    
    // Update user type in Firestore
    if (userProfile) {
      try {
        await updateUserProfile({ userType: newUserType });
        trackEvent('user_type_changed', { new_type: newUserType });
      } catch (error) {
        console.error('Error updating user type:', error);
      }
    }
  };

  const shareReferral = async () => {
    try {
      const referralCode = userProfile?.referralCode || "DEVGNAN" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const result = await Share.share({
        message: `Join DevGnan with my referral code: ${referralCode}. Download the app today!`,
        title: 'DevGnan Referral',
      });
      
      if (result.action === Share.sharedAction) {
        trackEvent('referral_shared');
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  const selectProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required!');
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
          trackEvent('profile_image_updated');
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };
  
  const saveProfile = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile({
        displayName: profileName,
        role: profileRole,
        company: profileCompany,
      });
      setShowProfileModal(false);
      trackEvent('profile_updated');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateReferral = async () => {
    if (!referralEmail) {
      toast.error('Email is required');
      return;
    }
    
    try {
      setIsLoading(true);
      await createReferral(referralEmail, referralName, referralJobType);
      setReferralEmail('');
      setReferralName('');
      setReferralJobType('');
      setShowReferralModal(false);
      loadReferrals();
    } catch (error) {
      console.error('Error creating referral:', error);
    } finally {
      setIsLoading(false);
    }
  };  
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshing={isRefreshing}
        onRefresh={loadReferrals}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#03449e', '#0967d2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <Title style={styles.headerTitle}>DevGnan</Title>
              <View style={styles.headerActions}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    {userType === 'professional' ? 'Pro' : 'Student'}
                  </Text>
                  <Switch
                    value={userType === 'professional'}
                    onValueChange={handleToggleUserType}
                    color={theme.colors.primaryContainer}
                  />
                </View>
                <IconButton
                  icon="logout"
                  iconColor="white"
                  size={24}
                  onPress={signOut}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => setShowProfileModal(true)}
            >
              <TouchableOpacity onPress={selectProfileImage}>
                <Avatar.Image 
                  size={70} 
                  source={{ uri: profileData.avatar }}
                  style={styles.profileAvatar}
                />
                <View style={styles.cameraIconOverlay}>
                  <MaterialIcons name="camera-alt" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.profileRole}>{profileData.role}</Text>
                <Text style={styles.profileCompany}>{profileData.company}</Text>
                <Text style={styles.referralCodeText}>Code: {profileData.referralCode}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional/Student Find Buttons Based on User Type */}
        <StudentFindProfessionalsButton navigation={navigation} />
        <ProfessionalFindStudentsButton navigation={navigation} />

        {/* Check Referral Offers/Sent Offers Buttons Based on User Type */}
        {userType === 'student' && (
          <View style={styles.offersButtonContainer}>
            <Button 
              mode="contained" 
              icon="inbox-arrow-down" 
              onPress={() => navigation.navigate('ReferralOffers')}
              style={styles.offersButton}
            >
              Check Referral Offers
            </Button>
          </View>
        )}

        {userType === 'professional' && (
          <View style={styles.offersButtonContainer}>
            <Button 
              mode="contained" 
              icon="inbox-arrow-up" 
              onPress={() => navigation.navigate('SentReferralOffers')}
              style={styles.offersButton}
            >
              View Sent Offers
            </Button>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Referral Statistics</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{referralStats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>{referralStats.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{referralStats.successful}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Progress</Text>
                <ProgressBar 
                  progress={0.33} 
                  color={theme.colors.primary} 
                  style={styles.progressBar}
                />
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>0</Text>
                  <Text style={styles.progressText}>Level 10</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsContainer}>
          <Card style={styles.rewardsCard}>
            <LinearGradient
              colors={['#03449e', '#0967d2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardsGradient}
            >
              <View style={styles.rewardsContent}>
                <View>
                  <Text style={styles.rewardsLabel}>Total Rewards Earned</Text>
                  <Text style={styles.rewardsAmount}>₹{referralStats.rewards}</Text>
                </View>
                <FontAwesome5 name="rupee-sign" size={36} color="rgba(255,255,255,0.4)" />
              </View>
            </LinearGradient>
          </Card>
        </View>        
        
        {/* Share Referral Section */}
        <View style={styles.shareContainer}>
          <Card style={styles.shareCard}>
            <Card.Content style={styles.shareContent}>
              <View style={styles.shareTextContainer}>
                <Text style={styles.shareTitle}>Share Your Referral</Text>
                <Text style={styles.shareDescription}>
                  Invite friends and colleagues to join DevGnan and earn rewards!
                </Text>
              </View>
              <View style={styles.shareButtonsContainer}>
                <Button 
                  mode="contained" 
                  onPress={shareReferral}
                  icon="share"
                  style={styles.shareButton}
                >
                  Share
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowReferralModal(true)}
                  icon="plus"
                  style={styles.newReferralButton}
                >
                  New
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>        
        
        {/* Recent Referrals Section */}
        <View style={styles.referralsContainer}>
          <Text style={styles.referralsTitle}>Recent Referrals</Text>
          {recentReferrals.length > 0 ? (
            <View style={styles.referralsList}>
              {recentReferrals.map((referral) => (
                <ReferralCard key={referral.id} referral={referral} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyReferrals}>
              <Text style={styles.emptyReferralsText}>
                No referrals yet. Tap 'New' to create your first referral!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Profile Edit Modal */}
      <Portal>
        <Modal
          visible={showProfileModal}
          onDismiss={() => setShowProfileModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Edit Profile</Title>
            
            <TextInput
              label="Full Name"
              value={profileName}
              onChangeText={setProfileName}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <TextInput
              label={userType === 'professional' ? 'Job Title' : 'Field of Study'}
              value={profileRole}
              onChangeText={setProfileRole}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <TextInput
              label={userType === 'professional' ? 'Company' : 'University'}
              value={profileCompany}
              onChangeText={setProfileCompany}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowProfileModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={saveProfile}
                loading={isLoading}
                style={[styles.modalButton, styles.saveButton]}
              >
                Save
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
      
      {/* New Referral Modal */}
      <Portal>
        <Modal
          visible={showReferralModal}
          onDismiss={() => setShowReferralModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>New Referral</Title>
            
            <TextInput
              label="Contact Email *"
              value={referralEmail}
              onChangeText={setReferralEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
            />
            
            <TextInput
              label="Contact Name (Optional)"
              value={referralName}
              onChangeText={setReferralName}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <TextInput
              label="Job Type (Optional)"
              value={referralJobType}
              onChangeText={setReferralJobType}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowReferralModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreateReferral}
                loading={isLoading}
                style={[styles.modalButton, styles.saveButton]}
              >
                Create
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerContent: {
    padding: 16,
    paddingTop: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  switchLabel: {
    color: 'white',
    fontSize: 14,
    marginRight: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },  
  profileAvatar: {
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraIconOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  profileCompany: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  referralCodeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  offersButtonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  offersButton: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsCard: {
    borderRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#243b53',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#627d98',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334e68',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d9e2ec',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#829ab1',
  },
  rewardsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  rewardsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  rewardsGradient: {
    padding: 16,
    borderRadius: 16,
  },
  rewardsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  rewardsAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  shareContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  shareCard: {
    borderRadius: 16,
  },  
  shareContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#243b53',
  },
  shareDescription: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 4,
  },
  shareButtonsContainer: {
    flexDirection: 'column',
  },
  shareButton: {
    borderRadius: 8,
    marginBottom: 8,
  },
  newReferralButton: {
    borderRadius: 8,
  },
  referralsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  referralsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#243b53',
    marginBottom: 16,
  },  
  referralsList: {
    marginBottom: 16,
  },
  emptyReferrals: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  emptyReferralsText: {
    color: '#627d98',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#0967d2',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
});