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

const ReferralOffersScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (userProfile?.userType === USER_TYPES.STUDENT) {
      loadOffers();
    } else {
      // If not a student, redirect to professional offers screen
      navigation.replace('SentReferralOffers');
    }
  }, [userProfile]);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      
      // Query Firestore for referral offers sent to this student
      const offersQuery = query(
        collection(db, 'referralOffers'),
        where('studentId', '==', userProfile.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(offersQuery);
      const offersData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        offersData.push({
          id: doc.id,
          professionalName: data.professionalName,
          professionalId: data.professionalId,
          professionalEmail: data.professionalEmail,
          jobPosition: data.jobPosition,
          company: data.company,
          message: data.message,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          professionalImage: `https://api.a0.dev/assets/image?text=indian%20professional%20headshot&aspect=1:1&seed=${data.professionalId.substring(0, 5)}`,
        });
      });
      
      setOffers(offersData);
      
      trackEvent('viewed_referral_offers');
    } catch (error) {
      console.error('Error loading referral offers:', error);
      toast.error('Failed to load referral offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      setIsProcessing(true);
      
      // Update the offer status in Firestore
      await updateDoc(doc(db, 'referralOffers', selectedOffer.id), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      // Update the local state
      setOffers(prev => 
        prev.map(offer => 
          offer.id === selectedOffer.id 
            ? {...offer, status: 'accepted', updatedAt: new Date()} 
            : offer
        )
      );
      
      trackEvent('accepted_referral_offer', {
        professional_id: selectedOffer.professionalId,
        company: selectedOffer.company
      });
      
      setShowOfferModal(false);
      toast.success('Referral offer accepted');
      
    } catch (error) {
      console.error('Error accepting referral offer:', error);
      toast.error('Failed to accept offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      setIsProcessing(true);
      
      // Update the offer status in Firestore
      await updateDoc(doc(db, 'referralOffers', selectedOffer.id), {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
      
      // Update the local state
      setOffers(prev => 
        prev.map(offer => 
          offer.id === selectedOffer.id 
            ? {...offer, status: 'declined', updatedAt: new Date()} 
            : offer
        )
      );
      
      trackEvent('declined_referral_offer', {
        professional_id: selectedOffer.professionalId
      });
      
      setShowOfferModal(false);
      toast.success('Referral offer declined');
      
    } catch (error) {
      console.error('Error declining referral offer:', error);
      toast.error('Failed to decline offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'offered':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#fff0c2' }]}
            textStyle={{ color: '#946500' }}
            icon="bell"
          >
            New Offer
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
          source={{ uri: item.professionalImage }} 
          size={50} 
          style={styles.avatar}
        />
        <View style={styles.offerInfo}>
          <Text style={styles.jobPosition}>{item.jobPosition}</Text>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.professional}>
            <Text style={styles.label}>From: </Text>
            {item.professionalName}
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
        <Text style={styles.headerTitle}>Referral Offers</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      ) : (
        <>
          {offers.length > 0 ? (
            <FlatList
              data={offers}
              renderItem={renderOfferCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No referral offers yet</Text>
              <Text style={styles.emptySubtext}>
                When professionals send you referral offers, they will appear here.
              </Text>
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
              <Title style={styles.modalTitle}>Referral Offer</Title>
              
              {/* Professional info */}
              <View style={styles.professionalInfo}>
                <Avatar.Image 
                  source={{ uri: selectedOffer.professionalImage }} 
                  size={60} 
                  style={styles.modalAvatar}
                />
                <View style={styles.professionalDetails}>
                  <Text style={styles.professionalName}>
                    {selectedOffer.professionalName}
                  </Text>
                  <Text style={styles.professionalEmail}>
                    {selectedOffer.professionalEmail}
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
                
                <Text style={styles.jobLabel}>Date:</Text>
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
                  <Text style={styles.messageLabel}>Message:</Text>
                  <Text style={styles.messageContent}>
                    "{selectedOffer.message}"
                  </Text>
                </>
              )}
              
              {/* Action buttons - only show for 'offered' status */}
              {selectedOffer.status === 'offered' && (
                <View style={styles.actionButtons}>
                  <Button 
                    mode="outlined"
                    onPress={handleDeclineOffer}
                    style={styles.declineButton}
                    loading={isProcessing}
                    disabled={isProcessing}
                  >
                    Decline
                  </Button>
                  <Button 
                    mode="contained"
                    onPress={handleAcceptOffer}
                    style={styles.acceptButton}
                    loading={isProcessing}
                    disabled={isProcessing}
                  >
                    Accept
                  </Button>
                </View>
              )}
              
              {/* Close button for non-actionable statuses */}
              {selectedOffer.status !== 'offered' && (
                <Button 
                  mode="contained"
                  onPress={() => setShowOfferModal(false)}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              )}
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
  listContainer: {
    padding: 16,
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
  professional: {
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
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    marginRight: 16,
    backgroundColor: '#f0f4f8',
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
  },
  professionalEmail: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  declineButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#841d29',
  },
  acceptButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#0d5626',
  },
  closeButton: {
    marginTop: 24,
  },
});

export default ReferralOffersScreen;