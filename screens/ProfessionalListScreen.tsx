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
  Searchbar,
  Divider,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { db, useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { toast } from 'sonner-native';
const ProfessionalListScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  useEffect(() => {
    if (userProfile?.userType === 'student') {
      loadProfessionals();
    } else {
      // If not a student, redirect to home
      navigation.replace('Home');
    }
  }, [userProfile]);

  const loadProfessionals = async () => {
    try {
      setIsLoading(true);
      
      // Query Firestore for users who are professionals
      const professionalsQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'professional'),
        orderBy('successfulReferrals', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(professionalsQuery);
      const professionalsData = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        professionalsData.push({
          id: doc.id,
          name: userData.displayName || 'Professional',
          company: userData.company || 'Company',
          jobTitle: userData.jobTitle || 'Professional',
          photoURL: userData.photoURL || `https://api.a0.dev/assets/image?text=indian%20professional%20headshot&aspect=1:1&seed=${doc.id.substring(0, 5)}`,
          skills: userData.skills || [],
          experience: userData.experience || '0',
          successfulReferrals: userData.successfulReferrals || 0,
          industry: userData.industry || 'Technology',
        });
      });
      
      setProfessionals(professionalsData);
      setFilteredProfessionals(professionalsData);
      trackEvent('viewed_professionals_list');
    } catch (error) {
      console.error('Error loading professionals:', error);
      toast.error('Failed to load professionals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredProfessionals(professionals);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const filtered = professionals.filter(
      prof => 
        prof.name.toLowerCase().includes(lowerCaseQuery) ||
        prof.company.toLowerCase().includes(lowerCaseQuery) ||
        prof.jobTitle.toLowerCase().includes(lowerCaseQuery) ||
        prof.industry.toLowerCase().includes(lowerCaseQuery) ||
        (prof.skills && prof.skills.some(skill => 
          skill.toLowerCase().includes(lowerCaseQuery)
        ))
    );
    
    setFilteredProfessionals(filtered);
  };

  const handleSelectProfessional = (professional) => {
    navigation.navigate('ProfessionalDetail', { professional });
  };

  const renderProfessionalCard = ({ item }) => (
    <Card style={styles.card} onPress={() => handleSelectProfessional(item)}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Image 
          source={{ uri: item.photoURL }} 
          size={60} 
          style={styles.avatar}
        />
        <View style={styles.professionalInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <Text style={styles.company}>{item.company}</Text>
          
          <View style={styles.statsRow}>
            <Chip 
              style={styles.chip}
              textStyle={styles.chipText}
              icon="briefcase"
            >
              {item.experience} yrs
            </Chip>
            <Chip 
              style={styles.chip}
              textStyle={styles.chipText}
              icon="check-circle"
            >
              {item.successfulReferrals} referrals
            </Chip>
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
        <Text style={styles.headerTitle}>Find Professionals</Text>
      </View>
      
      <Searchbar
        placeholder="Search by name, company, skills..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading professionals...</Text>
        </View>
      ) : (
        <>
          {filteredProfessionals.length > 0 ? (
            <FlatList
              data={filteredProfessionals}
              renderItem={renderProfessionalCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No professionals found</Text>
              <Text style={styles.emptySubtext}>Try different search terms</Text>
              <Button 
                mode="contained" 
                onPress={loadProfessionals}
                style={styles.refreshButton}
              >
                Refresh List
              </Button>
            </View>
          )}
        </>
      )}
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
  searchbar: {
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 2,
    borderRadius: 8,
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
  professionalInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: '#334e68',
  },
  company: {
    fontSize: 14,
    color: '#627d98',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    marginRight: 8,
    height: 24,
  },
  chipText: {
    fontSize: 12,
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
  refreshButton: {
    borderRadius: 8,
  },
});

export default ProfessionalListScreen;