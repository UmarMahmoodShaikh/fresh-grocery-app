module Api
  module V1
    class BudgetProfilesController < ApplicationController
      before_action :authenticate_request
      before_action :set_profile, only: [:show, :update, :destroy, :activate]

      # GET /api/v1/budget_profiles
      def index
        profiles = current_user.budget_profiles
          .includes(category_budgets: :category)
          .order(is_active: :desc, updated_at: :desc)

        render json: profiles.map { |p| serialize_profile(p) }
      end

      # GET /api/v1/budget_profiles/:id
      def show
        render json: serialize_profile(@profile)
      end

      # POST /api/v1/budget_profiles
      def create
        profile = current_user.budget_profiles.build(profile_params)

        # If this is the user's first profile, make it active
        profile.is_active = true if current_user.budget_profiles.count == 0

        ActiveRecord::Base.transaction do
          if profile.save
            bulk_save_category_budgets(profile)
            profile_with_associations = current_user.budget_profiles
              .includes(category_budgets: :category)
              .find(profile.id)
            render json: serialize_profile(profile_with_associations), status: :created
          else
            render json: { errors: profile.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      # PATCH /api/v1/budget_profiles/:id
      def update
        ActiveRecord::Base.transaction do
          if @profile.update(profile_params)
            bulk_save_category_budgets(@profile)
            profile_with_associations = current_user.budget_profiles
              .includes(category_budgets: :category)
              .find(@profile.id)
            render json: serialize_profile(profile_with_associations)
          else
            render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      # DELETE /api/v1/budget_profiles/:id
      def destroy
        was_active = @profile.is_active
        @profile.destroy

        # If we deleted the active profile, activate the most recent one
        if was_active
          next_profile = current_user.budget_profiles.order(updated_at: :desc).first
          next_profile&.activate!
        end

        head :no_content
      end

      # PATCH /api/v1/budget_profiles/:id/activate
      def activate
        @profile.activate!
        render json: serialize_profile(@profile)
      end

      private

      def set_profile
        @profile = current_user.budget_profiles
          .includes(category_budgets: :category)
          .find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Budget profile not found" }, status: :not_found
      end

      def profile_params
        params.require(:budget_profile).permit(
          :name,
          :total_budget
        )
      end

      def bulk_save_category_budgets(profile)
        cb_attrs = params.dig(:budget_profile, :category_budgets_attributes)
        return unless cb_attrs.is_a?(Array) || cb_attrs.is_a?(ActionController::Parameters) || cb_attrs.is_a?(Hash)

        now = Time.current
        to_upsert = []
        to_delete_ids = []

        process_item = ->(cb) {
          cb_data = cb.respond_to?(:to_unsafe_h) ? cb.to_unsafe_h : cb
          category_id = cb_data[:category_id]
          amount = cb_data[:amount].to_f

          if cb_data[:_destroy] == true || cb_data[:_destroy] == "true" || amount <= 0
            to_delete_ids << category_id
          else
            to_upsert << {
              budget_profile_id: profile.id,
              category_id: category_id,
              amount: amount,
              created_at: now,
              updated_at: now
            }
          end
        }

        if cb_attrs.is_a?(Array)
          cb_attrs.each { |item| process_item.call(item) }
        else
          cb_attrs.each { |_, item| process_item.call(item) }
        end

        # 1. Bulk delete in one query
        profile.category_budgets.where(category_id: to_delete_ids).delete_all if to_delete_ids.any?

        # 2. Bulk upsert in one query
        CategoryBudget.upsert_all(to_upsert, unique_by: [:budget_profile_id, :category_id]) if to_upsert.any?
      end

      def serialize_profile(profile)
        {
          id: profile.id,
          name: profile.name,
          total_budget: profile.total_budget.to_f,
          is_active: profile.is_active,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          category_budgets: profile.category_budgets.map do |cb|
            {
              id: cb.id,
              category_id: cb.category_id,
              category_name: cb.category&.name,
              amount: cb.amount.to_f
            }
          end
        }
      end
    end
  end
end
