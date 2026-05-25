import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useColorScheme,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, Store } from '@/context/StoreContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { storesApi } from '@/services/api';

export default function StoreSelectorScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  const router = useRouter();
  const { availableStores, selectStore, refreshStores } = useStore();
  
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [loading, setLoading] = useState(false);
  const [sortedStores, setSortedStores] = useState<Store[]>([]);
  const [detectedStore, setDetectedStore] = useState<Store | null>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    sortStores();
  }, [availableStores]);

  const init = async () => {
    setLoading(true);
    await refreshStores();
    await requestLocationPermission();
    setLoading(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkPresence = async (latitude: number, longitude: number) => {
    try {
      const res = await storesApi.detect(latitude, longitude);
      if (res.data) {
        setDetectedStore(res.data as Store);
      } else {
        setDetectedStore(null);
      }
    } catch (e) {
      console.log('Detection error', e);
      setDetectedStore(null);
    }
  };

  const sortStores = async () => {
    let currentPos: Location.LocationObject | null = null;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        currentPos = await Location.getCurrentPositionAsync({});
      }
    } catch (e) {
      console.log('Location error', e);
    }

    const filtered = availableStores.filter(s => s.active);
    if (currentPos) {
      const { latitude, longitude } = currentPos.coords;
      
      // Auto-detect if user is inside a store footprint
      checkPresence(latitude, longitude);

      const sorted = [...filtered].sort((a, b) => {
        const distA = calculateDistance(latitude, longitude, (a as any).latitude, (a as any).longitude);
        const distB = calculateDistance(latitude, longitude, (b as any).latitude, (b as any).longitude);
        return distA - distB;
      });
      setSortedStores(sorted);
    } else {
      setSortedStores(filtered);
    }
  };

  const handleSelectStore = async (store: Store) => {
    setLoading(true);
    await selectStore(store);
    router.replace('/(tabs)');
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    setLoading(true);
    
    // Assume QR code contains the store slug
    try {
      const result = await storesApi.getBySlug(data.trim());
      if (result.data) {
        await selectStore(result.data as Store);
        router.replace('/(tabs)');
      } else {
        alert('Store not found. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('QR Scan error:', error);
      alert('Error scanning store. Please try again.');
      setLoading(false);
    }
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleSelectStore(item)}
      activeOpacity={0.7}
    >
      <View style={styles.storeLogoContainer}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.storeLogo} />
        ) : (
          <Ionicons name="storefront-outline" size={32} color="#2D6A4F" />
        )}
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeSlug}>@{item.slug}</Text>
        <View style={styles.deliveryBadge}>
          <Ionicons name="bicycle-outline" size={14} color="#059669" />
          <Text style={styles.deliveryText}>€{Number(item.delivery_fee || 0).toFixed(2)} delivery</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.loadingText}>Setting up your store experience...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Choose a store to start shopping</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (res.granted) setIsScanning(true);
            } else {
              setIsScanning(true);
            }
          }}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Store QR</Text>
        </TouchableOpacity>
      </View>

      {detectedStore && (
        <View style={styles.detectedSection}>
          <View style={styles.detectedTitleRow}>
            <View style={styles.liveIndicator} />
            <Text style={styles.detectedTitle}>You are inside</Text>
          </View>
          <TouchableOpacity
            style={[styles.storeCard, styles.detectedCard]}
            onPress={() => handleSelectStore(detectedStore)}
            activeOpacity={0.8}
          >
            <View style={styles.storeLogoContainer}>
              {detectedStore.logo_url ? (
                <Image source={{ uri: detectedStore.logo_url }} style={styles.storeLogo} />
              ) : (
                <Ionicons name="storefront-outline" size={32} color="#2D6A4F" />
              )}
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{detectedStore.name}</Text>
              <Text style={styles.storeSlug}>@{detectedStore.slug}</Text>
              <View style={[styles.deliveryBadge, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="flash-outline" size={14} color="#EA580C" />
                <Text style={[styles.deliveryText, { color: '#EA580C' }]}>
                  €{Number(detectedStore.delivery_fee || 0).toFixed(2)} delivery
                </Text>
              </View>
            </View>
            <View style={styles.enterBadge}>
              <Text style={styles.enterBadgeText}>ENTER</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Nearby Stores</Text>
      
      <FlatList
        data={sortedStores}
        renderItem={renderStoreItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No stores found in your area</Text>
          </View>
        }
      />

      <Modal visible={isScanning} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Store QR</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.scanFrame}>
              <View style={styles.frameCorner} />
            </View>
          </CameraView>
          
          <Text style={styles.scanHint}>Align the store QR code within the frame</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#111827' : '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: isDark ? '#D1D5DB' : '#4B5563',
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: isDark ? '#F9FAFB' : '#1F2937',
  },
  subtitle: {
    fontSize: 18,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginTop: 8,
  },
  actionRow: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  scanButton: {
    backgroundColor: '#2D6A4F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#F9FAFB' : '#1F2937',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  detectedSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  detectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  detectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detectedCard: {
    borderColor: '#2D6A4F',
    borderWidth: 2,
    backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
  },
  enterBadge: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: isDark ? '#1F2937' : '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  storeLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: isDark ? '#111827' : '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  storeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#F9FAFB' : '#1F2937',
  },
  storeSlug: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: isDark ? '#9CA3AF' : '#6B7280',
    fontSize: 16,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCorner: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
  }
});
