import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, Avatar, Chip, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function ReferralCard({ referral }) {
  const theme = useTheme();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'completed': return theme.colors.primary;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'check-circle';
      case 'completed': return 'check-circle';
      case 'pending': return 'schedule';
      default: return 'info';
    }
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Surface style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.rowContainer}>
          <Avatar.Image 
            size={48} 
            source={{ uri: referral.avatar }} 
          />
          
          <View style={styles.detailsContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>{referral.name}</Text>
              <Chip 
                icon={() => (
                  <MaterialIcons 
                    name={getStatusIcon(referral.status)} 
                    size={16} 
                    color={getStatusColor(referral.status)} 
                  />
                )}
                textStyle={{ color: getStatusColor(referral.status) }}
                style={[
                  styles.statusChip, 
                  { 
                    backgroundColor: `${getStatusColor(referral.status)}20`,
                    borderColor: getStatusColor(referral.status)
                  }
                ]}
              >
                {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
              </Chip>
            </View>
            
            <Text style={styles.jobType}>{referral.type}</Text>
            <Text style={styles.date}>
              Referred on {formatDate(referral.date)}
            </Text>
          </View>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#243b53',
  },
  statusChip: {
    height: 24,
    borderWidth: 1,
  },
  jobType: {
    fontSize: 14,
    color: '#627d98',
  },
  date: {
    fontSize: 12,
    color: '#829ab1',
    marginTop: 4,
  },
});