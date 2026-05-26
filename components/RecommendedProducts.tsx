import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { searchClient } from '@/services/algolia';
import { productsApiV2 } from '@/services/api';
import { useStore } from '@/context/StoreContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface RecommendedProductProps {
  product: any;
}

export const RecommendedProducts: React.FC<RecommendedProductProps> = ({ product }) => {
  const isDark = useColorScheme() === 'dark';
  const { selectedStore } = useStore();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;
    fetchRecommendations();
  }, [product]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let finalRecommendations: any[] = [];

      // Strategy 1: Algolia search by category name — exclude current product
      if (product.category?.name) {
        try {
          const results = await searchClient.searchSingleIndex({
            indexName: 'Product',
            searchParams: {
              query: product.category.name,
              hitsPerPage: 10,
              filters: `NOT objectID:${product.id}`,
            },
          });

          const hits = (results as any).hits || [];

          if (hits.length > 0) {
            // Prefer different brand, but if no results fall back to any same category
            const differentBrand = hits.filter(
              (h: any) => h.brand?.name && h.brand.name !== product.brand?.name
            );
            finalRecommendations = (differentBrand.length > 0 ? differentBrand : hits).slice(0, 6);
          }
        } catch (algoliaErr) {
          console.warn('Algolia recommendation search failed:', algoliaErr);
        }
      }

      // Strategy 2: Backend API fallback by category
      if (finalRecommendations.length === 0 && selectedStore && product.category?.id) {
        try {
          const res = await productsApiV2.getByCategory(selectedStore.slug, product.category.id);
          const all = Array.isArray(res.data) ? res.data : (res.data as any)?.products || [];
          const filtered = all.filter((p: any) => p.id !== product.id);
          finalRecommendations = filtered.slice(0, 6);
        } catch (apiErr) {
          console.warn('API recommendation by category failed:', apiErr);
        }
      }

      // Strategy 3: Global Store Fallback — fetch all products from the store, filter out current one
      if (finalRecommendations.length === 0 && selectedStore) {
        try {
          const res = await productsApiV2.getAll(selectedStore.slug);
          const all = Array.isArray(res.data) ? res.data : (res.data as any)?.products || [];
          const filtered = all.filter((p: any) => p.id !== product.id);
          finalRecommendations = filtered.slice(0, 6);
        } catch (globalErr) {
          console.warn('API global store fallback failed:', globalErr);
        }
      }

      setRecommendations(finalRecommendations);
    } catch (e) {
      console.warn('RecommendedProducts error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
          {product.category?.name ? `More ${product.category.name}` : 'You may also like'}
        </Text>
        <ActivityIndicator color="#2D6A4F" style={{ marginVertical: 12 }} />
      </View>
    );
  }

  if (recommendations.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? '#1F2937' : 'white' }]}
      onPress={() => router.push(`/product/${item.objectID || item.id}`)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, { alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
        </View>
      )}
      <Text style={[styles.name, { color: isDark ? '#F9FAFB' : '#1F2937' }]} numberOfLines={2}>
        {item.name}
      </Text>
      {item.brand?.name && (
        <Text style={styles.brand} numberOfLines={1}>{item.brand.name}</Text>
      )}
      <Text style={styles.price}>€{Number(item.price || 0).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
        {product.category?.name ? `More ${product.category.name}` : 'You may also like'}
      </Text>
      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={(item) => (item.objectID || item.id || Math.random()).toString()}
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
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  card: {
    width: 140,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  brand: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
});
