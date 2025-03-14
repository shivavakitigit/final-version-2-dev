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
  TextInput,
  SegmentedButtons
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { db, useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner-native';
const ProfessionalRequestsScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [requestAction, setRequestAction] = useState('accept');
  const [respondMessage, setRespondMessage] = useState('');
  const theme = useTheme();

  useEffect(() => {
    if (userProfile?.userType === 'professional') {
      loadRequests();
    } else {
      // If not a professional, redirect to home
      navigation.replace('Home');
    }
  }, [userProfile]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      
      // Query Firestore for requests made to this professional
      const requestsQuery = query(
        collection(db, 'referralRequests'),
        where('professionalId', '==', userProfile.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          studentName: data.studentName,
          studentId: data.studentId,
          studentEmail: data.studentEmail,
          jobPosition: data.jobPosition,
          company: data.company,
          status: data.status,
          paymentRequired: data.paymentRequired,
          paymentAmount: data.paymentAmount,
          message: data.message,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          studentImage: `https://api.a0.dev/assets/image?text=indian%20student%20headshot&aspect=1:1&seed=${data.studentId.substring(0, 5)}`,
        });
      });
      
      setRequests(requestsData);
      trackEvent('viewed_professional_requests');
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsProcessing(true);
      
      let updateData = {
        updatedAt: new Date()
      };
      
      if (requestAction === 'accept') {
        // Free referral
        updateData.status = 'accepted';
        updateData.paymentRequired = false;
        if (respondMessage) {
          updateData.professionalMessage = respondMessage;
        }
      } else if (requestAction === 'payment') {
        // Request payment
        if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
          toast.error('Please enter a valid payment amount');
          return;
        }
        
        updateData.status = 'payment_requested';
        updateData.paymentRequired = true;
        updateData.paymentAmount = parseFloat(paymentAmount);
        if (respondMessage) {
          updateData.professionalMessage = respondMessage;
        }
      } else {
        // Decline
        updateData.status = 'declined';
        if (respondMessage) {
          updateData.professionalMessage = respondMessage;
        }
      }
      
      // Update the request in Firestore
      await updateDoc(doc(db, 'referralRequests', selectedRequest.id), updateData);
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? {...req, ...updateData, updatedAt: new Date()} 
            : req
        )
      );
      
      trackEvent('responded_to_request', {
        action: requestAction,
        student_id: selectedRequest.studentId,
      });
      
      setShowActionModal(false);
      toast.success(`Request ${requestAction === 'accept' ? 'accepted' : requestAction === 'payment' ? 'payment requested' : 'declined'} successfully`);
      
      // Reset form
      setPaymentAmount('');
      setRespondMessage('');
      setRequestAction('accept');
      
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to respond to request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewRequest = (request) => {
    if (request.status === 'pending') {
      setSelectedRequest(request);
      setShowActionModal(true);
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
            Completed
          </Chip>
        );
      case 'cancelled':
        return (
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#e2e8f0' }]}
            textStyle={{ color: '#475569' }}
            icon="cancel"
          >
            Cancelled
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
          source={{ uri: item.studentImage }} 
          size={50} 
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.jobPosition}>{item.jobPosition}</Text>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.student}>
            <Text style={styles.label}>Student: </Text>
            {item.studentName || item.studentEmail}
          </Text>
          
          <View style={styles.dateContainer}>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {getStatusChip(item.status)}
            
            {item.paymentRequired && item.paymentAmount && (
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
        <Text style={styles.headerTitle}>Student Referral Requests</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
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
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>
                When students send you referral requests, they will appear here.
              </Text>
            </View>
          )}
        </>
      )}
      
      {/* Action Modal */}
      <Portal>
        <Modal
          visible={showActionModal}
          onDismiss={() => setShowActionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Respond to Request</Title>
            
            {selectedRequest && (
              <View style={styles.modalRequestInfo}>
                <Avatar.Image 
                  source={{ uri: selectedRequest.studentImage }} 
                  size={50} 
                  style={styles.modalAvatar}
                />
                <View style={styles.modalRequestDetails}>
                  <Text style={styles.modalStudentName}>
                    {selectedRequest.studentName || selectedRequest.studentEmail}
                  </Text>
                  <Text style={styles.modalJobInfo}>
                    {selectedRequest.jobPosition} at {selectedRequest.company}
                  </Text>
                  {selectedRequest.message && (
                    <Text style={styles.modalMessage}>
                      "{selectedRequest.message}"
                    </Text>
                  )}
                </View>
              </View>
            )}
            
            <View style={styles.actionSegment}>
              <SegmentedButtons
                value={requestAction}
                onValueChange={setRequestAction}
                buttons={[
                  {
                    value: 'accept',
                    label: 'Accept (Free)',
                    icon: 'check',
                    style: requestAction === 'accept' ? { backgroundColor: '#d1fadf' } : {}
                  },
                  {
                    value: 'payment',
                    label: 'Request Payment',
                    icon: 'cash',
                    style: requestAction === 'payment' ? { backgroundColor: '#eadeff' } : {}
                  },
                  {
                    value: 'decline',
                    label: 'Decline',
                    icon: 'close',
                    style: requestAction === 'decline' ? { backgroundColor: '#ffccd6' } : {}
                  },
                ]}
              />
            </View>
            
            {requestAction === 'payment' && (
              <TextInput
                label="Payment Amount (₹)"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.modalInput}
                placeholder="e.g. 5000"
                left={<TextInput.Icon icon="currency-inr" />}
              />
            )}
            
            <TextInput
              label="Message (Optional)"
              value={respondMessage}
              onChangeText={setRespondMessage}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.modalInput}
              placeholder={
                requestAction === 'accept' 
                  ? "Add instructions or details for the referral" 
                  : requestAction === 'payment'
                  ? "Explain why you're requesting payment"
                  : "Provide a reason for declining"
              }
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowActionModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleRespondToRequest}
                loading={isProcessing}
                style={[
                  styles.modalButton, 
                  requestAction === 'accept' 
                    ? styles.acceptButton 
                    : requestAction === 'payment'
                    ? styles.paymentButton
                    : styles.declineButton
                ]}
                disabled={requestAction === 'payment' && (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0)}
              >
                {requestAction === 'accept' 
                  ? 'Accept Request' 
                  : requestAction === 'payment'
                  ? 'Request Payment'
                  : 'Decline Request'}
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
  student: {
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
  modalRequestInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  modalAvatar: {
    marginRight: 12,
    backgroundColor: '#f0f4f8',
  },
  modalRequestDetails: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334e68',
  },
  modalJobInfo: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 2,
  },
  modalMessage: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionSegment: {
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
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
    backgroundColor: '#0d5626',
  },
  paymentButton: {
    backgroundColor: '#5e139e',
  },
  declineButton: {
    backgroundColor: '#841d29',
  },
});

export default ProfessionalRequestsScreen;