import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { recommendClient } from '@/services/algolia';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface RecommendedProductProps {
  objectID: string;
  userToken: string;
}

export const RecommendedProducts: React.FC<RecommendedProductProps> = ({ objectID, userToken }) => {
  const isDark = useColorScheme() === 'dark';
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { results } = await recommendClient.getRecommendations({
          requests: [
            {
              indexName: 'Product',
              model: 'related-products',
              objectID,
              threshold: 0,
              maxRecommendations: 10,
            },
          ],
        });
        
        if (results && results[0] && results[0].hits) {
          setRecommendations(results[0].hits);
        }
      } catch (error) {
      }
    };

    if (objectID) {
      fetchRecommendations();
    }
  }, [objectID]);

  if (recommendations.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/product/${item.objectID}`)}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      <Text style={[styles.name, { color: isDark ? '#F9FAFB' : '#1F2937' }]} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Products you may like</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  card: {
    width: 140,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
});
