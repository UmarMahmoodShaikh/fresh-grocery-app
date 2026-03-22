import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { recommendClient } from '@/services/algolia';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser } from '@/services/api';

export const PersonalizedRecommendations: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<string>('anonymous');

  useEffect(() => {
    const fetchUserAndRecommendations = async () => {
      setLoading(true);
      try {
        const user = await getStoredUser();
        const token = user && user.id ? user.id.toString() : 'anonymous';
        setUserToken(token);

        const { results } = await recommendClient.getRecommendations({
          requests: [
            {
              indexName: 'Product',
              model: 'recommendations' as any,
              userToken: token,
              threshold: 0,
              maxRecommendations: 10,
            } as any,
          ],
        });
        
        if (results && results[0] && results[0].hits) {
          setRecommendations(results[0].hits);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRecommendations();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2D6A4F" />
      </View>
    );
  }

  if (recommendations.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/product/${item.objectID}`)}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: isDark ? '#F9FAFB' : '#1F2937' }]} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Recommended for you</Text>
        <Ionicons name="sparkles" size={16} color="#F59E0B" style={styles.sparkle} />
      </View>
      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={(item) => item.objectID}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sparkle: {
    marginLeft: 6,
  },
  list: {
    paddingRight: 16,
    gap: 12,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrap: {
    backgroundColor: '#fff',
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 10,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
});
