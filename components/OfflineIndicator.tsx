import { useNetwork } from '@/context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

export const OfflineIndicator: React.FC = () => {
    const isDark = useColorScheme() === 'dark';
    const { isOnline } = useNetwork();
    const [expandAnim] = useState(new Animated.Value(0));
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setIsExpanded(false);
        }
    }, [isOnline]);

    const toggleExpand = () => {
        Animated.timing(expandAnim, {
            toValue: isExpanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setIsExpanded(!isExpanded);
    };

    if (isOnline) return null;

    const expandHeight = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 90],
    });

    return (
        <View style={styles.container}>
            {/* Expanded Message */}
            <Animated.View
                style={[
                    styles.expandedMessage,
                    {
                        height: expandHeight,
                        backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
                        opacity: expandAnim,
                    },
                ]}
            >
                <View style={styles.messageContent}>
                    <Ionicons name="wifi-off" size={20} color="#DC2626" />
                    <View style={styles.messageText}>
                        <Text style={styles.messageTitle}>Offline Mode</Text>
                        <Text style={styles.messageSubtitle}>
                            Some features may be limited
                        </Text>
                    </View>
                </View>
            </Animated.View>

            {/* Floating Badge */}
            <TouchableOpacity
                style={[
                    styles.badge,
                    {
                        backgroundColor: isDark ? '#DC2626' : '#FEE2E2',
                        borderColor: isDark ? '#991B1B' : '#FECACA',
                    },
                ]}
                onPress={toggleExpand}
            >
                <Text style={styles.badgeText}>No Internet</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 999,
    },
    expandedMessage: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    messageContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    messageText: {
        flex: 1,
    },
    messageTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
        marginBottom: 2,
    },
    messageSubtitle: {
        fontSize: 12,
        color: '#991B1B',
        lineHeight: 16,
    },
    badge: {
        width: 110,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626',
        textAlign: 'center',
    },
});