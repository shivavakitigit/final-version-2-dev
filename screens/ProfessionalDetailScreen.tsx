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
  Card, 
  Avatar, 
  Button, 
  Chip, 
  Divider,
  useTheme,
  Portal,
  Modal,
  TextInput,
  Title
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { db, useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, setDoc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner-native';

const ProfessionalDetailScreen = ({ route, navigation }) => {
  const { professional } = route.params;
  const { userProfile, trackEvent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [jobPosition, setJobPosition] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const theme = useTheme();

  const handleSendRequest = async () => {
    if (!jobPosition.trim()) {
      toast.error('Please enter the job position');
      return;
    }

    if (!company.trim()) {
      toast.error('Please enter the company name');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a unique ID for the request
      const requestId = `${userProfile.uid}_to_${professional.id}_${Date.now()}`;
      
      // Create the request document
      const requestData = {
        id: requestId,
        studentId: userProfile.uid,
        studentName: userProfile.displayName || userProfile.email,
        studentEmail: userProfile.email,
        professionalId: professional.id,
        professionalName: professional.name,
        jobPosition,
        company,
        message: message.trim(),
        status: 'pending', // pending, accepted, declined
        paymentRequired: null, // null until professional responds
        paymentAmount: null, // null until professional responds
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'referralRequests', requestId), requestData);
      
      // Update student stats
      await updateDoc(doc(db, 'users', userProfile.uid), {
        sentRequests: increment(1)
      });
      
      trackEvent('sent_referral_request', {
        professional_id: professional.id,
        company: company
      });
      
      setShowRequestModal(false);
      toast.success('Request sent successfully!');
      
      // Clear form
      setJobPosition('');
      setCompany('');
      setMessage('');
      
      // Navigate to request tracking screen
      navigation.navigate('RequestsTracker');
      
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <ScrollView>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Profile</Text>
        </View>
        
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <LinearGradient
            colors={['#03449e', '#0967d2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <Avatar.Image 
              source={{ uri: professional.photoURL }} 
              size={100} 
              style={styles.avatar}
            />
          </LinearGradient>
          
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileName}>{professional.name}</Text>
              {professional.successfulReferrals > 0 && (
                <MaterialIcons name="verified" size={20} color="#4CAF50" />
              )}
            </View>
            
            <Text style={styles.profileTitle}>{professional.jobTitle}</Text>
            <Text style={styles.profileCompany}>{professional.company}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{professional.experience}</Text>
                <Text style={styles.statLabel}>Years Exp.</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{professional.successfulReferrals}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{professional.industry}</Text>
                <Text style={styles.statLabel}>Industry</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Skills Section */}
        {professional.skills && professional.skills.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Skills & Expertise</Text>
              <View style={styles.skillsContainer}>
                {professional.skills.map((skill, index) => (
                  <Chip 
                    key={index}
                    style={styles.skillChip}
                    textStyle={styles.skillChipText}
                  >
                    {skill}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        
        {/* Referral Cost Notice */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Referral Information</Text>
            <Text style={styles.infoText}>
              This professional may require a payment for referrals based on their time and effort. 
              After submitting your request, they will review it and may ask for a fee between 
              ₹5,000 - ₹10,000 or offer a free referral.
            </Text>
            
            <Text style={styles.infoHighlight}>
              Payment is only required if both parties agree and the professional accepts your request.
            </Text>
          </Card.Content>
        </Card>
        
        {/* Request Button */}
        <View style={styles.requestButtonContainer}>
          <Button 
            mode="contained"
            onPress={() => setShowRequestModal(true)}
            style={styles.requestButton}
            icon="send"
          >
            Request Referral
          </Button>
        </View>
      </ScrollView>
      
      {/* Request Modal */}
      <Portal>
        <Modal
          visible={showRequestModal}
          onDismiss={() => setShowRequestModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Request Referral</Title>
            
            <TextInput
              label="Job Position *"
              value={jobPosition}
              onChangeText={setJobPosition}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g. Software Engineer, Data Scientist"
            />
            
            <TextInput
              label="Company Name *"
              value={company}
              onChangeText={setCompany}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g. Google, Amazon, Microsoft"
            />
            
            <TextInput
              label="Message (Optional)"
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              placeholder="Introduce yourself and explain why you're interested in this position"
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowRequestModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSendRequest}
                loading={isLoading}
                style={[styles.modalButton, styles.sendButton]}
                disabled={!jobPosition.trim() || !company.trim()}
              >
                Send Request
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
    padding: 16,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileHeader: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  avatar: {
    marginBottom: -50,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: '#f0f4f8',
  },
  profileContent: {
    paddingTop: 60,
    alignItems: 'center',
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
  },
  profileTitle: {
    fontSize: 16,
    color: '#334e68',
    marginTop: 4,
  },
  profileCompany: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
  },
  statLabel: {
    fontSize: 12,
    color: '#627d98',
    marginTop: 4,
  },
  statDivider: {
    height: 30,
    width: 1,
    backgroundColor: '#d9e2ec',
  },
  sectionCard: {
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
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: 4,
    backgroundColor: '#e6f6ff',
  },
  skillChipText: {
    color: '#0967d2',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627d98',
    marginBottom: 12,
  },
  infoHighlight: {
    fontSize: 14,
    lineHeight: 20,
    color: '#103262',
    fontWeight: '600',
  },
  requestButtonContainer: {
    margin: 24,
  },
  requestButton: {
    padding: 8,
    borderRadius: 8,
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
  sendButton: {
    marginLeft: 8,
  },
});

export default ProfessionalDetailScreen;