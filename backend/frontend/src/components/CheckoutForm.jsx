import { useState } from 'react';
import { useCart } from '../context/CartContext';
import '../styles/CheckoutForm.css';

export default function CheckoutForm({ onSubmit, isLoading = false }) {
  const { cartTotal } = useCart();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    deliveryMethod: 'standard',
    deliveryInstructions: '',
    paymentMethod: 'card',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="checkout-form-container">
      <form onSubmit={handleSubmit} className="checkout-form" noValidate>
        <h2>Shipping Information</h2>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.phone && (
            <span className="error-message">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address">Street Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={errors.address ? 'input-error' : ''}
            disabled={isLoading}
          />
          {errors.address && (
            <span className="error-message">{errors.address}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={errors.city ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.city && (
              <span className="error-message">{errors.city}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="zip">ZIP Code *</label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              className={errors.zip ? 'input-error' : ''}
              disabled={isLoading}
            />
            {errors.zip && (
              <span className="error-message">{errors.zip}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <h2>Delivery Options</h2>

        <div className="form-group">
          <label htmlFor="deliveryMethod">Delivery Method *</label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            value={formData.deliveryMethod}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="standard">Standard (3-5 business days)</option>
            <option value="express">Express (24 hours)</option>
            <option value="same">Same Day</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="deliveryInstructions">Special Instructions (optional)</label>
          <textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            value={formData.deliveryInstructions}
            onChange={handleChange}
            placeholder="e.g., Leave at door, ring doorbell twice, etc."
            disabled={isLoading}
            rows="3"
          />
        </div>

        <h2>Payment Method</h2>

        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method *</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="card">Credit/Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="cash">Cash on Delivery</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="submit-btn"
        >
          {isLoading ? 'Processing...' : `Place Order ($${cartTotal.toFixed(2)})`}
        </button>
      </form>
    </div>
  );
}
