import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/pages/Orders.css';

export default function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    // Filter
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getAll();
            // The API returns array directly based on controller
            setOrders(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            // Refresh local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update order status');
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        if (statusFilter === 'all') return true;
        return order.status === statusFilter;
    });

    // Pagination Logic
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="orders-page-container">
            <header className="page-header">
                <div className="header-left">
                    <button onClick={() => navigate('/admin')} className="back-btn">← Back to Dashboard</button>
                    <h1>Orders Management</h1>
                </div>
                <div className="header-actions">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="status-filter"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading-spinner">Loading orders...</div>
            ) : (
                <>
                    <div className="orders-table-wrapper">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Delivery</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrders.length > 0 ? (
                                    currentOrders.map(order => (
                                        <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} className="order-row">
                                            <td className="font-mono">#{order.orderNumber || order.id}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>
                                                <div className="customer-cell">
                                                    <span className="customer-name">
                                                        {order.guestInfo ? `${order.guestInfo.firstName} ${order.guestInfo.lastName} (Guest)` : 'Registered User'}
                                                    </span>
                                                    <span className="customer-email">
                                                        {order.guestInfo ? order.guestInfo.email : (order.user?.email || 'N/A')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="font-bold">${parseFloat(order.total).toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${order.status?.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{order.deliveryMethod}</td>
                                            <td>
                                                <button
                                                    className="view-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/orders/${order.id}`);
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">No orders found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="page-btn"
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="page-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
