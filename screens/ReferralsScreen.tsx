import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  Chip,
  Searchbar,
  Divider,
  useTheme,
  SegmentedButtons,
  FAB,
  Portal,
  Modal,
  Title,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth, USER_TYPES } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner-native';

const ReferralsScreen = ({ navigation }) => {
  const { userProfile, getReferrals, createReferral, trackEvent } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralName, setReferralName] = useState('');
  const [referralJobType, setReferralJobType] = useState('');
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    loadReferrals();
  }, [userProfile]);

  useEffect(() => {
    filterReferrals();
  }, [referrals, tabValue, searchQuery]);

  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      
      if (!userProfile) {
        return;
      }
      
      // Fetch referrals from Firestore or use the getReferrals function
      const fetchedReferrals = await getReferrals();
      
      setReferrals(fetchedReferrals);
      
      trackEvent('viewed_referrals');
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterReferrals = () => {
    // First, filter by tab
    let filtered = [...referrals];
    
    if (tabValue === 'pending') {
      filtered = filtered.filter(ref => ref.status === 'pending');
    } else if (tabValue === 'active') {
      filtered = filtered.filter(ref => 
        ref.status === 'accepted' || 
        ref.status === 'payment_requested' || 
        ref.status === 'payment_accepted' || 
        ref.status === 'payment_completed'
      );
    } else if (tabValue === 'completed') {
      filtered = filtered.filter(ref => ref.status === 'completed');
    }
    
    // Then, apply search query if exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ref => 
        (ref.refereeName && ref.refereeName.toLowerCase().includes(query)) ||
        (ref.refereeEmail && ref.refereeEmail.toLowerCase().includes(query)) ||
        (ref.jobType && ref.jobType.toLowerCase().includes(query)) ||
        (ref.status && ref.status.toLowerCase().includes(query))
      );
    }
    
    setFilteredReferrals(filtered);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReferrals();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCreateReferral = async () => {
    if (!referralEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    
    try {
      setIsCreatingReferral(true);
      
      await createReferral(
        referralEmail.trim(),
        referralName.trim() || referralEmail.split('@')[0],
        referralJobType.trim() || 'Not specified'
      );
      
      // Reset form and close modal
      setReferralEmail('');
      setReferralName('');
      setReferralJobType('');
      setShowAddModal(false);
      
      // Refresh the list
      loadReferrals();
      
      toast.success('Referral created successfully');
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error('Failed to create referral');
    } finally {
      setIsCreatingReferral(false);
    }
  };

  const renderStatusChip = (status) => {
    switch(status) {
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

  const renderReferralCard = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ReferralDetail', { referral: item })}
    >
      <Card.Content style={styles.cardContent}>
        <Avatar.Image 
          source={{ 
            uri: `https://api.a0.dev/assets/image?text=indian%20person%20headshot&aspect=1:1&seed=${item.id.substring(0, 5)}` 
          }} 
          size={50} 
          style={styles.avatar}
        />
        <View style={styles.referralInfo}>
          <Text style={styles.name}>{item.refereeName || item.refereeEmail.split('@')[0]}</Text>
          <Text style={styles.email}>{item.refereeEmail}</Text>
          <Text style={styles.jobType}>{item.jobType || 'Not specified'}</Text>
          
          <View style={styles.referralFooter}>
            <Text style={styles.date}>
              {new Date(item.createdAt.toDate()).toLocaleDateString()}
            </Text>
            {renderStatusChip(item.status)}
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
        <Text style={styles.headerTitle}>My Referrals</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, email, or status"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={tabValue}
          onValueChange={setTabValue}
          buttons={[
            {
              value: 'all',
              label: 'All',
            },
            {
              value: 'pending',
              label: 'Pending',
            },
            {
              value: 'active',
              label: 'Active',
            },
            {
              value: 'completed',
              label: 'Completed',
            },
          ]}
        />
      </View>
      
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading referrals...</Text>
        </View>
      ) : (
        <>
          {filteredReferrals.length > 0 ? (
            <FlatList
              data={filteredReferrals}
              renderItem={renderReferralCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No referrals found</Text>
              {tabValue !== 'all' ? (
                <Text style={styles.emptySubtext}>Try a different filter or create a new referral</Text>
              ) : searchQuery ? (
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              ) : (
                <Text style={styles.emptySubtext}>Tap the + button to create your first referral</Text>
              )}
              
              <Button 
                mode="contained" 
                onPress={() => setShowAddModal(true)}
                style={styles.createButton}
                icon="plus"
              >
                Create New Referral
              </Button>
            </View>
          )}
        </>
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddModal(true)}
      />
      
      {/* Create Referral Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Create New Referral</Title>
            
            <TextInput
              label="Contact Email *"
              value={referralEmail}
              onChangeText={setReferralEmail}
              mode="outlined"
              style={styles.modalInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              label="Contact Name (Optional)"
              value={referralName}
              onChangeText={setReferralName}
              mode="outlined"
              style={styles.modalInput}
            />
            
            <TextInput
              label="Job Type/Position (Optional)"
              value={referralJobType}
              onChangeText={setReferralJobType}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g. Software Engineer, Data Scientist"
            />
            
            <Text style={styles.modalHelp}>
              Create a referral to track status and share your referral code with the contact.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
                disabled={isCreatingReferral}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleCreateReferral}
                loading={isCreatingReferral}
                style={[styles.modalButton, styles.createModalButton]}
                disabled={!referralEmail.trim() || isCreatingReferral}
              >
                Create Referral
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
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  searchbar: {
    borderRadius: 8,
    elevation: 2,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
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
  referralInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334e68',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 2,
  },
  jobType: {
    fontSize: 14,
    color: '#334e68',
    marginBottom: 8,
  },
  referralFooter: {
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
  createButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
  modalHelp: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 16,
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
  createModalButton: {
    marginLeft: 8,
  },
});

export default ReferralsScreen;