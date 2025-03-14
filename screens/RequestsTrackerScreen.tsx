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
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { db, useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner-native';


const RequestsTrackerScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (userProfile?.userType === 'student') {
      loadRequests();
    } else {
      // If not a student, redirect to professional requests screen
      navigation.replace('ProfessionalRequests');
    }
  }, [userProfile]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      
      // Query Firestore for requests made by this student
      const requestsQuery = query(
        collection(db, 'referralRequests'),
        where('studentId', '==', userProfile.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          professionalName: data.professionalName,
          professionalId: data.professionalId,
          jobPosition: data.jobPosition,
          company: data.company,
          status: data.status,
          paymentRequired: data.paymentRequired,
          paymentAmount: data.paymentAmount,
          message: data.message,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          professionalImage: `https://api.a0.dev/assets/image?text=indian%20professional%20headshot&aspect=1:1&seed=${data.professionalId.substring(0, 5)}`,
        });
      });
      
      setRequests(requestsData);
      trackEvent('viewed_request_tracker');
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load your requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPayment = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      // Update the request status
      await updateDoc(doc(db, 'referralRequests', selectedRequest.id), {
        status: 'payment_accepted',
        updatedAt: new Date()
      });
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? {...req, status: 'payment_accepted', updatedAt: new Date()} 
            : req
        )
      );
      
      trackEvent('accepted_payment_request', {
        professional_id: selectedRequest.professionalId,
        amount: selectedRequest.paymentAmount,
      });
      
      setShowPaymentModal(false);
      toast.success('Payment accepted. Proceed to complete the payment.');
      
      // Here you would navigate to a payment screen
      // For now, just simulate navigation
      navigation.navigate('PaymentScreen', { request: selectedRequest });
      
    } catch (error) {
      console.error('Error accepting payment:', error);
      toast.error('Failed to accept payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      // Update the request status
      await updateDoc(doc(db, 'referralRequests', selectedRequest.id), {
        status: 'payment_rejected',
        updatedAt: new Date()
      });
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? {...req, status: 'payment_rejected', updatedAt: new Date()} 
            : req
        )
      );
      
      trackEvent('rejected_payment_request', {
        professional_id: selectedRequest.professionalId,
      });
      
      setShowPaymentModal(false);
      toast.success('Payment request rejected');
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewRequest = (request) => {
    if (request.status === 'payment_requested') {
      setSelectedRequest(request);
      setShowPaymentModal(true);
    } else {
      // Navigate to request detail
      navigation.navigate('RequestDetail', { request });
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
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
      case 'payment_requested':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#eadeff' }]}
            textStyle={{ color: '#5e139e' }}
            icon="currency-inr"
          >
            Payment Required
          </Chip>
        );
      case 'payment_accepted':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#bfdbfe' }]}
            textStyle={{ color: '#1e3a8a' }}
            icon="cash"
          >
            Payment Pending
          </Chip>
        );
      case 'payment_rejected':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#ffccd6' }]}
            textStyle={{ color: '#841d29' }}
            icon="close-circle"
          >
            Payment Rejected
          </Chip>
        );
      case 'payment_completed':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#d1fadf' }]}
            textStyle={{ color: '#0d5626' }}
            icon="check-circle"
          >
            Payment Completed
          </Chip>
        );
      case 'completed':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#d1fadf' }]}
            textStyle={{ color: '#0d5626' }}
            icon="star"
          >
            Referral Completed
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

  const renderRequestCard = ({ item }) => (
    <Card style={styles.card} onPress={() => handleViewRequest(item)}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Image 
          source={{ uri: item.professionalImage }} 
          size={50} 
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.jobPosition}>{item.jobPosition}</Text>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.professional}>
            <Text style={styles.label}>Professional: </Text>
            {item.professionalName}
          </Text>
          
          <View style={styles.dateContainer}>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {getStatusChip(item.status)}
            
            {item.paymentRequired && item.status === 'payment_requested' && (
              <Chip 
                style={[styles.amountChip]}
                textStyle={{ color: '#5e139e' }}
                icon="currency-inr"
              >
                ₹{item.paymentAmount}
              </Chip>
            )}
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
        <Text style={styles.headerTitle}>Your Referral Requests</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <>
          {requests.length > 0 ? (
            <FlatList
              data={requests}
              renderItem={renderRequestCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No requests found</Text>
              <Text style={styles.emptySubtext}>
                Start by finding a professional and requesting a referral
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('ProfessionalList')}
                style={styles.findButton}
                icon="search"
              >
                Find Professionals
              </Button>
            </View>
          )}
        </>
      )}
      
      {/* Payment Confirmation Modal */}
      <Portal>
        <Modal
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Payment Request</Title>
            
            <View style={styles.modalProfessionalInfo}>
              <Avatar.Image 
                source={{ uri: selectedRequest?.professionalImage }} 
                size={60} 
                style={styles.modalAvatar}
              />
              <View>
                <Text style={styles.modalProfessionalName}>
                  {selectedRequest?.professionalName}
                </Text>
                <Text style={styles.modalJobInfo}>
                  {selectedRequest?.jobPosition} at {selectedRequest?.company}
                </Text>
              </View>
            </View>
            
            <View style={styles.paymentInfoContainer}>
              <Text style={styles.paymentInfoText}>
                The professional has requested a payment of:
              </Text>
              <Text style={styles.paymentAmount}>
                ₹{selectedRequest?.paymentAmount}
              </Text>
              <Text style={styles.paymentDescription}>
                This payment covers the professional's time and effort in referring you
                to this position. Accepting will take you to a payment screen.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={handleRejectPayment}
                style={styles.modalButton}
                icon="close"
                loading={isProcessing}
                disabled={isProcessing}
              >
                Decline
              </Button>
              <Button 
                mode="contained" 
                onPress={handleAcceptPayment}
                style={[styles.modalButton, styles.acceptButton]}
                icon="check"
                loading={isProcessing}
                disabled={isProcessing}
              >
                Accept & Pay
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
  requestInfo: {
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 12,
    color: '#829ab1',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
    marginRight: 8,
  },
  amountChip: {
    height: 24,
    backgroundColor: '#f3e8ff',
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
  findButton: {
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
  modalProfessionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    marginRight: 16,
    backgroundColor: '#f0f4f8',
  },
  modalProfessionalName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalJobInfo: {
    fontSize: 14,
    color: '#627d98',
  },
  paymentInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#334e68',
    textAlign: 'center',
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0967d2',
    textAlign: 'center',
    marginVertical: 8,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#627d98',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  acceptButton: {
    marginLeft: 8,
  },
});

export default RequestsTrackerScreen;