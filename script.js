const modal = document.getElementById("pokemonModal");
const closeModal = document.getElementById("closeModal");
const browseBtn = document.getElementById("browse-btn");
const pokemonListElem = document.getElementById("pokemonList");
const pageInfo = document.getElementById("pageInfo");
const nextPageBtn = document.getElementById("nextPage");
const prevPageBtn = document.getElementById("prevPage");
const filterInput = document.getElementById("filterInput");
const searchBar = document.getElementById("search-bar");
const searchBtn = document.getElementById("search-btn");
const pokemonContainer = document.getElementById("pokemonContainer");

let allPokemon = [];
let filteredPokemon = [];
let currentPage = 1;
const itemsPerPage = 20;

let isSearching = false;
let lastSearchTime = 0;
const cooldown = 1500;

// 🧩 Load Pokémon names
async function loadPokemonList() {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
    const data = await res.json();
    allPokemon = data.results;
    filteredPokemon = allPokemon;
  } catch (err) {
    console.error("Error loading Pokémon list:", err);
  }
}
loadPokemonList();

// 🧭 Render Pokémon list per page
function renderPokemonList(page) {
  pokemonListElem.innerHTML = "";
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredPokemon.slice(start, end);

  pageItems.forEach(pokemon => {
    const li = document.createElement("li");
    li.textContent = pokemon.name;
    li.addEventListener("click", async () => {
      searchBar.value = pokemon.name;
      modal.style.display = "none";
      await searchPokemon(); // 🔍 Automatically show details when clicked
    });
    pokemonListElem.appendChild(li);
  });

  pageInfo.textContent = `Page ${page}`;
  prevPageBtn.disabled = page === 1;
  nextPageBtn.disabled = end >= filteredPokemon.length;
}

// 🧭 Modal controls
browseBtn.addEventListener("click", () => {
  currentPage = 1;
  filteredPokemon = allPokemon;
  renderPokemonList(currentPage);
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// 🧭 Pagination
nextPageBtn.addEventListener("click", () => {
  if (currentPage * itemsPerPage < filteredPokemon.length) {
    currentPage++;
    renderPokemonList(currentPage);
  }
});
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPokemonList(currentPage);
  }
});

// 🧭 Filter Pokémon
filterInput.addEventListener("input", () => {
  const query = filterInput.value.toLowerCase();
  filteredPokemon = allPokemon.filter(p => p.name.includes(query));
  currentPage = 1;
  renderPokemonList(currentPage);
});

// 🔍 Fetch and display Pokémon data
async function searchPokemon() {
  const now = Date.now();
  if (isSearching || now - lastSearchTime < cooldown) {
    pokemonContainer.innerHTML = `<p style="color:red;">⏳ Please wait before searching again...</p>`;
    return;
  }

  const name = searchBar.value.trim().toLowerCase();
  if (!name) return;

  isSearching = true;
  lastSearchTime = now;
  searchBtn.disabled = true;
  searchBtn.innerText = "Searching...";

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error("❌ Pokémon not found!");
    const data = await res.json();

    const speciesRes = await fetch(data.species.url);
    const speciesData = await speciesRes.json();
    const description =
      speciesData.flavor_text_entries.find(e => e.language.name === "en")?.flavor_text.replace(/\f/g, " ") ||
      "No description available.";

    const types = data.types.map(t => t.type.name).join(", ");
    const stats = data.stats.reduce((acc, s) => {
      acc[s.stat.name] = s.base_stat;
      return acc;
    }, {});

    pokemonContainer.innerHTML = `
      <div class="card">
        <div class="card-inner">
          <div class="card-name">${data.name.toUpperCase()}</div>
          <img src="${data.sprites.front_default}" alt="${data.name}" class="card-img" />
          <div class="card-desc">
            <p><b>Type:</b> ${types}</p>
            <p><b>Description:</b> ${description}</p>
            <div class="stat"><span>HP:</span><span>${stats.hp}</span></div>
            <div class="stat"><span>Attack:</span><span>${stats.attack}</span></div>
            <div class="stat"><span>Defense:</span><span>${stats.defense}</span></div>
            <div class="stat"><span>Speed:</span><span>${stats.speed}</span></div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    pokemonContainer.innerHTML = `<p style="color:red;">${err.message}</p>`;
  } finally {
    isSearching = false;
    searchBtn.disabled = false;
    searchBtn.innerText = "Search";
  }
}

// 🧠 Events for search
searchBtn.addEventListener("click", searchPokemon);
searchBar.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchPokemon();
  }
});
