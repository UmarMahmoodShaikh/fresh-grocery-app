class Ability
  include CanCan::Ability

  def initialize(admin_user)
    admin_user ||= AdminUser.new # guest user (not logged in)

    if admin_user.admin?
      # Admins can do everything
      can :manage, :all
    elsif admin_user.employee?
      # Employees can only read (view) everything
      can :read, :all
      can :read, ActiveAdmin::Page, name: "Dashboard"
    else
      # Not logged in or unknown role - can't do anything
      cannot :manage, :all
    end
  end
end
