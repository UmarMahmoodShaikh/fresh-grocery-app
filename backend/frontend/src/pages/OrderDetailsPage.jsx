import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/pages/OrderDetails.css';

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getById(id);
            setOrder(response.data);
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to update status to ${newStatus}?`)) return;

        try {
            setUpdating(true);
            await ordersAPI.updateStatus(id, newStatus);
            setOrder(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading-container">Loading order details...</div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!order) return <div className="not-found">Order not found</div>;

    const { guestInfo, user, deliveryAddress, items, total, subtotal, deliveryFee } = order;

    return (
        <div className="order-details-container">
            <header className="details-header">
                <button onClick={() => navigate('/admin/orders')} className="back-link">← Back to Orders</button>
                <div className="header-title">
                    <h1>Order #{order.orderNumber || order.id.slice(0, 8)}</h1>
                    <span className={`status-pill ${order.status}`}>{order.status}</span>
                </div>
            </header>

            <div className="details-grid">
                {/* Left Column: Items */}
                <div className="details-main">
                    <div className="card items-card">
                        <h2>Order Items</h2>
                        <div className="details-items-list">
                            {items && items.map((item, idx) => (
                                <div key={idx} className="details-order-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.productName || item.name || 'Product'}</span>
                                        <span className="item-meta">Qty: {item.quantity} × ${item.price}</span>
                                    </div>
                                    <span className="item-total">${(item.quantity * item.price).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="order-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>${parseFloat(subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Fee</span>
                                <span>${parseFloat(deliveryFee || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${parseFloat(total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer & Actions */}
                <div className="details-sidebar">
                    <div className="card customer-card">
                        <h2>Customer Details</h2>
                        <div className="info-group">
                            <label>Name</label>
                            <p>{guestInfo ? `${guestInfo.firstName} ${guestInfo.lastName}` : (user?.email || 'N/A')}</p>
                        </div>
                        <div className="info-group">
                            <label>Email</label>
                            <p>{guestInfo ? guestInfo.email : (user?.email || 'N/A')}</p>
                        </div>
                        <div className="info-group">
                            <label>Phone</label>
                            <p>{guestInfo ? guestInfo.phone : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="card shipping-card">
                        <h2>Delivery Info</h2>
                        <div className="info-group">
                            <label>Address</label>
                            <p>{typeof deliveryAddress === 'string' ? deliveryAddress :
                                `${deliveryAddress?.address}, ${deliveryAddress?.city}`
                            }</p>
                        </div>
                        <div className="info-group">
                            <label>Method</label>
                            <p style={{ textTransform: 'capitalize' }}>{order.deliveryMethod}</p>
                        </div>
                        {order.deliveryInstructions && (
                            <div className="info-group">
                                <label>Instructions</label>
                                <p className="instructions">{order.deliveryInstructions}</p>
                            </div>
                        )}
                    </div>

                    <div className="card actions-card">
                        <h2>Update Status</h2>
                        <div className="status-buttons">
                            {['pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    disabled={updating || order.status === status}
                                    onClick={() => handleStatusUpdate(status)}
                                    className={`action-btn ${status} ${order.status === status ? 'active' : ''}`}
                                >
                                    Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
