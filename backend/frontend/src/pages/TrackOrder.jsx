import React, { useState } from 'react';
import { ordersAPI } from '../services/api';
import '../styles/pages/TrackOrder.css';

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', emoji: '📝' },
    { key: 'processing', label: 'Packing', emoji: '📦' },
    { key: 'shipped', label: 'On Its Way', emoji: '🚚' },
    { key: 'delivered', label: 'Delivered', emoji: '✅' }
];

export default function TrackOrder() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderId) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const response = await ordersAPI.getById(orderId);
            setOrder(response.data);
        } catch (err) {
            setError('Order not found. Please check your Order ID.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndex = (status) => {
        if (status === 'cancelled') return -1;
        return STATUS_STEPS.findIndex(step => step.key === status);
    };

    const currentStepIndex = order ? getStatusIndex(order.status) : -1;

    return (
        <div className="track-order-container">
            <div className="track-card">
                <h1>Track Your Order 🚀</h1>
                <p>Enter your order ID to see real-time updates.</p>

                <form onSubmit={handleSearch} className="track-search-form">
                    <input
                        type="text"
                        placeholder="Enter Order ID (e.g. 1)"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Track Order'}
                    </button>
                </form>

                {error && <div className="track-error">{error}</div>}

                {order && (
                    <div className="track-result fade-in">
                        <div className="order-summary-header">
                            <h3>Order #{order.id}</h3>
                            <span className={`status-pill ${order.status}`}>{order.status.toUpperCase()}</span>
                        </div>

                        {order.status === 'cancelled' ? (
                            <div className="cancelled-message">
                                <span className="emoji">❌</span>
                                <p>This order has been cancelled.</p>
                            </div>
                        ) : (
                            <div className="track-timeline">
                                <div className="timeline-line">
                                    <div
                                        className="timeline-progress"
                                        style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="timeline-steps">
                                    {STATUS_STEPS.map((step, index) => (
                                        <div
                                            key={step.key}
                                            className={`timeline-step ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
                                        >
                                            <div className="step-emoji">{step.emoji}</div>
                                            <div className="step-label">{step.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="order-mini-details">
                            <div className="detail-row">
                                <span>Items:</span>
                                <span>{order.order_items?.length || 0} items</span>
                            </div>
                            <div className="detail-row">
                                <span>Total Amount:</span>
                                <span className="total-value">${parseFloat(order.total).toFixed(2)}</span>
                            </div>
                            {order.delivery_address && (
                                <div className="detail-row address">
                                    <span>Shipping To:</span>
                                    <p>{order.delivery_address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
