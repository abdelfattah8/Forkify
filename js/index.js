/* ═══════════════════════════════════════
   FORKIFY — index.js (Improved)
   Fixes: unique IDs, Enter key search,
   ingredients display, error handling,
   empty state, results count, quick tags
═══════════════════════════════════════ */

// ── DOM refs ──
const loadingScreen = document.getElementById('loading');
const btnSearch     = document.getElementById('btnSearch');
const inputSearch   = document.getElementById('searchInput');
const recipesRow    = document.getElementById('recipesRow');
const resultsInfo   = document.getElementById('resultsInfo');
const emptyState    = document.getElementById('emptyState');
const recipeSourceLink = document.getElementById('recipeSourceLink');

let allRecipes = [];

// ── Init ──
getRecipes('pizza');

// ── Events ──
btnSearch.addEventListener('click', handleSearch);

// Enter key support (was missing before)
inputSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Quick tag buttons
document.querySelectorAll('.quick-tag').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.q;
    inputSearch.value = q;
    getRecipes(q);
  });
});

function handleSearch() {
  const term = inputSearch.value.trim();
  if (!term) {
    inputSearch.focus();
    inputSearch.style.outline = '2px solid #f97316';
    setTimeout(() => inputSearch.style.outline = '', 1500);
    return;
  }
  getRecipes(term);
}

// ── Fetch recipes ──
async function getRecipes(term = 'pizza') {
  try {
    showLoading(true);
    clearResults();

    const res = await fetch(`https://forkify-api.herokuapp.com/api/search?q=${encodeURIComponent(term)}`);

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    allRecipes = data.recipes || [];

    if (allRecipes.length === 0) {
      emptyState.classList.remove('d-none');
      resultsInfo.classList.add('d-none');
    } else {
      displayData(term);
    }

  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

// ── Display cards ──
function displayData(term) {
  // Results count bar
  resultsInfo.innerHTML = `Found <strong>${allRecipes.length}</strong> recipes for "<strong>${term}</strong>"`;
  resultsInfo.classList.remove('d-none');
  emptyState.classList.add('d-none');

  // Build cards
  const fragment = document.createDocumentFragment();

  allRecipes.forEach((recipe, i) => {
    const col = document.createElement('div');
    col.className = 'col';

    // Shorten title cleanly — max 6 words, not 2
    const shortTitle = recipe.title.split(' ').slice(0, 6).join(' ') +
                       (recipe.title.split(' ').length > 6 ? '…' : '');

    col.innerHTML = `
      <div class="recipe-card">
        <div class="card-img-wrap">
          <img
            src="${recipe.image_url}"
            alt="${recipe.title}"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'"
          >
          <div class="card-img-overlay"></div>
          ${recipe.publisher ? `<span class="card-publisher">📍 ${recipe.publisher}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title">${recipe.title}</h3>
          <button
            class="card-btn"
            data-bs-toggle="modal"
            data-bs-target="#recipeModal"
            data-recipe-id="${recipe.recipe_id}"
          >
            View Recipe →
          </button>
        </div>
      </div>
    `;

    fragment.appendChild(col);
  });

  recipesRow.appendChild(fragment);

  // Attach modal open events after cards are rendered
  document.querySelectorAll('.card-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.recipeId));
  });
}

// ── Show recipe details in modal ──
async function showDetails(id) {
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = '';
  recipeSourceLink.href = '#';

  try {
    showLoading(true);

    const res = await fetch(`https://forkify-api.herokuapp.com/api/get?rId=${id}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    const r = data.recipe;

    // Update modal title
    document.getElementById('recipeModalLabel').textContent = r.title;

    // Source link
    if (r.source_url) {
      recipeSourceLink.href = r.source_url;
      recipeSourceLink.classList.remove('d-none');
    } else {
      recipeSourceLink.classList.add('d-none');
    }

    // Build ingredients list
    const ingredients = r.ingredients || [];
    const ingHTML = ingredients.length > 0
      ? `<p class="ingredients-title">Ingredients (${ingredients.length})</p>
         <ul class="ingredients-list">
           ${ingredients.map(ing => `
             <li>
               <span class="ing-dot"></span>
               <span>${ing}</span>
             </li>
           `).join('')}
         </ul>`
      : '';

    modalBody.innerHTML = `
      <img src="${r.image_url}" alt="${r.title}" class="modal-recipe-img"
           onerror="this.src='https://via.placeholder.com/600x280?text=No+Image'">
      <div class="modal-recipe-body">
        <h2 class="modal-recipe-title">${r.title}</h2>
        ${r.publisher ? `<p class="modal-recipe-publisher">by ${r.publisher}</p>` : ''}
        ${ingHTML}
      </div>
    `;

  } catch (error) {
    modalBody.innerHTML = `
      <div class="text-center p-5">
        <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
        <h5>Couldn't load recipe</h5>
        <p class="text-muted">${error.message}</p>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

// ── Helpers ──
function showLoading(show) {
  loadingScreen.classList.toggle('d-none', !show);
}

function clearResults() {
  recipesRow.innerHTML = '';
  resultsInfo.classList.add('d-none');
  emptyState.classList.add('d-none');
}

function showError(msg) {
  recipesRow.innerHTML = `
    <div class="col-12 text-center py-5">
      <div style="font-size:3rem;margin-bottom:16px">😕</div>
      <h5>Something went wrong</h5>
      <p class="text-muted">${msg || 'Please check your connection and try again.'}</p>
      <button class="search-btn mt-3" onclick="getRecipes('pizza')">Try Again</button>
    </div>
  `;
}