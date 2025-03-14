import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
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
  Title,
  TextInput,
  SegmentedButtons,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { db, useAuth } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner-native';

const PaymentScreen = ({ route, navigation }) => {
  const { request } = route.params;
  const { userProfile, trackEvent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const theme = useTheme();

  const handlePayment = async () => {
    if (paymentMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter UPI ID');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would integrate with a payment gateway
      // For now, we'll simulate a successful payment after a delay
      
      // Delay to simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the request status in Firestore
      await updateDoc(doc(db, 'referralRequests', request.id), {
        status: 'payment_completed',
        paymentMethod,
        paymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      trackEvent('payment_completed', {
        professional_id: request.professionalId,
        amount: request.paymentAmount,
        payment_method: paymentMethod
      });
      
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigation.navigate('RequestsTracker');
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
          <Text style={styles.headerTitle}>Complete Payment</Text>
        </View>
        
        {/* Payment Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Professional:</Text>
              <Text style={styles.summaryValue}>{request.professionalName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Job Position:</Text>
              <Text style={styles.summaryValue}>{request.jobPosition}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Company:</Text>
              <Text style={styles.summaryValue}>{request.company}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Payment Amount:</Text>
              <Text style={styles.amountValue}>₹{request.paymentAmount}</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Payment Methods */}
        <Card style={styles.methodsCard}>
          <Card.Content>
            <Text style={styles.methodsTitle}>Select Payment Method</Text>
            
            <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
              <View style={styles.methodOption}>
                <RadioButton value="upi" />
                <View style={styles.methodContent}>
                  <Text style={styles.methodLabel}>UPI Payment</Text>
                  <Text style={styles.methodDesc}>Pay instantly using any UPI app</Text>
                  <View style={styles.upiLogos}>
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=GooglePay&aspect=1:1&seed=123' }} 
                      style={styles.upiLogo} 
                    />
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=PhonePe&aspect=1:1&seed=456' }} 
                      style={styles.upiLogo} 
                    />
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=BHIM&aspect=1:1&seed=789' }} 
                      style={styles.upiLogo} 
                    />
                  </View>
                  
                  {paymentMethod === 'upi' && (
                    <TextInput
                      label="Enter UPI ID"
                      value={upiId}
                      onChangeText={setUpiId}
                      mode="outlined"
                      style={styles.upiInput}
                      placeholder="yourname@upi"
                    />
                  )}
                </View>
              </View>
              
              <View style={styles.methodOption}>
                <RadioButton value="card" />
                <View style={styles.methodContent}>
                  <Text style={styles.methodLabel}>Credit/Debit Card</Text>
                  <Text style={styles.methodDesc}>Pay securely using your card</Text>
                  <View style={styles.cardLogos}>
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=VISA&aspect=1:1&seed=321' }} 
                      style={styles.cardLogo} 
                    />
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=MasterCard&aspect=1:1&seed=654' }} 
                      style={styles.cardLogo} 
                    />
                    <Image 
                      source={{ uri: 'https://api.a0.dev/assets/image?text=RuPay&aspect=1:1&seed=987' }} 
                      style={styles.cardLogo} 
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.methodOption}>
                <RadioButton value="bank" />
                <View style={styles.methodContent}>
                  <Text style={styles.methodLabel}>Net Banking</Text>
                  <Text style={styles.methodDesc}>Pay through your internet banking</Text>
                </View>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        {/* Payment Notes */}
        <Card style={styles.notesCard}>
          <Card.Content>
            <Text style={styles.notesTitle}>Important Notes:</Text>
            <Text style={styles.notesText}>
              • Your payment is secure and will be held in escrow until the professional confirms the referral.
            </Text>
            <Text style={styles.notesText}>
              • If the referral doesn't proceed, you can request a refund within 30 days.
            </Text>
            <Text style={styles.notesText}>
              • For any payment issues, please contact our support team.
            </Text>
          </Card.Content>
        </Card>
        
        {/* Pay Button */}
        <View style={styles.payButtonContainer}>
          <Button 
            mode="contained"
            onPress={handlePayment}
            loading={isLoading}
            disabled={isLoading || (paymentMethod === 'upi' && !upiId.trim())}
            style={styles.payButton}
            icon="cash"
          >
            Pay ₹{request.paymentAmount}
          </Button>
        </View>
      </ScrollView>
      
      {/* Success Modal */}
      <Portal>
        <Modal
          visible={showSuccessModal}
          onDismiss={handleContinue}
          contentContainerStyle={styles.successModal}
        >
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={80} color="#0d5626" />
            </View>
            <Title style={styles.successTitle}>Payment Successful!</Title>
            <Text style={styles.successText}>
              Your payment of ₹{request.paymentAmount} has been successfully processed.
              The professional will be notified and will proceed with your referral.
            </Text>
            <Button 
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
            >
              Continue
            </Button>
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
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#627d98',
  },
  summaryValue: {
    fontSize: 14,
    color: '#334e68',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
    color: '#334e68',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    color: '#0967d2',
    fontWeight: 'bold',
  },
  methodsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  methodContent: {
    flex: 1,
    marginLeft: 8,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334e68',
  },
  methodDesc: {
    fontSize: 14,
    color: '#627d98',
    marginTop: 2,
  },
  upiLogos: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  upiLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  upiInput: {
    marginTop: 8,
  },
  cardLogos: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cardLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  notesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 6,
  },
  payButtonContainer: {
    margin: 24,
  },
  payButton: {
    padding: 8,
    borderRadius: 8,
  },
  successModal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  successContent: {
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    marginBottom: 16,
    color: '#0d5626',
  },
  successText: {
    fontSize: 16,
    color: '#334e68',
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    paddingHorizontal: 32,
    borderRadius: 8,
  },
});

export default PaymentScreen;