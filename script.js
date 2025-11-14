// Recipe Finder Application
class RecipeFinder {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
        this.currentRecipes = [];
        this.init();
    }

    init() {
        // DOM Elements
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.resultsContainer = document.getElementById('results-container');
        this.loadingElement = document.getElementById('loading');
        this.noResultsElement = document.getElementById('no-results');
        this.searchPage = document.getElementById('search-page');
        this.recipeDetailPage = document.getElementById('recipe-detail-page');
        this.recipeDetailContent = document.getElementById('recipe-detail-content');
        this.backToSearchButton = document.getElementById('back-to-search');
        this.favoritesLink = document.getElementById('favorites-link');
        
        // Event Listeners
        this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        this.resultsContainer.addEventListener('click', (e) => this.handleRecipeClick(e));
        this.favoritesLink.addEventListener('click', (e) => this.showFavorites(e));
        this.backToSearchButton.addEventListener('click', () => this.showSearchPage());
        
        // Add animation to header on load
        this.animateHeader();
        
        // Load initial recipes
        this.loadInitialRecipes();
    }

    animateHeader() {
        const title = document.querySelector('.display-4');
        const lead = document.querySelector('.lead');
        
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(20px)';
            setTimeout(() => {
                title.style.transition = 'all 0.8s ease';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 300);
        }
        
        if (lead) {
            lead.style.opacity = '0';
            lead.style.transform = 'translateY(20px)';
            setTimeout(() => {
                lead.style.transition = 'all 0.8s ease 0.2s';
                lead.style.opacity = '1';
                lead.style.transform = 'translateY(0)';
            }, 500);
        }
    }

    async loadInitialRecipes() {
        // Load some popular recipes by default
        await this.searchRecipes('chicken');
    }

    async searchRecipes(query) {
        this.showLoading();
        
        try {
            // Using TheMealDB API which is free and doesn't require an API key
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
            const data = await response.json();
            
            if (data.meals) {
                this.currentRecipes = data.meals;
                this.displayRecipes(data.meals);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            this.showNoResults();
        }
    }

    displayRecipes(recipes) {
        this.hideLoading();
        this.resultsContainer.innerHTML = '';
        
        if (recipes.length === 0) {
            this.showNoResults();
            return;
        }
        
        this.hideNoResults();
        
        recipes.forEach((recipe, index) => {
            const isFavorite = this.favorites.some(fav => fav.idMeal === recipe.idMeal);
            const recipeCard = this.createRecipeCard(recipe, isFavorite, index);
            this.resultsContainer.appendChild(recipeCard);
        });
    }

    createRecipeCard(recipe, isFavorite, index) {
        const col = document.createElement('div');
        col.className = 'col-md-3 col-sm-6';
        
        // Truncate long titles
        const title = recipe.strMeal.length > 30 ? recipe.strMeal.substring(0, 30) + '...' : recipe.strMeal;
        
        col.innerHTML = `
            <div class="card recipe-card">
                <img src="${recipe.strMealThumb}" class="recipe-image" alt="${recipe.strMeal}">
                <div class="recipe-details">
                    <h5 class="recipe-title">${title}</h5>
                    <p class="recipe-category">
                        <span class="badge bg-secondary">${recipe.strCategory}</span> 
                        <span class="badge bg-info">${recipe.strArea}</span>
                    </p>
                    <p class="text-muted small">${this.truncateDescription(recipe.strInstructions, 100)}</p>
                </div>
                <div class="recipe-footer">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.idMeal}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="view-btn" data-id="${recipe.idMeal}">View Recipe</button>
                </div>
            </div>
        `;
        
        return col;
    }

    truncateDescription(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    handleSearch(e) {
        e.preventDefault();
        const query = this.searchInput.value.trim();
        
        if (query) {
            this.searchRecipes(query);
            
            // Add animation to search container
            const searchContainer = document.querySelector('.search-container');
            searchContainer.style.transform = 'scale(0.98)';
            setTimeout(() => {
                searchContainer.style.transition = 'transform 0.3s ease';
                searchContainer.style.transform = 'scale(1)';
            }, 100);
        }
    }

    handleRecipeClick(e) {
        // Handle favorite button clicks
        if (e.target.closest('.favorite-btn')) {
            const button = e.target.closest('.favorite-btn');
            const recipeId = button.getAttribute('data-id');
            this.toggleFavorite(recipeId, button);
        }
        
        // Handle view recipe button clicks
        if (e.target.closest('.view-btn')) {
            const button = e.target.closest('.view-btn');
            const recipeId = button.getAttribute('data-id');
            this.showRecipeDetails(recipeId);
            
            // Add animation to button
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transition = 'transform 0.2s ease';
                button.style.transform = 'scale(1)';
            }, 100);
        }
    }

    toggleFavorite(recipeId, button) {
        const recipe = this.currentRecipes.find(r => r.idMeal === recipeId);
        
        if (!recipe) return;
        
        const isCurrentlyFavorite = this.favorites.some(fav => fav.idMeal === recipeId);
        
        if (isCurrentlyFavorite) {
            // Remove from favorites
            this.favorites = this.favorites.filter(fav => fav.idMeal !== recipeId);
            button.classList.remove('active');
            button.title = 'Add to favorites';
            
            // Show feedback
            this.showToast('Removed from favorites', 'danger');
        } else {
            // Add to favorites
            this.favorites.push(recipe);
            button.classList.add('active');
            button.title = 'Remove from favorites';
            
            // Show feedback
            this.showToast('Added to favorites!', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('favoriteRecipes', JSON.stringify(this.favorites));
    }

    showToast(message, type) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed`;
        toast.style = 'top: 20px; right: 20px; z-index: 10000; min-width: 250px; border-radius: 15px;';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    async showRecipeDetails(recipeId) {
        const recipe = this.currentRecipes.find(r => r.idMeal === recipeId) || 
                      this.favorites.find(r => r.idMeal === recipeId);
        
        if (!recipe) {
            // If not found in current recipes or favorites, fetch from API
            try {
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
                const data = await response.json();
                if (data.meals) {
                    this.displayRecipePage(data.meals[0]);
                }
            } catch (error) {
                console.error('Error fetching recipe details:', error);
            }
        } else {
            this.displayRecipePage(recipe);
        }
    }

    displayRecipePage(recipe) {
        // Extract ingredients
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }
        
        // Extract instructions
        const instructions = recipe.strInstructions.split('\n').filter(step => step.trim() !== '');
        
        this.recipeDetailContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${recipe.strMealThumb}" class="recipe-detail-image" alt="${recipe.strMeal}">
                    <h2>${recipe.strMeal}</h2>
                    <p><strong>Category:</strong> ${recipe.strCategory}</p>
                    <p><strong>Area:</strong> ${recipe.strArea}</p>
                    <p><strong>Tags:</strong> ${recipe.strTags ? recipe.strTags.replace(/,/g, ', ') : 'None'}</p>
                </div>
                <div class="col-md-6">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <h3>Instructions</h3>
                    <ol class="instructions-list">
                        ${instructions.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
            ${recipe.strYoutube ? `
            <div class="row mt-4">
                <div class="col-12">
                    <h3>Video Tutorial</h3>
                    <a href="${recipe.strYoutube}" target="_blank" class="btn btn-danger">
                        <i class="fab fa-youtube me-2"></i>Watch on YouTube
                    </a>
                </div>
            </div>
            ` : ''}
        `;
        
        // Hide search page and show recipe detail page
        this.searchPage.classList.add('d-none');
        this.recipeDetailPage.classList.remove('d-none');
        
        // Scroll to top of page
        window.scrollTo(0, 0);
    }

    showSearchPage() {
        // Hide recipe detail page and show search page
        this.recipeDetailPage.classList.add('d-none');
        this.searchPage.classList.remove('d-none');
        
        // Scroll to top of page
        window.scrollTo(0, 0);
    }

    showFavorites(e) {
        e.preventDefault();
        if (this.favorites.length > 0) {
            this.displayRecipes(this.favorites);
        } else {
            this.resultsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div style="font-size: 5rem; color: #ff6b6b; margin-bottom: 20px;">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3 style="color: white; font-weight: 700;">No Favorites Yet</h3>
                    <p class="lead" style="color: rgba(255, 255, 255, 0.9);">Start adding recipes to your favorites by clicking the heart icon on recipe cards</p>
                </div>
            `;
        }
    }

    showLoading() {
        this.loadingElement.classList.remove('d-none');
        this.noResultsElement.classList.add('d-none');
    }

    hideLoading() {
        this.loadingElement.classList.add('d-none');
    }

    showNoResults() {
        this.hideLoading();
        this.noResultsElement.classList.remove('d-none');
        this.resultsContainer.innerHTML = '';
    }

    hideNoResults() {
        this.noResultsElement.classList.add('d-none');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RecipeFinder();
});