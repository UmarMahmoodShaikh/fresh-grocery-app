class Ability
  include CanCan::Ability

  def initialize(admin_user)
    return unless admin_user

    # 1. GLOBAL SUPER ADMIN
    if admin_user.super_admin? && admin_user.store_id.nil?
      can :manage, :all
      return
    end

    # All non-global admins need a store_id
    return unless admin_user.store_id.present?

    # Common read access for all store-level staff
    can :read, ActiveAdmin::Page, name: "Dashboard"
    can :read, Store, id: admin_user.store_id

    # 2. FULL STORE ADMIN (Store Manager)
    if admin_user.super_admin? || admin_user.store_admin?
      can :read, Product
      can :read, Category
      can :read, Brand
      
      can :update, Store, id: admin_user.store_id
      can :manage, StoreProduct, store_id: admin_user.store_id
      can :manage, StoreCategory, store_id: admin_user.store_id
      can :manage, Order, store_id: admin_user.store_id
      can :manage, Promotion, store_id: admin_user.store_id
      can :manage, Banner, store_id: admin_user.store_id

    # 3. STORE MARKETING MANAGER
    elsif admin_user.store_marketing_manager?
      can :manage, Promotion, store_id: admin_user.store_id
      can :manage, Banner, store_id: admin_user.store_id
      can :read, Product
      
    # 4. STORE PRODUCTS MANAGER
    elsif admin_user.store_products_manager?
      can :read, Product
      can :read, Category
      can :read, Brand
      
      can :manage, StoreProduct, store_id: admin_user.store_id
      can :manage, StoreCategory, store_id: admin_user.store_id

    # 5. STORE EMPLOYEE (General Staff)
    elsif admin_user.employee?
      # Read-only access to their store's operations
      can :read, StoreProduct, store_id: admin_user.store_id
      can :read, StoreCategory, store_id: admin_user.store_id
      # Staff usually need to process orders
      can :manage, Order, store_id: admin_user.store_id
    end

  end
end
