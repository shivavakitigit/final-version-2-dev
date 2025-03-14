import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  Chip, 
  useTheme,
  Portal,
  Modal,
  Title,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { db, useAuth, USER_TYPES } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';

import { toast } from 'sonner-native';

const SentReferralOffersScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [sentOffers, setSentOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (userProfile) {
      if (userProfile?.userType === USER_TYPES.PROFESSIONAL) {
        loadSentOffers();
      } else {
        // If not a professional, redirect to student offers screen
        navigation.replace('ReferralOffers');
      }
    }
  }, [userProfile]);

  const loadSentOffers = async () => {
    try {
      setIsLoading(true);
      
      // Check if userProfile and uid exist before querying
      if (!userProfile || !userProfile.uid) {
        console.error('User profile or UID is undefined');
        toast.error('Unable to load referral offers');
        setIsLoading(false);
        return;
      }
      
      // Query Firestore for referral offers sent by this professional
      const offersQuery = query(
        collection(db, 'referralOffers'),
        where('professionalId', '==', userProfile.uid), // Guaranteed to be defined now
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(offersQuery);
      const offersData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        offersData.push({
          id: doc.id,
          studentName: data.studentName,
          studentId: data.studentId,
          studentEmail: data.studentEmail,
          jobPosition: data.jobPosition,
          company: data.company,
          message: data.message,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          studentImage: `https://api.a0.dev/assets/image?text=indian%20student%20headshot&aspect=1:1&seed=${data.studentId?.substring(0, 5) || ''}`,
        });
      });
      
      setSentOffers(offersData);
      
      trackEvent('viewed_sent_referral_offers');
    } catch (error) {
      console.error('Error loading sent referral offers:', error);
      toast.error('Failed to load sent offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  const handleMarkComplete = async () => {
    if (!selectedOffer) return;
    
    try {
      // Update the offer status in Firestore
      await updateDoc(doc(db, 'referralOffers', selectedOffer.id), {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
      
      // Update the local state
      setSentOffers(prev => 
        prev.map(offer => 
          offer.id === selectedOffer.id 
            ? {...offer, status: 'completed', updatedAt: new Date()} 
            : offer
        )
      );
      
      trackEvent('completed_referral_offer', {
        student_id: selectedOffer.studentId,
        company: selectedOffer.company
      });
      
      setShowOfferModal(false);
      toast.success('Referral marked as completed');
      
    } catch (error) {
      console.error('Error marking referral as complete:', error);
      toast.error('Failed to update referral status');
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'offered':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#fff0c2' }]}
            textStyle={{ color: '#946500' }}
            icon="clock"
          >
            Pending
          </Chip>
        );
      case 'accepted':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#d1fadf' }]}
            textStyle={{ color: '#0d5626' }}
            icon="check-circle"
          >
            Accepted
          </Chip>
        );
      case 'declined':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#ffccd6' }]}
            textStyle={{ color: '#841d29' }}
            icon="close-circle"
          >
            Declined
          </Chip>
        );
      case 'completed':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#d1fadf' }]}
            textStyle={{ color: '#0d5626' }}
            icon="star"
          >
            Completed
          </Chip>
        );
      default:
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#f1f5f9' }]}
            textStyle={{ color: '#334e68' }}
          >
            {status}
          </Chip>
        );
    }
  };

  const renderOfferCard = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => handleViewOffer(item)}
    >
      <Card.Content style={styles.cardContent}>
        <Avatar.Image 
          source={{ uri: item.studentImage }} 
          size={50} 
          style={styles.avatar}
        />
        <View style={styles.offerInfo}>
          <Text style={styles.jobPosition}>{item.jobPosition}</Text>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.student}>
            <Text style={styles.label}>To: </Text>
            {item.studentName || item.studentEmail}
          </Text>
          
          <View style={styles.offerFooter}>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {getStatusChip(item.status)}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sent Referral Offers</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          icon="account-search" 
          onPress={() => navigation.navigate('StudentList')}
          style={styles.findStudentsButton}
        >
          Find Students
        </Button>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading sent offers...</Text>
        </View>
      ) : (
        <>
          {sentOffers.length > 0 ? (
            <FlatList
              data={sentOffers}
              renderItem={renderOfferCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="send" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No sent referral offers</Text>
              <Text style={styles.emptySubtext}>
                Find students and send them referral offers to help them in their career.
              </Text>
              <Button 
                mode="contained" 
                icon="account-search"
                onPress={() => navigation.navigate('StudentList')}
                style={styles.findStudentsEmptyButton}
              >
                Find Students to Refer
              </Button>
            </View>
          )}
        </>
      )}
      
      {/* Offer Detail Modal */}
      <Portal>
        <Modal
          visible={showOfferModal}
          onDismiss={() => setShowOfferModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedOffer && (
            <View style={styles.modalContent}>
              <Title style={styles.modalTitle}>Referral Offer Details</Title>
              
              {/* Student info */}
              <View style={styles.studentInfo}>
                <Avatar.Image 
                  source={{ uri: selectedOffer.studentImage }} 
                  size={60} 
                  style={styles.modalAvatar}
                />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>
                    {selectedOffer.studentName || 'Student'}
                  </Text>
                  <Text style={styles.studentEmail}>
                    {selectedOffer.studentEmail}
                  </Text>
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              {/* Job details */}
              <View style={styles.jobDetails}>
                <Text style={styles.jobLabel}>Position:</Text>
                <Text style={styles.jobValue}>{selectedOffer.jobPosition}</Text>
                
                <Text style={styles.jobLabel}>Company:</Text>
                <Text style={styles.jobValue}>{selectedOffer.company}</Text>
                
                <Text style={styles.jobLabel}>Sent on:</Text>
                <Text style={styles.jobValue}>
                  {new Date(selectedOffer.createdAt).toLocaleDateString()}
                </Text>
                
                <Text style={styles.jobLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  {getStatusChip(selectedOffer.status)}
                </View>
              </View>
              
              {/* Message if exists */}
              {selectedOffer.message && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.messageLabel}>Your Message:</Text>
                  <Text style={styles.messageContent}>
                    "{selectedOffer.message}"
                  </Text>
                </>
              )}
              
              {/* Mark as complete button - only for accepted referrals */}
              {selectedOffer.status === 'accepted' && (
                <Button 
                  mode="contained"
                  onPress={handleMarkComplete}
                  style={styles.completeButton}
                  icon="check-circle"
                >
                  Mark as Completed
                </Button>
              )}
              
              {/* Close button */}
              <Button 
                mode={selectedOffer.status === 'accepted' ? 'outlined' : 'contained'}
                onPress={() => setShowOfferModal(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          )}
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
  actionsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  findStudentsButton: {
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#f0f4f8',
  },
  offerInfo: {
    flex: 1,
  },
  jobPosition: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#334e68',
    marginBottom: 2,
  },
  student: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 6,
  },
  label: {
    color: '#829ab1',
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: '#829ab1',
  },
  statusChip: {
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#627d98',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#627d98',
    textAlign: 'center',
    marginBottom: 20,
  },
  findStudentsEmptyButton: {
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    marginRight: 16,
    backgroundColor: '#f0f4f8',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
  },
  studentEmail: {
    fontSize: 14,
    color: '#627d98',
  },
  divider: {
    marginVertical: 16,
  },
  jobDetails: {
    marginBottom: 16,
  },
  jobLabel: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 4,
  },
  jobValue: {
    fontSize: 16,
    color: '#334e68',
    fontWeight: '500',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  messageLabel: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 8,
  },
  messageContent: {
    fontSize: 16,
    color: '#334e68',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  completeButton: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: '#0d5626',
  },
  closeButton: {
    marginTop: 8,
  },
});

export default SentReferralOffersScreen;