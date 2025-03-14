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
  useTheme,
  Chip,
  Portal,
  Modal,
  Title,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { db, useAuth, USER_TYPES } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner-native';
import { LinearGradient } from 'expo-linear-gradient';
const RequestDetailScreen = ({ route, navigation }) => {
  const { request } = route.params;
  const { userProfile, trackEvent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const theme = useTheme();

  const isStudent = userProfile?.userType === USER_TYPES.STUDENT;
  const isOwner = isStudent 
    ? request.studentId === userProfile.uid 
    : request.professionalId === userProfile.uid;

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkComplete = async () => {
    if (!isOwner || !request) return;
    
    try {
      setIsLoading(true);
      
      // Update the request status
      await updateDoc(doc(db, 'referralRequests', request.id), {
        status: 'completed',
        completionMessage,
        completedAt: serverTimestamp(),
        completedBy: userProfile.uid,
        updatedAt: serverTimestamp()
      });
      
      trackEvent('marked_request_complete', {
        request_id: request.id,
        userType: userProfile.userType
      });
      
      setShowCompletionModal(false);
      toast.success('Request marked as complete');
      
      // Navigate back to the list
      if (isStudent) {
        navigation.navigate('RequestsTracker');
      } else {
        navigation.navigate('ProfessionalRequests');
      }
      
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to update request status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!isOwner || !request) return;
    
    try {
      setIsLoading(true);
      
      // Update the request status
      await updateDoc(doc(db, 'referralRequests', request.id), {
        status: 'cancelled',
        cancelReason,
        cancelledAt: serverTimestamp(),
        cancelledBy: userProfile.uid,
        updatedAt: serverTimestamp()
      });
      
      trackEvent('cancelled_request', {
        request_id: request.id,
        userType: userProfile.userType
      });
      
      setShowCancelModal(false);
      toast.success('Request cancelled successfully');
      
      // Navigate back to the list
      if (isStudent) {
        navigation.navigate('RequestsTracker');
      } else {
        navigation.navigate('ProfessionalRequests');
      }
      
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setIsLoading(false);
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

  const canComplete = () => {
    if (!isOwner) return false;
    
    if (isStudent) {
      return request.status === 'accepted' || request.status === 'payment_completed';
    } else {
      return request.status === 'accepted' || request.status === 'payment_completed';
    }
  };

  const canCancel = () => {
    if (!isOwner) return false;
    
    return request.status === 'pending' || 
      request.status === 'accepted' || 
      request.status === 'payment_requested';
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={['#03449e', '#0967d2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <View style={styles.statusChipContainer}>
                {getStatusChip(request.status)}
              </View>
              <Text style={styles.statusDate}>
                Last updated: {formatDate(request.updatedAt)}
              </Text>
            </View>
          </LinearGradient>
        </Card>

        {/* Job Details Card */}
        <Card style={styles.detailCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Job Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Position:</Text>
              <Text style={styles.detailValue}>{request.jobPosition}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company:</Text>
              <Text style={styles.detailValue}>{request.company}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
            </View>
            {request.message && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.messageLabel}>Request Message:</Text>
                <Text style={styles.message}>"{request.message}"</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Contact Details Card */}
        <Card style={styles.detailCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              {isStudent ? 'Professional' : 'Student'} Details
            </Text>
            <View style={styles.contactInfo}>
              <Avatar.Image
                source={{ 
                  uri: isStudent 
                    ? request.professionalImage 
                    : `https://api.a0.dev/assets/image?text=student&aspect=1:1&seed=${request.studentId?.substring(0, 5)}` 
                }}
                size={60}
                style={styles.contactAvatar}
              />
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>
                  {isStudent ? request.professionalName : request.studentName || request.studentEmail}
                </Text>
                <Text style={styles.contactEmail}>
                  {isStudent ? request.professionalEmail || 'No email provided' : request.studentEmail}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Payment Details Card (if applicable) */}
        {request.paymentRequired && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.paymentAmount}>
                <Text style={styles.paymentLabel}>Amount:</Text>
                <Text style={styles.paymentValue}>₹{request.paymentAmount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {request.status === 'payment_requested' && 'Awaiting payment'}
                  {request.status === 'payment_accepted' && 'Payment pending'}
                  {request.status === 'payment_rejected' && 'Payment rejected'}
                  {request.status === 'payment_completed' && 'Payment completed'}
                  {!['payment_requested', 'payment_accepted', 'payment_rejected', 'payment_completed'].includes(request.status) && 'N/A'}
                </Text>
              </View>
              {request.paymentMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{request.paymentMethod}</Text>
                </View>
              )}
              {request.paymentDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(request.paymentDate)}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Professional Message (if exists) */}
        {request.professionalMessage && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Professional's Message</Text>
              <Text style={styles.message}>"{request.professionalMessage}"</Text>
            </Card.Content>
          </Card>
        )}

        {/* Completion Message (if exists) */}
        {request.completionMessage && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Completion Notes</Text>
              <Text style={styles.message}>"{request.completionMessage}"</Text>
              {request.completedAt && (
                <Text style={styles.completedDate}>
                  Completed on {formatDate(request.completedAt)} at {formatTime(request.completedAt)}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Cancellation Reason (if exists) */}
        {request.cancelReason && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Cancellation Reason</Text>
              <Text style={styles.message}>"{request.cancelReason}"</Text>
              {request.cancelledAt && (
                <Text style={styles.cancelledDate}>
                  Cancelled on {formatDate(request.cancelledAt)} at {formatTime(request.cancelledAt)}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        {(canComplete() || canCancel()) && (
          <View style={styles.actionButtonsContainer}>
            {canComplete() && (
              <Button
                mode="contained"
                icon="check-circle"
                onPress={() => setShowCompletionModal(true)}
                style={[styles.actionButton, styles.completeButton]}
              >
                Mark as Complete
              </Button>
            )}
            {canCancel() && (
              <Button
                mode="outlined"
                icon="cancel"
                onPress={() => setShowCancelModal(true)}
                style={[styles.actionButton, styles.cancelButton]}
              >
                Cancel Request
              </Button>
            )}
          </View>
        )}

        {/* Pay Now Button (if student and payment requested) */}
        {isStudent && request.status === 'payment_requested' && (
          <View style={styles.payButtonContainer}>
            <Button
              mode="contained"
              icon="cash"
              onPress={() => navigation.navigate('PaymentScreen', { request })}
              style={styles.payButton}
            >
              Pay Now - ₹{request.paymentAmount}
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Completion Modal */}
      <Portal>
        <Modal
          visible={showCompletionModal}
          onDismiss={() => setShowCompletionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Mark as Complete</Title>
            <Text style={styles.modalText}>
              {isStudent 
                ? "Confirm that the professional has provided the referral as agreed." 
                : "Confirm that you've completed the referral for this student."
              }
            </Text>
            <TextInput
              label="Completion Notes (Optional)"
              value={completionMessage}
              onChangeText={setCompletionMessage}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              placeholder="Add any notes about the referral completion..."
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowCompletionModal(false)}
                style={styles.modalButton}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleMarkComplete}
                loading={isLoading}
                style={[styles.modalButton, styles.completeModalButton]}
              >
                Confirm Completion
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Cancel Modal */}
      <Portal>
        <Modal
          visible={showCancelModal}
          onDismiss={() => setShowCancelModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Cancel Request</Title>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this referral request?
            </Text>
            <TextInput
              label="Reason for Cancellation"
              value={cancelReason}
              onChangeText={setCancelReason}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              placeholder="Please provide a reason for cancellation..."
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowCancelModal(false)}
                style={styles.modalButton}
                disabled={isLoading}
              >
                Go Back
              </Button>
              <Button
                mode="contained"
                onPress={handleCancelRequest}
                loading={isLoading}
                style={[styles.modalButton, styles.cancelModalButton]}
                disabled={!cancelReason.trim()}
              >
                Cancel Request
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
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  statusChipContainer: {
    marginBottom: 8,
  },
  statusChip: {
    height: 32,
  },
  statusDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  detailCard: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#627d98',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#334e68',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    marginVertical: 12,
  },
  messageLabel: {
    fontSize: 16,
    color: '#627d98',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#334e68',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    marginRight: 16,
    backgroundColor: '#f0f4f8',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 14,
    color: '#627d98',
  },
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#627d98',
  },
  paymentValue: {
    fontSize: 24,
    color: '#0967d2',
    fontWeight: 'bold',
  },
  completedDate: {
    marginTop: 8,
    fontSize: 14,
    color: '#0d5626',
    textAlign: 'right',
  },
  cancelledDate: {
    marginTop: 8,
    fontSize: 14,
    color: '#841d29',
    textAlign: 'right',
  },
  actionButtonsContainer: {
    margin: 16,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  completeButton: {
    backgroundColor: '#0d5626',
  },
  cancelButton: {
    borderColor: '#841d29',
    borderWidth: 1,
  },
  payButtonContainer: {
    margin: 16,
    marginTop: 24,
  },
  payButton: {
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
  },
  modalText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#627d98',
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  completeModalButton: {
    backgroundColor: '#0d5626',
  },
  cancelModalButton: {
    backgroundColor: '#841d29',
  },
});

export default RequestDetailScreen;