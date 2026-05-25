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

        if profile.save
          render json: serialize_profile(profile), status: :created
        else
          render json: { errors: profile.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/budget_profiles/:id
      def update
        if @profile.update(profile_params)
          render json: serialize_profile(@profile.reload)
        else
          render json: { errors: @profile.errors.full_messages }, status: :unprocessable_entity
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
          :total_budget,
          category_budgets_attributes: [:id, :category_id, :amount, :_destroy]
        )
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
