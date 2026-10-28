let _dbCrashRecords = [];
/**
 * ============================================================================
 * SMART CRASH & TRAFFIC MANAGEMENT SYSTEM
 * Domain: Web Development & Data Analytics
 * Description: Client-side JavaScript controller managing SPA navigation,
 * Leaflet map visualization, dynamic filtering, Chart.js analytics,
 * and incident reporting.
 * ============================================================================
 */

// ============================================================================
// 1. DATA MODELS & SAMPLE DATASETS
// ============================================================================

// Traffic Status Records for Bengaluru road corridors
const SAMPLE_TRAFFIC_DATA = [
  { road: "Hosur Road", level: "Heavy", speed: "24 km/h", status: "Congested" },
  { road: "Electronic City Road", level: "Moderate", speed: "42 km/h", status: "Moving" },
  { road: "Bannerghatta Road", level: "Low", speed: "58 km/h", status: "Clear" },
  { road: "Outer Ring Road", level: "Heavy", speed: "21 km/h", status: "Congested" },
  { road: "Sarjapur Road", level: "Moderate", speed: "39 km/h", status: "Moving" },
  { road: "Kanakapura Road", level: "Low", speed: "55 km/h", status: "Clear" }
];

// Sample Road / Crash Risk Locations for Leaflet Map (Bengaluru corridors)
const SAMPLE_MAP_LOCATIONS = [
  {
    name: "Hosur Road",
    lat: 12.8988,
    lng: 77.6433,
    crashCount: 4,
    riskLevel: "High",
    roadCondition: "Wet"
  },
  {
    name: "Electronic City Road",
    lat: 12.8452,
    lng: 77.6602,
    crashCount: 2,
    riskLevel: "Moderate",
    roadCondition: "Dry"
  },
  {
    name: "Bannerghatta Road",
    lat: 12.8912,
    lng: 77.5975,
    crashCount: 1,
    riskLevel: "Low",
    roadCondition: "Dry"
  },
  {
    name: "Outer Ring Road",
    lat: 12.9248,
    lng: 77.6805,
    crashCount: 5,
    riskLevel: "High",
    roadCondition: "Wet"
  },
  {
    name: "Sarjapur Road",
    lat: 12.9166,
    lng: 77.6750,
    crashCount: 2,
    riskLevel: "Moderate",
    roadCondition: "Dry"
  },
  {
    name: "Kanakapura Road",
    lat: 12.8805,
    lng: 77.5583,
    crashCount: 1,
    riskLevel: "Low",
    roadCondition: "Dry"
  }
];

// 8 Required Sample Crash Records
const SAMPLE_CRASH_RECORDS = [
  {
    id: "CR-001",
    location: "Hosur Road",
    date: "2026-08-12",
    type: "Vehicle Collision",
    severity: "High",
    condition: "Wet"
  },
  {
    id: "CR-002",
    location: "Electronic City Road",
    date: "2026-08-18",
    type: "Rear-end",
    severity: "Moderate",
    condition: "Dry"
  },
  {
    id: "CR-003",
    location: "Bannerghatta Road",
    date: "2026-08-21",
    type: "Skid",
    severity: "Low",
    condition: "Dry"
  },
  {
    id: "CR-004",
    location: "Outer Ring Road",
    date: "2026-09-02",
    type: "Vehicle Collision",
    severity: "High",
    condition: "Wet"
  },
  {
    id: "CR-005",
    location: "Sarjapur Road",
    date: "2026-09-05",
    type: "Side Impact",
    severity: "Moderate",
    condition: "Dry"
  },
  {
    id: "CR-006",
    location: "Hosur Road",
    date: "2026-09-10",
    type: "Rear-end",
    severity: "Low",
    condition: "Dry"
  },
  {
    id: "CR-007",
    location: "Outer Ring Road",
    date: "2026-09-13",
    type: "Vehicle Collision",
    severity: "High",
    condition: "Wet"
  },
  {
    id: "CR-008",
    location: "Kanakapura Road",
    date: "2026-09-16",
    type: "Skid",
    severity: "Moderate",
    condition: "Dry"
  }
];

// Global references for Map and Chart instances
let leafletMapInstance = null;
let leafletMarkersLayer = null;
let homeLeafletMapInstance = null;
let chartCrashSeverity = null;
let chartSeverityDash = null;
let chartLocationDash = null;
let chartTypeDash = null;
let chartTimelineDash = null;
let chartConditionDash = null;
let chartTrafficDash = null;
let _dashAutoRefreshTimer = null;
let _lastDashboardStats = null;
let cachedHistoricalCorridors = null;
let trafficMapHistoricalGroup = null;
let homeMapHistoricalGroup = null;
let currentTrafficDisplayMode = "live"; // "live" or "historical"

// ============================================================================
// 2. INITIALIZATION & SPA ROUTING
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initNavigation();
  initHomeRouteSearch();
  initFormHandling();
  initInAppCamera();
  initDashboard();
  handleRoute();
});

/**
 * Configure SPA page switching and mobile menu
 */
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-pill, .nav-link");
  const mobileToggle = document.getElementById("btnMobileMenuToggle");
  const topbarNav = document.getElementById("topbarNav");
  const backdrop = document.getElementById("mobileNavBackdrop");

  function closeMobileNav() {
    if (topbarNav) topbarNav.classList.remove("mobile-open");
    if (mobileToggle) {
      mobileToggle.classList.remove("is-active");
      mobileToggle.setAttribute("aria-expanded", "false");
    }
    if (backdrop) backdrop.classList.remove("active");
  }

  function toggleMobileNav() {
    if (!topbarNav) return;
    const isOpen = topbarNav.classList.toggle("mobile-open");
    if (mobileToggle) {
      mobileToggle.classList.toggle("is-active", isOpen);
      mobileToggle.setAttribute("aria-expanded", String(isOpen));
    }
    if (backdrop) {
      backdrop.classList.toggle("active", isOpen);
    }
  }

  if (mobileToggle && !mobileToggle.dataset.bound) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileNav();
    });
    mobileToggle.dataset.bound = "true";
  }

  if (backdrop && !backdrop.dataset.bound) {
    backdrop.addEventListener("click", () => {
      closeMobileNav();
    });
    backdrop.dataset.bound = "true";
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileNav();
    }
    if (typeof leafletMap !== "undefined" && leafletMap) {
      leafletMap.invalidateSize();
    }
  });

  // Intercept navigation links
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetHash = link.getAttribute("href");
      window.location.hash = targetHash;
      closeMobileNav();
    });
  });

  // Hero section navigation buttons
  const heroBtnExplore = document.getElementById("heroBtnExploreTraffic");
  if (heroBtnExplore) {
    heroBtnExplore.addEventListener("click", () => {
      navigateToPage("traffic");
    });
  }

  const heroBtnCrash = document.getElementById("heroBtnViewCrash");
  if (heroBtnCrash) {
    heroBtnCrash.addEventListener("click", () => {
      navigateToPage("crash-data");
    });
  }

  // Feature cards sublinks
  document.querySelectorAll(".card-footer-link a").forEach(cardLink => {
    cardLink.addEventListener("click", (e) => {
      e.preventDefault();
      const targetHash = cardLink.getAttribute("href");
      window.location.hash = targetHash;
    });
  });

  // Listen to browser hash changes
  window.addEventListener("hashchange", handleRoute);
}

/**
 * Handle route changes based on window.location.hash
 */
function handleRoute() {
  const hash = window.location.hash.replace("#", "") || "home";
  navigateToPage(hash);
}

/**
 * Switch the active page section and invoke specific page render functions
 * @param {string} pageId - Target page identifier
 */
function navigateToPage(pageId) {
  // Supported pages
  const validPages = ["home", "route", "traffic", "crash-data", "report-crash", "dashboard", "about"];
  const page = validPages.includes(pageId) ? pageId : "home";

  // Update hash if not matched
  if (window.location.hash !== `#${page}`) {
    window.location.hash = `#${page}`;
  }

  // Update active navigation link
  document.querySelectorAll(".nav-pill, .nav-link").forEach(link => {
    if (link.getAttribute("data-page") === page) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Toggle page visibility
  document.querySelectorAll(".page-section").forEach(sec => {
    sec.classList.remove("active");
  });

  const activeSection = document.getElementById(`page-${page}`);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  // Safety: stop camera hardware stream if user leaves the crash report page
  if (page !== "report-crash" && typeof stopInAppCameraStream === "function") {
    stopInAppCameraStream();
  }

  // Dashboard periodic auto-refresh management
  if (page === "dashboard") {
    if (!_dashAutoRefreshTimer) {
      _dashAutoRefreshTimer = setInterval(() => {
        const sec = document.getElementById("page-dashboard");
        if (sec && sec.classList.contains("active")) {
          renderDashboard(false);
        }
      }, 30000);
    }
  } else {
    if (_dashAutoRefreshTimer) {
      clearInterval(_dashAutoRefreshTimer);
      _dashAutoRefreshTimer = null;
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Invoke modular renderer for the selected page
  switch (page) {
    case "home":
      renderHome();
      break;
    case "route":
      renderScreenshotRoutePage();
      break;
    case "traffic":
      renderTraffic();
      break;
    case "crash-data":
      renderCrash();
      break;
    case "report-crash":
      renderReport();
      break;
    case "dashboard":
      renderDashboard(true);
      break;
    case "about":
      renderAbout();
      break;
    default:
      renderHome();
  }
}

// ============================================================================
// 3. PAGE RENDERERS
// ============================================================================

/**
 * Render Home Page
 */
function renderHome() {
  // Home dashboard preview map
  initHomeMap();
  // Route search visualizer
  initRouteSearch();
}

/**
 * Initialize the compact Bengaluru map shown on the Home dashboard.
 */
function initHomeMap() {
  const el = document.getElementById("homeTrafficMap");
  if (!el || typeof L === "undefined") return;

  setTimeout(() => {
    if (!homeLeafletMapInstance) {
      homeLeafletMapInstance = L.map("homeTrafficMap", {
        center: [12.9716, 77.5946],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(homeLeafletMapInstance);

      homeLeafletMarkersLayer = L.layerGroup().addTo(homeLeafletMapInstance);
      SAMPLE_MAP_LOCATIONS.forEach(loc => {
        let color = loc.riskLevel === "High" ? "#ef4444" : loc.riskLevel === "Moderate" ? "#f59e0b" : "#10b981";
        const marker = L.circleMarker([loc.lat, loc.lng], {
          radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: .92
        });
        marker.bindPopup(`<strong>${loc.name}</strong><br>Crash Count: ${loc.crashCount}<br>Risk: ${loc.riskLevel}<br>Road: ${loc.roadCondition}`);
        homeLeafletMarkersLayer.addLayer(marker);
      });

      // Render historical dataset corridors onto Home preview map
      homeMapHistoricalGroup = L.layerGroup().addTo(homeLeafletMapInstance);
      renderHistoricalCorridorLines(homeLeafletMapInstance, homeMapHistoricalGroup);
    }
    homeLeafletMapInstance.invalidateSize();
  }, 120);
}

/**
 * Render Traffic Monitoring Page
 */
function renderTraffic() {
  renderTrafficTable();
  initOrUpdateMap();
}

/**
 * Render Crash Data Page
 */
function renderCrash() {
  fetch(API_BASE + "/api/crash-reports")
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.reports)) {
        _dbCrashRecords = data.reports.map(r => ({
          id: "CR-" + String(r.report_id).padStart(4, "0"),
          location: r.location,
          date: r.report_date || "—",
          type: r.crash_type || "Vehicle Collision",
          severity: r.severity || "Moderate",
          condition: r.road_condition || "Normal",
          status: r.status,
          isDb: true
        }));
      }
    })
    .catch(() => {})
    .finally(() => {
      renderCrashSummaryCards();
      initCrashFilters();
      applyCrashFilters();
      renderCrashSeverityDistributionChart();
    });
}

/**
 * Render Crash Report Submission Page
 */
function renderReport() {
  if (!_currentUser || !_authToken) {
    _redirectAfterAuth = "report-crash";
  }
  updateAuthUI();

  // Keep date unpopulated so it shows the dd/mm/yyyy placeholder, default time to 00:00
  const dateInput = document.getElementById("reportDate");
  const timeInput = document.getElementById("reportTime");
  if (dateInput && !dateInput.value) {
    dateInput.value = "";
  }
  if (timeInput) {
    timeInput.value = "00:00";
  }

  loadUserReports();
}

/**
 * Render Analytics Dashboard
 */
function renderDashboard(isManualRefresh) {
  if (typeof fetchAndRenderDashboard === "function") {
    fetchAndRenderDashboard(isManualRefresh);
  }
}

/**
 * Render About Page
 */
function renderAbout() {
  // Static content, validated against project rubric
}

// ============================================================================
// 4. HISTORICAL TRAFFIC DATASET (Banglore_traffic_Dataset.csv) & LEAFLET MAP
// ============================================================================

/**
 * Fetch 16 corridors from backend /api/historical-traffic/corridors
 */
async function fetchHistoricalCorridors() {
  if (cachedHistoricalCorridors && cachedHistoricalCorridors.length > 0) {
    return cachedHistoricalCorridors;
  }
  try {
    const res = await fetch("http://127.0.0.1:5000/api/historical-traffic/corridors");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.corridors)) {
      cachedHistoricalCorridors = data.corridors;
      return cachedHistoricalCorridors;
    }
  } catch (err) {
    console.warn("Could not fetch historical traffic corridors:", err);
  }
  return [];
}

/**
 * Render real historical traffic lines on any Leaflet map
 * Green (< 60%), Yellow (60%–79.9%), Red (>= 80%)
 */
async function renderHistoricalCorridorLines(mapInstance, layerGroup) {
  if (!mapInstance || !layerGroup) return;
  layerGroup.clearLayers();

  const corridors = await fetchHistoricalCorridors();
  if (!corridors || corridors.length === 0) return;

  corridors.forEach(c => {
    if (!c.coordinates || c.coordinates.length < 2) return;

    // Dark casing line for contrast
    const casing = L.polyline(c.coordinates, {
      color: "#080f1e",
      weight: 8,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round"
    });
    layerGroup.addLayer(casing);

    // Colored road line based strictly on Congestion Level:
    // Green (< 60%), Yellow (60%–79.9%), Red (>= 80%)
    const poly = L.polyline(c.coordinates, {
      color: c.color,
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    });

    const popupHtml = `
      <div class="custom-leaflet-popup" style="font-size:12px; line-height:1.5; min-width:220px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
          <strong style="color:#ffffff; font-size:13px;">${escapeHtml(c.display_name)}</strong>
          <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:10px; background:${c.color}22; color:${c.color}; border:1px solid ${c.color}66;">${c.congestion_category}</span>
        </div>
        <div style="font-size:10px; color:#60a5fa; font-weight:700; margin-bottom:4px;">📊 HISTORICAL TRAFFIC DATASET</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Congestion Level:</span>
          <strong style="color:${c.color};">${c.congestion_level_pct}%</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Average Speed:</span>
          <span style="color:#f8fafc;">${c.average_speed_kmh} km/h</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Traffic Volume:</span>
          <span style="color:#f8fafc;">${c.traffic_volume.toLocaleString()} veh/day</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Travel Time Index:</span>
          <span style="color:#f8fafc;">${c.travel_time_index}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Incidents Logged:</span>
          <span style="color:#f8fafc;">${c.total_incidents}</span>
        </div>
        <div style="font-size:10px; color:#64748b; margin-top:6px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.08);">
          Source: Banglore_traffic_Dataset.csv (${c.sample_count} records)
        </div>
      </div>
    `;

    poly.bindPopup(popupHtml);
    layerGroup.addLayer(poly);
  });
}

/**
 * Render the road traffic table dynamically from Banglore_traffic_Dataset.csv
 */
async function renderTrafficTable() {
  const tbody = document.getElementById("trafficTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#94a3b8;">Loading dataset telemetry from Banglore_traffic_Dataset.csv...</td></tr>`;

  const corridors = await fetchHistoricalCorridors();
  if (!corridors || corridors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#f87171;">⚠️ Unable to load Banglore_traffic_Dataset.csv from backend. Ensure Flask is running at http://127.0.0.1:5000.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  corridors.forEach(item => {
    const row = document.createElement("tr");

    let levelBadgeClass = "badge-traffic ";
    if (item.congestion_category === "Low") levelBadgeClass += "low";
    else if (item.congestion_category === "Moderate") levelBadgeClass += "moderate";
    else levelBadgeClass += "heavy";

    let statusBadgeClass = "badge-traffic ";
    if (item.congestion_category === "Low") statusBadgeClass += "clear";
    else if (item.congestion_category === "Moderate") statusBadgeClass += "moving";
    else statusBadgeClass += "congested";

    row.innerHTML = `
      <td><strong>${escapeHtml(item.road_name)}</strong> <span style="font-size:0.75rem; color:#94a3b8;">(${escapeHtml(item.area_name)})</span></td>
      <td><span class="${levelBadgeClass}">${item.congestion_level_pct}% (${item.congestion_category})</span></td>
      <td><strong>${item.average_speed_kmh} km/h</strong></td>
      <td>${item.traffic_volume.toLocaleString()} veh</td>
      <td>${item.total_incidents}</td>
      <td><span class="${statusBadgeClass}">${escapeHtml(item.status_label)}</span></td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Initialize or update Leaflet.js map for Bengaluru corridors
 */
function initOrUpdateMap() {
  const mapContainer = document.getElementById("trafficMap");
  if (!mapContainer) return;

  setTimeout(() => {
    if (!leafletMapInstance) {
      leafletMapInstance = L.map("trafficMap", {
        center: [12.9600, 77.6200],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(leafletMapInstance);

      // Add historical corridor polylines layer
      trafficMapHistoricalGroup = L.layerGroup().addTo(leafletMapInstance);
      renderHistoricalCorridorLines(leafletMapInstance, trafficMapHistoricalGroup);

      leafletMarkersLayer = L.layerGroup().addTo(leafletMapInstance);
      renderMapMarkers();
    } else {
      leafletMapInstance.invalidateSize();
      if (trafficMapHistoricalGroup) {
        renderHistoricalCorridorLines(leafletMapInstance, trafficMapHistoricalGroup);
      }
    }
  }, 100);
}

/**
 * Render risk markers on the Leaflet map with colored circle pins & popups
 */
function renderMapMarkers() {
  if (!leafletMarkersLayer) return;
  leafletMarkersLayer.clearLayers();

  SAMPLE_MAP_LOCATIONS.forEach(loc => {
    let color = "#10b981"; // Low Risk = Green
    let riskBadgeClass = "level-green";

    if (loc.riskLevel === "High") {
      color = "#ef4444"; // Red
      riskBadgeClass = "level-red";
    } else if (loc.riskLevel === "Moderate") {
      color = "#f59e0b"; // Yellow
      riskBadgeClass = "level-yellow";
    }

    // Leaflet circleMarker provides crisp, responsive vector dots with pulse
    const circle = L.circleMarker([loc.lat, loc.lng], {
      radius: 10,
      fillColor: color,
      color: "#ffffff",
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.9
    });

    const popupContent = `
      <div class="custom-leaflet-popup">
        <h4 class="popup-title">${loc.name}</h4>
        <div class="popup-row">
          <span class="popup-label">Crash Count:</span>
          <span class="popup-val">${loc.crashCount}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Risk Level:</span>
          <span class="popup-val"><span class="status-level-badge ${riskBadgeClass}">${loc.riskLevel} Risk</span></span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Road Condition:</span>
          <span class="popup-val">${loc.roadCondition}</span>
        </div>
        <span class="popup-tag">Active Monitoring Point</span>
      </div>
    `;

    circle.bindPopup(popupContent);
    leafletMarkersLayer.addLayer(circle);
  });
}

// ============================================================================
// 5. CRASH DATA PAGE & DYNAMIC FILTERS
// ============================================================================

/**
 * Get combined list of crashes: base dataset + user-submitted reports from localStorage
 */
function getAllCrashRecords() {
  if (_dbCrashRecords && _dbCrashRecords.length > 0) {
    const dbIds = new Set(_dbCrashRecords.map(r => r.id));
    const localData = getLocalStorageReports().filter(item => !dbIds.has(item.id));
    const localMapped = localData.map((item, idx) => ({
      id: item.id || `CR-RPT-${idx + 1}`,
      location: item.location,
      date: item.date,
      type: item.crashType,
      severity: item.severity,
      condition: item.roadCondition,
      status: item.status || "Pending",
      isLocal: true
    }));
    return [..._dbCrashRecords, ...localMapped];
  }

  // Fallback to sample dataset only if database is completely offline/empty
  return [...SAMPLE_CRASH_RECORDS];
}

/**
 * Calculate and render summary counts on the Crash Data page
 */
function renderCrashSummaryCards() {
  const records = getAllCrashRecords();
  const total = records.length;
  const high = records.filter(r => r.severity === "High").length;
  const moderate = records.filter(r => r.severity === "Moderate").length;
  const low = records.filter(r => r.severity === "Low").length;

  const totalEl = document.getElementById("statTotalCrashes");
  const highEl = document.getElementById("statHighSeverity");
  const modEl = document.getElementById("statModSeverity");
  const lowEl = document.getElementById("statLowSeverity");

  if (totalEl) totalEl.textContent = total;
  if (highEl) highEl.textContent = high;
  if (modEl) modEl.textContent = moderate;
  if (lowEl) lowEl.textContent = low;
}

/**
 * Attach change events to Crash Data filter dropdowns
 */
function initCrashFilters() {
  const locFilter = document.getElementById("filterLocation");
  const sevFilter = document.getElementById("filterSeverity");
  const typeFilter = document.getElementById("filterType");
  const resetBtn = document.getElementById("resetFiltersBtn");

  if (locFilter && !locFilter.dataset.bound) {
    locFilter.addEventListener("change", applyCrashFilters);
    locFilter.dataset.bound = "true";
  }
  if (sevFilter && !sevFilter.dataset.bound) {
    sevFilter.addEventListener("change", applyCrashFilters);
    sevFilter.dataset.bound = "true";
  }
  if (typeFilter && !typeFilter.dataset.bound) {
    typeFilter.addEventListener("change", applyCrashFilters);
    typeFilter.dataset.bound = "true";
  }
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.addEventListener("click", () => {
      if (locFilter) locFilter.value = "All";
      if (sevFilter) sevFilter.value = "All";
      if (typeFilter) typeFilter.value = "All";
      applyCrashFilters();
    });
    resetBtn.dataset.bound = "true";
  }
}

/**
 * Filter the crash records dynamically and update table DOM
 */
function applyCrashFilters() {
  const locVal = document.getElementById("filterLocation")?.value || "All";
  const sevVal = document.getElementById("filterSeverity")?.value || "All";
  const typeVal = document.getElementById("filterType")?.value || "All";

  const allRecords = getAllCrashRecords();

  const filtered = allRecords.filter(item => {
    const matchLoc = locVal === "All" || item.location === locVal;
    const matchSev = sevVal === "All" || item.severity === sevVal;
    const matchType = typeVal === "All" || item.type === typeVal;
    return matchLoc && matchSev && matchType;
  });

  const tbody = document.getElementById("crashTableBody");
  const countEl = document.getElementById("tableResultsCount");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
        No crash records match the selected filter criteria. Try resetting filters.
      </td>
    `;
    tbody.appendChild(emptyRow);
  } else {
    filtered.forEach(item => {
      const row = document.createElement("tr");

      let sevClass = "badge-traffic ";
      if (item.severity === "High") sevClass += "heavy";
      else if (item.severity === "Moderate") sevClass += "moderate";
      else sevClass += "low";

      const statusBadge = item.status
        ? `<span class="status-badge status-${(item.status || 'pending').toLowerCase()}" style="font-size:0.68rem; margin-left:6px; padding:2px 6px;">${escapeHtml(item.status)}</span>`
        : '';

      row.innerHTML = `
        <td><code>${item.id}</code> ${statusBadge}</td>
        <td><strong>${escapeHtml(item.location)}</strong></td>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.type)}</td>
        <td><span class="${sevClass}">${escapeHtml(item.severity)}</span></td>
        <td>${escapeHtml(item.condition)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allRecords.length} records`;
  }
}

/**
 * Chart.js: Crash Severity Distribution Chart (Doughnut)
 */
function renderCrashSeverityDistributionChart() {
  const canvas = document.getElementById("crashSeverityChart");
  if (!canvas) return;

  const records = getAllCrashRecords();
  const highCount = records.filter(r => r.severity === "High").length;
  const modCount = records.filter(r => r.severity === "Moderate").length;
  const lowCount = records.filter(r => r.severity === "Low").length;

  if (chartCrashSeverity) {
    chartCrashSeverity.destroy();
  }

  const ctx = canvas.getContext("2d");
  chartCrashSeverity = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["High Severity", "Moderate Severity", "Low Severity"],
      datasets: [
        {
          data: [highCount, modCount, lowCount],
          backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 14,
            padding: 15,
            font: { family: "Inter", size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` ${context.label}: ${context.raw} records`;
            }
          }
        }
      },
      cutout: "62%"
    }
  });
}

// ============================================================================
// 6. REPORT CRASH FORM â€” FLASK BACKEND INTEGRATION
// ============================================================================

// Backend base URL — dynamically resolved for localhost, local Wi-Fi, and mobile devices
const API_BASE = (typeof window !== "undefined" && window.location && (window.location.protocol === "http:" || window.location.protocol === "https:") && window.location.hostname)
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : "http://127.0.0.1:5000";

/**
 * Helper to get user-scoped localStorage key
 */
function getLocalStorageKey() {
  if (_currentUser && _currentUser.user_id) {
    return "crashReports_uid_" + _currentUser.user_id;
  }
  return "crashReports_guest";
}

/**
 * Helper to fetch stored crash reports from localStorage (local mirror)
 * @returns {Array}
 */
function getLocalStorageReports() {
  try {
    const key = getLocalStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to read crashReports from localStorage:", err);
    return [];
  }
}

/**
 * Helper to save crash reports array to localStorage
 * @param {Array} reports
 */
function saveLocalStorageReports(reports) {
  try {
    const key = getLocalStorageKey();
    localStorage.setItem(key, JSON.stringify(reports));
  } catch (err) {
    console.error("Unable to save crashReports to localStorage:", err);
  }
}

// ============================================================================
// IN-APP CAMERA HARDWARE CAPTURE & METADATA MANAGEMENT
// ============================================================================
let _activeCameraStream = null;
let _cameraFacingMode = "environment"; // "environment" (rear camera) or "user" (front camera)
let _capturedPhotoData = null;      // base64 data URL
let _capturedAt = null;             // ISO timestamp string
let _captureLat = null;             // Geolocation latitude at shutter press
let _captureLng = null;             // Geolocation longitude at shutter press

function initInAppCamera() {
  const btnOpen = document.getElementById("btnOpenInAppCamera");
  const btnShutter = document.getElementById("btnShutterSnap");
  const btnCancel = document.getElementById("btnCancelCameraStream");
  const btnRetake = document.getElementById("btnRetakePhoto");
  const btnRemove = document.getElementById("btnRemovePhoto");
  const btnSnapSubmit = document.getElementById("btnSnapSubmitShortcut");
  const btnDismissAlert = document.getElementById("btnDismissCameraAlert");
  const btnClosePhoto = document.getElementById("btnClosePhotoModal");
  const btnClosePhotoBtm = document.getElementById("btnClosePhotoModalBottom");

  if (btnOpen) {
    btnOpen.addEventListener("click", () => {
      openInAppCameraStream();
    });
  }

  if (btnSnapSubmit) {
    btnSnapSubmit.addEventListener("click", () => {
      const submitBtn = document.getElementById("submitReportBtn");
      if (submitBtn) submitBtn.click();
    });
  }

  if (btnShutter) {
    btnShutter.addEventListener("click", () => {
      captureSnapshotFromLiveStream();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      stopInAppCameraStream();
    });
  }

  if (btnRetake) {
    btnRetake.addEventListener("click", () => {
      retakeInAppPhoto();
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener("click", () => {
      removeInAppPhoto();
    });
  }

  if (btnDismissAlert) {
    btnDismissAlert.addEventListener("click", () => {
      hideCameraAlert();
    });
  }

  if (btnClosePhoto) {
    btnClosePhoto.addEventListener("click", () => {
      closePhotoModal();
    });
  }

  if (btnClosePhotoBtm) {
    btnClosePhotoBtm.addEventListener("click", () => {
      closePhotoModal();
    });
  }

  const btnFlip = document.getElementById("btnFlipCamera");
  if (btnFlip && !btnFlip.dataset.bound) {
    btnFlip.addEventListener("click", () => {
      flipInAppCamera();
    });
    btnFlip.dataset.bound = "true";
  }

  // Safety: Stop active camera tracks if user closes the tab or navigates away
  window.addEventListener("beforeunload", () => {
    stopInAppCameraStream();
  });
}

/**
 * Switch between rear (environment) and front (user) cameras on mobile devices
 */
async function flipInAppCamera() {
  _cameraFacingMode = (_cameraFacingMode === "environment" ? "user" : "environment");
  const flipText = document.getElementById("flipCameraText");
  if (flipText) {
    flipText.textContent = _cameraFacingMode === "environment" ? "Flip" : "Rear";
  }
  if (_activeCameraStream) {
    stopInAppCameraStream();
    await openInAppCameraStream();
  }
}

function showCameraAlert(title, message) {
  const alertEl = document.getElementById("cameraAlertBanner");
  const titleEl = document.getElementById("cameraAlertTitle");
  const msgEl = document.getElementById("cameraAlertMsg");
  if (!alertEl) return;
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  alertEl.classList.remove("hidden");
  alertEl.style.display = "flex";
}

function hideCameraAlert() {
  const alertEl = document.getElementById("cameraAlertBanner");
  if (alertEl) {
    alertEl.classList.add("hidden");
    alertEl.style.display = "none";
  }
}

async function openInAppCameraStream() {
  hideCameraAlert();

  // 1. Check secure context (navigator.mediaDevices requires HTTPS or localhost)
  const isSecure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isSecure) {
    showCameraAlert(
      "Secure Context Required on Mobile (HTTPS / Localhost)",
      "The browser MediaDevices camera API requires a secure context (HTTPS or localhost). On desktop, http://localhost:3000 is always allowed. On Android/iOS connecting via local Wi-Fi (" + window.location.host + "), modern browsers require HTTPS, port forwarding (e.g., 'adb reverse tcp:3000 tcp:3000' for Android USB), or enabling chrome://flags/#unsafely-treat-insecure-origin-as-secure."
    );
    return;
  }

  // 2. Check browser support for MediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraAlert(
      "Camera API Unsupported",
      "Your current browser does not support native camera media capture (getUserMedia). Please use Chrome, Edge, Safari, or Firefox."
    );
    return;
  }

  const video = document.getElementById("cameraVideoFeed");
  const liveBox = document.getElementById("cameraLiveBox");
  const triggerWrap = document.getElementById("cameraTriggerWrapper");
  const statusText = document.getElementById("cameraStatusText");

  if (statusText) statusText.textContent = "Requesting camera permission...";

  // 3. Request native user camera stream with facingMode (rear or front)
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: _cameraFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  } catch (err1) {
    console.warn("Requested facingMode constraint failed, attempting general video constraint:", err1);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err2) {
      console.error("Camera access error:", err2);
      let errTitle = "Camera Access Error";
      let errMsg = "Unable to start camera feed.";

      if (err2.name === "NotAllowedError" || err2.name === "PermissionDeniedError") {
        errTitle = "Camera Permission Required";
        errMsg = "A photo captured using the in-app camera is required to submit a crash report. Your report cannot be submitted without camera access. Please click the site settings / lock icon 🔒 in your browser's address bar, set Camera to 'Allow', and click 'Capture Accident Photo' again.";
      } else if (err2.name === "NotFoundError" || err2.name === "DevicesNotFoundError") {
        errTitle = "Camera Device Not Found";
        errMsg = "A photo captured using the in-app camera is required to submit a crash report. No camera hardware was detected on your system. Please connect a webcam or access this platform from a mobile device with a camera.";
      } else if (err2.name === "NotReadableError" || err2.name === "TrackStartError") {
        errTitle = "Camera Device In Use";
        errMsg = "A photo captured using the in-app camera is required to submit a crash report. Your camera is currently in use by another application. Please close other applications and try again.";
      } else if (err2.name === "OverconstrainedError") {
        errTitle = "Camera Constraints Unmet";
        errMsg = "A photo captured using the in-app camera is required to submit a crash report. The requested video resolution or settings are not supported by your camera.";
      } else {
        errTitle = "Camera Access Required";
        errMsg = "A photo captured using the in-app camera is required to submit a crash report. Camera error: " + (err2.message || err2.name);
      }

      showCameraAlert(errTitle, errMsg);
      return;
    }
  }

  _activeCameraStream = stream;
  if (video) {
    video.srcObject = stream;
    try {
      await video.play();
    } catch (playErr) {
      console.warn("Video play error:", playErr);
    }
  }

  if (liveBox) {
    liveBox.classList.remove("hidden");
    liveBox.style.display = "block";
  }
  if (triggerWrap) {
    triggerWrap.classList.add("hidden");
    triggerWrap.style.display = "none";
  }
  if (statusText) statusText.textContent = "Align incident scene in camera preview";
}

function stopInAppCameraStream() {
  if (_activeCameraStream) {
    try {
      _activeCameraStream.getTracks().forEach(track => {
        track.stop();
      });
    } catch (e) {
      console.warn("Error stopping camera tracks:", e);
    }
    _activeCameraStream = null;
  }

  const video = document.getElementById("cameraVideoFeed");
  if (video) {
    video.srcObject = null;
  }

  const liveBox = document.getElementById("cameraLiveBox");
  if (liveBox) {
    liveBox.classList.add("hidden");
    liveBox.style.display = "none";
  }

  // Restore trigger wrapper only if no photo was captured
  const triggerWrap = document.getElementById("cameraTriggerWrapper");
  if (triggerWrap && !_capturedPhotoData) {
    triggerWrap.classList.remove("hidden");
    triggerWrap.style.display = "flex";
  }
}

function captureSnapshotFromLiveStream() {
  const video = document.getElementById("cameraVideoFeed");
  const canvas = document.getElementById("cameraCanvasBuffer");
  if (!video || !canvas) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  // Export as JPEG (quality 0.85) ensuring <= 5MB
  _capturedPhotoData = canvas.toDataURL("image/jpeg", 0.85);
  _capturedAt = new Date().toISOString();
  _captureLat = null;
  _captureLng = null;

  // Immediately stop camera tracks as required
  stopInAppCameraStream();

  // Show captured snapshot preview card
  const card = document.getElementById("capturedSnapshotCard");
  const imgPreview = document.getElementById("capturedSnapshotPreview");
  const timeEl = document.getElementById("metaCapturedTimestamp");
  const coordsEl = document.getElementById("metaCapturedCoordinates");
  const triggerWrap = document.getElementById("cameraTriggerWrapper");

  if (imgPreview) imgPreview.src = _capturedPhotoData;
  if (timeEl) timeEl.textContent = new Date(_capturedAt).toLocaleString();
  if (coordsEl) coordsEl.textContent = "Detecting GPS coordinates...";

  if (card) {
    card.classList.remove("hidden");
    card.style.display = "flex";
  }
  if (triggerWrap) {
    triggerWrap.classList.add("hidden");
    triggerWrap.style.display = "none";
  }

  // Clear any existing missing-photo error banner
  const photoErrEl = document.getElementById("photoError");
  if (photoErrEl) {
    photoErrEl.textContent = "";
    photoErrEl.classList.remove("active");
    photoErrEl.style.display = "none";
  }

  // Capture optional device GPS at time of shutter press
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _captureLat = pos.coords.latitude;
        _captureLng = pos.coords.longitude;
        if (coordsEl) {
          coordsEl.textContent = `${_captureLat.toFixed(5)}° N, ${_captureLng.toFixed(5)}° E`;
        }
      },
      (geoErr) => {
        console.warn("Incident capture geolocation skipped:", geoErr.message);
        if (coordsEl) coordsEl.textContent = "Location permission denied / unavailable";
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );
  } else {
    if (coordsEl) coordsEl.textContent = "Geolocation unsupported by device";
  }
}

function retakeInAppPhoto() {
  removeInAppPhoto();
  openInAppCameraStream();
}

function removeInAppPhoto() {
  _capturedPhotoData = null;
  _capturedAt = null;
  _captureLat = null;
  _captureLng = null;

  const card = document.getElementById("capturedSnapshotCard");
  const imgPreview = document.getElementById("capturedSnapshotPreview");
  if (imgPreview) imgPreview.src = "";
  if (card) {
    card.classList.add("hidden");
    card.style.display = "none";
  }

  stopInAppCameraStream();

  const triggerWrap = document.getElementById("cameraTriggerWrapper");
  if (triggerWrap) {
    triggerWrap.classList.remove("hidden");
    triggerWrap.style.display = "flex";
  }
}

function resetInAppCameraFormState() {
  _capturedPhotoData = null;
  _capturedAt = null;
  _captureLat = null;
  _captureLng = null;

  stopInAppCameraStream();
  hideCameraAlert();

  const card = document.getElementById("capturedSnapshotCard");
  if (card) {
    card.classList.add("hidden");
    card.style.display = "none";
  }
  const imgPreview = document.getElementById("capturedSnapshotPreview");
  if (imgPreview) imgPreview.src = "";

  const triggerWrap = document.getElementById("cameraTriggerWrapper");
  if (triggerWrap) {
    triggerWrap.classList.remove("hidden");
    triggerWrap.style.display = "flex";
  }
}

/**
 * Bind form submit and validation logic.
 * On valid submission -> POST to Flask API -> save to MySQL.
 * Success message only shows AFTER backend confirms DB insert.
 */
function initFormHandling() {
  const form = document.getElementById("crashReportForm");
  const clearBtn = document.getElementById("clearLocalReportsBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all saved incident reports?")) {
        try {
          localStorage.removeItem(getLocalStorageKey());
          localStorage.removeItem("crashReports");
        } catch (_) {}
        renderLocalReportsTable();
      }
    });
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Require user login before submitting crash reports
    if (!_authToken || !_currentUser) {
      openAuthModal("login");
      showAuthAlert("Please sign in or create an account to submit a crash report.", false);
      return;
    }

    // Field references (existing HTML IDs -- unchanged)
    const nameInput = document.getElementById("reporterName");
    const locInput  = document.getElementById("reportLocation");
    const dateInput = document.getElementById("reportDate");
    const timeInput = document.getElementById("reportTime");
    const typeInput = document.getElementById("reportCrashType");
    const sevInput  = document.getElementById("reportSeverity");
    const condInput = document.getElementById("reportCondition");
    const descInput = document.getElementById("reportDescription");

    // Client-side validation (same logic as before)
    let isValid = true;
    const fields = [
      { input: nameInput, error: "nameError",      msg: "Please enter reporter name." },
      { input: locInput,  error: "locationError",  msg: "Please select crash location." },
      { input: dateInput, error: "dateError",      msg: "Please specify crash date." },
      { input: timeInput, error: "timeError",      msg: "Please specify crash time." },
      { input: typeInput, error: "typeError",      msg: "Please choose crash type." },
      { input: sevInput,  error: "severityError",  msg: "Please choose severity level." },
      { input: condInput, error: "conditionError", msg: "Please choose road condition." },
      { input: descInput, error: "descError",      msg: "Please provide incident description." }
    ];

    fields.forEach(f => {
      const errEl = document.getElementById(f.error);
      if (!f.input || !f.input.value.trim()) {
        isValid = false;
        if (errEl) { errEl.textContent = f.msg; errEl.classList.add("active"); }
      } else {
        if (errEl) { errEl.textContent = ""; errEl.classList.remove("active"); }
      }
    });

    // Mandatory In-App Camera Accident Photo Validation
    const photoErrEl = document.getElementById("photoError");
    if (!_capturedPhotoData || !_capturedPhotoData.trim()) {
      isValid = false;
      if (photoErrEl) {
        photoErrEl.textContent = "Please capture an accident photo before submitting your report.";
        photoErrEl.classList.add("active");
        photoErrEl.style.display = "block";
      }
      const camGroup = document.getElementById("cameraCaptureGroup");
      if (camGroup) {
        camGroup.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      if (photoErrEl) {
        photoErrEl.textContent = "";
        photoErrEl.classList.remove("active");
        photoErrEl.style.display = "none";
      }
    }

    if (!isValid) return;

    // Build JSON payload matching the Flask API contract
    const payload = {
      reporter_name:  nameInput.value.trim(),
      location:       locInput.value,
      report_date:    dateInput.value,
      report_time:    timeInput.value,
      crash_type:     typeInput.value,
      severity:       sevInput.value,
      road_condition: condInput.value,
      description:    descInput.value.trim(),
      photo_data:     _capturedPhotoData || "",
      captured_at:    _capturedAt || "",
      capture_lat:    _captureLat,
      capture_lng:    _captureLng
    };

    // Disable submit button while in-flight
    const submitBtn = document.getElementById("submitReportBtn");
    const origBtnHTML = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    // POST to Flask backend (Authenticated)
    fetch(API_BASE + "/api/crash-reports", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        let data;
        try { data = await response.json(); } catch (_) { data = {}; }

        if (!response.ok || !data.success) {
          showFormError(data.error || "We couldn't save your report. Please try again.");
          return;
        }

        // CONFIRMED DB INSERT -- success banner with Report ID
        showFormSuccess(data.report_id, data.status);

        // Reset form and restore default date (dd/mm/yyyy) and time (00:00)
        form.reset();
        if (dateInput) dateInput.value = "";
        if (timeInput) timeInput.value = "00:00";
        resetInAppCameraFormState();

        // Mirror to localStorage so the table updates immediately
        const localReport = {
          id:           "CR-" + String(data.report_id).padStart(4, "0"),
          name:         payload.reporter_name,
          location:     payload.location,
          date:         payload.report_date,
          time:         payload.report_time,
          crashType:    payload.crash_type,
          severity:     payload.severity,
          roadCondition:payload.road_condition,
          description:  payload.description,
          status:       data.status,
          photo_path:   data.photo_path || null,
          captured_at:  data.captured_at || payload.captured_at,
          capture_lat:  data.capture_lat !== undefined ? data.capture_lat : payload.capture_lat,
          capture_lng:  data.capture_lng !== undefined ? data.capture_lng : payload.capture_lng,
          submittedAt:  new Date().toLocaleString()
        };
        const existing = getLocalStorageReports();
        existing.unshift(localReport);
        saveLocalStorageReports(existing);

        // Also push to active memory so severity counts update immediately
        _dbCrashRecords.unshift({
          id: "CR-" + String(data.report_id).padStart(4, "0"),
          location: payload.location,
          date: payload.report_date || "—",
          type: payload.crash_type || "Vehicle Collision",
          severity: payload.severity || "Moderate",
          condition: payload.road_condition || "Normal",
          status: data.status,
          isDb: true
        });
        renderCrashSummaryCards();
        renderLocalReportsTable();
        // Immediately refresh Dashboard metrics & database reports table
        if (typeof renderDashboard === "function") {
          renderDashboard(false);
        }
      })
      .catch((err) => {
        console.error("Network error submitting crash report:", err);
        showFormError("Unable to connect to the server. Please try again later.");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnHTML ||
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> SUBMIT REPORT';
        }
      });
  });
}

/**
 * Show professional in-page success banner.
 * Called ONLY after backend confirms the DB insert (201 response).
 */
function showFormSuccess(reportId, status) {
  const alertEl = document.getElementById("formSuccessAlert");
  if (!alertEl) return;
  alertEl.removeAttribute("style");
  alertEl.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
    '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
    '</svg>' +
    '<div>' +
    '<strong>Crash Report Submitted</strong><br>' +
    '<span>Your report has been successfully saved to the database.</span><br>' +
    '<small>Report ID: <strong>CR-' + String(reportId).padStart(4, "0") + '</strong>' +
    ' &nbsp;|&nbsp; Status: <strong>' + escapeHtml(status) + ' Verification</strong></small><br>' +
    '<small style="color:#065f46;margin-top:4px;display:block;">Thank you for helping improve road safety.</small>' +
    '</div>';
  alertEl.classList.remove("hidden");
  setTimeout(() => alertEl.classList.add("hidden"), 9000);
}

/**
 * Show in-page error banner on form submission failure.
 * Never exposes MySQL errors or stack traces.
 */
function showFormError(message) {
  const alertEl = document.getElementById("formSuccessAlert");
  if (!alertEl) return;
  alertEl.style.cssText = "background-color:#fef2f2;border-color:#fecaca;color:#991b1b;";
  alertEl.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<line x1="15" y1="9" x2="9" y2="15"></line>' +
    '<line x1="9" y1="9" x2="15" y2="15"></line>' +
    '</svg>' +
    '<span>' + escapeHtml(message) + '</span>';
  alertEl.classList.remove("hidden");
  setTimeout(() => {
    alertEl.classList.add("hidden");
    alertEl.removeAttribute("style");
  }, 7000);
}

/**
 * Render reports saved in browser localStorage
 */
function renderLocalReportsTable() {
  const tbody = document.getElementById("localReportsTableBody");
  if (!tbody) return;

  const reports = getLocalStorageReports();
  tbody.innerHTML = "";

  if (reports.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td colspan="7" style="text-align:center;color:#94a3b8;padding:1.5rem;">' +
      'No crash reports yet. Submit a report above!' +
      '</td>';
    tbody.appendChild(row);
    return;
  }

  reports.forEach(report => {
    const row = document.createElement("tr");
    let sevBadge = "badge-traffic ";
    if (report.severity === "High") sevBadge += "heavy";
    else if (report.severity === "Moderate") sevBadge += "moderate";
    else sevBadge += "low";

    row.innerHTML =
      '<td><small style="color:#64748b;">' + (report.submittedAt || "Just now") + '</small></td>' +
      '<td><strong>' + escapeHtml(report.name) + '</strong></td>' +
      '<td>' + escapeHtml(report.location) + '</td>' +
      '<td>' + escapeHtml(formatDDMMYYYY(report.date)) + ' ' + escapeHtml(report.time) + '</td>' +
      '<td>' + escapeHtml(report.crashType) + '</td>' +
      '<td><span class="' + sevBadge + '">' + escapeHtml(report.severity) + '</span></td>' +
      '<td>' + escapeHtml(report.roadCondition) + '</td>' +
      '<td><span class="status-badge status-' + (report.status || 'pending').toLowerCase() + '">' + escapeHtml(report.status || 'Pending') + '</span></td>';
    tbody.appendChild(row);
  });
}

/**
 * Format ISO or YYYY-MM-DD date to dd/mm/yyyy
 */
function formatDDMMYYYY(d) {
  if (!d || d === "\u2014" || d === "—") return "\u2014";
  var s = String(d).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return m[3] + "/" + m[2] + "/" + m[1];
  }
  return s;
}

/**
 * Minimal XSS defense for locally rendered strings
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================================
// 7. DATABASE-DRIVEN DASHBOARD PAGE & CHARTS (CHART.JS)
// ============================================================================

/**
 * Initialize Dashboard DOM Event Listeners
 */
function initDashboard() {
  const refreshBtn = document.getElementById("btnRefreshDashboard");
  const scopeSelect = document.getElementById("dashScopeSelect");
  const statusFilter = document.getElementById("dashStatusFilter");
  const retryBtn = document.getElementById("btnRetryDashboard");
  const closePhotoBtn = document.getElementById("btnClosePhotoModal");
  const closePhotoBtnBottom = document.getElementById("btnClosePhotoModalBottom");

  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.addEventListener("click", () => fetchAndRenderDashboard(true));
    refreshBtn.dataset.bound = "true";
  }

  if (scopeSelect && !scopeSelect.dataset.bound) {
    scopeSelect.addEventListener("change", () => {
      scopeSelect.dataset.userChanged = "true";
      fetchAndRenderDashboard(true);
    });
    scopeSelect.dataset.bound = "true";
  }

  if (statusFilter && !statusFilter.dataset.bound) {
    statusFilter.addEventListener("change", () => {
      if (_lastDashboardStats && Array.isArray(_lastDashboardStats.recent_reports)) {
        renderDashboardReportsTable(_lastDashboardStats.recent_reports);
      }
    });
    statusFilter.dataset.bound = "true";
  }

  if (retryBtn && !retryBtn.dataset.bound) {
    retryBtn.addEventListener("click", () => fetchAndRenderDashboard(true));
    retryBtn.dataset.bound = "true";
  }

  if (closePhotoBtn && !closePhotoBtn.dataset.bound) {
    closePhotoBtn.addEventListener("click", closeDashboardPhotoModal);
    closePhotoBtn.dataset.bound = "true";
  }

  if (closePhotoBtnBottom && !closePhotoBtnBottom.dataset.bound) {
    closePhotoBtnBottom.addEventListener("click", closeDashboardPhotoModal);
    closePhotoBtnBottom.dataset.bound = "true";
  }
}

/**
 * Fetch and Render the Database-Driven Dashboard
 * @param {boolean} isManual - whether triggered by user action
 */
async function fetchAndRenderDashboard(isManual) {
  const loadingEl = document.getElementById("dashLoadingState");
  const errorEl = document.getElementById("dashErrorState");
  const emptyEl = document.getElementById("dashEmptyState");
  const refreshBtn = document.getElementById("btnRefreshDashboard");
  const spinnerIcon = refreshBtn?.querySelector(".refresh-spinner-icon");
  const refreshBtnText = document.getElementById("dashRefreshBtnText");
  const lastUpdatedEl = document.getElementById("dashLastUpdated");
  const scopeSelect = document.getElementById("dashScopeSelect");

  let currentScope = scopeSelect ? scopeSelect.value : (_currentUser ? "user" : "all");

  // If user is not logged in and scope is set to "user", fallback to "all" to avoid 401
  if (!_currentUser && currentScope === "user") {
    if (scopeSelect) scopeSelect.value = "all";
    currentScope = "all";
  }

  // Visual loading feedback
  if (loadingEl) loadingEl.classList.remove("hidden");
  if (errorEl) errorEl.classList.add("hidden");
  if (emptyEl) emptyEl.classList.add("hidden");
  if (spinnerIcon) spinnerIcon.classList.add("spinning");
  if (refreshBtnText) refreshBtnText.textContent = "Syncing...";

  try {
    const url = `${API_BASE}/api/crash-statistics?scope=${encodeURIComponent(currentScope)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      let errData = {};
      try { errData = await response.json(); } catch (_) {}
      throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.success) {
      throw new Error(data.error || "Malformed database statistics payload received.");
    }

    _lastDashboardStats = data;
    const stats = data.statistics || {};

    // 1. Render all 8 Stat Cards
    renderDashboardStatCards(stats);

    // 2. Synchronize active memory array for other app sections (e.g. map / crash data)
    if (Array.isArray(data.recent_reports)) {
      _dbCrashRecords = data.recent_reports.map(r => ({
        id: "CR-" + String(r.report_id).padStart(4, "0"),
        location: r.location,
        date: r.report_date || "—",
        time: r.report_time || "—",
        type: r.crash_type || "Vehicle Collision",
        severity: r.severity || "Moderate",
        condition: r.road_condition || "Normal",
        status: r.status || "Pending",
        photo_path: r.photo_path || null,
        captured_at: r.captured_at || null,
        user_id: r.user_id || null,
        isDb: true
      }));
    } else {
      _dbCrashRecords = [];
    }

    // 3. Render 5 Database-Driven Charts
    renderDashboardSeverityChart(data.by_severity || [], stats);
    renderDashboardLocationChart(data.by_location || []);
    renderDashboardTypeChart(data.by_type || []);
    renderDashboardTimelineChart(data.by_timeline || []);
    renderDashboardConditionChart(data.by_condition || []);

    // 4. Render Historical Traffic Corridor Benchmark Chart (Chart 6)
    if (!cachedHistoricalCorridors) {
      fetchHistoricalCorridors().then(() => renderDashboardTrafficChart()).catch(() => renderDashboardTrafficChart());
    } else {
      renderDashboardTrafficChart();
    }

    // 5. Render Database Crash Reports Table
    renderDashboardReportsTable(data.recent_reports || []);

    // 6. Handle Empty State & Clear Messaging
    if (stats.total_submissions === 0) {
      if (emptyEl) {
        emptyEl.classList.remove("hidden");
        const emptyTitle = document.getElementById("dashEmptyTitle");
        const emptyMsg = document.getElementById("dashEmptyMsg");
        if (currentScope === "user") {
          if (emptyTitle) emptyTitle.textContent = "No Personal Incident Reports";
          if (emptyMsg) {
            const userName = _currentUser ? escapeHtml(_currentUser.name) : "your account";
            emptyMsg.innerHTML = `You have not submitted any crash reports under <strong>${userName}</strong> yet. Click <strong>Report Crash</strong> to submit a new report with mandatory in-app camera evidence.`;
          }
        } else {
          if (emptyTitle) emptyTitle.textContent = "No Database Records Found";
          if (emptyMsg) emptyMsg.textContent = "No crash reports were found in the database for the selected scope.";
        }
      }
    } else {
      if (emptyEl) emptyEl.classList.add("hidden");
    }

    // 7. Update Sync Status Meta
    if (lastUpdatedEl) {
      const nowStr = new Date().toLocaleTimeString();
      const scopeLabel = currentScope === "user" ? "personal" : "city-wide";
      lastUpdatedEl.textContent = `Synced: ${nowStr} (${stats.total_submissions} ${scopeLabel} records in database)`;
    }

    // 8. Refresh Journey History Section if present
    if (typeof renderJourneyHistoryDashboard === "function") {
      renderJourneyHistoryDashboard();
    }

  } catch (err) {
    console.error("Failed to fetch database dashboard stats:", err);
    if (errorEl) {
      errorEl.classList.remove("hidden");
      const errorMsg = document.getElementById("dashErrorMsg");
      if (errorMsg) {
        errorMsg.textContent = `Unable to connect to database API: ${err.message}. Real metrics are preserved and cannot be fabricated.`;
      }
    }
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (spinnerIcon) spinnerIcon.classList.remove("spinning");
    if (refreshBtnText) refreshBtnText.textContent = "Refresh Data";
  }
}

/**
 * Update Stat Cards with Real Database Counts
 * @param {Object} stats
 */
function renderDashboardStatCards(stats) {
  const totalSubmissionsEl = document.getElementById("dashTotalSubmissions");
  const totalCrashesEl = document.getElementById("dashTotalCrashes");
  const verifiedEl = document.getElementById("dashVerifiedCrashes");
  const pendingEl = document.getElementById("dashPendingCrashes");
  const rejectedEl = document.getElementById("dashRejectedCrashes");
  const highEl = document.getElementById("dashHighCrashes");
  const modEl = document.getElementById("dashModCrashes");
  const lowEl = document.getElementById("dashLowCrashes");
  const photosEl = document.getElementById("dashPhotosCount");

  const totalAll = stats.total_submissions !== undefined ? stats.total_submissions : 0;
  const verified = stats.verified !== undefined ? stats.verified : 0;
  const pending = stats.pending !== undefined ? stats.pending : 0;
  const rejected = stats.rejected !== undefined ? stats.rejected : 0;
  const high = stats.high !== undefined ? stats.high : (stats.all_high || 0);
  const mod = stats.moderate !== undefined ? stats.moderate : (stats.all_medium || 0);
  const low = stats.low !== undefined ? stats.low : (stats.all_low || 0);
  const withPhotos = stats.with_photos !== undefined ? stats.with_photos : 0;

  if (totalSubmissionsEl) totalSubmissionsEl.textContent = totalAll;
  if (totalCrashesEl) totalCrashesEl.textContent = totalAll;
  if (verifiedEl) verifiedEl.textContent = verified;
  if (pendingEl) pendingEl.textContent = pending;
  if (rejectedEl) rejectedEl.textContent = rejected;
  if (highEl) highEl.textContent = high;
  if (modEl) modEl.textContent = mod;
  if (lowEl) lowEl.textContent = low;
  if (photosEl) photosEl.textContent = withPhotos;
}

/**
 * Chart 1: Crashes by Severity (Bar Chart)
 */
function renderDashboardSeverityChart(bySeverity, stats) {
  const canvas = document.getElementById("chartSeverityDashboard");
  if (!canvas) return;
  if (chartSeverityDash) chartSeverityDash.destroy();

  // Find counts for High, Moderate, Low from database aggregation
  let highCount = 0, modCount = 0, lowCount = 0;
  if (Array.isArray(bySeverity) && bySeverity.length > 0) {
    bySeverity.forEach(item => {
      const label = (item.label || "").toLowerCase();
      if (label === "high") highCount = item.count;
      else if (label === "moderate") modCount = item.count;
      else if (label === "low") lowCount = item.count;
    });
  } else if (stats) {
    highCount = stats.high || 0;
    modCount = stats.moderate || 0;
    lowCount = stats.low || 0;
  }

  chartSeverityDash = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["High Severity", "Moderate Severity", "Low Severity"],
      datasets: [
        {
          label: "Incident Count",
          data: [highCount, modCount, lowCount],
          backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` Database Incidents: ${context.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        x: {
          ticks: { color: "#475569", font: { weight: "600" } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Chart 2: Crashes by Location (Horizontal Bar Chart)
 */
function renderDashboardLocationChart(byLocation) {
  const canvas = document.getElementById("chartLocationDashboard");
  if (!canvas) return;
  if (chartLocationDash) chartLocationDash.destroy();

  const labels = byLocation.length > 0 ? byLocation.map(i => i.label) : ["No Records"];
  const counts = byLocation.length > 0 ? byLocation.map(i => i.count) : [0];

  chartLocationDash = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Corridor Incidents",
          data: counts,
          backgroundColor: "#2563eb",
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` Recorded Incidents: ${context.raw}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        y: {
          ticks: { color: "#334155", font: { weight: "500" } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Chart 3: Crashes by Collision Type (Doughnut Chart)
 */
function renderDashboardTypeChart(byType) {
  const canvas = document.getElementById("chartTypeDashboard");
  if (!canvas) return;
  if (chartTypeDash) chartTypeDash.destroy();

  const labels = byType.length > 0 ? byType.map(i => i.label) : ["No Records"];
  const counts = byType.length > 0 ? byType.map(i => i.count) : [0];
  const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

  chartTypeDash = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: context => ` ${context.label}: ${context.raw} reports`
          }
        }
      }
    }
  });
}

/**
 * Chart 4: Monthly Crash Timeline Trend (Line / Bar Chart)
 */
function renderDashboardTimelineChart(byTimeline) {
  const canvas = document.getElementById("chartTimelineDashboard");
  if (!canvas) return;
  if (chartTimelineDash) chartTimelineDash.destroy();

  const labels = byTimeline.length > 0 ? byTimeline.map(i => i.label) : ["Current Month"];
  const counts = byTimeline.length > 0 ? byTimeline.map(i => i.count) : [0];

  chartTimelineDash = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Reports",
          data: counts,
          backgroundColor: "#8b5cf6",
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` Total Reports: ${context.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        x: {
          ticks: { color: "#334155", font: { weight: "500" } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Chart 5: Road Surface Conditions (Bar Chart)
 */
function renderDashboardConditionChart(byCondition) {
  const canvas = document.getElementById("chartConditionDashboard");
  if (!canvas) return;
  if (chartConditionDash) chartConditionDash.destroy();

  const labels = byCondition.length > 0 ? byCondition.map(i => i.label) : ["No Records"];
  const counts = byCondition.length > 0 ? byCondition.map(i => i.count) : [0];
  const colors = labels.map(l => {
    const s = l.toLowerCase();
    if (s.includes("wet")) return "#0ea5e9";
    if (s.includes("dry")) return "#f59e0b";
    if (s.includes("poor") || s.includes("rough")) return "#ef4444";
    return "#64748b";
  });

  chartConditionDash = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Road Condition Incidents",
          data: counts,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` Incidents: ${context.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        x: {
          ticks: { color: "#334155", font: { weight: "500" } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Chart 6: Historical Corridor Speed Analysis from Banglore_traffic_Dataset.csv
 */
function renderDashboardTrafficChart() {
  const canvasTraffic = document.getElementById("chartTrafficDistribution");
  if (!canvasTraffic) return;
  if (chartTrafficDash) chartTrafficDash.destroy();

  const dataSource = (cachedHistoricalCorridors && cachedHistoricalCorridors.length > 0)
    ? cachedHistoricalCorridors.map(c => ({
        road: c.road_name,
        speed: c.average_speed_kmh,
        level: c.congestion_category,
        status: c.status_label,
        color: c.color
      }))
    : SAMPLE_TRAFFIC_DATA.map(t => ({
        road: t.road,
        speed: parseInt(t.speed, 10),
        level: t.level,
        status: t.status,
        color: t.level === "Heavy" ? "#ef4444" : (t.level === "Moderate" ? "#f59e0b" : "#10b981")
      }));

  const roadNames = dataSource.map(t => t.road);
  const roadSpeeds = dataSource.map(t => t.speed);
  const barColors = dataSource.map(t => t.color);

  chartTrafficDash = new Chart(canvasTraffic.getContext("2d"), {
    type: "bar",
    data: {
      labels: roadNames,
      datasets: [
        {
          label: "Average Speed (km/h)",
          data: roadSpeeds,
          backgroundColor: barColors,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            generateLabels: () => [
              { text: "High Congestion (Red)", fillStyle: "#ef4444", strokeStyle: "#ef4444" },
              { text: "Moderate Delay (Yellow)", fillStyle: "#f59e0b", strokeStyle: "#f59e0b" },
              { text: "Low Congestion (Green)", fillStyle: "#10b981", strokeStyle: "#10b981" }
            ]
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const item = dataSource[context.dataIndex];
              return ` Avg Speed: ${context.raw} km/h (${item.level} Congestion - ${item.status})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Speed in km/h", color: "#64748b" },
          ticks: { color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        x: {
          ticks: { color: "#334155", font: { weight: "500" } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Render the Live Database Crash Reports Table
 * @param {Array} reports
 */
function renderDashboardReportsTable(reports) {
  const tbody = document.getElementById("dashReportsTableBody");
  const countEl = document.getElementById("dashReportsCount");
  const statusFilter = document.getElementById("dashStatusFilter")?.value || "All";
  if (!tbody) return;

  tbody.innerHTML = "";

  const filtered = reports.filter(r => {
    if (statusFilter === "All") return true;
    return (r.status || "").toLowerCase() === statusFilter.toLowerCase();
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${reports.length} database records`;
  }

  if (filtered.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="9" style="text-align: center; padding: 2rem; color: #94a3b8;">
        No database records match the status filter: <strong>${escapeHtml(statusFilter)}</strong>.
      </td>
    `;
    tbody.appendChild(emptyRow);
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const statusStr = r.status || "Pending";
    const statusClass = `status-${statusStr.toLowerCase()}`;
    const reportCode = `CR-${String(r.report_id).padStart(4, "0")}`;

    // Severity styling
    let sevClass = "badge-traffic low";
    if (r.severity === "High") sevClass = "badge-traffic heavy";
    else if (r.severity === "Moderate") sevClass = "badge-traffic moderate";

    // Photo preview
    let photoHtml = '<span class="photo-cell-none">No Photo</span>';
    if (r.photo_path) {
      const fullPhotoUrl = `${API_BASE}/api/${r.photo_path.replace(/^\/+/, '')}`;
      photoHtml = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <img src="${fullPhotoUrl}" alt="Photo" class="report-photo-thumb"
               onclick="openDashboardPhotoModal('${fullPhotoUrl}', '${reportCode}', '${escapeHtml(r.location)}', '${escapeHtml(r.report_date || '')}', '${escapeHtml(r.report_time || '')}')"
               title="Click to view full photo evidence"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
          <button type="button" class="btn-view-photo-text"
                  onclick="openDashboardPhotoModal('${fullPhotoUrl}', '${reportCode}', '${escapeHtml(r.location)}', '${escapeHtml(r.report_date || '')}', '${escapeHtml(r.report_time || '')}')">
            View
          </button>
        </div>
      `;
    }

    // Action buttons for workflow transitions (Testing & Verification)
    let actionButtons = "";
    const isOwner = _currentUser && (String(r.user_id) === String(_currentUser.user_id) || (_lastDashboardStats && _lastDashboardStats.scope === "user"));
    if (isOwner) {
      if (statusStr === "Pending") {
        actionButtons = `
          <button type="button" class="btn-action-verify" onclick="updateReportWorkflowStatus(${r.report_id}, 'Verified')" title="Mark as officially verified incident">
            ✓ Verify
          </button>
          <button type="button" class="btn-action-reject" onclick="updateReportWorkflowStatus(${r.report_id}, 'Rejected')" title="Mark as rejected">
            ✕ Reject
          </button>
        `;
      } else if (statusStr === "Verified") {
        actionButtons = `
          <button type="button" class="btn-action-pending" onclick="updateReportWorkflowStatus(${r.report_id}, 'Pending')" title="Revert to pending review">
            ↺ Pending
          </button>
          <button type="button" class="btn-action-reject" onclick="updateReportWorkflowStatus(${r.report_id}, 'Rejected')" title="Mark as rejected">
            ✕ Reject
          </button>
        `;
      } else {
        actionButtons = `
          <button type="button" class="btn-action-verify" onclick="updateReportWorkflowStatus(${r.report_id}, 'Verified')" title="Mark as verified incident">
            ✓ Verify
          </button>
          <button type="button" class="btn-action-pending" onclick="updateReportWorkflowStatus(${r.report_id}, 'Pending')" title="Revert to pending">
            ↺ Pending
          </button>
        `;
      }
    } else {
      actionButtons = `<span style="font-size:0.75rem; color:#94a3b8; font-style:italic;">Read-only</span>`;
    }

    const dateFormatted = formatDDMMYYYY(r.report_date);
    const timeFormatted = r.report_time ? ` (${r.report_time})` : "";

    tr.innerHTML = `
      <td><code>${reportCode}</code></td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(statusStr)}</span></td>
      <td><strong>${escapeHtml(r.location || "—")}</strong></td>
      <td>${dateFormatted}${timeFormatted}</td>
      <td>${escapeHtml(r.crash_type || "—")}</td>
      <td><span class="${sevClass}">${escapeHtml(r.severity || "—")}</span></td>
      <td>${escapeHtml(r.road_condition || "Normal")}</td>
      <td>${photoHtml}</td>
      <td><div style="display:flex; gap:4px; flex-wrap:wrap;">${actionButtons}</div></td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Update Workflow Status of a Crash Report
 * @param {number} reportId
 * @param {string} newStatus - 'Pending' | 'Verified' | 'Rejected'
 */
async function updateReportWorkflowStatus(reportId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/crash-reports/${reportId}/status`, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || "Failed to update crash report status.");
      return;
    }

    // Refresh dashboard immediately
    fetchAndRenderDashboard(true);
    // Also refresh public map / crash records table
    if (typeof loadCrashReportsFromBackend === "function") {
      loadCrashReportsFromBackend();
    }
    if (typeof loadUserReports === "function") {
      loadUserReports();
    }
  } catch (err) {
    console.error("Status update request error:", err);
    alert("Network error updating report status.");
  }
}

/**
 * Open Photo Evidence Modal
 */
function openDashboardPhotoModal(url, code, location, date, time) {
  const modal = document.getElementById("photoViewModal");
  const img = document.getElementById("photoModalImg");
  const title = document.getElementById("photoModalTitle");
  const meta = document.getElementById("photoModalMeta");
  if (!modal || !img) return;

  img.src = url;
  if (title) title.textContent = `📸 Evidence Photo — ${code}`;
  if (meta) {
    meta.innerHTML = `
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:0.85rem; color:#cbd5e1;">
        <div><strong>Location:</strong> ${location}</div>
        <div><strong>Date &amp; Time:</strong> ${formatDDMMYYYY(date)} ${time}</div>
      </div>
    `;
  }
  modal.classList.remove("hidden");
}

function closeDashboardPhotoModal() {
  const modal = document.getElementById("photoViewModal");
  if (modal) modal.classList.add("hidden");
}


// ============================================================================
// 8. USER AUTHENTICATION & PERSONAL REPORT MANAGEMENT
// ============================================================================

var _authToken = null;
var _currentUser = null;
var _userReports = [];
var _redirectAfterAuth = null;

function getAuthHeaders() {
  var headers = { "Content-Type": "application/json" };
  if (_authToken) {
    headers["Authorization"] = "Bearer " + _authToken;
  }
  return headers;
}

function initAuth() {
  try {
    _authToken = localStorage.getItem("smart_traffic_auth_token") || null;
    var userJson = localStorage.getItem("smart_traffic_user");
    _currentUser = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    _authToken = null;
    _currentUser = null;
  }

  // Setup event listeners for Auth UI
  var btnOpen = document.getElementById("btnOpenAuthModal");
  var btnNotice = document.getElementById("btnNoticeSignIn");
  var btnNoticeReg = document.getElementById("btnNoticeRegister");
  var btnNoticeLog = document.getElementById("btnNoticeLogin");
  var btnClose = document.getElementById("btnCloseAuthModal");
  var modal = document.getElementById("authModal");
  var tabLog = document.getElementById("tabLogin");
  var tabReg = document.getElementById("tabRegister");
  var formLog = document.getElementById("loginForm");
  var formReg = document.getElementById("registerForm");
  var btnOut = document.getElementById("btnLogout");
  var btnRefRep = document.getElementById("btnRefreshUserReports");
  var btnCloseEdit = document.getElementById("btnCloseEditModal");
  var btnCancelEdit = document.getElementById("btnCancelEditModal");
  var editModal = document.getElementById("editReportModal");
  var formEdit = document.getElementById("editReportForm");

  if (btnOpen) btnOpen.addEventListener("click", function () { openAuthModal("login"); });
  if (btnNotice) btnNotice.addEventListener("click", function () { openAuthModal("login"); });
  if (btnNoticeReg) {
    btnNoticeReg.addEventListener("click", function () {
      _redirectAfterAuth = "report-crash";
      openAuthModal("register");
    });
  }
  if (btnNoticeLog) {
    btnNoticeLog.addEventListener("click", function () {
      _redirectAfterAuth = "report-crash";
      openAuthModal("login");
    });
  }
  if (btnClose) btnClose.addEventListener("click", closeAuthModal);
  if (btnOut) btnOut.addEventListener("click", handleLogout);
  if (btnRefRep) btnRefRep.addEventListener("click", loadUserReports);

  if (tabLog) tabLog.addEventListener("click", function () { switchAuthTab("login"); });
  if (tabReg) tabReg.addEventListener("click", function () { switchAuthTab("register"); });

  if (formLog) formLog.addEventListener("submit", handleLogin);
  if (formReg) formReg.addEventListener("submit", handleRegister);

  if (btnCloseEdit) btnCloseEdit.addEventListener("click", closeEditReportModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeEditReportModal);
  if (formEdit) formEdit.addEventListener("submit", saveEditedReport);

  // Close modals when clicking backdrop
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeAuthModal();
    });
  }
  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === editModal) closeEditReportModal();
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAuthModal();
      closeEditReportModal();
    }
  });

  // Verify session with backend if token exists
  if (_authToken) {
    fetch(API_BASE + "/api/auth/me", { headers: getAuthHeaders() })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.success) {
          handleLogout(null, true);
        } else {
          _currentUser = data.user;
          localStorage.setItem("smart_traffic_user", JSON.stringify(_currentUser));
          updateAuthUI();
          loadUserReports();
        }
      })
      .catch(function () {
        updateAuthUI();
        loadUserReports();
      });
  } else {
    updateAuthUI();
    loadUserReports();
  }
}

function updateAuthUI() {
  var guestBlock = document.getElementById("guestReportCrashBlock");
  var authSection = document.getElementById("authenticatedReportSection");
  var badge = document.getElementById("userProfileBadge");
  var btnOpen = document.getElementById("btnOpenAuthModal");
  var notice = document.getElementById("reportLoginNotice");
  var nameInput = document.getElementById("reporterName");
  var avatarCircle = document.getElementById("userAvatarCircle");
  var nameLabel = document.getElementById("userNameLabel");

  if (_currentUser && _authToken) {
    if (guestBlock) guestBlock.classList.add("hidden");
    if (authSection) authSection.classList.remove("hidden");
    if (badge) badge.classList.remove("hidden");
    if (btnOpen) btnOpen.classList.add("hidden");
    if (notice) notice.classList.add("hidden");
    if (avatarCircle) {
      var initial = (_currentUser.name || "U").trim().charAt(0).toUpperCase();
      avatarCircle.textContent = initial || "U";
    }
    if (nameLabel) {
      nameLabel.textContent = _currentUser.name || "User";
      nameLabel.title = _currentUser.email || "";
    }
    if (nameInput) {
      nameInput.value = _currentUser.name || "";
    }
  } else {
    if (guestBlock) guestBlock.classList.remove("hidden");
    if (authSection) authSection.classList.add("hidden");
    if (badge) badge.classList.add("hidden");
    if (btnOpen) btnOpen.classList.remove("hidden");
    if (notice) notice.classList.remove("hidden");
    if (nameInput) {
      nameInput.value = "";
    }
  }
}

function openAuthModal(tab) {
  var modal = document.getElementById("authModal");
  var alertBox = document.getElementById("authModalAlert");
  if (alertBox) {
    alertBox.className = "auth-alert hidden";
    alertBox.textContent = "";
  }
  switchAuthTab(tab || "login");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  var modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}

function switchAuthTab(tab) {
  var tabLog = document.getElementById("tabLogin");
  var tabReg = document.getElementById("tabRegister");
  var formLog = document.getElementById("loginForm");
  var formReg = document.getElementById("registerForm");
  var alertBox = document.getElementById("authModalAlert");
  if (alertBox) alertBox.classList.add("hidden");

  if (tab === "register") {
    if (tabLog) tabLog.classList.remove("active");
    if (tabReg) tabReg.classList.add("active");
    if (formLog) formLog.classList.add("hidden");
    if (formReg) formReg.classList.remove("hidden");
  } else {
    if (tabReg) tabReg.classList.remove("active");
    if (tabLog) tabLog.classList.add("active");
    if (formReg) formReg.classList.add("hidden");
    if (formLog) formLog.classList.remove("hidden");
  }
}

function showAuthAlert(msg, isSuccess) {
  var alertBox = document.getElementById("authModalAlert");
  if (!alertBox) return;
  alertBox.className = "auth-alert " + (isSuccess ? "success" : "error");
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}

function handleLogin(e) {
  if (e) e.preventDefault();
  var email = (document.getElementById("loginEmail").value || "").trim();
  var password = (document.getElementById("loginPassword").value || "").trim();
  var btn = document.getElementById("btnSubmitLogin");

  if (!email || !password) {
    showAuthAlert("Please enter both email and password.", false);
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Signing In...";
  }

  fetch(API_BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sign In";
      }
      if (!data.success) {
        showAuthAlert(data.error || "Login failed.", false);
        return;
      }
      _authToken = data.token;
      _currentUser = data.user;
      localStorage.setItem("smart_traffic_auth_token", _authToken);
      localStorage.setItem("smart_traffic_user", JSON.stringify(_currentUser));

      // Clear previous in-memory session data to guarantee account isolation
      _dbCrashRecords = [];
      _lastDashboardStats = null;
      _userReports = [];

      // Default dashboard scope to personal for authenticated user
      const scopeSelect = document.getElementById("dashScopeSelect");
      if (scopeSelect) {
        scopeSelect.value = "user";
        delete scopeSelect.dataset.userChanged;
      }

      closeAuthModal();
      updateAuthUI();
      loadUserReports();

      // Refresh Dashboard and Crash stats immediately with isolated user scope
      if (typeof fetchAndRenderDashboard === "function") {
        fetchAndRenderDashboard(true);
      }
      if (typeof renderCrashSummaryCards === "function") {
        renderCrashSummaryCards();
      }

      if (_redirectAfterAuth) {
        var targetPage = _redirectAfterAuth;
        _redirectAfterAuth = null;
        navigateToPage(targetPage);
        window.location.hash = "#" + targetPage;
      }
    })
    .catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sign In";
      }
      showAuthAlert("Unable to connect to backend server.", false);
    });
}

function handleRegister(e) {
  if (e) e.preventDefault();
  var name = (document.getElementById("regName").value || "").trim();
  var email = (document.getElementById("regEmail").value || "").trim();
  var password = (document.getElementById("regPassword").value || "").trim();
  var btn = document.getElementById("btnSubmitRegister");

  if (!name || !email || !password) {
    showAuthAlert("Please fill in all registration fields.", false);
    return;
  }
  if (password.length < 6) {
    showAuthAlert("Password must be at least 6 characters long.", false);
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating Account...";
  }

  fetch(API_BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, email: email, password: password })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Create Account";
      }
      if (!data.success) {
        showAuthAlert(data.error || "Registration failed.", false);
        return;
      }
      _authToken = data.token;
      _currentUser = data.user;
      localStorage.setItem("smart_traffic_auth_token", _authToken);
      localStorage.setItem("smart_traffic_user", JSON.stringify(_currentUser));

      // Clear previous in-memory session data to guarantee account isolation
      _dbCrashRecords = [];
      _lastDashboardStats = null;
      _userReports = [];

      // Default dashboard scope to personal for newly registered user
      const scopeSelect = document.getElementById("dashScopeSelect");
      if (scopeSelect) {
        scopeSelect.value = "user";
        delete scopeSelect.dataset.userChanged;
      }

      closeAuthModal();
      updateAuthUI();
      loadUserReports();

      // Refresh Dashboard immediately - new account displays zero personal records
      if (typeof fetchAndRenderDashboard === "function") {
        fetchAndRenderDashboard(true);
      }
      if (typeof renderCrashSummaryCards === "function") {
        renderCrashSummaryCards();
      }

      if (_redirectAfterAuth) {
        var targetPage = _redirectAfterAuth;
        _redirectAfterAuth = null;
        navigateToPage(targetPage);
        window.location.hash = "#" + targetPage;
      }
    })
    .catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Create Account";
      }
      showAuthAlert("Unable to connect to backend server.", false);
    });
}

function handleLogout(e, silent) {
  if (e) e.preventDefault();
  if (_authToken && !silent) {
    fetch(API_BASE + "/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders()
    }).catch(function () {});
  }

  // Clear any legacy or user-scoped cache
  try {
    localStorage.removeItem("crashReports");
    if (_currentUser && _currentUser.user_id) {
      localStorage.removeItem("crashReports_uid_" + _currentUser.user_id);
    }
  } catch (_) {}

  _authToken = null;
  _currentUser = null;
  _userReports = [];
  _dbCrashRecords = [];
  _lastDashboardStats = null;
  localStorage.removeItem("smart_traffic_auth_token");
  localStorage.removeItem("smart_traffic_user");

  // Reset dashboard scope dropdown to "all" (public) when logged out
  const scopeSelect = document.getElementById("dashScopeSelect");
  if (scopeSelect) {
    scopeSelect.value = "all";
    delete scopeSelect.dataset.userChanged;
  }

  updateAuthUI();
  loadUserReports();

  // Reset Dashboard immediately so no previous user's data remains on screen
  if (typeof fetchAndRenderDashboard === "function") {
    fetchAndRenderDashboard(true);
  }
  if (typeof renderCrashSummaryCards === "function") {
    renderCrashSummaryCards();
  }
}

function loadUserReports() {
  var tb = document.getElementById("localReportsTableBody");
  var badge = document.getElementById("userReportsCountBadge");
  if (!tb) return;

  if (!_authToken || !_currentUser) {
    if (badge) badge.textContent = "0 reports";
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">' +
      'Please <a href="javascript:void(0)" onclick="openAuthModal(\'login\')" style="color:#38bdf8;font-weight:600;text-decoration:underline;">sign in</a> to view and manage your reported crashes.' +
      '</td></tr>';
    return;
  }

  tb.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">Loading your submitted reports…</td></tr>';

  fetch(API_BASE + "/api/user/my-reports", { headers: getAuthHeaders() })
    .then(function (res) {
      if (res.status === 401) {
        handleLogout(null, true);
        throw new Error("Session expired.");
      }
      return res.json();
    })
    .then(function (data) {
      if (!data.success) throw new Error(data.error || "Failed to load reports.");
      _userReports = data.reports || [];
      renderUserReportsTable(_userReports);
    })
    .catch(function (err) {
      console.warn("User reports fetch error:", err);
      tb.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#f87171;">' +
        'Could not load your reports. Please ensure backend is running.' +
        '</td></tr>';
    });
}

function renderUserReportsTable(reports) {
  var tb = document.getElementById("localReportsTableBody");
  var badge = document.getElementById("userReportsCountBadge");
  if (!tb) return;

  if (badge) {
    badge.textContent = reports.length + " report" + (reports.length !== 1 ? "s" : "");
  }

  if (!reports || reports.length === 0) {
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#94a3b8;">' +
      'You have not submitted any crash reports yet. Submit an incident report above to track its status.' +
      '</td></tr>';
    return;
  }

  tb.innerHTML = "";
  reports.forEach(function (r) {
    var row = document.createElement("tr");
    var sc = r.severity === "High" ? "heavy" : r.severity === "Moderate" ? "moderate" : "low";
    var st = (r.status || "Pending").toLowerCase();
    var dtStr = formatDDMMYYYY(r.report_date) + (r.report_time ? " " + r.report_time : "");

    var photoCell = '<span class="photo-cell-none">No Photo</span>';
    if (r.photo_path) {
      var photoUrl = API_BASE + "/api/" + r.photo_path;
      photoCell = 
        '<div class="report-photo-thumb-wrap">' +
          '<img src="' + photoUrl + '" alt="Incident Scene" class="report-photo-thumb" onclick="openPhotoModal(' + r.report_id + ')" title="View Captured Incident Photo" />' +
          '<button type="button" class="btn-view-photo-text" onclick="openPhotoModal(' + r.report_id + ')">View</button>' +
        '</div>';
    }

    row.innerHTML =
      '<td><code>CR-' + String(r.report_id).padStart(4, "0") + '</code></td>' +
      '<td><strong>' + escapeHtml(r.location) + '</strong></td>' +
      '<td>' + escapeHtml(dtStr) + '</td>' +
      '<td>' + escapeHtml(r.crash_type || "—") + '</td>' +
      '<td><span class="badge-traffic ' + sc + '">' + escapeHtml(r.severity || "—") + '</span></td>' +
      '<td>' + escapeHtml(r.road_condition || "—") + '</td>' +
      '<td>' + photoCell + '</td>' +
      '<td><span class="status-badge status-' + st + '">' + escapeHtml(r.status || "Pending") + '</span></td>' +
      '<td>' +
        '<div class="report-actions-wrap">' +
          '<button type="button" class="btn-report-action btn-report-edit" onclick="openEditReportModal(' + r.report_id + ')" title="Edit this report">✎ Edit</button>' +
          '<button type="button" class="btn-report-action btn-report-delete" onclick="deleteUserReport(' + r.report_id + ')" title="Delete this report">🗑 Delete</button>' +
        '</div>' +
      '</td>';
    tb.appendChild(row);
  });
}

function openPhotoModal(reportId) {
  var rep = _userReports.find(function (r) { return r.report_id === reportId; });
  if (!rep || !rep.photo_path) return;

  var modal = document.getElementById("photoViewModal");
  var title = document.getElementById("photoModalTitle");
  var img = document.getElementById("photoModalImg");
  var meta = document.getElementById("photoModalMeta");

  if (title) title.textContent = "Incident Scene Photo — CR-" + String(rep.report_id).padStart(4, "0");
  if (img) img.src = API_BASE + "/api/" + rep.photo_path;

  var coordsText = "Not captured";
  if (rep.capture_lat !== null && rep.capture_lat !== undefined && rep.capture_lng !== null && rep.capture_lng !== undefined) {
    coordsText = Number(rep.capture_lat).toFixed(5) + "° N, " + Number(rep.capture_lng).toFixed(5) + "° E";
  }

  var timeText = rep.captured_at || (rep.created_at ? new Date(rep.created_at).toLocaleString() : "Submission record");

  if (meta) {
    meta.innerHTML = 
      '<div style="margin-bottom:10px;">' +
        '<span class="badge-unverified-photo">User-Captured Photo (Unverified Incident Metadata)</span>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:0.83rem; color:#cbd5e1;">' +
        '<div><strong>Road Corridor:</strong> <span style="color:#38bdf8;">' + escapeHtml(rep.location) + '</span></div>' +
        '<div><strong>Captured Timestamp:</strong> <span style="color:#f8fafc;">' + escapeHtml(timeText) + '</span></div>' +
        '<div><strong>Capture Coordinates:</strong> <span style="color:#38bdf8; font-family:monospace;">' + escapeHtml(coordsText) + '</span></div>' +
        '<div><strong>Incident Severity:</strong> <span>' + escapeHtml(rep.severity || "—") + '</span></div>' +
      '</div>';
  }

  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
  document.body.style.overflow = "hidden";
}

function closePhotoModal() {
  var modal = document.getElementById("photoViewModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}

function openEditReportModal(reportId) {
  var rep = _userReports.find(function (r) { return r.report_id === reportId; });
  if (!rep) return;

  var modal = document.getElementById("editReportModal");
  var title = document.getElementById("editModalTitle");
  var alertBox = document.getElementById("editModalAlert");

  if (title) title.textContent = "Edit Crash Report CR-" + String(rep.report_id).padStart(4, "0");
  if (alertBox) {
    alertBox.className = "auth-alert hidden";
    alertBox.textContent = "";
  }

  document.getElementById("editReportId").value = rep.report_id;
  document.getElementById("editLocation").value = rep.location || "";
  document.getElementById("editDate").value = rep.report_date || "";
  document.getElementById("editTime").value = rep.report_time || "00:00";
  document.getElementById("editCrashType").value = rep.crash_type || "Vehicle Collision";
  document.getElementById("editSeverity").value = rep.severity || "Moderate";
  document.getElementById("editCondition").value = rep.road_condition || "Dry";
  document.getElementById("editDescription").value = rep.description || "";

  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
  document.body.style.overflow = "hidden";
}

function closeEditReportModal() {
  var modal = document.getElementById("editReportModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}

function saveEditedReport(e) {
  if (e) e.preventDefault();
  var reportId = document.getElementById("editReportId").value;
  var location = document.getElementById("editLocation").value;
  var report_date = document.getElementById("editDate").value;
  var report_time = document.getElementById("editTime").value;
  var crash_type = document.getElementById("editCrashType").value;
  var severity = document.getElementById("editSeverity").value;
  var road_condition = document.getElementById("editCondition").value;
  var description = document.getElementById("editDescription").value.trim();

  var btn = document.getElementById("btnSaveEditedReport");
  var alertBox = document.getElementById("editModalAlert");

  if (!location || !report_date || !report_time) {
    if (alertBox) {
      alertBox.className = "auth-alert error";
      alertBox.textContent = "Please provide Location, Date, and Time.";
      alertBox.classList.remove("hidden");
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Saving...";
  }

  var payload = {
    location: location,
    report_date: report_date,
    report_time: report_time,
    crash_type: crash_type,
    severity: severity,
    road_condition: road_condition,
    description: description
  };

  fetch(API_BASE + "/api/user/my-reports/" + reportId, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
      if (!data.success) {
        if (alertBox) {
          alertBox.className = "auth-alert error";
          alertBox.textContent = data.error || "Update failed.";
          alertBox.classList.remove("hidden");
        }
        return;
      }
      closeEditReportModal();
      loadUserReports();
    })
    .catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
      if (alertBox) {
        alertBox.className = "auth-alert error";
        alertBox.textContent = "Unable to connect to backend server.";
        alertBox.classList.remove("hidden");
      }
    });
}

function deleteUserReport(reportId) {
  var idStr = "CR-" + String(reportId).padStart(4, "0");
  if (!confirm("Are you sure you want to permanently delete crash report " + idStr + "?")) {
    return;
  }

  fetch(API_BASE + "/api/user/my-reports/" + reportId, {
    method: "DELETE",
    headers: getAuthHeaders()
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        alert(data.error || "Failed to delete report.");
        return;
      }
      loadUserReports();
    })
    .catch(function () {
      alert("Unable to connect to backend server to delete report.");
    });
}

// Backward compatibility alias
function renderLocalReportsTable() {
  loadUserReports();
}

// ============================================================================
// 9. MAP — VERIFIED DB MARKERS
// ============================================================================

var _dbVerifiedLayer = null;
var _LOCATION_COORDS = {
  "Hosur Road":           [12.8988, 77.6433],
  "Electronic City Road": [12.8452, 77.6602],
  "Bannerghatta Road":    [12.8912, 77.5975],
  "Outer Ring Road":      [12.9248, 77.6805],
  "Sarjapur Road":        [12.9166, 77.6750],
  "Kanakapura Road":      [12.8805, 77.5583]
};

function refreshVerifiedMapMarkers() {
  if (typeof L === "undefined" || !leafletMapInstance) return;
  if (!_dbVerifiedLayer) _dbVerifiedLayer = L.layerGroup().addTo(leafletMapInstance);
  _dbVerifiedLayer.clearLayers();
  fetch(API_BASE + "/api/crash-reports?status=Verified")
    .then(function (res) { return res.json(); })
    .then(function (d) {
      if (!d.success) return;
      d.reports.forEach(function (r) {
        var lat = r.latitude, lng = r.longitude;
        if (!lat || !lng) { var c = _LOCATION_COORDS[r.location]; if (!c) return; lat = c[0]; lng = c[1]; }
        lat += (Math.random() - 0.5) * 0.003;
        lng += (Math.random() - 0.5) * 0.003;
        var sc = r.severity === "High" ? "heavy" : r.severity === "Moderate" ? "moderate" : "low";
        var mk = L.circleMarker([lat, lng], { radius: 11, fillColor: "#dc2626", color: "#fff", weight: 3, fillOpacity: 0.95 });
        mk.bindPopup(
          '<div class="custom-leaflet-popup">' +
          '<h4 class="popup-title">\uD83D\uDEA8 Verified Crash — ' + escapeHtml(r.location) + "</h4>" +
          '<div class="popup-row"><span class="popup-label">Report ID:</span><span class="popup-val">CR-' + String(r.report_id).padStart(4,"0") + "</span></div>" +
          '<div class="popup-row"><span class="popup-label">Date:</span><span class="popup-val">' + (r.report_date || "\u2014") + "</span></div>" +
          '<div class="popup-row"><span class="popup-label">Type:</span><span class="popup-val">' + escapeHtml(r.crash_type || "\u2014") + "</span></div>" +
          '<div class="popup-row"><span class="popup-label">Severity:</span><span class="popup-val"><span class="badge-traffic ' + sc + '">' + escapeHtml(r.severity || "\u2014") + "</span></span></div>" +
          '<span class="popup-tag" style="background:#fef2f2;color:#991b1b;">\u2713 Verified Incident</span>' +
          "</div>"
        );
        _dbVerifiedLayer.addLayer(mk);
      });
    }).catch(function () {});
}

var _dbHomeLayer = null;
function refreshHomeVerifiedMarkers() {
  if (typeof L === "undefined" || !homeLeafletMapInstance) return;
  if (!_dbHomeLayer) _dbHomeLayer = L.layerGroup().addTo(homeLeafletMapInstance);
  _dbHomeLayer.clearLayers();
  fetch(API_BASE + "/api/crash-reports?status=Verified")
    .then(function (res) { return res.json(); })
    .then(function (d) {
      if (!d.success) return;
      d.reports.forEach(function (r) {
        var lat = r.latitude, lng = r.longitude;
        if (!lat || !lng) { var c = _LOCATION_COORDS[r.location]; if (!c) return; lat = c[0]; lng = c[1]; }
        lat += (Math.random()-0.5)*0.003; lng += (Math.random()-0.5)*0.003;
        var mk = L.circleMarker([lat,lng],{radius:8,fillColor:"#dc2626",color:"#fff",weight:2.5,fillOpacity:.95});
        mk.bindPopup("<strong>\uD83D\uDEA8 " + escapeHtml(r.location) + "</strong><br>Verified Crash &mdash; CR-" + String(r.report_id).padStart(4,"0"));
        _dbHomeLayer.addLayer(mk);
      });
    }).catch(function(){});
}

// ============================================================================
// 10. DASHBOARD & CRASH-DATA STATS FROM API
// ============================================================================

// Dashboard stats now calculated directly from all records via renderDashboardStats()
// ensuring severity counts (High/Moderate/Low) always increase when reports are submitted.

// Patch renderTraffic to also load DB markers after map init
var _origRT = window.renderTraffic;
window.renderTraffic = function () { _origRT(); setTimeout(refreshVerifiedMapMarkers, 500); };

// Patch renderHome to add DB markers to home mini-map
var _origRH = window.renderHome;
window.renderHome = function () { _origRH(); setTimeout(refreshHomeVerifiedMarkers, 600); };

// renderCrash handles its own stats

// ============================================================================
// 11. ROUTE SEARCH & TRAFFIC VISUALIZATION (HOME PAGE)
// ============================================================================

/**
 * Demo route data - illustrates how traffic/risk info would appear per route.
 * Clearly labeled as demo/sample data. No real-time API connected.
 */
var ROUTE_DATA = {
  "Bangalore City Centre:Electronic City": {
    distance: "18.4 km", eta: "42 min",
    traffic: "Heavy", risk: "High", speed: "40 km/h", condition: "Wet",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9380, 77.6120], color: "#ef4444", label: "Heavy" },
      { from: [12.9380, 77.6120], to: [12.9100, 77.6350], color: "#f59e0b", label: "Moderate" },
      { from: [12.9100, 77.6350], to: [12.8700, 77.6640], color: "#ef4444", label: "Heavy" }
    ]
  },
  "Bangalore City Centre:Hosur Road": {
    distance: "9.2 km", eta: "24 min",
    traffic: "Heavy", risk: "High", speed: "35 km/h", condition: "Wet",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9450, 77.6100], color: "#ef4444", label: "Heavy" },
      { from: [12.9450, 77.6100], to: [12.8988, 77.6433], color: "#ef4444", label: "Heavy" }
    ]
  },
  "Bangalore City Centre:Outer Ring Road": {
    distance: "11.5 km", eta: "28 min",
    traffic: "Heavy", risk: "High", speed: "38 km/h", condition: "Wet",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9500, 77.6200], color: "#f59e0b", label: "Moderate" },
      { from: [12.9500, 77.6200], to: [12.9248, 77.6805], color: "#ef4444", label: "Heavy" }
    ]
  },
  "Bangalore City Centre:Bannerghatta Road": {
    distance: "12.8 km", eta: "26 min",
    traffic: "Low", risk: "Low", speed: "55 km/h", condition: "Dry",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9300, 77.5900], color: "#10b981", label: "Low" },
      { from: [12.9300, 77.5900], to: [12.8912, 77.5975], color: "#10b981", label: "Low" }
    ]
  },
  "Bangalore City Centre:Sarjapur Road": {
    distance: "14.1 km", eta: "32 min",
    traffic: "Moderate", risk: "Moderate", speed: "45 km/h", condition: "Dry",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9500, 77.6300], color: "#f59e0b", label: "Moderate" },
      { from: [12.9500, 77.6300], to: [12.9166, 77.6750], color: "#f59e0b", label: "Moderate" }
    ]
  },
  "Bangalore City Centre:Kanakapura Road": {
    distance: "16.3 km", eta: "30 min",
    traffic: "Low", risk: "Low", speed: "55 km/h", condition: "Dry",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9200, 77.5800], color: "#10b981", label: "Low" },
      { from: [12.9200, 77.5800], to: [12.8805, 77.5583], color: "#10b981", label: "Low" }
    ]
  },
  "Hosur Road:Electronic City": {
    distance: "8.6 km", eta: "22 min",
    traffic: "Moderate", risk: "Moderate", speed: "45 km/h", condition: "Wet",
    segments: [
      { from: [12.8988, 77.6433], to: [12.8800, 77.6520], color: "#f59e0b", label: "Moderate" },
      { from: [12.8800, 77.6520], to: [12.8452, 77.6602], color: "#10b981", label: "Low" }
    ]
  },
  "Outer Ring Road:Sarjapur Road": {
    distance: "6.4 km", eta: "18 min",
    traffic: "Heavy", risk: "High", speed: "38 km/h", condition: "Wet",
    segments: [
      { from: [12.9248, 77.6805], to: [12.9200, 77.6780], color: "#ef4444", label: "Heavy" },
      { from: [12.9200, 77.6780], to: [12.9166, 77.6750], color: "#ef4444", label: "Heavy" }
    ]
  }
};

/** Leaflet layer group for the route search map */
var routeLeafletMap = null;
var routePolylineLayer = null;
var routeMarkersLayer = null;

/**
 * Initialize the Route Search map (displayed on the Home page)
 */
function initRouteMap() {
  var el = document.getElementById("routeMap");
  if (!el || typeof L === "undefined") return;
  if (routeLeafletMap) {
    routeLeafletMap.invalidateSize();
    return;
  }

  routeLeafletMap = L.map("routeMap", {
    center: [12.9716, 77.5946],
    zoom: 11,
    zoomControl: true,
    scrollWheelZoom: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "\u00a9 OpenStreetMap contributors"
  }).addTo(routeLeafletMap);

  routePolylineLayer = L.layerGroup().addTo(routeLeafletMap);
  routeMarkersLayer  = L.layerGroup().addTo(routeLeafletMap);

  // Draw sample risk markers to populate the default map view
  SAMPLE_MAP_LOCATIONS.forEach(function (loc) {
    var color = loc.riskLevel === "High" ? "#ef4444"
              : loc.riskLevel === "Moderate" ? "#f59e0b" : "#10b981";
    var mk = L.circleMarker([loc.lat, loc.lng], {
      radius: 8, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.85
    });
    mk.bindPopup("<strong>" + loc.name + "</strong><br>Risk: " + loc.riskLevel + "<br>Crashes: " + loc.crashCount);
    routeMarkersLayer.addLayer(mk);
  });
}

/**
 * Handle Route Search button click
 */
function handleRouteSearch() {
  var fromVal = (document.getElementById("routeFrom") || {}).value || "";
  var toVal   = (document.getElementById("routeTo")   || {}).value || "";

  if (!fromVal || !toVal) {
    alert("Please select both a start location and a destination.");
    return;
  }
  if (fromVal === toVal) {
    alert("Start and destination cannot be the same location.");
    return;
  }

  // Build route key (try both directions)
  var key   = fromVal + ":" + toVal;
  var keyRv = toVal   + ":" + fromVal;
  var route = ROUTE_DATA[key] || ROUTE_DATA[keyRv];

  if (!route) {
    // Fallback generic route for unlisted pairs
    route = {
      distance: Math.floor(Math.random() * 15 + 8) + "." + Math.floor(Math.random() * 9) + " km",
      eta: Math.floor(Math.random() * 25 + 18) + " min",
      traffic: "Moderate", risk: "Moderate", speed: "45 km/h", condition: "Dry",
      segments: []
    };
  }

  // Populate info panel
  var trafficColors = { Heavy:"#ef4444", Moderate:"#f59e0b", Low:"#10b981" };
  var tColor = trafficColors[route.traffic] || "#64748b";
  var riskEmoji  = route.risk === "High" ? "🔴" : route.risk === "Moderate" ? "🟡" : "🟢";
  var trafficEmoji = route.traffic === "Heavy" ? "🔴 Heavy" : route.traffic === "Moderate" ? "🟡 Moderate" : "🟢 Low";

  var setVal = function (id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  setVal("routeDistance",  route.distance);
  setVal("routeETA",       route.eta);
  setVal("routeTraffic",   "<span style='color:" + tColor + ";font-weight:700;'>" + trafficEmoji + "</span>");
  setVal("routeRisk",      riskEmoji + " " + route.risk);
  setVal("routeSpeed",     "<span style='font-weight:700;'>" + route.speed + "</span>");
  setVal("routeCondition", route.condition);

  // Show panel
  var panel = document.getElementById("routeInfoPanel");
  if (panel) { panel.classList.remove("hidden"); }

  // Draw route on map
  if (!routeLeafletMap) { initRouteMap(); }
  setTimeout(function () {
    if (!routeLeafletMap) return;
    routePolylineLayer.clearLayers();

    if (route.segments && route.segments.length) {
      route.segments.forEach(function (seg) {
        var line = L.polyline([seg.from, seg.to], {
          color: seg.color, weight: 7, opacity: 0.9
        });
        line.bindPopup("<strong>Traffic:</strong> " + seg.label + "<br><em style='color:#64748b;font-size:0.75em;'>Demo data</em>");
        routePolylineLayer.addLayer(line);
      });

      // Fit map to route bounds
      var allPoints = [];
      route.segments.forEach(function (s) { allPoints.push(s.from); allPoints.push(s.to); });
      if (allPoints.length) routeLeafletMap.fitBounds(allPoints, { padding: [40, 40] });
    } else {
      // Generic: draw from first available location to another
      var fromLoc = SAMPLE_MAP_LOCATIONS.find(function (l) { return l.name.includes(fromVal.split(" ")[0]); });
      var toLoc   = SAMPLE_MAP_LOCATIONS.find(function (l) { return l.name.includes(toVal.split(" ")[0]); });
      if (fromLoc && toLoc) {
        var mid = [(fromLoc.lat + toLoc.lat) / 2 + 0.01, (fromLoc.lng + toLoc.lng) / 2];
        var line1 = L.polyline([[fromLoc.lat, fromLoc.lng], mid], { color: "#f59e0b", weight: 7, opacity: 0.9 });
        var line2 = L.polyline([mid, [toLoc.lat, toLoc.lng]],   { color: "#10b981", weight: 7, opacity: 0.9 });
        routePolylineLayer.addLayer(line1);
        routePolylineLayer.addLayer(line2);
        routeLeafletMap.fitBounds([[fromLoc.lat, fromLoc.lng], [toLoc.lat, toLoc.lng]], { padding: [40, 40] });
      }
    }

    // Draw verified crash markers
    fetch(API_BASE + "/api/crash-reports?status=Verified")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.success) return;
        d.reports.forEach(function (r) {
          var lat = r.latitude, lng = r.longitude;
          if (!lat || !lng) {
            var c = _LOCATION_COORDS[r.location];
            if (!c) return;
            lat = c[0]; lng = c[1];
          }
          var mk = L.circleMarker([lat, lng], {
            radius: 9, fillColor: "#dc2626", color: "#fff", weight: 2.5, fillOpacity: 0.95
          });
          mk.bindPopup("<strong>Verified Crash</strong><br>" + escapeHtml(r.location) + "<br>Severity: " + escapeHtml(r.severity) + "<br>Type: " + escapeHtml(r.crash_type || ""));
          routePolylineLayer.addLayer(mk);
        });
      })
      .catch(function () {});

    routeLeafletMap.invalidateSize();
  }, 150);
}

/**
 * Wire up the route search button and initialize map on home render
 */
function initRouteSearch() {
  var btn = document.getElementById("routeSearchBtn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", handleRouteSearch);
    btn.dataset.bound = "true";
  }
  // Initialize map right away so it's ready
  setTimeout(initRouteMap, 200);
}


// ============================================================================
// 12. DEDICATED ROUTE PAGE & HOME SEARCH LOGIC
// ============================================================================

// Location coordinates lookup dictionary for all supported places
var LOCATION_COORDS = {
  "Bangalore":               [12.9716, 77.5946],
  "Bangalore City Centre":   [12.9716, 77.5946],
  "Electronic City":         [12.8452, 77.6602],
  "Hosur":                   [12.7409, 77.8253],
  "Hosur Road":              [12.8988, 77.6433],
  "Anekal":                  [12.7100, 77.6970],
  "Silk Board":              [12.9172, 77.6228],
  "Koramangala":             [12.9352, 77.6245],
  "Whitefield":              [12.9698, 77.7499],
  "Bannerghatta Road":       [12.8912, 77.5975],
  "Outer Ring Road":         [12.9248, 77.6805],
  "Sarjapur Road":           [12.9166, 77.6750],
  "Kanakapura Road":         [12.8805, 77.5583]
};

// Rich route database for primary corridors
var DETAILED_ROUTE_DATABASE = {
  "Bangalore:Electronic City": {
    distance: "18.4 km",
    eta: "42 min",
    traffic: "Heavy",
    risk: "High",
    speed: "40 km/h",
    condition: "Wet",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9352, 77.6245], color: "#10b981", label: "Low Traffic / Good Flow" },
      { from: [12.9352, 77.6245], to: [12.9172, 77.6228], color: "#f59e0b", label: "Moderate Traffic / Medium Delay" },
      { from: [12.9172, 77.6228], to: [12.8988, 77.6433], color: "#ef4444", label: "Heavy Traffic / High Congestion" },
      { from: [12.8988, 77.6433], to: [12.8452, 77.6602], color: "#ef4444", label: "Heavy Traffic / Risk Area" }
    ],
    directions: [
      "Start from Bangalore City Centre heading south towards Richmond Circle.",
      "Continue along Hosur Road corridor via Koramangala (traffic moving smoothly).",
      "Pass through St. John's Junction towards Central Silk Board (expect moderate congestion).",
      "Merge onto Hosur Road Elevated Expressway (heavy traffic & bottleneck).",
      "Take the Electronic City Phase 1 exit ramp.",
      "Destination Electronic City will be on the right."
    ]
  },
  "Koramangala:Silk Board": {
    distance: "3.8 km",
    eta: "14 min",
    traffic: "Heavy",
    risk: "High",
    speed: "30 km/h",
    condition: "Wet",
    segments: [
      { from: [12.9352, 77.6245], to: [12.9250, 77.6235], color: "#f59e0b", label: "Moderate Traffic" },
      { from: [12.9250, 77.6235], to: [12.9172, 77.6228], color: "#ef4444", label: "Heavy Traffic / Congested" }
    ],
    directions: [
      "Start from Koramangala 80 Feet Road.",
      "Head south towards St. John's Hospital Road.",
      "Approach Central Silk Board junction flyover.",
      "Destination Central Silk Board reached at interchange."
    ]
  },
  "Silk Board:Hosur": {
    distance: "28.2 km",
    eta: "48 min",
    traffic: "Moderate",
    risk: "Moderate",
    speed: "50 km/h",
    condition: "Wet",
    segments: [
      { from: [12.9172, 77.6228], to: [12.8988, 77.6433], color: "#ef4444", label: "Heavy Traffic at Junction" },
      { from: [12.8988, 77.6433], to: [12.8452, 77.6602], color: "#f59e0b", label: "Moderate Traffic (Elevated Tollway)" },
      { from: [12.8452, 77.6602], to: [12.7409, 77.8253], color: "#10b981", label: "Low Traffic / Fast Flow (NH 44)" }
    ],
    directions: [
      "Start from Central Silk Board flyover heading south.",
      "Merge onto NH 44 (Hosur Road).",
      "Pass through Electronic City tollway.",
      "Continue straight past Attibele border checkpoint.",
      "Enter Hosur town limits along highway.",
      "Destination Hosur reached."
    ]
  },
  "Bangalore:Whitefield": {
    distance: "19.6 km",
    eta: "45 min",
    traffic: "Heavy",
    risk: "High",
    speed: "35 km/h",
    condition: "Dry",
    segments: [
      { from: [12.9716, 77.5946], to: [12.9560, 77.6500], color: "#10b981", label: "Low Traffic (Old Airport Rd)" },
      { from: [12.9560, 77.6500], to: [12.9500, 77.7000], color: "#f59e0b", label: "Moderate Traffic (Marathahalli)" },
      { from: [12.9500, 77.7000], to: [12.9698, 77.7499], color: "#ef4444", label: "Heavy Traffic (ITPL Main Rd)" }
    ],
    directions: [
      "Start from Bangalore City Centre heading east.",
      "Continue along Old Airport Road towards HAL.",
      "Cross the Marathahalli bridge onto Varthur Road.",
      "Turn left onto ITPL Main Road.",
      "Destination Whitefield will be on the right."
    ]
  },
  "Electronic City:Anekal": {
    distance: "16.2 km",
    eta: "28 min",
    traffic: "Low",
    risk: "Low",
    speed: "55 km/h",
    condition: "Dry",
    segments: [
      { from: [12.8452, 77.6602], to: [12.7800, 77.6750], color: "#10b981", label: "Low Traffic / Clear" },
      { from: [12.7800, 77.6750], to: [12.7100, 77.6970], color: "#10b981", label: "Low Traffic / Clear" }
    ],
    directions: [
      "Start from Electronic City Phase 1 exit.",
      "Head south on Jigani-Anekal Road.",
      "Pass through Jigani Industrial Area.",
      "Continue straight for 8 km along State Highway 87.",
      "Destination Anekal reached."
    ]
  }
};

/**
 * Normalizes location strings for lookup
 */
function normalizeLocName(name) {
  if (!name) return "Bangalore";
  var n = name.trim();
  if (/bangalore/i.test(n)) return "Bangalore";
  if (/electronic\s*city/i.test(n)) return "Electronic City";
  if (/silk\s*board/i.test(n)) return "Silk Board";
  if (/koramangala/i.test(n)) return "Koramangala";
  if (/hosur/i.test(n)) return "Hosur";
  if (/whitefield/i.test(n)) return "Whitefield";
  if (/anekal/i.test(n)) return "Anekal";
  if (/bannerghatta/i.test(n)) return "Bannerghatta Road";
  if (/outer\s*ring/i.test(n)) return "Outer Ring Road";
  if (/sarjapur/i.test(n)) return "Sarjapur Road";
  if (/kanakapura/i.test(n)) return "Kanakapura Road";
  return n;
}

/**
 * Synthesize route data dynamically for any pair not hardcoded in the dictionary
 */
function synthesizeRoute(fromName, toName) {
  var cFrom = LOCATION_COORDS[fromName] || [12.9716, 77.5946];
  var cTo   = LOCATION_COORDS[toName]   || [12.8452, 77.6602];

  // Approximate distance using Pythagorean on degree coords (1 deg ~ 111 km)
  var dLat = (cTo[0] - cFrom[0]) * 111;
  var dLng = (cTo[1] - cFrom[1]) * 111 * Math.cos(cFrom[0] * Math.PI / 180);
  var straightKm = Math.sqrt(dLat * dLat + dLng * dLng);
  var roadKm = Math.max(3.5, (straightKm * 1.35)).toFixed(1);

  // Generate intermediate coordinates
  var mid1 = [
    cFrom[0] + (cTo[0] - cFrom[0]) * 0.35 + 0.005,
    cFrom[1] + (cTo[1] - cFrom[1]) * 0.35 - 0.003
  ];
  var mid2 = [
    cFrom[0] + (cTo[0] - cFrom[0]) * 0.70 - 0.004,
    cFrom[1] + (cTo[1] - cFrom[1]) * 0.70 + 0.004
  ];

  var avgSpeed = straightKm > 20 ? 50 : 38;
  var etaMin = Math.round((roadKm / avgSpeed) * 60 + 6);

  return {
    distance: roadKm + " km",
    eta: etaMin + " min",
    traffic: "Moderate",
    risk: "Moderate",
    speed: avgSpeed + " km/h",
    condition: "Dry",
    segments: [
      { from: cFrom, to: mid1, color: "#10b981", label: "Low Traffic" },
      { from: mid1,  to: mid2, color: "#f59e0b", label: "Moderate Traffic" },
      { from: mid2,  to: cTo,  color: "#ef4444", label: "Heavy Traffic near destination" }
    ],
    directions: [
      "Start from " + fromName + " heading towards main corridor.",
      "Merge onto arterial road connecting towards " + toName + ".",
      "Continue straight past central traffic junction.",
      "Follow regional signage towards destination corridor.",
      "Take the access exit towards " + toName + ".",
      "Destination " + toName + " reached."
    ]
  };
}

/**
 * Retrieve route data for any from/to pair
 */
function getRouteData(fromLoc, toLoc) {
  var key1 = fromLoc + ":" + toLoc;
  var key2 = toLoc + ":" + fromLoc;

  if (DETAILED_ROUTE_DATABASE[key1]) {
    return DETAILED_ROUTE_DATABASE[key1];
  }
  if (DETAILED_ROUTE_DATABASE[key2]) {
    // Reverse directions
    var r = JSON.parse(JSON.stringify(DETAILED_ROUTE_DATABASE[key2]));
    r.directions.reverse();
    r.segments.forEach(function (s) {
      var tmp = s.from; s.from = s.to; s.to = tmp;
    });
    return r;
  }
  return synthesizeRoute(fromLoc, toLoc);
}

/**
 * Bind Home Page Route Search Form and validation
 */
function initHomeRouteSearch() {
  var form = document.getElementById("homeRouteSearchForm");
  var fromInput = document.getElementById("inputRouteFrom");
  var toInput = document.getElementById("inputRouteTo");
  var errAlert = document.getElementById("routeSearchErrorAlert");
  var swapBtn = document.getElementById("btnSwapLocations");

  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener("click", function () {
      var tmp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = tmp;
    });
  }

  // Quick suggestion chips
  document.querySelectorAll(".chip-btn").forEach(function (chip) {
    chip.addEventListener("click", function () {
      if (fromInput) fromInput.value = chip.getAttribute("data-from") || "";
      if (toInput)   toInput.value   = chip.getAttribute("data-to")   || "";
      if (errAlert)  errAlert.classList.add("hidden");
    });
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fromVal = (fromInput ? fromInput.value : "").trim();
      var toVal   = (toInput   ? toInput.value   : "").trim();

      // Step 2 Requirement: Validate that both fields are filled
      if (!fromVal || !toVal) {
        if (errAlert) {
          errAlert.classList.remove("hidden");
          var msgEl = document.getElementById("routeSearchErrorMsg");
          if (msgEl) msgEl.textContent = "Please enter both starting point and destination.";
        }
        return;
      }

      if (errAlert) errAlert.classList.add("hidden");

      // Save selected route in state and sessionStorage
      window.currentRouteData = { from: fromVal, to: toVal };
      try {
        sessionStorage.setItem("selectedRoute", JSON.stringify({ from: fromVal, to: toVal }));
      } catch (_) {}

      // Step 3 Requirement: Navigate the user to the Route map page (#route)
      navigateToPage("route");
    });
  }
}

/** Map instance for dedicated Route page */
var routePageMapInstance = null;
var routePagePolylineLayer = null;
var routePageMarkersLayer = null;
var currentRouteBounds = null;

/**
 * Render Dedicated Route Page (#page-route)
 */
function renderRoutePage() {
  // Retrieve selected locations
  var routePair = window.currentRouteData;
  if (!routePair) {
    try {
      var saved = sessionStorage.getItem("selectedRoute");
      if (saved) routePair = JSON.parse(saved);
    } catch (_) {}
  }
  if (!routePair || !routePair.from || !routePair.to) {
    routePair = { from: "Bangalore", to: "Electronic City" };
  }

  var fromNorm = normalizeLocName(routePair.from);
  var toNorm   = normalizeLocName(routePair.to);

  // Update DOM header labels
  var setText = function (id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("routePageFromText", routePair.from);
  setText("routePageToText",   routePair.to);
  setText("cardFromVal",        routePair.from);
  setText("cardToVal",          routePair.to);

  // Fetch route metrics & segments
  var routeInfo = getRouteData(fromNorm, toNorm);

  // Update Route Information Card metrics
  setText("cardDistanceVal", routeInfo.distance);
  setText("cardEtaVal",      routeInfo.eta);
  setText("cardRiskVal",     routeInfo.risk);
  setText("cardSpeedVal",    routeInfo.speed);

  var trafEl = document.getElementById("cardTrafficVal");
  if (trafEl) {
    if (routeInfo.traffic === "Heavy") {
      trafEl.innerHTML = '<span class="pill red">&#128308; Heavy</span>';
    } else if (routeInfo.traffic === "Moderate") {
      trafEl.innerHTML = '<span class="pill amber">&#128993; Moderate</span>';
    } else {
      trafEl.innerHTML = '<span class="pill green">&#128994; Low Traffic</span>';
    }
  }

  // Populate Turn-by-Turn Directions
  var dirList = document.getElementById("turnDirectionsList");
  if (dirList) {
    dirList.innerHTML = "";
    routeInfo.directions.forEach(function (step, index) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>Step " + (index + 1) + ":</strong> " + escapeHtml(step);
      dirList.appendChild(li);
    });
  }

  // Render Leaflet Route Map
  initRouteMapCanvas(fromNorm, toNorm, routeInfo);
}

/**
 * Initialize and draw route on Leaflet Map
 */
function initRouteMapCanvas(fromLoc, toLoc, routeInfo) {
  var mapEl = document.getElementById("routeMapCanvas");
  if (!mapEl || typeof L === "undefined") return;

  setTimeout(function () {
    if (!routePageMapInstance) {
      routePageMapInstance = L.map("routeMapCanvas", {
        center: [12.9100, 77.6300],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(routePageMapInstance);

      routePagePolylineLayer = L.layerGroup().addTo(routePageMapInstance);
      routePageMarkersLayer  = L.layerGroup().addTo(routePageMapInstance);

      // Wire zoom fit button
      var fitBtn = document.getElementById("btnResetRouteZoom");
      if (fitBtn) {
        fitBtn.addEventListener("click", function () {
          if (routePageMapInstance && currentRouteBounds) {
            routePageMapInstance.fitBounds(currentRouteBounds, { padding: [40, 40] });
          }
        });
      }
    }

    routePagePolylineLayer.clearLayers();
    routePageMarkersLayer.clearLayers();

    var allCoords = [];

    // Draw Route Polylines with traffic segments (Green, Yellow, Red)
    if (routeInfo.segments && routeInfo.segments.length) {
      routeInfo.segments.forEach(function (seg) {
        var poly = L.polyline([seg.from, seg.to], {
          color: seg.color,
          weight: 8,
          opacity: 0.92,
          lineCap: "round",
          lineJoin: "round"
        });
        poly.bindPopup("<strong>Traffic Condition:</strong> " + seg.label + "<br><small style='color:#64748b;'>Segment of " + escapeHtml(fromLoc) + " &rarr; " + escapeHtml(toLoc) + "</small>");
        routePagePolylineLayer.addLayer(poly);

        allCoords.push(seg.from);
        allCoords.push(seg.to);
      });
    }

    var startCoord = (routeInfo.segments && routeInfo.segments[0]) ? routeInfo.segments[0].from : (LOCATION_COORDS[fromLoc] || [12.9716, 77.5946]);
    var destCoord  = (routeInfo.segments && routeInfo.segments.length) ? routeInfo.segments[routeInfo.segments.length - 1].to : (LOCATION_COORDS[toLoc] || [12.8452, 77.6602]);

    // Step 10 Requirement: Distinct Start & Destination Markers
    // START Location Marker: Green
    var startMarker = L.circleMarker(startCoord, {
      radius: 12,
      fillColor: "#10b981",
      color: "#ffffff",
      weight: 3.5,
      fillOpacity: 1
    });
    startMarker.bindPopup(
      '<div class="custom-leaflet-popup">' +
      '<h4 class="popup-title" style="color:#065f46;">&#128205; START LOCATION</h4>' +
      '<p style="margin:4px 0 0"><strong>' + escapeHtml(fromLoc) + '</strong><br>' +
      '<span class="status-pill status-pill-green" style="font-size:0.7rem;margin-top:4px;display:inline-block;">Journey Departure Point</span></p>' +
      '</div>'
    );
    routePageMarkersLayer.addLayer(startMarker);

    // DESTINATION Location Marker: Red
    var destMarker = L.circleMarker(destCoord, {
      radius: 12,
      fillColor: "#ef4444",
      color: "#ffffff",
      weight: 3.5,
      fillOpacity: 1
    });
    destMarker.bindPopup(
      '<div class="custom-leaflet-popup">' +
      '<h4 class="popup-title" style="color:#991b1b;">&#128205; DESTINATION</h4>' +
      '<p style="margin:4px 0 0"><strong>' + escapeHtml(toLoc) + '</strong><br>' +
      '<span class="status-pill status-pill-red" style="font-size:0.7rem;margin-top:4px;display:inline-block;">Estimated ETA: ' + escapeHtml(routeInfo.eta) + '</span></p>' +
      '</div>'
    );
    routePageMarkersLayer.addLayer(destMarker);

    // Auto-fit zoom to route
    if (allCoords.length) {
      currentRouteBounds = L.latLngBounds(allCoords);
      routePageMapInstance.fitBounds(currentRouteBounds, { padding: [50, 50] });
    }

    // Step 11 Requirement: Display Verified Crash Markers along corridor
    fetch(API_BASE + "/api/crash-reports?status=Verified")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.success || !Array.isArray(data.reports)) return;

        data.reports.forEach(function (r) {
          var lat = r.latitude, lng = r.longitude;
          if (!lat || !lng) {
            var c = LOCATION_COORDS[r.location];
            if (!c) return;
            lat = c[0] + (Math.random() - 0.5) * 0.004;
            lng = c[1] + (Math.random() - 0.5) * 0.004;
          }

          var crashMarker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: "#dc2626",
            color: "#ffffff",
            weight: 2.5,
            fillOpacity: 0.95
          });

          var crashPopup =
            '<div class="custom-leaflet-popup">' +
            '<h4 class="popup-title" style="color:#991b1b;">&#128680; CRASH REPORT</h4>' +
            '<div class="popup-row"><span class="popup-label">Location:</span> <span class="popup-val"><strong>' + escapeHtml(r.location) + '</strong></span></div>' +
            '<div class="popup-row"><span class="popup-label">Crash Type:</span> <span class="popup-val">' + escapeHtml(r.crash_type || "Vehicle Collision") + '</span></div>' +
            '<div class="popup-row"><span class="popup-label">Severity:</span> <span class="popup-val"><span class="badge-traffic heavy">' + escapeHtml(r.severity || "High") + '</span></span></div>' +
            '<div class="popup-row"><span class="popup-label">Road Condition:</span> <span class="popup-val">' + escapeHtml(r.road_condition || "Wet") + '</span></div>' +
            '<div class="popup-row"><span class="popup-label">Date:</span> <span class="popup-val">' + escapeHtml(r.report_date || "Recent") + '</span></div>' +
            '<span class="popup-tag" style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca;margin-top:6px;display:inline-block;">Verified Official Crash</span>' +
            '</div>';

          crashMarker.bindPopup(crashPopup);
          routePageMarkersLayer.addLayer(crashMarker);
        });
      })
      .catch(function () {});

    routePageMapInstance.invalidateSize();
  }, 100);
}


// ============================================================================
// 13. REAL ROAD GEOCODING & OSRM ROUTING ENGINE (ACCURATE ROADS & DIRECTIONS)
// ============================================================================

/**
 * Verified Bengaluru landmark & corridor coordinates for instant zero-latency matching
 */
var BENGALURU_COORDINATES_MAP = {
  "chikkahagade": [12.7323, 77.7016],
  "chikkahagade, bengaluru": [12.7323, 77.7016],
  "near chikkahagade": [12.7323, 77.7016],
  "near chikkahagade, bengaluru": [12.7323, 77.7016],
  "hebbal": [13.0358, 77.5970],
  "hebbal, bengaluru": [13.0358, 77.5970],
  "electronic city": [12.8452, 77.6602],
  "electronic city, bengaluru": [12.8452, 77.6602],
  "electronic city phase 1": [12.8485, 77.6625],
  "electronic city phase 1, bengaluru": [12.8485, 77.6625],
  "electronic city phase 2": [12.8390, 77.6780],
  "electronic city phase 2, bengaluru": [12.8390, 77.6780],
  "koramangala": [12.9352, 77.6245],
  "koramangala, bengaluru": [12.9352, 77.6245],
  "whitefield": [12.9698, 77.7499],
  "whitefield, bengaluru": [12.9698, 77.7499],
  "indiranagar": [12.9784, 77.6408],
  "indiranagar, bengaluru": [12.9784, 77.6408],
  "majestic": [12.9767, 77.5713],
  "majestic, bengaluru": [12.9767, 77.5713],
  "kempegowda bus station": [12.9767, 77.5713],
  "silk board": [12.9172, 77.6228],
  "silk board, bengaluru": [12.9172, 77.6228],
  "central silk board": [12.9172, 77.6228],
  "yelahanka": [13.1007, 77.5963],
  "yelahanka, bengaluru": [13.1007, 77.5963],
  "kr puram": [13.0075, 77.6959],
  "kr puram, bengaluru": [13.0075, 77.6959],
  "k.r. puram": [13.0075, 77.6959],
  "hsr layout": [12.9121, 77.6446],
  "hsr layout, bengaluru": [12.9121, 77.6446],
  "bannerghatta road": [12.8912, 77.5975],
  "bannerghatta road, bengaluru": [12.8912, 77.5975],
  "marathahalli": [12.9560, 77.7011],
  "marathahalli, bengaluru": [12.9560, 77.7011],
  "jayanagar": [12.9308, 77.5838],
  "jayanagar, bengaluru": [12.9308, 77.5838],
  "outer ring road": [12.9248, 77.6805],
  "outer ring road, bengaluru": [12.9248, 77.6805],
  "sarjapur road": [12.9166, 77.6750],
  "sarjapur road, bengaluru": [12.9166, 77.6750],
  "kanakapura road": [12.8805, 77.5583],
  "hosur": [12.7409, 77.8253],
  "hosur road": [12.8988, 77.6433],
  "anekal": [12.7100, 77.6970],
  "anekal, bengaluru": [12.7100, 77.6970],
  "bangalore": [12.9716, 77.5946],
  "bengaluru": [12.9716, 77.5946],
  "bangalore city centre": [12.9716, 77.5946]
};

var currentMapTheme = "dark";
var darkTileLayer = null;
var satTileLayer = null;
var routeLiveTrafficEnabled = true;
var _screenshotMap = null;
var _trafficLayersGroup = null;
var _incidentLayersGroup = null;
var _alternativeRouteGroup = null;
var _affectedRouteGroup = null;
var _incidentHighlightGroup = null;
var _incidentPollTimer = null;
var _alertedIncidentIds = new Set();
var _currentRoutePair = null;
var _activeIncidentDetectionData = null;
var _isAlternativeRouteActive = false;
var _originalRouteBackup = null;

var _markersGroup = null;
var isCalculatingRoute = false;

// Dedicated state objects for decoupled routing coordinates and display text
var fromLocation = {
  text: "",
  lat: null,
  lon: null,
  source: null // "gps" | "manual" | "geocoding"
};

var toLocation = {
  text: "",
  lat: null,
  lon: null,
  source: null
};


/**
 * Geocodes location name to latitude and longitude.
 * Uses local coordinate lookup first, then OpenStreetMap Nominatim.
 */
async function getCoordinates(placeQuery) {
  if (!placeQuery || !placeQuery.trim()) return null;
  var raw = placeQuery.trim();
  var norm = raw.toLowerCase().replace(/\s+/g, " ");

  // A. Check if user referenced current GPS position
  if ((norm === "current location" || norm === "my location") && currentUserPosition) {
    return {
      lat: currentUserPosition.lat,
      lon: currentUserPosition.lon,
      userLabel: raw,
      displayName: "Current Location",
      source: "gps"
    };
  }

  // B. Handle and clean prefix such as "near ..."
  var cleanQuery = raw;
  if (/^near\s+/i.test(norm)) {
    cleanQuery = raw.replace(/^near\s+/i, "").trim();
  }
  var cleanNorm = cleanQuery.toLowerCase().replace(/\s+/g, " ");

  // 1. Direct match in local dictionary
  if (BENGALURU_COORDINATES_MAP[norm]) {
    var c = BENGALURU_COORDINATES_MAP[norm];
    return { lat: c[0], lon: c[1], userLabel: raw, displayName: raw };
  }
  if (BENGALURU_COORDINATES_MAP[cleanNorm]) {
    var c = BENGALURU_COORDINATES_MAP[cleanNorm];
    return { lat: c[0], lon: c[1], userLabel: raw, displayName: raw };
  }

  // 2. Normalized prefix or substring match in local dictionary
  var keys = Object.keys(BENGALURU_COORDINATES_MAP);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (norm === k || norm.startsWith(k + ",") || norm.startsWith(k + " ") ||
        cleanNorm === k || cleanNorm.startsWith(k + ",") || cleanNorm.startsWith(k + " ")) {
      var c2 = BENGALURU_COORDINATES_MAP[k];
      return { lat: c2[0], lon: c2[1], userLabel: raw, displayName: raw };
    }
  }

  // 3. Fallback to OpenStreetMap Nominatim API (try cleaned query first, then raw)
  var queriesToTry = [cleanQuery];
  if (cleanQuery !== raw) queriesToTry.push(raw);

  for (var qIdx = 0; qIdx < queriesToTry.length; qIdx++) {
    var q = queriesToTry[qIdx];
    var searchQuery = q;
    var lower = q.toLowerCase();
    if (!lower.includes("bengaluru") && !lower.includes("bangalore") && !lower.includes("karnataka") && !lower.includes("india")) {
      searchQuery = q + ", Bengaluru, Karnataka, India";
    }

    try {
      var url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(searchQuery) + "&limit=1";
      var res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (res.ok) {
        var data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            userLabel: raw,
            displayName: data[0].display_name
          };
        }
      }
      // If not found with suffix, try without suffix
      if (searchQuery !== q) {
        var rawUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(q) + "&limit=1";
        var res2 = await fetch(rawUrl, { headers: { "Accept-Language": "en" } });
        if (res2.ok) {
          var data2 = await res2.json();
          if (data2 && data2.length > 0) {
            return {
              lat: parseFloat(data2[0].lat),
              lon: parseFloat(data2[0].lon),
              userLabel: raw,
              displayName: data2[0].display_name
            };
          }
        }
      }
    } catch (err) {
      console.warn("Geocoding lookup failed for query:", q, err);
    }
  }

  return null;
}

/**
 * Calculates road route using OSRM (Open Source Routing Machine)
 */
async function calculateRoadRoute(startCoords, destCoords) {
  var url = "https://router.project-osrm.org/route/v1/driving/" +
    startCoords.lon + "," + startCoords.lat + ";" +
    destCoords.lon + "," + destCoords.lat +
    "?overview=full&geometries=geojson&steps=true";

  var response = await fetch(url);
  if (!response.ok) {
    throw new Error("Routing request failed with HTTP " + response.status);
  }
  var data = await response.json();
  if (!data || data.code !== "Ok" || !data.routes || !data.routes.length) {
    throw new Error("No driving route returned by OSRM");
  }

  var route = data.routes[0];
  var rawGeometry = route.geometry.coordinates; // [lon, lat] pairs
  var latLngs = rawGeometry.map(function(pt) { return [pt[1], pt[0]]; });

  var distanceMeters = route.distance || 0;
  var durationSeconds = route.duration || 0;
  var distanceKm = (distanceMeters / 1000).toFixed(1);
  var durationMins = Math.max(1, Math.round(durationSeconds / 60));

  var rawSteps = (route.legs && route.legs[0] && route.legs[0].steps) ? route.legs[0].steps : [];
  var directions = [];

  if (rawSteps.length > 0) {
    rawSteps.forEach(function(step, idx) {
      var m = step.maneuver || {};
      var type = m.type || "turn";
      var modifier = (m.modifier || "").toLowerCase();
      var road = (step.name || "").trim();
      var stepDist = step.distance || 0;
      var distStr = stepDist >= 1000 ? (stepDist / 1000).toFixed(1) + " km" : Math.round(stepDist) + " m";

      var icon = "↑";
      var bulletClass = "bullet-arrow";
      var text = "";

      if (idx === 0) {
        icon = "🟢";
        bulletClass = "bullet-green";
        text = "Start at " + (startCoords.userLabel || road || "starting point");
      } else if (idx === rawSteps.length - 1 || type === "arrive") {
        icon = "🔴";
        bulletClass = "bullet-red";
        text = "Arrive at " + (destCoords.userLabel || road || "destination");
      } else {
        if (modifier.includes("left")) icon = "⮰";
        else if (modifier.includes("right")) icon = "⮱";
        else if (type.includes("rotary") || type.includes("roundabout")) icon = "⟳";

        if (type === "turn") {
          text = "Turn " + (modifier ? modifier + " " : "") + (road ? "onto " + road : "ahead");
        } else if (type === "new name") {
          text = "Continue onto " + (road || "road");
        } else if (type === "continue") {
          text = "Continue " + (modifier ? modifier + " " : "") + (road ? "on " + road : "straight");
        } else if (type === "fork") {
          text = "Take " + (modifier ? modifier + " fork " : "fork ") + (road ? "toward " + road : "");
        } else if (type === "rotary" || type === "roundabout") {
          text = "Enter roundabout and take exit " + (road ? "onto " + road : "");
        } else if (type === "on ramp" || type === "ramp") {
          text = "Take ramp " + (road ? "toward " + road : "");
        } else if (type === "end of road") {
          text = "At end of road, turn " + (modifier || "ahead") + (road ? " onto " + road : "");
        } else {
          text = road ? "Continue onto " + road : "Continue straight on route";
        }
      }

      directions.push({ icon: icon, text: text, dist: distStr, bulletClass: bulletClass });
    });
  } else {
    // Clean advisory if steps are omitted
    directions = [
      { icon: "🟢", text: "Start at " + startCoords.userLabel, dist: "0 km", bulletClass: "bullet-green" },
      { icon: "↑", text: "Follow calculated road route for " + distanceKm + " km", dist: distanceKm + " km", bulletClass: "bullet-arrow" },
      { icon: "🔴", text: "Arrive at " + destCoords.userLabel, dist: distanceKm + " km", bulletClass: "bullet-red" }
    ];
  }

  // Model-based traffic distribution (Clearly identified as prototype/sample data)
  var distNum = parseFloat(distanceKm) || 1;
  var heavyKm = (distNum * 0.38).toFixed(1) + " km";
  var modKm   = (distNum * 0.34).toFixed(1) + " km";
  var lightKm = Math.max(0.5, distNum - (distNum * 0.72)).toFixed(1) + " km";

  var trafficCondition = "Moderate";
  if (durationMins / distNum > 2.2) trafficCondition = "Heavy";
  else if (durationMins / distNum < 1.3) trafficCondition = "Light";

  return {
    startCoords: startCoords,
    destCoords: destCoords,
    latLngs: latLngs,
    distanceKm: distanceKm,
    durationMins: durationMins,
    trafficCondition: trafficCondition,
    heavyKm: heavyKm,
    modKm: modKm,
    lightKm: lightKm,
    directions: directions
  };
}

/**
 * Renders the Route Details & Map Page with real road coordinates
 */
function renderScreenshotRoutePage() {
  var pair = window.currentRoutePair || { from: "Hebbal, Bengaluru", to: "Electronic City, Bengaluru" };

  // Sync inputs
  var sf = document.getElementById("routeStripFrom");
  var st = document.getElementById("routeStripTo");
  if (sf) sf.value = pair.from;
  if (st) st.value = pair.to;

  var hf = document.getElementById("inputRouteFrom");
  var ht = document.getElementById("inputRouteTo");
  if (hf) hf.value = pair.from;
  if (ht) ht.value = pair.to;

  // If already calculated and matches pair, display it
  if (window.currentRouteData && window.currentRoutePair &&
      window.currentRoutePair.from === pair.from &&
      window.currentRoutePair.to === pair.to) {
    displayRoute(window.currentRouteData, pair);
    return;
  }

  // Otherwise calculate road route automatically
  executeRouteSearch(pair.from, pair.to, "auto");
}

/**
 * Updates UI and draws real road route on map
 */
function displayRoute(routeData, pair) {
  // 1. Metric Cards
  var dEl = document.getElementById("dispDistance");
  var eEl = document.getElementById("dispETA");
  var tEl = document.getElementById("dispTrafficLevel");
  if (dEl) dEl.textContent = routeData.distanceKm + " km";
  if (eEl) eEl.textContent = routeData.durationMins + " mins";
  if (tEl) {
    tEl.textContent = routeData.trafficCondition;
    tEl.className = "trio-value " + (routeData.trafficCondition === "Heavy" ? "text-danger" : routeData.trafficCondition === "Moderate" ? "text-moderate" : "text-success");
  }

  // 2. Segmented Traffic Bar
  var hKm = document.getElementById("kmHeavy");
  var mKm = document.getElementById("kmMod");
  var lKm = document.getElementById("kmLight");
  if (hKm) hKm.textContent = routeData.heavyKm;
  if (mKm) mKm.textContent = routeData.modKm;
  if (lKm) lKm.textContent = routeData.lightKm;

  // 3. Turn-by-Turn Directions
  var dirList = document.getElementById("turnDirectionsList");
  if (dirList) {
    dirList.innerHTML = "";
    routeData.directions.forEach(function(step) {
      var li = document.createElement("li");
      li.className = "direction-step-item";
      li.innerHTML = '<span class="step-bullet ' + step.bulletClass + '">' + step.icon + '</span>' +
                     '<div class="step-details">' +
                     '<span class="step-instruction">' + escapeHtml(step.text) + '</span>' +
                     '<span class="step-distance">' + escapeHtml(step.dist) + '</span>' +
                     '</div>';
      dirList.appendChild(li);
    });
  }

  // 3.5. Update Collapsible Directions Badge & Route Overview Comparison Panel
  var stepsBadge = document.getElementById("stepsCountBadge");
  if (stepsBadge) {
    stepsBadge.textContent = (routeData.directions ? routeData.directions.length : 0) + " steps";
  }

  var rcOrigDist = document.getElementById("rcOrigDist");
  var rcOrigEta = document.getElementById("rcOrigEta");
  var rcOrigTrafficText = document.getElementById("rcOrigTrafficText");
  var rcOrigDot = document.getElementById("rcOrigDot");
  if (rcOrigDist) rcOrigDist.textContent = routeData.distanceKm + " km";
  if (rcOrigEta) rcOrigEta.textContent = routeData.durationMins + " mins";
  if (rcOrigTrafficText) rcOrigTrafficText.textContent = (routeData.trafficCondition || "Moderate") + " Traffic";
  if (rcOrigDot) {
    rcOrigDot.className = "rc-cond-dot " + (routeData.trafficCondition === "Heavy" ? "dot-red" : routeData.trafficCondition === "Moderate" ? "dot-yellow" : "dot-green");
  }

  // Reset comparison cards and tags
  var cardOrig = document.getElementById("routeCardOriginal");
  var cardAlt = document.getElementById("routeCardAlternative");
  var activeTag = document.getElementById("overviewActiveTag");
  var rcAltDist = document.getElementById("rcAltDist");
  var rcAltEta = document.getElementById("rcAltEta");
  var rcAltSaving = document.getElementById("rcAltSavingText");
  var rerouteAdvisory = document.getElementById("rerouteAdvisoryText");
  var btnUseAlt = document.getElementById("btnUseAlternateRoute");

  if (cardOrig) cardOrig.classList.add("active-card");
  if (cardAlt) cardAlt.classList.remove("active-card");
  if (activeTag) {
    activeTag.textContent = "Original Active";
    activeTag.className = "overview-active-tag tag-primary";
  }
  if (rcAltDist) rcAltDist.textContent = "-- km";
  if (rcAltEta) rcAltEta.textContent = "-- mins";
  if (rcAltSaving) {
    rcAltSaving.textContent = "Analyzing incidents & detours...";
    rcAltSaving.className = "rc-saving-text text-emerald";
  }
  if (rerouteAdvisory) rerouteAdvisory.textContent = "Checking route corridor for active accident reports and alternatives...";
  if (btnUseAlt) {
    btnUseAlt.disabled = true;
    btnUseAlt.classList.add("disabled");
  }

  // Hide compact alert and detail drawer until incident evaluation completes
  var compactAlert = document.getElementById("compactAccidentAlert");
  var drawer = document.getElementById("incidentDetailDrawer");
  if (compactAlert) compactAlert.classList.add("hidden");
  if (drawer) drawer.classList.add("hidden");

  // 4. Map Console
  if (activeMapEngine === "google" && googleMapsApiLoaded && googleMapsDirectionsSupported !== false) {
    renderGoogleRoadMap(routeData, pair);
  } else {
    renderScreenshotMap(routeData, pair);
  }

  // 5. Query traffic flow for route coordinates according to selected mode
  if (currentTrafficDisplayMode === "historical") {
    loadHistoricalTrafficForRoute(routeData.latLngs);
  } else {
    loadTomTomTrafficForRoute(routeData.latLngs);
  }

  // 6. Check for active incident alerts along route & evaluate rerouting
  checkRouteForIncidentAlerts(routeData, pair);
}

/**
 * Draw interactive Leaflet map with real road polylines, start/destination pins, and incident markers
 */

// ============================================================================
// 13.5 TOMTOM REAL-TIME TRAFFIC FLOW ENGINE
// ============================================================================

var currentTrafficFlowData = null;
var isTrafficRefreshing = false;
var trafficLastRefreshedAt = 0;
var trafficAutoRefreshTimer = null;
var TRAFFIC_REFRESH_COOLDOWN_MS = 15000; // 15s cooldown to protect API rate limits

/**
 * Samples representative road coordinate points along the route geometry
 * (limited to 5-7 points to avoid excessive API calls)
 */
function sampleRouteCoordinates(latLngs, maxSamples) {
  if (!latLngs || latLngs.length === 0) return [];
  var limit = maxSamples || 6;
  var total = latLngs.length;
  if (total <= limit) {
    return latLngs.map(function(pt) { return { lat: pt[0], lon: pt[1] }; });
  }

  var sampledIndices = [];
  var step = total / (limit + 1);
  for (var i = 1; i <= limit; i++) {
    sampledIndices.push(Math.min(total - 1, Math.floor(i * step)));
  }

  var uniqueIndices = Array.from(new Set(sampledIndices));
  return uniqueIndices.map(function(idx) {
    return { lat: latLngs[idx][0], lon: latLngs[idx][1] };
  });
}

/**
 * Calls Flask backend /api/traffic-flow to retrieve real TomTom traffic flow data
 */
async function loadTomTomTrafficForRoute(latLngs, isManualRefresh) {
  if (!latLngs || latLngs.length === 0) return;

  var btnRefresh = document.getElementById("btnRefreshTraffic");
  if (btnRefresh) {
    btnRefresh.disabled = true;
    var lbl = btnRefresh.querySelector(".refresh-label");
    if (lbl) lbl.textContent = "Updating...";
  }

  var sampledPoints = sampleRouteCoordinates(latLngs, 6);

  try {
    var resp = await fetch("http://127.0.0.1:5000/api/traffic-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: sampledPoints })
    });

    if (!resp.ok) {
      throw new Error("HTTP " + resp.status + " from traffic backend");
    }

    var result = await resp.json();
    currentTrafficFlowData = result;
    trafficLastRefreshedAt = Date.now();

    updateTrafficUIState(result);
    if (_screenshotMap && _trafficLayersGroup) {
      renderTrafficLayers(latLngs, result);
    }
  } catch (err) {
    console.warn("Traffic flow fetch error:", err);
    var fallbackResult = {
      success: false,
      source: "TRAFFIC DATA UNAVAILABLE",
      status: "network_error",
      message: "Cannot connect to Flask backend at http://127.0.0.1:5000. Is the backend running?",
      last_updated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      segments: []
    };
    currentTrafficFlowData = fallbackResult;
    updateTrafficUIState(fallbackResult);
    if (_screenshotMap && _trafficLayersGroup) {
      renderTrafficLayers(latLngs, fallbackResult);
    }
  } finally {
    if (btnRefresh) {
      var lbl2 = btnRefresh.querySelector(".refresh-label");
      if (lbl2) lbl2.textContent = "Refresh";
      setTimeout(function() {
        if (btnRefresh) btnRefresh.disabled = false;
        isTrafficRefreshing = false;
      }, 3000);
    }
  }
}

/**
 * Updates UI badges, timestamps, alerts, and summary metrics based on traffic flow result
 */
function updateTrafficUIState(result) {
  var pill = document.getElementById("trafficSourcePill");
  var updatedText = document.getElementById("trafficLastUpdatedText");
  var alertBox = document.getElementById("trafficStatusAlert");
  var alertMsg = document.getElementById("trafficStatusMsg");
  var dispTraffic = document.getElementById("dispTrafficLevel");

  if (result.success && result.status === "live") {
    // 1. LIVE TRAFFIC (Only displayed when verified real data is returned)
    if (pill) {
      pill.className = "traffic-source-pill live";
      pill.innerHTML = "🟢 LIVE TRAFFIC";
    }
    if (updatedText) {
      updatedText.innerHTML = "Live at <strong>" + escapeHtml(result.last_updated) + "</strong> &bull; Avg: " + result.average_current_speed + " km/h";
    }
    if (alertBox) alertBox.classList.add("hidden");

    if (dispTraffic) {
      dispTraffic.textContent = result.overall_condition;
      dispTraffic.className = "trio-value " + (result.overall_condition === "Heavy" ? "text-danger" : result.overall_condition === "Moderate" ? "text-moderate" : "text-success");
    }

    // Update segmented traffic stats if segments available
    if (result.segments && result.segments.length > 0 && window.currentRouteData) {
      var totalDist = parseFloat(window.currentRouteData.distanceKm) || 1.0;
      var counts = { Light: 0, Moderate: 0, Heavy: 0 };
      result.segments.forEach(function(s) {
        if (counts[s.congestion_level] !== undefined) counts[s.congestion_level]++;
      });
      var totalSegs = result.segments.length;
      var hRatio = counts.Heavy / totalSegs;
      var mRatio = counts.Moderate / totalSegs;
      var lRatio = counts.Light / totalSegs;

      var hKm = (totalDist * hRatio).toFixed(1) + " km";
      var mKm = (totalDist * mRatio).toFixed(1) + " km";
      var lKm = (totalDist * lRatio).toFixed(1) + " km";

      var elHKm = document.getElementById("kmHeavy");
      var elMKm = document.getElementById("kmMod");
      var elLKm = document.getElementById("kmLight");
      if (elHKm) elHKm.textContent = hKm;
      if (elMKm) elMKm.textContent = mKm;
      if (elLKm) elLKm.textContent = lKm;

      var bH = document.getElementById("barSegHeavy");
      var bM = document.getElementById("barSegMod");
      var bL = document.getElementById("barSegLight");
      if (bH) { bH.style.width = Math.round(hRatio * 100) + "%"; bH.title = hKm + " Heavy (TomTom Live)"; }
      if (bM) { bM.style.width = Math.round(mRatio * 100) + "%"; bM.title = mKm + " Moderate (TomTom Live)"; }
      if (bL) { bL.style.width = Math.round(lRatio * 100) + "%"; bL.title = lKm + " Light (TomTom Live)"; }
    }

  } else if (result.status === "network_error" || result.status === "upstream_error") {
    // 2. TRAFFIC DATA UNAVAILABLE (When network or provider service fails)
    if (pill) {
      pill.className = "traffic-source-pill error";
      pill.innerHTML = "⚠️ TRAFFIC DATA UNAVAILABLE";
    }
    if (updatedText) {
      updatedText.innerHTML = "Service unavailable &bull; " + (result.last_updated || "Just now");
    }
    if (alertBox && alertMsg) {
      alertBox.className = "traffic-status-banner error";
      alertBox.classList.remove("hidden");
      if (result.status === "network_error") {
        alertMsg.innerHTML = "<strong>Backend Connection Failed:</strong> Cannot connect to Flask at <code>http://127.0.0.1:5000/api/traffic-flow</code>. Ensure backend is running.";
      } else {
        alertMsg.innerHTML = "<strong>Traffic Data Unavailable:</strong> " + escapeHtml(result.message || "Unable to retrieve road speeds from TomTom servers. Please check your network connection.");
      }
    }
  } else {
    // 3. DEMO TRAFFIC (When key is missing or in fallback mode; never labeled as live)
    if (pill) {
      pill.className = "traffic-source-pill demo";
      pill.innerHTML = "⚠️ DEMO TRAFFIC";
    }
    if (updatedText) {
      updatedText.innerHTML = "Demo flow &bull; " + (result.last_updated || "Just now");
    }
    if (alertBox && alertMsg) {
      alertBox.className = "traffic-status-banner";
      alertBox.classList.remove("hidden");
      if (result.status === "key_missing") {
        alertMsg.innerHTML = "<strong>TomTom API Key Missing:</strong> Add <code>TOMTOM_API_KEY=PASTE_YOUR_REAL_KEY_HERE</code> in <code>backend/.env</code> and restart Flask to enable real traffic.";
      } else if (result.status === "auth_error") {
        alertMsg.innerHTML = "<strong>Invalid TomTom Key:</strong> The key in <code>backend/.env</code> was rejected by TomTom. Please verify your Consumer Key at developer.tomtom.com.";
      } else {
        alertMsg.innerHTML = "<strong>Notice:</strong> " + escapeHtml(result.message || "Live traffic unavailable. Showing demo traffic.");
      }
    }
  }
}

/**
 * Renders casing and traffic colored polylines along the route
 */
function renderTrafficLayers(latLngs, trafficResult) {
  if (!_trafficLayersGroup || !latLngs || latLngs.length === 0) return;
  _trafficLayersGroup.clearLayers();

  // 1. Draw base casing line
  var baseCasing = L.polyline(latLngs, {
    color: "#080f1e",
    weight: 10,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  });
  _trafficLayersGroup.addLayer(baseCasing);

  // 2. Real TomTom Live Traffic Polylines
  if (trafficResult && trafficResult.success && trafficResult.segments && trafficResult.segments.length > 0) {
    var segs = trafficResult.segments;
    var totalPts = latLngs.length;
    var ptsPerSeg = Math.max(1, Math.floor(totalPts / segs.length));

    for (var sIdx = 0; sIdx < segs.length; sIdx++) {
      var seg = segs[sIdx];
      var startIdx = sIdx * ptsPerSeg;
      var endIdx = (sIdx === segs.length - 1) ? totalPts : (sIdx + 1) * ptsPerSeg + 1;
      var slice = latLngs.slice(startIdx, endIdx);

      if (slice.length > 1) {
        var poly = L.polyline(slice, {
          color: seg.color,
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round"
        });

        var popupHtml =
          '<div class="custom-leaflet-popup" style="font-size:12px; line-height:1.5;">' +
          '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
          '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:' + seg.color + '"></span>' +
          '<strong style="color:' + seg.color + '; font-size:13px;">' + seg.congestion_level + ' Traffic</strong>' +
          '</div>' +
          '<div><b>Provider:</b> TomTom Traffic API (Live)</div>' +
          '<div><b>Current Speed:</b> ' + seg.current_speed + ' km/h</div>' +
          '<div><b>Free-flow Speed:</b> ' + seg.free_flow_speed + ' km/h</div>' +
          '<div><b>Speed Ratio:</b> ' + Math.round(seg.speed_ratio * 100) + '% of free flow</div>' +
          (seg.road_closure ? '<div style="color:#ef4444; font-weight:bold; margin-top:2px;">⚠ Road Closure Reported</div>' : '') +
          '<div style="font-size:10px; color:#94a3b8; margin-top:4px;">Updated: ' + escapeHtml(trafficResult.last_updated) + '</div>' +
          '</div>';

        poly.bindPopup(popupHtml);
        _trafficLayersGroup.addLayer(poly);
      }
    }
    return;
  }

  // 3. Demo Fallback Polylines (Explicitly labeled as Demo / Sample Flow)
  var totalPts = latLngs.length;
  var idx1 = Math.floor(totalPts * 0.35);
  var idx2 = Math.floor(totalPts * 0.70);

  var segGreen = latLngs.slice(0, idx1 + 1);
  var segYellow = latLngs.slice(idx1, idx2 + 1);
  var segRed = latLngs.slice(idx2);

  if (segGreen.length > 1) {
    var pGreen = L.polyline(segGreen, { color: "#10b981", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" });
    pGreen.bindPopup("<strong>🟢 Light Traffic (Demo / Sample Data)</strong><br>Connect TomTom API in backend/.env for live speeds.");
    _trafficLayersGroup.addLayer(pGreen);
  }
  if (segYellow.length > 1) {
    var pYellow = L.polyline(segYellow, { color: "#f59e0b", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" });
    pYellow.bindPopup("<strong>🟡 Moderate Traffic (Demo / Sample Data)</strong><br>Connect TomTom API in backend/.env for live speeds.");
    _trafficLayersGroup.addLayer(pYellow);
  }
  if (segRed.length > 1) {
    var pRed = L.polyline(segRed, { color: "#ef4444", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" });
    pRed.bindPopup("<strong>🔴 Heavy Traffic (Demo / Sample Data)</strong><br>Connect TomTom API in backend/.env for live speeds.");
    _trafficLayersGroup.addLayer(pRed);
  }
}

/**
 * Calls Flask backend /api/historical-traffic/match-route to match route coordinates to dataset corridors
 */
async function loadHistoricalTrafficForRoute(latLngs) {
  if (!latLngs || latLngs.length === 0) return;

  var pill = document.getElementById("trafficSourcePill");
  var updatedText = document.getElementById("trafficLastUpdatedText");
  var alertBox = document.getElementById("trafficStatusAlert");
  var alertMsg = document.getElementById("trafficStatusMsg");
  var dispTraffic = document.getElementById("dispTrafficLevel");
  var lineUnmatched = document.getElementById("legendLineUnmatched");

  var sampledPoints = sampleRouteCoordinates(latLngs, 10);
  var ptsPayload = sampledPoints.map(function(p) { return [p.lat, p.lon]; });

  try {
    var resp = await fetch("http://127.0.0.1:5000/api/historical-traffic/match-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: ptsPayload })
    });

    if (!resp.ok) throw new Error("HTTP " + resp.status + " from historical route backend");

    var result = await resp.json();
    if (!result.success || !result.segments) throw new Error("Invalid response format");

    if (pill) {
      pill.className = "traffic-source-pill historical";
      pill.innerHTML = "📊 HISTORICAL DATASET";
    }
    if (updatedText) {
      updatedText.innerHTML = "Telemetry: <strong>Banglore_traffic_Dataset.csv</strong> &bull; 8,936 Records";
    }
    if (alertBox) alertBox.classList.add("hidden");
    if (lineUnmatched) lineUnmatched.style.display = "flex";

    // Overall summary condition
    var matchedSegs = result.segments.filter(function(s) { return !s.unmatched; });
    if (matchedSegs.length > 0) {
      var avgCong = matchedSegs.reduce(function(acc, s) { return acc + s.congestion_level_pct; }, 0) / matchedSegs.length;
      var cond = avgCong >= 80 ? "Heavy" : (avgCong >= 60 ? "Moderate" : "Light");
      if (dispTraffic) {
        dispTraffic.textContent = cond;
        dispTraffic.className = "trio-value " + (cond === "Heavy" ? "text-danger" : cond === "Moderate" ? "text-moderate" : "text-success");
      }
    } else {
      if (dispTraffic) {
        dispTraffic.textContent = "Unmatched";
        dispTraffic.className = "trio-value text-slate";
      }
    }

    // Segment stats breakdown
    if (window.currentRouteData) {
      var totalDist = parseFloat(window.currentRouteData.distanceKm) || 1.0;
      var counts = { Light: 0, Moderate: 0, Heavy: 0, Unmatched: 0 };
      result.segments.forEach(function(s) {
        if (s.unmatched) counts.Unmatched++;
        else if (counts[s.congestion_category] !== undefined) counts[s.congestion_category]++;
      });
      var totalSegs = result.segments.length;
      var hRatio = counts.Heavy / totalSegs;
      var mRatio = counts.Moderate / totalSegs;
      var lRatio = counts.Light / totalSegs;

      var elHKm = document.getElementById("kmHeavy");
      var elMKm = document.getElementById("kmMod");
      var elLKm = document.getElementById("kmLight");
      if (elHKm) elHKm.textContent = (totalDist * hRatio).toFixed(1) + " km";
      if (elMKm) elMKm.textContent = (totalDist * mRatio).toFixed(1) + " km";
      if (elLKm) elLKm.textContent = (totalDist * lRatio).toFixed(1) + " km";

      var bH = document.getElementById("barSegHeavy");
      var bM = document.getElementById("barSegMod");
      var bL = document.getElementById("barSegLight");
      if (bH) { bH.style.width = Math.round(hRatio * 100) + "%"; bH.title = (totalDist * hRatio).toFixed(1) + " km Heavy (Historical Dataset)"; }
      if (bM) { bM.style.width = Math.round(mRatio * 100) + "%"; bM.title = (totalDist * mRatio).toFixed(1) + " km Moderate (Historical Dataset)"; }
      if (bL) { bL.style.width = Math.round(lRatio * 100) + "%"; bL.title = (totalDist * lRatio).toFixed(1) + " km Light (Historical Dataset)"; }
    }

    if (_screenshotMap && _trafficLayersGroup) {
      renderHistoricalRouteTrafficLayers(latLngs, result.segments);
    }
  } catch (err) {
    console.warn("Historical traffic route fetch error:", err);
    if (pill) {
      pill.className = "traffic-source-pill error";
      pill.innerHTML = "⚠️ DATASET UNAVAILABLE";
    }
    if (alertBox && alertMsg) {
      alertBox.className = "traffic-status-banner error";
      alertBox.classList.remove("hidden");
      alertMsg.innerHTML = "<strong>Dataset Error:</strong> Unable to match route with <code>data/Banglore_traffic_Dataset.csv</code>. Check Flask backend.";
    }
  }
}

/**
 * Draws historical traffic colored segments onto the calculated route
 */
function renderHistoricalRouteTrafficLayers(latLngs, segments) {
  if (!_trafficLayersGroup || !latLngs || latLngs.length === 0) return;
  _trafficLayersGroup.clearLayers();

  // Base high-contrast casing line
  var baseCasing = L.polyline(latLngs, {
    color: "#080f1e",
    weight: 10,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  });
  _trafficLayersGroup.addLayer(baseCasing);

  var totalPts = latLngs.length;
  var ptsPerSeg = Math.max(1, Math.floor(totalPts / segments.length));

  for (var sIdx = 0; sIdx < segments.length; sIdx++) {
    var seg = segments[sIdx];
    var startIdx = sIdx * ptsPerSeg;
    var endIdx = (sIdx === segments.length - 1) ? totalPts : (sIdx + 1) * ptsPerSeg + 1;
    var slice = latLngs.slice(startIdx, endIdx);

    if (slice.length > 1) {
      var color = seg.unmatched ? "#64748b" : seg.color;
      var poly = L.polyline(slice, {
        color: color,
        weight: 6,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        dashArray: seg.unmatched ? "6, 6" : null
      });

      var popupHtml = "";
      if (!seg.unmatched) {
        popupHtml =
          '<div class="custom-leaflet-popup" style="font-size:12px; line-height:1.5;">' +
          '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
          '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:' + seg.color + '"></span>' +
          '<strong style="color:' + seg.color + '; font-size:13px;">' + seg.congestion_category + ' Congestion (' + seg.congestion_level_pct + '%)</strong>' +
          '</div>' +
          '<div><b>Matched Corridor:</b> ' + escapeHtml(seg.corridor_name) + '</div>' +
          '<div><b>Historical Avg Speed:</b> ' + seg.average_speed_kmh + ' km/h</div>' +
          '<div><b>Traffic Volume:</b> ' + seg.traffic_volume.toLocaleString() + ' veh/day</div>' +
          '<div style="font-size:10px; color:#60a5fa; margin-top:4px;">📊 Source: Banglore_traffic_Dataset.csv</div>' +
          '</div>';
      } else {
        popupHtml =
          '<div class="custom-leaflet-popup" style="font-size:12px; line-height:1.5;">' +
          '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
          '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#64748b"></span>' +
          '<strong style="color:#94a3b8; font-size:13px;">⚪ Unmatched Road Segment</strong>' +
          '</div>' +
          '<div style="font-size:11px; color:#cbd5e1; margin-top:4px;">' + escapeHtml(seg.message) + '</div>' +
          '<div style="font-size:10px; color:#64748b; margin-top:4px;">Switch to <b>Live (TomTom)</b> to view real-time speeds on this road.</div>' +
          '</div>';
      }

      poly.bindPopup(popupHtml);
      _trafficLayersGroup.addLayer(poly);
    }
  }
}

/**
 * Triggers manual traffic refresh with rate-limit protection
 */
function refreshRouteTraffic() {
  if (currentTrafficDisplayMode === "historical") {
    if (window.currentRouteData && window.currentRouteData.latLngs) {
      loadHistoricalTrafficForRoute(window.currentRouteData.latLngs);
    }
    return;
  }

  if (isTrafficRefreshing) return;
  var now = Date.now();
  var elapsed = now - trafficLastRefreshedAt;
  if (trafficLastRefreshedAt > 0 && elapsed < TRAFFIC_REFRESH_COOLDOWN_MS) {
    var remainingSec = Math.ceil((TRAFFIC_REFRESH_COOLDOWN_MS - elapsed) / 1000);
    var alertBox = document.getElementById("trafficStatusAlert");
    var alertMsg = document.getElementById("trafficStatusMsg");
    if (alertBox && alertMsg) {
      alertBox.classList.remove("hidden");
      alertMsg.innerHTML = "⏳ Please wait " + remainingSec + "s before refreshing again to respect provider API limits.";
      setTimeout(function() { if (alertBox) alertBox.classList.add("hidden"); }, 3000);
    }
    return;
  }

  if (window.currentRouteData && window.currentRouteData.latLngs) {
    isTrafficRefreshing = true;
    loadTomTomTrafficForRoute(window.currentRouteData.latLngs, true);
  }
}

function renderScreenshotMap(routeData, pair) {
  var mapCanvas = document.getElementById("routeMapCanvas");
  if (!mapCanvas || typeof L === "undefined") return;

  setTimeout(function() {
    if (!_screenshotMap) {
      _screenshotMap = L.map("routeMapCanvas", {
        center: [12.9716, 77.5946],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter layer (with Retina high-DPI support)
      darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        detectRetina: true
      }).addTo(_screenshotMap);

      // Esri Satellite layer
      satTileLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18
      });

      _trafficLayersGroup = L.layerGroup().addTo(_screenshotMap);
      _affectedRouteGroup = L.layerGroup().addTo(_screenshotMap);
      _alternativeRouteGroup = L.layerGroup().addTo(_screenshotMap);
      _incidentHighlightGroup = L.layerGroup().addTo(_screenshotMap);
      _incidentLayersGroup = L.layerGroup(); // Disabled marker layer on the map per requirements
      _markersGroup = L.layerGroup().addTo(_screenshotMap);

      // Bind Map Action Buttons
      var bIn  = document.getElementById("btnZoomInRoute");
      var bOut = document.getElementById("btnZoomOutRoute");
      var bFit = document.getElementById("btnRecenterRoute");
      if (bIn)  bIn.onclick = function() { _screenshotMap.zoomIn(); };
      if (bOut) bOut.onclick = function() { _screenshotMap.zoomOut(); };
      if (bFit) bFit.onclick = function() {
        if (_screenshotMap.currentBounds) _screenshotMap.fitBounds(_screenshotMap.currentBounds, { padding: [50, 50] });
      };

      // Satellite View Toggle
      var satBtn = document.getElementById("btnToggleSatellite");
      if (satBtn) {
        satBtn.onclick = function() {
          if (currentMapTheme === "dark") {
            _screenshotMap.removeLayer(darkTileLayer);
            satTileLayer.addTo(_screenshotMap);
            currentMapTheme = "satellite";
            satBtn.innerHTML = '<div class="sat-thumb-img" style="background:#111d38;"></div><span>Dark View</span>';
          } else {
            _screenshotMap.removeLayer(satTileLayer);
            darkTileLayer.addTo(_screenshotMap);
            currentMapTheme = "dark";
            satBtn.innerHTML = '<div class="sat-thumb-img"></div><span>Satellite View</span>';
          }
        };
      }

      // Live Traffic Toggle
      var trafToggle = document.getElementById("toggleLiveTraffic");
      if (trafToggle) {
        trafToggle.onchange = function() {
          routeLiveTrafficEnabled = trafToggle.checked;
          if (routeLiveTrafficEnabled) {
            _screenshotMap.addLayer(_trafficLayersGroup);
          } else {
            _screenshotMap.removeLayer(_trafficLayersGroup);
          }
        };
      }

      // Traffic Mode Switcher: Live (TomTom) vs Historical (Banglore_traffic_Dataset.csv)
      var btnLiveMode = document.getElementById("btnModeLiveTraffic");
      var btnHistMode = document.getElementById("btnModeHistoricalTraffic");
      var lineUnmatched = document.getElementById("legendLineUnmatched");
      var legRed = document.getElementById("legendTextRed");
      var legYel = document.getElementById("legendTextYellow");
      var legGrn = document.getElementById("legendTextGreen");

      if (btnLiveMode) {
        btnLiveMode.onclick = function() {
          currentTrafficDisplayMode = "live";
          btnLiveMode.classList.add("active");
          if (btnHistMode) btnHistMode.classList.remove("active");
          if (lineUnmatched) lineUnmatched.style.display = "none";
          if (legRed) legRed.innerHTML = "Heavy Traffic (&ge; 80% / TomTom &lt; 45%)";
          if (legYel) legYel.innerHTML = "Moderate Traffic (60%–79.9% / 45%–74%)";
          if (legGrn) legGrn.innerHTML = "Light Traffic (&lt; 60% / &ge; 75%)";
          if (window.currentRouteData && window.currentRouteData.latLngs) {
            loadTomTomTrafficForRoute(window.currentRouteData.latLngs);
          }
        };
      }

      if (btnHistMode) {
        btnHistMode.onclick = function() {
          currentTrafficDisplayMode = "historical";
          btnHistMode.classList.add("active");
          if (btnLiveMode) btnLiveMode.classList.remove("active");
          if (lineUnmatched) lineUnmatched.style.display = "flex";
          if (legRed) legRed.innerHTML = "Heavy Congestion (&ge; 80.0%)";
          if (legYel) legYel.innerHTML = "Moderate Congestion (60.0%–79.9%)";
          if (legGrn) legGrn.innerHTML = "Low Congestion (&lt; 60.0%)";
          if (window.currentRouteData && window.currentRouteData.latLngs) {
            loadHistoricalTrafficForRoute(window.currentRouteData.latLngs);
          }
        };
      }
    }

    _trafficLayersGroup.clearLayers();
    if (_affectedRouteGroup) _affectedRouteGroup.clearLayers();
    if (_alternativeRouteGroup) _alternativeRouteGroup.clearLayers();
    if (_incidentHighlightGroup) _incidentHighlightGroup.clearLayers();
    _incidentLayersGroup.clearLayers();
    _markersGroup.clearLayers();

    var latLngs = routeData.latLngs;
    if (!latLngs || latLngs.length === 0) return;

    // 1 & 2. Draw traffic layers according to selected mode (Live TomTom or Historical Dataset)
    if (currentTrafficDisplayMode === "historical") {
      loadHistoricalTrafficForRoute(latLngs);
    } else {
      renderTrafficLayers(latLngs, currentTrafficFlowData);
    }

    // 3. Start Marker (Green Pin)
    var startPt = [routeData.startCoords.lat, routeData.startCoords.lon];
    var startLabel = pair.from ? pair.from.split(",")[0] : "Start";
    var startIcon = L.divIcon({
      className: "custom-pin-start",
      html: '<div style="background:#10b981; color:#fff; font-weight:700; font-size:11px; padding:3px 8px; border-radius:12px; box-shadow:0 0 10px #10b981; white-space:nowrap; display:flex; align-items:center; gap:4px; transform:translate(-50%, -100%);">🟢 ' + escapeHtml(startLabel) + '</div>'
    });
    var mStart = L.marker(startPt, { icon: startIcon });
    mStart.bindPopup("<strong>📍 Start: " + escapeHtml(pair.from) + "</strong>");
    _markersGroup.addLayer(mStart);

    // 4. Destination Marker (Red Pin)
    var endPt = [routeData.destCoords.lat, routeData.destCoords.lon];
    var destLabel = pair.to ? pair.to.split(",")[0] : "Destination";
    var destIcon = L.divIcon({
      className: "custom-pin-dest",
      html: '<div style="background:#ef4444; color:#fff; font-weight:700; font-size:11px; padding:3px 8px; border-radius:12px; box-shadow:0 0 10px #ef4444; white-space:nowrap; display:flex; align-items:center; gap:4px; transform:translate(-50%, -100%);">🔴 ' + escapeHtml(destLabel) + '</div>'
    });
    var mDest = L.marker(endPt, { icon: destIcon });
    mDest.bindPopup("<strong>📍 Destination: " + escapeHtml(pair.to) + "</strong>");
    _markersGroup.addLayer(mDest);

// 6. Auto-fit bounds to the complete road route
    _screenshotMap.currentBounds = L.latLngBounds(latLngs);
    _screenshotMap.fitBounds(_screenshotMap.currentBounds, { padding: [50, 50] });
    _screenshotMap.invalidateSize();
  }, 120);
}

// ============================================================================

// ============================================================================
// 13.75 SMART ACCIDENT DETECTION ALERTS & AUTOMATIC REROUTING
// ============================================================================

/**
 * Checks driver route against active crash reports in the database
 */
async function checkRouteForIncidentAlerts(routeData, pair) {
  _currentRoutePair = pair;
  _originalRouteBackup = {
    distanceKm: routeData.distanceKm,
    durationMins: routeData.durationMins,
    directions: routeData.directions ? routeData.directions.slice() : [],
    latLngs: routeData.latLngs ? routeData.latLngs.slice() : []
  };

  try {
    var resp = await fetch(API_BASE + "/api/routing/detect-incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route_geometry: routeData.latLngs,
        start: { lat: routeData.startCoords.lat, lon: routeData.startCoords.lon },
        destination: { lat: routeData.destCoords.lat, lon: routeData.destCoords.lon },
        max_age_hours: 48
      })
    });

    if (resp.ok) {
      var data = await resp.json();
      handleIncidentDetectionResult(data, routeData, pair, false);
    }
  } catch (err) {
    console.warn("Incident detection request failed:", err);
  }

  // Periodic polling every 30s while route is active
  startIncidentPolling(routeData, pair);
}

/**
 * Handles incident detection response and populates the compact alert bar,
 * drawer, and route overview comparison cards.
 */
function handleIncidentDetectionResult(data, routeData, pair, isPollUpdate) {
  var compactAlert = document.getElementById("compactAccidentAlert");
  var drawer = document.getElementById("incidentDetailDrawer");
  var cardOrig = document.getElementById("routeCardOriginal");
  var cardAlt = document.getElementById("routeCardAlternative");
  var activeTag = document.getElementById("overviewActiveTag");
  var btnUseAlt = document.getElementById("btnUseAlternateRoute");
  var rerouteAdvisory = document.getElementById("rerouteAdvisoryText");
  var rcAltDist = document.getElementById("rcAltDist");
  var rcAltEta = document.getElementById("rcAltEta");
  var rcAltSaving = document.getElementById("rcAltSavingText");

  if (!data || !data.has_incident || !data.primary_incident) {
    if (compactAlert) compactAlert.classList.add("hidden");
    if (drawer) drawer.classList.add("hidden");
    if (cardOrig) cardOrig.classList.add("active-card");
    if (cardAlt) cardAlt.classList.remove("active-card");
    if (activeTag) {
      activeTag.textContent = "Original Active";
      activeTag.className = "overview-active-tag tag-primary";
    }
    if (rcAltDist) rcAltDist.textContent = "No detour";
    if (rcAltEta) rcAltEta.textContent = "N/A";
    if (rcAltSaving) {
      rcAltSaving.textContent = "No active incidents on route";
      rcAltSaving.className = "rc-saving-text text-slate";
    }
    if (rerouteAdvisory) {
      rerouteAdvisory.textContent = "Planned corridor is clear of active accident reports. Original route is optimal.";
    }
    if (btnUseAlt) {
      btnUseAlt.disabled = true;
      btnUseAlt.classList.add("disabled");
    }
    if (_affectedRouteGroup) _affectedRouteGroup.clearLayers();
    if (_alternativeRouteGroup) _alternativeRouteGroup.clearLayers();
    if (_incidentHighlightGroup) _incidentHighlightGroup.clearLayers();
    return;
  }

  _activeIncidentDetectionData = data;
  var inc = data.primary_incident;
  var reroute = data.reroute || {};

  // 1. Populate Compact Accident Alert Bar Above Map
  var badgeEl = document.getElementById("compactAlertBadge");
  var locEl = document.getElementById("compactAlertLoc");
  var timeEl = document.getElementById("compactAlertTime");
  var statusEl = document.getElementById("compactAlertStatus");
  var trafficEl = document.getElementById("compactAlertTraffic");

  if (badgeEl) {
    badgeEl.textContent = inc.crash_type || "Accident";
  }

  if (locEl) {
    var distStr = (inc.distance_from_route_m != null) ? " (" + inc.distance_from_route_m + "m from route)" : "";
    locEl.textContent = (inc.location || "Monitored Road Corridor") + distStr;
  }

  if (timeEl) {
    var repTime = inc.report_time || inc.created_at || "Recently";
    timeEl.textContent = "Reported " + repTime;
  }

  if (statusEl) {
    if (inc.is_verified) {
      statusEl.className = "alert-status-badge badge-verified";
      statusEl.textContent = "Verified Official Incident";
    } else {
      statusEl.className = "alert-status-badge badge-unverified";
      statusEl.textContent = "Reported • Pending Verification";
    }
  }

  if (trafficEl) {
    var tfText = (data.traffic_impact && data.traffic_impact.description) ?
      data.traffic_impact.description :
      (data.traffic_impact && data.traffic_impact.delay_mins > 0 ? "Traffic delay ~" + Math.round(data.traffic_impact.delay_mins) + " mins" : "Traffic flow: Moderate impact");
    trafficEl.textContent = tfText;
  }

  if (compactAlert) {
    compactAlert.classList.remove("hidden");
  }

  // 2. Populate Expandable Detail Drawer
  var drawerType = document.getElementById("drawerIncidentType");
  var drawerSev = document.getElementById("drawerSeverity");
  var drawerRoad = document.getElementById("drawerRoadCondition");
  var drawerDist = document.getElementById("drawerDistance");
  var drawerDesc = document.getElementById("drawerDescription");

  if (drawerType) drawerType.textContent = inc.crash_type || "Vehicle Incident";
  if (drawerSev) {
    var sevText = (inc.severity || "Moderate") + " Severity";
    drawerSev.textContent = sevText;
    var sevLower = (inc.severity || "").toLowerCase();
    drawerSev.className = "cell-val " + (sevLower.includes("high") ? "text-red" : sevLower.includes("low") ? "text-green" : "text-yellow");
  }
  if (drawerRoad) drawerRoad.textContent = inc.weather_road_condition || inc.road_condition || "Normal Surface";
  if (drawerDist) {
    drawerDist.textContent = (inc.distance_from_route_m != null) ?
      inc.distance_from_route_m + " meters from planned route" :
      "Within affected corridor";
  }
  if (drawerDesc) {
    var reporter = inc.user_id ? " • Reported by User #" + inc.user_id : "";
    drawerDesc.textContent = (inc.description || "Active incident reported along road corridor.") + reporter;
  }

  // 3. Populate Route Overview Comparison Panel
  var oDist = data.original_route ? data.original_route.distance_km : routeData.distanceKm;
  var oDur = data.original_route ? data.original_route.duration_mins : routeData.durationMins;
  var rcOrigDist = document.getElementById("rcOrigDist");
  var rcOrigEta = document.getElementById("rcOrigEta");
  var rcOrigTrafficText = document.getElementById("rcOrigTrafficText");
  if (rcOrigDist) rcOrigDist.textContent = oDist + " km";
  if (rcOrigEta) rcOrigEta.textContent = oDur + " mins";
  if (rcOrigTrafficText) rcOrigTrafficText.textContent = (routeData.trafficCondition || "Moderate") + " Traffic";

  if (reroute.has_alternative) {
    if (rcAltDist) rcAltDist.textContent = reroute.distance_km + " km";
    if (rcAltEta) rcAltEta.textContent = reroute.duration_mins + " mins";
    if (rcAltSaving) {
      if (reroute.time_saved_mins > 0) {
        rcAltSaving.textContent = "⚡ Save ~" + Math.round(reroute.time_saved_mins) + " mins";
        rcAltSaving.className = "rc-saving-text text-emerald";
      } else {
        var extra = Math.round(reroute.duration_mins - oDur);
        rcAltSaving.textContent = extra > 0 ? "Detour adds +" + extra + " mins" : "Similar ETA (0 min diff)";
        rcAltSaving.className = "rc-saving-text text-slate";
      }
    }
    if (rerouteAdvisory) {
      rerouteAdvisory.textContent = reroute.reason || "Alternative bypass route available avoiding affected road segment.";
    }
    if (btnUseAlt) {
      btnUseAlt.disabled = false;
      btnUseAlt.classList.remove("disabled");
    }
  } else {
    if (rcAltDist) rcAltDist.textContent = "No detour";
    if (rcAltEta) rcAltEta.textContent = "N/A";
    if (rcAltSaving) {
      rcAltSaving.textContent = "No alternative bypass";
      rcAltSaving.className = "rc-saving-text text-slate";
    }
    if (rerouteAdvisory) {
      rerouteAdvisory.textContent = reroute.reason || "No beneficial alternative bypass found. Drive cautiously through incident zone.";
    }
    if (btnUseAlt) {
      btnUseAlt.disabled = true;
      btnUseAlt.classList.add("disabled");
    }
  }

  // 4. Map Visuals: Affected Segment & Alternative Detour Polyline
  if (_affectedRouteGroup && data.affected_segment && data.affected_segment.geometry && data.affected_segment.geometry.length > 0) {
    _affectedRouteGroup.clearLayers();
    var affPoly = L.polyline(data.affected_segment.geometry, {
      color: "#f43f5e",
      weight: 8,
      opacity: 0.92,
      dashArray: "4, 6"
    });
    _affectedRouteGroup.addLayer(affPoly);
  }

  if (_alternativeRouteGroup && reroute.has_alternative && reroute.geometry && reroute.geometry.length > 0) {
    _alternativeRouteGroup.clearLayers();
    if (!_isAlternativeRouteActive) {
      var altPoly = L.polyline(reroute.geometry, {
        color: "#06b6d4",
        weight: 5,
        opacity: 0.85,
        dashArray: "8, 10"
      });
      altPoly.bindPopup("<strong>Alternative Bypass Route</strong><br>" + reroute.distance_km + " km • " + reroute.duration_mins + " mins");
      _alternativeRouteGroup.addLayer(altPoly);
    }
  }

  // In-app toast notification for newly detected incident
  if (isPollUpdate && !_alertedIncidentIds.has(inc.report_id)) {
    _alertedIncidentIds.add(inc.report_id);
    showNewIncidentToast(inc);
  } else {
    _alertedIncidentIds.add(inc.report_id);
  }

  // Bind interactive actions
  bindIncidentAlertActions(data, routeData, pair);
}

/**
 * Binds click events to the compact alert bar, drawer, and route comparison cards
 */
function bindIncidentAlertActions(data, routeData, pair) {
  var compactAlert = document.getElementById("compactAccidentAlert");
  var drawer = document.getElementById("incidentDetailDrawer");
  var btnToggle = document.getElementById("btnToggleIncidentDetails");
  var btnDismiss = document.getElementById("btnDismissCompactAlert");
  var btnFocus = document.getElementById("btnFocusIncidentOnMap");
  var btnUseAlt = document.getElementById("btnUseAlternateRoute");
  var btnKeepCurrent = document.getElementById("btnKeepCurrentRoute");
  var cardOrig = document.getElementById("routeCardOriginal");
  var cardAlt = document.getElementById("routeCardAlternative");
  var activeTag = document.getElementById("overviewActiveTag");

  var inc = data.primary_incident;
  var reroute = data.reroute || {};

  // 1. Toggle Incident Detail Drawer
  if (btnToggle) {
    btnToggle.onclick = function() {
      if (!drawer) return;
      var isHidden = drawer.classList.toggle("hidden");
      var chevron = document.getElementById("detailsChevron");
      if (chevron) chevron.textContent = isHidden ? "▼" : "▲";
      btnToggle.classList.toggle("active-open", !isHidden);
    };
  }

  // 2. Dismiss Compact Alert
  if (btnDismiss) {
    btnDismiss.onclick = function() {
      if (compactAlert) compactAlert.classList.add("hidden");
      if (drawer) drawer.classList.add("hidden");
    };
  }

  // 3. Focus Incident on Map (Circular marker, NO red triangle)
  if (btnFocus) {
    btnFocus.onclick = function() {
      if (!_screenshotMap || !inc) return;
      _screenshotMap.setView([inc.latitude, inc.longitude], 15);
      if (_incidentHighlightGroup) {
        _incidentHighlightGroup.clearLayers();
        var circle = L.circleMarker([inc.latitude, inc.longitude], {
          radius: 11,
          fillColor: "#ea580c",
          color: "#ffffff",
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        });
        var popContent = '<div class="custom-leaflet-popup">' +
          '<h4 class="popup-title" style="color:#ea580c; margin:0 0 6px 0;">Incident Report</h4>' +
          '<div class="popup-row"><strong>' + escapeHtml(inc.location) + '</strong></div>' +
          '<div class="popup-row">Type: ' + escapeHtml(inc.crash_type) + '</div>' +
          '<div class="popup-row">Severity: ' + escapeHtml(inc.severity) + '</div>' +
          '<div class="popup-row">Status: <strong>' + escapeHtml(inc.status) + '</strong></div>' +
          '<span class="popup-tag" style="background:#fff7ed;color:#c2410c;border:1px solid #ffedd5;margin-top:6px;display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;">' +
          escapeHtml(inc.verification_badge) + '</span>' +
          '</div>';
        circle.bindPopup(popContent).openPopup();
        _incidentHighlightGroup.addLayer(circle);
      }
    };
  }

  // 4. Switch to Alternative Route
  var switchToAltFn = function() {
    if (!reroute.has_alternative || !reroute.geometry || reroute.geometry.length === 0) return;
    _isAlternativeRouteActive = true;

    if (cardOrig) cardOrig.classList.remove("active-card");
    if (cardAlt) cardAlt.classList.add("active-card");
    if (activeTag) {
      activeTag.textContent = "Alternative Active";
      activeTag.className = "overview-active-tag tag-cyan";
    }

    var dispDist = document.getElementById("dispDistance");
    var dispETA = document.getElementById("dispETA");
    var dispTraffic = document.getElementById("dispTrafficLevel");
    if (dispDist) dispDist.textContent = reroute.distance_km + " km";
    if (dispETA) dispETA.textContent = reroute.duration_mins + " mins";
    if (dispTraffic) {
      dispTraffic.textContent = "Detour (Active)";
      dispTraffic.className = "trio-value text-cyan";
    }

    if (_trafficLayersGroup && _alternativeRouteGroup) {
      _trafficLayersGroup.clearLayers();
      _alternativeRouteGroup.clearLayers();

      // Solid cyan alternative route
      var solidAlt = L.polyline(reroute.geometry, {
        color: "#06b6d4",
        weight: 6,
        opacity: 0.95
      });
      _trafficLayersGroup.addLayer(solidAlt);

      // Faded original route
      if (window.currentRouteData && window.currentRouteData.latLngs) {
        var fadedOrig = L.polyline(window.currentRouteData.latLngs, {
          color: "#64748b",
          weight: 4,
          opacity: 0.65,
          dashArray: "6, 8"
        });
        fadedOrig.bindPopup("Original Route: " + (data.original_route ? data.original_route.distance_km : routeData.distanceKm) + " km • Incident affected corridor");
        _alternativeRouteGroup.addLayer(fadedOrig);
      }

      if (_screenshotMap) {
        _screenshotMap.fitBounds(L.latLngBounds(reroute.geometry), { padding: [50, 50] });
      }
    }
  };

  // 5. Revert to Original Route
  var revertToOrigFn = function() {
    _isAlternativeRouteActive = false;

    if (cardOrig) cardOrig.classList.add("active-card");
    if (cardAlt) cardAlt.classList.remove("active-card");
    if (activeTag) {
      activeTag.textContent = "Original Active";
      activeTag.className = "overview-active-tag tag-primary";
    }

    var dispDist = document.getElementById("dispDistance");
    var dispETA = document.getElementById("dispETA");
    var dispTraffic = document.getElementById("dispTrafficLevel");
    if (dispDist) dispDist.textContent = routeData.distanceKm + " km";
    if (dispETA) dispETA.textContent = routeData.durationMins + " mins";
    if (dispTraffic) {
      dispTraffic.textContent = routeData.trafficCondition || "Moderate";
      dispTraffic.className = "trio-value " + (routeData.trafficCondition === "Heavy" ? "text-danger" : routeData.trafficCondition === "Moderate" ? "text-moderate" : "text-success");
    }

    if (_trafficLayersGroup && _alternativeRouteGroup && window.currentRouteData && window.currentRouteData.latLngs) {
      _trafficLayersGroup.clearLayers();
      _alternativeRouteGroup.clearLayers();

      renderTrafficLayers(window.currentRouteData.latLngs, currentTrafficFlowData);

      if (reroute.has_alternative && reroute.geometry && reroute.geometry.length > 0) {
        var altPoly = L.polyline(reroute.geometry, {
          color: "#06b6d4",
          weight: 5,
          opacity: 0.85,
          dashArray: "8, 10"
        });
        altPoly.bindPopup("<strong>Alternative Bypass Route</strong><br>" + reroute.distance_km + " km • " + reroute.duration_mins + " mins");
        _alternativeRouteGroup.addLayer(altPoly);
      }

      if (_screenshotMap) {
        _screenshotMap.fitBounds(L.latLngBounds(window.currentRouteData.latLngs), { padding: [50, 50] });
      }
    }
  };

  if (btnUseAlt) btnUseAlt.onclick = switchToAltFn;
  if (btnKeepCurrent) btnKeepCurrent.onclick = revertToOrigFn;
  if (cardAlt) cardAlt.onclick = switchToAltFn;
  if (cardOrig) cardOrig.onclick = revertToOrigFn;
}

/**
 * Shows an in-app toast notification for newly detected incident
 */
function showNewIncidentToast(inc) {
  var toast = document.getElementById("newIncidentToastAlert");
  var toastText = document.getElementById("toastIncidentText");
  if (!toast || !toastText) return;

  toastText.textContent = (inc.crash_type || "Incident") + " near " + (inc.location || "route") + " (" + inc.status + ")";
  toast.classList.remove("hidden");
  setTimeout(function() {
    toast.classList.add("hidden");
  }, 7000);
}

/**
 * Starts periodic incident polling every 30 seconds
 */
function startIncidentPolling(routeData, pair) {
  stopIncidentPolling();
  _incidentPollTimer = setInterval(async function() {
    if (!window.currentRouteData || !window.currentRouteData.latLngs) {
      stopIncidentPolling();
      return;
    }
    try {
      var resp = await fetch(API_BASE + "/api/routing/detect-incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_geometry: window.currentRouteData.latLngs,
          start: { lat: routeData.startCoords.lat, lon: routeData.startCoords.lon },
          destination: { lat: routeData.destCoords.lat, lon: routeData.destCoords.lon },
          max_age_hours: 48
        })
      });
      if (resp.ok) {
        var data = await resp.json();
        handleIncidentDetectionResult(data, routeData, pair, true);
      }
    } catch (e) {
      console.warn("Periodic incident poll error:", e);
    }
  }, 30000);
}

/**
 * Stops periodic incident polling
 */
function stopIncidentPolling() {
  if (_incidentPollTimer) {
    clearInterval(_incidentPollTimer);
    _incidentPollTimer = null;
  }
}

// 13.8 GOOGLE MAPS PLATFORM DUAL ENGINE INTEGRATION
// ============================================================================

var activeMapEngine = "leaflet"; // "leaflet" | "google"
var googleMapsApiConfigured = false;
var googleMapsApiLoaded = false;
var googleMapsDirectionsSupported = null; // null | true | false
var googleMapInstance = null;
var googleDirectionsService = null;
var googleDirectionsRenderer = null;
var googleTrafficLayer = null;
var googleIncidentMarkers = [];

function showMapsEngineNotice(msg, type) {
  var banner = document.getElementById("mapsEngineNoticeBanner");
  var text = document.getElementById("mapsEngineNoticeText");
  var icon = document.getElementById("mapsEngineNoticeIcon");
  var title = document.getElementById("mapsEngineNoticeTitle");
  if (!banner || !text) return;

  text.textContent = msg;
  banner.className = "engine-notice-banner notice-" + (type || "info");
  if (icon) icon.textContent = type === "danger" ? "❌" : type === "warning" ? "⚠️" : "ℹ️";
  if (title) title.textContent = type === "danger" ? "Authentication Notice" : type === "warning" ? "Directions Capability Notice" : "Google Maps Engine Info";
  banner.classList.remove("hidden");
}

function switchToLeafletEngine() {
  activeMapEngine = "leaflet";
  var btnLeaf = document.getElementById("btnEngineLeaflet");
  var btnGgl = document.getElementById("btnEngineGoogle");
  if (btnLeaf) btnLeaf.classList.add("active");
  if (btnGgl) btnGgl.classList.remove("active");

  var lCanvas = document.getElementById("routeMapCanvas");
  var gCanvas = document.getElementById("googleMapCanvas");
  if (lCanvas) lCanvas.classList.remove("hidden");
  if (gCanvas) gCanvas.classList.add("hidden");

  if (_screenshotMap) {
    setTimeout(function() {
      _screenshotMap.invalidateSize();
      if (_screenshotMap.currentBounds) {
        _screenshotMap.fitBounds(_screenshotMap.currentBounds, { padding: [50, 50] });
      }
    }, 100);
  }
}

async function switchToGoogleEngine() {
  if (!googleMapsApiConfigured) {
    showMapsEngineNotice("Google Maps API key is not configured in backend/.env. Please add GOOGLE_MAPS_API_KEY=YOUR_KEY in backend/.env.", "warning");
    var keyModal = document.getElementById("googleKeyModal");
    if (keyModal) keyModal.classList.remove("hidden");
    return;
  }
  if (!googleMapsApiLoaded) {
    showMapsEngineNotice("Google Maps library is still loading. Please wait a moment...", "info");
    return;
  }

  activeMapEngine = "google";
  var btnLeaf = document.getElementById("btnEngineLeaflet");
  var btnGgl = document.getElementById("btnEngineGoogle");
  if (btnGgl) btnGgl.classList.add("active");
  if (btnLeaf) btnLeaf.classList.remove("active");

  var lCanvas = document.getElementById("routeMapCanvas");
  var gCanvas = document.getElementById("googleMapCanvas");
  if (gCanvas) gCanvas.classList.remove("hidden");
  if (lCanvas) lCanvas.classList.add("hidden");

  if (window.currentRoutePair && fromLocation && fromLocation.lat && toLocation && toLocation.lat) {
    try {
      var gRoute = await calculateGoogleRoute(
        { lat: fromLocation.lat, lon: fromLocation.lon, text: fromLocation.text },
        { lat: toLocation.lat, lon: toLocation.lon, text: toLocation.text }
      );
      window.currentRouteData = gRoute;
      displayRoute(gRoute, window.currentRoutePair);
    } catch (err) {
      console.warn("Could not calculate Google route:", err);
      showMapsEngineNotice("Google Directions API returned an error (" + err.message + "). Displaying route on Leaflet + OSRM.", "warning");
      switchToLeafletEngine();
    }
  } else {
    if (!googleMapInstance && gCanvas) {
      googleMapInstance = new google.maps.Map(gCanvas, {
        center: { lat: 12.9716, lng: 77.5946 },
        zoom: 12
      });
    }
    if (googleMapInstance) {
      google.maps.event.trigger(googleMapInstance, "resize");
    }
  }
}

function calculateGoogleRoute(startCoords, destCoords) {
  return new Promise(function(resolve, reject) {
    if (typeof google === "undefined" || !google.maps || !google.maps.DirectionsService) {
      return reject(new Error("Google Maps DirectionsService not available"));
    }
    if (!googleDirectionsService) {
      googleDirectionsService = new google.maps.DirectionsService();
    }
    var req = {
      origin: new google.maps.LatLng(startCoords.lat, startCoords.lon),
      destination: new google.maps.LatLng(destCoords.lat, destCoords.lon),
      travelMode: google.maps.TravelMode.DRIVING
    };

    googleDirectionsService.route(req, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        googleMapsDirectionsSupported = true;
        var route = response.routes[0];
        var leg = route.legs[0];
        var distanceKm = (leg.distance.value / 1000).toFixed(1);
        var durationMins = Math.max(1, Math.round(leg.duration.value / 60));

        var directions = leg.steps.map(function(s, idx) {
          var cleanText = s.instructions.replace(/<[^>]*>?/gm, " ");
          var icon = "↑";
          var bulletClass = "bullet-arrow";
          if (idx === 0) {
            icon = "🟢"; bulletClass = "bullet-green";
          } else if (idx === leg.steps.length - 1) {
            icon = "🔴"; bulletClass = "bullet-red";
          }
          return {
            icon: icon,
            text: cleanText,
            dist: s.distance ? s.distance.text : "",
            bulletClass: bulletClass
          };
        });

        var latLngs = [];
        route.overview_path.forEach(function(pt) {
          latLngs.push([pt.lat(), pt.lng()]);
        });

        resolve({
          distanceKm: distanceKm,
          durationMins: durationMins,
          trafficCondition: "Normal",
          heavyKm: "0.0 km",
          modKm: "0.0 km",
          lightKm: distanceKm + " km",
          directions: directions,
          latLngs: latLngs,
          startCoords: startCoords,
          destCoords: destCoords,
          googleDirectionsResult: response,
          engine: "google"
        });
      } else {
        googleMapsDirectionsSupported = false;
        reject(new Error("Google Directions failed with status: " + status));
      }
    });
  });
}

function renderGoogleRoadMap(routeData, pair) {
  var gCanvas = document.getElementById("googleMapCanvas");
  var lCanvas = document.getElementById("routeMapCanvas");
  if (!gCanvas) return;

  if (lCanvas) lCanvas.classList.add("hidden");
  gCanvas.classList.remove("hidden");

  if (!googleMapInstance) {
    googleMapInstance = new google.maps.Map(gCanvas, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
  }

  if (!googleDirectionsRenderer) {
    googleDirectionsRenderer = new google.maps.DirectionsRenderer({
      map: googleMapInstance,
      suppressMarkers: false
    });
  } else {
    googleDirectionsRenderer.setMap(googleMapInstance);
  }

  if (routeData.googleDirectionsResult) {
    googleDirectionsRenderer.setDirections(routeData.googleDirectionsResult);
  }

  // Google real-time TrafficLayer
  if (!googleTrafficLayer) {
    googleTrafficLayer = new google.maps.TrafficLayer();
  }
  var toggleTraffic = document.getElementById("toggleLiveTraffic");
  if (toggleTraffic && toggleTraffic.checked) {
    googleTrafficLayer.setMap(googleMapInstance);
  } else {
    googleTrafficLayer.setMap(null);
  }

  setTimeout(function() {
    google.maps.event.trigger(googleMapInstance, "resize");
  }, 100);

  renderGoogleIncidents();
}

function renderGoogleIncidents() {
  if (!googleMapInstance) return;
  googleIncidentMarkers.forEach(function(m) { m.setMap(null); });
  googleIncidentMarkers = [];
}

async function initGoogleMapsIntegration() {
  var badge = document.getElementById("gmapsStatusBadge");
  var modalKeyBadge = document.getElementById("modalKeyStatusBadge");
  var modalDirBadge = document.getElementById("modalDirectionsStatusBadge");

  window.gm_authFailure = function() {
    googleMapsDirectionsSupported = false;
    if (badge) {
      badge.textContent = "Auth Failed";
      badge.className = "engine-badge badge-danger";
    }
    if (modalKeyBadge) {
      modalKeyBadge.textContent = "Rejected (gm_authFailure)";
      modalKeyBadge.className = "engine-badge badge-danger";
    }
    showMapsEngineNotice("Google Maps authentication rejected your Demo Key (gm_authFailure). Active engine: Leaflet (OSRM Free).", "danger");
    switchToLeafletEngine();
  };

  try {
    var resp = await fetch("http://127.0.0.1:5000/api/config/maps");
    if (!resp.ok) return;
    var data = await resp.json();

    if (data.google_maps_configured && data.script_url) {
      googleMapsApiConfigured = true;
      if (badge) {
        badge.textContent = "Ready";
        badge.className = "engine-badge badge-success";
      }
      if (modalKeyBadge) {
        modalKeyBadge.textContent = "Configured in backend/.env";
        modalKeyBadge.className = "engine-badge badge-success";
      }

      window.onGoogleMapsGlobalLoaded = function() {
        googleMapsApiLoaded = true;
        if (typeof google !== "undefined" && google.maps && google.maps.DirectionsService) {
          var ds = new google.maps.DirectionsService();
          ds.route({
            origin: { lat: 12.9767, lng: 77.5713 },
            destination: { lat: 12.9756, lng: 77.6066 },
            travelMode: google.maps.TravelMode.DRIVING
          }, function(res, status) {
            if (status === google.maps.DirectionsStatus.OK) {
              googleMapsDirectionsSupported = true;
              if (modalDirBadge) {
                modalDirBadge.textContent = "Supported (OK)";
                modalDirBadge.className = "engine-badge badge-success";
              }
            } else {
              googleMapsDirectionsSupported = false;
              if (modalDirBadge) {
                modalDirBadge.textContent = "Restricted (" + status + ")";
                modalDirBadge.className = "engine-badge badge-warning";
              }
            }
          });
        }
      };

      var script = document.createElement("script");
      script.id = "googleMapsGlobalScript";
      var fullUrl = data.script_url.startsWith("http") ? data.script_url : ("http://127.0.0.1:5000" + data.script_url);
      script.src = fullUrl + (fullUrl.includes("?") ? "&" : "?") + "callback=onGoogleMapsGlobalLoaded";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

    } else {
      googleMapsApiConfigured = false;
      if (badge) {
        badge.textContent = "No Key in .env";
        badge.className = "engine-badge badge-neutral";
      }
      if (modalKeyBadge) {
        modalKeyBadge.textContent = "Not Set in backend/.env";
        modalKeyBadge.className = "engine-badge badge-neutral";
      }
      if (modalDirBadge) {
        modalDirBadge.textContent = "Awaiting Key";
        modalDirBadge.className = "engine-badge badge-neutral";
      }
    }
  } catch (err) {
    console.warn("Unable to check Google Maps config:", err);
  }
}

function initMapEngineControls() {
  var btnLeaf = document.getElementById("btnEngineLeaflet");
  var btnGgl = document.getElementById("btnEngineGoogle");
  var btnNoticeDismiss = document.getElementById("btnDismissMapsNotice");
  var btnOpenModal = document.getElementById("btnOpenGoogleKeyModal");
  var btnCloseModal = document.getElementById("btnCloseGoogleKeyModal");
  var btnCloseModalBottom = document.getElementById("btnCloseGoogleKeyModalBottom");
  var keyModal = document.getElementById("googleKeyModal");

  if (btnLeaf) btnLeaf.addEventListener("click", switchToLeafletEngine);
  if (btnGgl) btnGgl.addEventListener("click", switchToGoogleEngine);
  if (btnNoticeDismiss) {
    btnNoticeDismiss.addEventListener("click", function() {
      var banner = document.getElementById("mapsEngineNoticeBanner");
      if (banner) banner.classList.add("hidden");
    });
  }

  if (btnOpenModal && keyModal) {
    btnOpenModal.addEventListener("click", function() {
      keyModal.classList.remove("hidden");
    });
  }
  if (btnCloseModal && keyModal) {
    btnCloseModal.addEventListener("click", function() {
      keyModal.classList.add("hidden");
    });
  }
  if (btnCloseModalBottom && keyModal) {
    btnCloseModalBottom.addEventListener("click", function() {
      keyModal.classList.add("hidden");
    });
  }
}

/**
 * Unified execution for route calculation with validation and loading states
 */
async function executeRouteSearch(fromStr, toStr, formType) {
  var errHome = document.getElementById("routeSearchErrorAlert");
  var errHomeMsg = document.getElementById("routeSearchErrorMsg");
  var errStrip = document.getElementById("routeStripErrorAlert");
  var errStripMsg = document.getElementById("routeStripErrorMsg");

  var showError = function(msg) {
    if (errHome && errHomeMsg) {
      errHomeMsg.textContent = msg;
      errHome.classList.remove("hidden");
    }
    if (errStrip && errStripMsg) {
      errStripMsg.textContent = msg;
      errStrip.classList.remove("hidden");
    }
  };

  var clearError = function() {
    if (errHome) errHome.classList.add("hidden");
    if (errStrip) errStrip.classList.add("hidden");
  };

  clearError();

  var fVal = (fromStr || "").trim();
  var tVal = (toStr || "").trim();

  // CASE 1: Empty From
  if (!fVal) {
    showError("Please enter a starting location.");
    var iFrom = document.getElementById("inputRouteFrom") || document.getElementById("routeStripFrom");
    if (iFrom) iFrom.focus();
    return;
  }

  // CASE 2: Empty To
  if (!tVal) {
    showError("Please enter a destination.");
    var iTo = document.getElementById("inputRouteTo") || document.getElementById("routeStripTo");
    if (iTo) iTo.focus();
    return;
  }

  if (isCalculatingRoute) return;
  isCalculatingRoute = true;

  // Loading state helper
  var btnHome = document.getElementById("btnSubmitRouteSearch");
  var btnStrip = document.getElementById("btnSubmitStripSearch");

  var setButtonState = function(loading, text) {
    [btnHome, btnStrip].forEach(function(btn) {
      if (!btn) return;
      btn.disabled = loading;
      var textSpan = btn.querySelector(".btn-search-text");
      if (textSpan) {
        textSpan.innerHTML = loading ? '<span class="btn-spinner"></span> ' + text : text;
      }
    });
  };

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Resolve Starting Location (GPS bypass vs Manual Geocoding)
    // ------------------------------------------------------------------------
    var isFromGps = false;
    if (fromLocation && fromLocation.source === "gps" && fromLocation.lat !== null && fromLocation.lon !== null) {
      // User obtained From via GPS ("Use My Location" or "Current Location")
      if (fVal === fromLocation.text || fVal.toLowerCase() === "current location" || fVal.toLowerCase() === "my location") {
        isFromGps = true;
      }
    }

    if (isFromGps) {
      // DO NOT call forward geocoder! Use stored GPS coordinates directly.
      fromLocation.text = fVal;
    } else {
      setButtonState(true, "Finding starting location...");
      var geocodedFrom = await getCoordinates(fVal);
      if (!geocodedFrom || geocodedFrom.lat == null || geocodedFrom.lon == null) {
        showError("Location not found for '" + fVal + "'. Please enter a more specific location.");
        setButtonState(false, "Search Route");
        isCalculatingRoute = false;
        return;
      }
      fromLocation = {
        text: fVal,
        lat: geocodedFrom.lat,
        lon: geocodedFrom.lon,
        source: "geocoding"
      };
    }

    // ------------------------------------------------------------------------
    // STEP 2: Resolve Destination Location
    // ------------------------------------------------------------------------
    var isToGps = false;
    if (toLocation && toLocation.source === "gps" && toLocation.lat !== null && toLocation.lon !== null) {
      if (tVal === toLocation.text || tVal.toLowerCase() === "current location" || tVal.toLowerCase() === "my location") {
        isToGps = true;
      }
    }

    if (isToGps) {
      toLocation.text = tVal;
    } else {
      setButtonState(true, "Finding destination...");
      var geocodedTo = await getCoordinates(tVal);
      if (!geocodedTo || geocodedTo.lat == null || geocodedTo.lon == null) {
        showError("Location not found for '" + tVal + "'. Please enter a more specific location.");
        setButtonState(false, "Search Route");
        isCalculatingRoute = false;
        return;
      }
      toLocation = {
        text: tVal,
        lat: geocodedTo.lat,
        lon: geocodedTo.lon,
        source: "geocoding"
      };
    }

    // ------------------------------------------------------------------------
    // STEP 3: Coordinate Validation
    // ------------------------------------------------------------------------
    if (fromLocation.lat === null || fromLocation.lon === null) {
      showError("Please select a valid starting location.");
      setButtonState(false, "Search Route");
      isCalculatingRoute = false;
      return;
    }

    if (toLocation.lat === null || toLocation.lon === null) {
      showError("Please select a valid destination.");
      setButtonState(false, "Search Route");
      isCalculatingRoute = false;
      return;
    }

    // ------------------------------------------------------------------------
    // STEP 4: Routing via OSRM using coordinates directly
    // ------------------------------------------------------------------------
    setButtonState(true, "Calculating route...");
    var startCoords = {
      lat: fromLocation.lat,
      lon: fromLocation.lon,
      userLabel: fromLocation.text,
      displayName: fromLocation.text,
      source: fromLocation.source
    };
    var destCoords = {
      lat: toLocation.lat,
      lon: toLocation.lon,
      userLabel: toLocation.text,
      displayName: toLocation.text,
      source: toLocation.source
    };

    var routeData = null;
    if (activeMapEngine === "google" && googleMapsApiLoaded && googleMapsDirectionsSupported !== false) {
      try {
        routeData = await calculateGoogleRoute(startCoords, destCoords);
      } catch (gErr) {
        console.warn("Google Maps route calculation failed:", gErr);
        showMapsEngineNotice("Google Directions API returned an error (" + gErr.message + "). Seamlessly falling back to Leaflet + OSRM routing.", "warning");
        switchToLeafletEngine();
        routeData = await calculateRoadRoute(startCoords, destCoords);
      }
    } else {
      routeData = await calculateRoadRoute(startCoords, destCoords);
    }

    window.currentRouteData = routeData;
    window.currentRoutePair = { from: fromLocation.text, to: toLocation.text };

    // STEP 5: Navigate to Route Page
    clearError();
    navigateToPage("route");
    displayRoute(routeData, window.currentRoutePair);

  } catch (err) {
    console.error("Route calculation error:", err);
    showError("Unable to calculate the route right now. Please try again.");
  } finally {
    setButtonState(false, "Search Route");
    isCalculatingRoute = false;
  }
}

/**
 * Initialize search event listeners on both Home and Route pages
 */
function initScreenshotSearchHandlers() {
  // Collapsible Turn-by-Turn Directions Accordion
  var btnAccordion = document.getElementById("btnAccordionDirections");
  var accordionBody = document.getElementById("directionsAccordionBody");
  var chevronIcon = document.getElementById("directionsChevronIcon");
  if (btnAccordion && accordionBody && !btnAccordion.dataset.bound) {
    btnAccordion.addEventListener("click", function() {
      var isCollapsed = accordionBody.classList.toggle("collapsed");
      btnAccordion.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      if (chevronIcon) chevronIcon.textContent = isCollapsed ? "▼" : "▲";
    });
    btnAccordion.dataset.bound = "1";
  }
  // Clear buttons: resets input and clears stored coordinates
  var bindClear = function(btnId, inputId, isFrom) {
    var b = document.getElementById(btnId);
    var i = document.getElementById(inputId);
    if (b && i && !b.dataset.bound) {
      b.addEventListener("click", function() {
        i.value = "";
        if (isFrom) {
          fromLocation = { text: "", lat: null, lon: null, source: null };
        } else {
          toLocation = { text: "", lat: null, lon: null, source: null };
        }
        i.focus();
      });
      b.dataset.bound = "1";
    }
  };
  bindClear("btnClearFrom", "inputRouteFrom", true);
  bindClear("btnClearTo", "inputRouteTo", false);
  bindClear("btnClearStripFrom", "routeStripFrom", true);
  bindClear("btnClearStripTo", "routeStripTo", false);

  // Swap buttons: swaps text inputs and location state objects
  var bindSwap = function(btnId, fromId, toId) {
    var b = document.getElementById(btnId);
    var f = document.getElementById(fromId);
    var t = document.getElementById(toId);
    if (b && f && t && !b.dataset.bound) {
      b.addEventListener("click", function() {
        var tmpVal = f.value; f.value = t.value; t.value = tmpVal;
        var tmpLoc = Object.assign({}, fromLocation);
        fromLocation = Object.assign({}, toLocation);
        toLocation = tmpLoc;
      });
      b.dataset.bound = "1";
    }
  };
  bindSwap("btnSwapLocations", "inputRouteFrom", "inputRouteTo");
  bindSwap("btnSwapStripLocations", "routeStripFrom", "routeStripTo");

  // Input change listeners: clears stored GPS coordinates if user modifies text
  var onFromInput = function(e) {
    var val = e.target.value.trim();
    if (fromLocation.source === "gps" && val !== fromLocation.text) {
      fromLocation = { text: val, lat: null, lon: null, source: "manual" };
    } else if (fromLocation.source !== "gps") {
      fromLocation = { text: val, lat: null, lon: null, source: "manual" };
    }
    // sync companion input
    var otherId = (e.target.id === "inputRouteFrom") ? "routeStripFrom" : "inputRouteFrom";
    var other = document.getElementById(otherId);
    if (other && other.value !== e.target.value) other.value = e.target.value;
  };

  var onToInput = function(e) {
    var val = e.target.value.trim();
    if (toLocation.source === "gps" && val !== toLocation.text) {
      toLocation = { text: val, lat: null, lon: null, source: "manual" };
    } else if (toLocation.source !== "gps") {
      toLocation = { text: val, lat: null, lon: null, source: "manual" };
    }
    // sync companion input
    var otherId = (e.target.id === "inputRouteTo") ? "routeStripTo" : "inputRouteTo";
    var other = document.getElementById(otherId);
    if (other && other.value !== e.target.value) other.value = e.target.value;
  };

  var bindInputListener = function(id, handler) {
    var el = document.getElementById(id);
    if (el && !el.dataset.inputBound) {
      el.addEventListener("input", handler);
      el.dataset.inputBound = "1";
    }
  };
  bindInputListener("inputRouteFrom", onFromInput);
  bindInputListener("routeStripFrom", onFromInput);
  bindInputListener("inputRouteTo", onToInput);
  bindInputListener("routeStripTo", onToInput);

  // Refresh Traffic Button
  var bRefreshTraf = document.getElementById("btnRefreshTraffic");
  if (bRefreshTraf && !bRefreshTraf.dataset.bound) {
    bRefreshTraf.addEventListener("click", function() {
      refreshRouteTraffic();
    });
    bRefreshTraf.dataset.bound = "1";
  }

  // Periodic Auto-Refresh: updates every 2 minutes while route is on screen
  if (!trafficAutoRefreshTimer) {
    trafficAutoRefreshTimer = setInterval(function() {
      if (window.currentRouteData && window.currentRouteData.latLngs && !isTrafficRefreshing) {
        loadTomTomTrafficForRoute(window.currentRouteData.latLngs, false);
      }
    }, 120000);
  }

  // Home Page Form
  var homeForm = document.getElementById("homeRouteSearchForm");
  var inputFrom = document.getElementById("inputRouteFrom");
  var inputTo = document.getElementById("inputRouteTo");

  if (homeForm && !homeForm.dataset.bound) {
    homeForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var fV = (inputFrom ? inputFrom.value : "").trim();
      var tV = (inputTo ? inputTo.value : "").trim();
      executeRouteSearch(fV, tV, "home");
    });
    homeForm.dataset.bound = "1";
  }

  // Route Page Persistent Strip Form
  var stripForm = document.getElementById("routePageSearchForm");
  var stripFrom = document.getElementById("routeStripFrom");
  var stripTo = document.getElementById("routeStripTo");

  if (stripForm && !stripForm.dataset.bound) {
    stripForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var fV = (stripFrom ? stripFrom.value : "").trim();
      var tV = (stripTo ? stripTo.value : "").trim();
      executeRouteSearch(fV, tV, "strip");
    });
    stripForm.dataset.bound = "1";
  }
}

// Attach listeners on load
document.addEventListener("DOMContentLoaded", function() {
  initScreenshotSearchHandlers();
  initGoogleMapsIntegration();
  initMapEngineControls();
});


// ============================================================================
// 14. USER LOCATION & JOURNEY TRACKING ENGINE (FEATURES 1 TO 25)
// ============================================================================

var isTracking = false;
var watchId = null;
var movementPath = [];        // Array of [lat, lon] points
var locationPoints = [];      // Array of detailed GPS point telemetry
var journeyStartLocation = null;
var journeyStartTime = null;
var journeyEndTime = null;
var journeyDurationTimer = null;
var currentUserPosition = null; // { lat, lon, accuracy, speed, heading }
var userLocationMarker = null;
var userAccuracyCircle = null;
var movementTrailPolyline = null;
var hasUserManualMovedMap = false;

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Earth's mean radius in km
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total cumulative distance along the movement trail
 */
function calculateTotalTrailDistance() {
  if (movementPath.length < 2) return 0;
  var total = 0;
  for (var i = 0; i < movementPath.length - 1; i++) {
    total += calculateDistance(
      movementPath[i][0], movementPath[i][1],
      movementPath[i+1][0], movementPath[i+1][1]
    );
  }
  return total;
}

/**
 * Converts compass degrees to 8 cardinal directions
 */
function headingToDirection(heading) {
  if (heading === null || heading === undefined || isNaN(heading)) return "Unavailable";
  var directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
  var index = Math.round(heading / 45) % 8;
  return directions[index];
}

/**
 * Formats speed in meters per second to km/h
 */
function formatSpeed(speedMps) {
  if (speedMps === null || speedMps === undefined || isNaN(speedMps) || speedMps < 0) {
    return "Unavailable";
  }
  return Math.round(speedMps * 3.6) + " km/h";
}

/**
 * Formats milliseconds to human readable duration
 */
function formatDurationHMS(ms) {
  var totalSec = Math.floor(ms / 1000);
  var hrs = Math.floor(totalSec / 3600);
  var mins = Math.floor((totalSec % 3600) / 60);
  var secs = totalSec % 60;
  if (hrs > 0) {
    return hrs + " hr " + mins + " min";
  }
  return mins + " min " + secs + " sec";
}

/**
 * Native Browser Geolocation requester with explicit permission handling
 */
function requestUserLocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    if (onError) onError({ code: 0, message: "Geolocation is not supported by this browser." });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    onError,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
  );
}

/**
 * Reverse geocodes GPS coordinates to readable place name via Nominatim
 */
async function reverseGeocodeLocation(lat, lon) {
  try {
    var url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lon;
    var resp = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (resp.ok) {
      var data = await resp.json();
      if (data && data.address) {
        var a = data.address;
        var neighborhood = a.suburb || a.neighbourhood || a.road || a.city_district || a.town || a.village || a.hamlet || a.city;
        if (neighborhood) {
          return "Near " + neighborhood + ", Bengaluru";
        }
      }
      if (data && data.display_name) {
        var parts = data.display_name.split(",");
        return parts.slice(0, 2).join(",").trim();
      }
    }
  } catch (e) {
    console.warn("Reverse geocode fallback:", e);
  }
  return "Current Location";
}

/**
 * Handles 'Use My Location' button clicks from Home or Route search bars
 */
async function handleUseMyLocationClick(targetInputId) {
  var inputEl = document.getElementById(targetInputId);
  var btnEl = document.getElementById(targetInputId === "inputRouteFrom" ? "btnHomeUseMyLocation" : "btnStripUseMyLocation");

  if (btnEl) {
    btnEl.dataset.origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '<span class="btn-spinner"></span> <span>Locating...</span>';
    btnEl.disabled = true;
  }

  requestUserLocation(
    async function(pos) {
      var lat = pos.coords.latitude;
      var lon = pos.coords.longitude;
      currentUserPosition = {
        lat: lat,
        lon: lon,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading
      };

      // Reverse geocode strictly for display purposes
      var placeName = "Current Location";
      try {
        var res = await reverseGeocodeLocation(lat, lon);
        if (res && res.trim()) placeName = res.trim();
      } catch (rgErr) {
        console.warn("Reverse geocoding error:", rgErr);
        placeName = "Current Location";
      }

      // Store GPS coordinates directly in fromLocation
      fromLocation = {
        text: placeName,
        lat: lat,
        lon: lon,
        source: "gps"
      };

      if (inputEl) {
        inputEl.value = placeName;
        inputEl.focus();
      }
      // Sync other input if present
      var otherId = targetInputId === "inputRouteFrom" ? "routeStripFrom" : "inputRouteFrom";
      var otherEl = document.getElementById(otherId);
      if (otherEl) otherEl.value = placeName;

      // Update map marker if map exists
      if (_screenshotMap) {
        updateUserMarker(lat, lon, pos.coords.accuracy, pos.coords.heading);
        _screenshotMap.setView([lat, lon], 15);
      }

      if (btnEl) {
        btnEl.innerHTML = btnEl.dataset.origHtml || '<span>My Location</span>';
        btnEl.disabled = false;
      }
    },
    function(err) {
      handleLocationError(err);
      if (btnEl) {
        btnEl.innerHTML = btnEl.dataset.origHtml || '<span>My Location</span>';
        btnEl.disabled = false;
      }
    }
  );
}

/**
 * Starts live journey tracking using navigator.geolocation.watchPosition
 */
function startJourneyTracking() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  var banner = document.getElementById("geoPermissionBanner");
  if (banner) banner.classList.add("hidden");

  isTracking = true;
  movementPath = [];
  locationPoints = [];
  hasUserManualMovedMap = false;
  journeyStartTime = Date.now();
  journeyEndTime = null;

  // Update UI State
  updateJourneyUIState(true);

  // Clear previous trail if any
  if (movementTrailPolyline && _screenshotMap) {
    _screenshotMap.removeLayer(movementTrailPolyline);
    movementTrailPolyline = null;
  }

  // Start live stopwatch timer
  startJourneyDurationTimer();

  // Begin watchPosition GPS polling
  try {
    watchId = navigator.geolocation.watchPosition(
      onWatchPositionSuccess,
      onWatchPositionError,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 1000 }
    );
  } catch (e) {
    console.error("watchPosition invocation failed:", e);
    stopJourneyTracking();
  }
}

/**
 * Handles incoming GPS location updates from watchPosition
 */
function onWatchPositionSuccess(pos) {
  if (!isTracking) return;

  var lat = pos.coords.latitude;
  var lon = pos.coords.longitude;
  var accuracy = pos.coords.accuracy;
  var speed = pos.coords.speed;
  var heading = pos.coords.heading;
  var timestamp = pos.timestamp || Date.now();

  currentUserPosition = {
    lat: lat,
    lon: lon,
    accuracy: accuracy,
    speed: speed,
    heading: heading
  };

  // Record initial coordinate
  if (!journeyStartLocation) {
    journeyStartLocation = { lat: lat, lon: lon, timestamp: timestamp };
  }

  // Append point to trail and telemetry history
  movementPath.push([lat, lon]);
  locationPoints.push({
    latitude: lat,
    longitude: lon,
    timestamp: timestamp,
    accuracy: accuracy,
    speed: speed,
    heading: heading
  });

  // Update User Location Marker & Circle
  updateUserMarker(lat, lon, accuracy, heading);

  // Update Movement Trail Polyline
  updateMovementTrail();

  // Update Live Stats Grid
  updateLiveJourneyStats(pos.coords);

  // Check Deviation from Planned Route
  checkRouteDeviation(lat, lon);

  // Check Proximity to Recorded Crash Hotspots
  checkNearbyCrashAlert(lat, lon);

  // Auto-center map on initial tracking fix
  if (_screenshotMap && !hasUserManualMovedMap && movementPath.length <= 2) {
    _screenshotMap.setView([lat, lon], 15);
  }
}

/**
 * Handles watchPosition errors with friendly user notifications
 */
function onWatchPositionError(err) {
  handleLocationError(err);
}

/**
 * User-friendly error message dispatcher
 */
function handleLocationError(err) {
  var msg = "Unable to retrieve your location.";
  if (err.code === 1) { // PERMISSION_DENIED
    msg = "Location access was denied. Please allow location permission in your browser settings to use this feature.";
  } else if (err.code === 2) { // POSITION_UNAVAILABLE
    msg = "Your location could not be determined. Please check your GPS/location settings.";
  } else if (err.code === 3) { // TIMEOUT
    msg = "Location request timed out. Please try again.";
  } else if (err.message) {
    msg = err.message;
  }
  alert(msg);
}

/**
 * Updates or creates the pulsing blue user location marker on the Leaflet map
 */
function updateUserMarker(lat, lon, accuracy, heading) {
  if (!_screenshotMap || typeof L === "undefined") return;

  var userIcon = L.divIcon({
    className: "custom-user-location-marker",
    html: '<div class="user-pulse-outer" title="Your Location"><div class="user-pulse-ring"></div><div class="user-pulse-center"></div></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  var popupHtml = '<div class="custom-leaflet-popup" style="text-align:center;">' +
                  '<strong>🔵 You are here</strong>' +
                  '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">Accuracy: &plusmn;' + Math.round(accuracy) + ' m</div>' +
                  '</div>';

  if (!userLocationMarker) {
    userLocationMarker = L.marker([lat, lon], { icon: userIcon, zIndexOffset: 2000 });
    userLocationMarker.bindPopup(popupHtml);
    userLocationMarker.addTo(_screenshotMap);
  } else {
    userLocationMarker.setLatLng([lat, lon]);
    userLocationMarker.setPopupContent(popupHtml);
  }

  // Draw or update accuracy radius circle
  if (!userAccuracyCircle) {
    userAccuracyCircle = L.circle([lat, lon], {
      radius: Math.max(accuracy, 10),
      color: "#3b82f6",
      weight: 1,
      fillColor: "#60a5fa",
      fillOpacity: 0.12
    }).addTo(_screenshotMap);
  } else {
    userAccuracyCircle.setLatLng([lat, lon]);
    userAccuracyCircle.setRadius(Math.max(accuracy, 10));
  }
}

/**
 * Updates the actual movement trail polyline on the Leaflet map
 */
function updateMovementTrail() {
  if (!_screenshotMap || typeof L === "undefined") return;

  if (!movementTrailPolyline) {
    movementTrailPolyline = L.polyline(movementPath, {
      color: "#2563eb",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(_screenshotMap);
    movementTrailPolyline.bindPopup("<strong>🔵 Actual Movement Trail</strong><br>Path travelled during active journey.");
  } else {
    movementTrailPolyline.setLatLngs(movementPath);
  }
}

/**
 * Updates the live telemetry card values
 */
function updateLiveJourneyStats(coords) {
  var speedEl = document.getElementById("valCurrentSpeed");
  var dirEl = document.getElementById("valCurrentDirection");
  var accEl = document.getElementById("valGpsAccuracy");
  var distEl = document.getElementById("valDistanceTravelled");
  var warnEl = document.getElementById("gpsAccuracyWarning");

  if (speedEl) speedEl.textContent = formatSpeed(coords.speed);
  if (dirEl) dirEl.textContent = headingToDirection(coords.heading);
  if (accEl) accEl.textContent = "±" + Math.round(coords.accuracy) + " m";

  var totalKm = calculateTotalTrailDistance();
  if (distEl) distEl.textContent = totalKm.toFixed(2) + " km";

  if (warnEl) {
    if (coords.accuracy > 50) {
      warnEl.classList.remove("hidden");
    } else {
      warnEl.classList.add("hidden");
    }
  }
}

/**
 * Live duration stopwatch updater
 */
function startJourneyDurationTimer() {
  if (journeyDurationTimer) clearInterval(journeyDurationTimer);
  journeyDurationTimer = setInterval(function() {
    if (!isTracking || !journeyStartTime) return;
    var elapsedMs = Date.now() - journeyStartTime;
    var totalSec = Math.floor(elapsedMs / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    var durEl = document.getElementById("valJourneyDuration");
    if (durEl) {
      durEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
  }, 1000);
}

/**
 * Checks if the user has drifted more than 250m from the planned OSRM route
 */
function checkRouteDeviation(lat, lon) {
  var alertEl = document.getElementById("routeDeviationAlert");
  if (!alertEl) return;

  if (!window.currentRouteData || !window.currentRouteData.latLngs || window.currentRouteData.latLngs.length === 0) {
    alertEl.classList.add("hidden");
    return;
  }

  var pts = window.currentRouteData.latLngs;
  var minDistance = 9999;
  for (var i = 0; i < pts.length; i += 3) { // sample check every 3rd point for efficiency
    var d = calculateDistance(lat, lon, pts[i][0], pts[i][1]);
    if (d < minDistance) minDistance = d;
  }

  // Threshold: 0.25 km (250 meters)
  if (minDistance > 0.25) {
    alertEl.classList.remove("hidden");
  } else {
    alertEl.classList.add("hidden");
  }
}

/**
 * Checks proximity to recorded crash hotspots (< 500m)
 */
function checkNearbyCrashAlert(lat, lon) {
  var alertEl = document.getElementById("crashProximityAlert");
  var nameEl = document.getElementById("nearbyCrashLocName");
  if (!alertEl || !nameEl) return;

  var recordedHotspots = [
    { name: "Central Silk Board Jn", lat: 12.9210, lng: 77.6350 },
    { name: "Outer Ring Road (Hebbal)", lat: 13.0150, lng: 77.6320 },
    { name: "Electronic City Phase 1 Tollway", lat: 12.8550, lng: 77.6620 },
    { name: "Indiranagar 100 Feet Road", lat: 12.9780, lng: 77.6410 }
  ];

  var nearbyCrash = null;
  for (var i = 0; i < recordedHotspots.length; i++) {
    var d = calculateDistance(lat, lon, recordedHotspots[i].lat, recordedHotspots[i].lng);
    if (d < 0.5) { // 500 meters
      nearbyCrash = recordedHotspots[i].name;
      break;
    }
  }

  if (nearbyCrash) {
    nameEl.textContent = nearbyCrash;
    alertEl.classList.remove("hidden");
  } else {
    alertEl.classList.add("hidden");
  }
}

/**
 * Stops journey tracking, compiles statistics, and saves to localStorage
 */
function stopJourneyTracking() {
  if (watchId !== null) {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch (e) {}
    watchId = null;
  }

  isTracking = false;
  if (journeyDurationTimer) {
    clearInterval(journeyDurationTimer);
    journeyDurationTimer = null;
  }
  journeyEndTime = Date.now();

  // Hide deviation and crash proximity alerts
  var devAlert = document.getElementById("routeDeviationAlert");
  if (devAlert) devAlert.classList.add("hidden");
  var crashAlert = document.getElementById("crashProximityAlert");
  if (crashAlert) crashAlert.classList.add("hidden");

  // Update UI State
  updateJourneyUIState(false);

  // Save journey locally and open summary dialog
  var saved = saveJourney();
  showJourneyCompletedModal(saved);
}

/**
 * Updates UI control states when tracking starts or stops
 */
function updateJourneyUIState(active) {
  var dot = document.getElementById("pulseDot");
  var statusText = document.getElementById("journeyStatusText");
  var card = document.querySelector(".journey-control-card");
  var btnStart = document.getElementById("btnStartJourney");
  var btnStop = document.getElementById("btnStopJourney");

  if (active) {
    if (dot) { dot.className = "pulse-status-dot status-active"; }
    if (statusText) { statusText.textContent = "● Journey Active"; statusText.style.color = "#10b981"; }
    if (card) { card.classList.add("active-tracking"); }
    if (btnStart) { btnStart.classList.add("hidden"); }
    if (btnStop) { btnStop.classList.remove("hidden"); }
  } else {
    if (dot) { dot.className = "pulse-status-dot status-off"; }
    if (statusText) { statusText.textContent = "Journey Tracking: OFF"; statusText.style.color = "#cbd5e1"; }
    if (card) { card.classList.remove("active-tracking"); }
    if (btnStart) { btnStart.classList.remove("hidden"); }
    if (btnStop) { btnStop.classList.add("hidden"); }
  }
}

/**
 * Saves completed journey record to localStorage
 */
function saveJourney() {
  var totalKm = calculateTotalTrailDistance();
  var durMs = (journeyEndTime || Date.now()) - (journeyStartTime || Date.now());
  var pair = window.currentRoutePair || { from: "Hebbal, Bengaluru", to: "Electronic City, Bengaluru" };

  var journeyRecord = {
    id: "JRN-" + Date.now(),
    date: new Date().toLocaleDateString("en-GB"),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    startTime: journeyStartTime,
    endTime: journeyEndTime,
    durationFormatted: formatDurationHMS(durMs),
    durationMs: durMs,
    startLocation: pair.from || "Starting Point",
    endLocation: pair.to || "Destination",
    distanceKm: totalKm.toFixed(2),
    pointsCount: locationPoints.length,
    locationPoints: locationPoints
  };

  var existing = loadJourneys();
  existing.unshift(journeyRecord);
  try {
    localStorage.setItem("smartTrafficJourneys", JSON.stringify(existing));
  } catch (e) {
    console.warn("Storage quota exceeded for journeys:", e);
  }

  // Refresh Dashboard history section if active
  renderJourneyHistoryDashboard();
  return journeyRecord;
}

/**
 * Loads journey records from localStorage
 */
function loadJourneys() {
  try {
    var raw = localStorage.getItem("smartTrafficJourneys");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Clears journey history from localStorage after user confirmation
 */
function clearJourneyHistory() {
  if (confirm("Are you sure you want to delete all stored journey history?")) {
    localStorage.removeItem("smartTrafficJourneys");
    renderJourneyHistoryDashboard();
  }
}

/**
 * Displays Journey Completed Summary Modal
 */
function showJourneyCompletedModal(journey) {
  var modal = document.getElementById("journeySummaryModal");
  if (!modal) return;

  var sLoc = document.getElementById("summaryStartLoc");
  var eLoc = document.getElementById("summaryEndLoc");
  var sDist = document.getElementById("summaryDistance");
  var sDur = document.getElementById("summaryDuration");
  var sPts = document.getElementById("summaryGpsPoints");

  if (sLoc) sLoc.textContent = journey.startLocation;
  if (eLoc) eLoc.textContent = journey.endLocation;
  if (sDist) sDist.textContent = journey.distanceKm + " km";
  if (sDur) sDur.textContent = journey.durationFormatted;
  if (sPts) sPts.textContent = journey.pointsCount;

  modal.classList.remove("hidden");
}

/**
 * Renders the Journey History section in the Dashboard
 */
function renderJourneyHistoryDashboard() {
  var container = document.getElementById("journeyHistoryContainer");
  if (!container) return;

  var journeys = loadJourneys();
  container.innerHTML = "";

  if (journeys.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:1.5rem;font-size:0.92rem;">' +
                          'No journey history available. Start a journey on the Route page to record GPS trips!' +
                          '</div>';
    return;
  }

  journeys.forEach(function(j) {
    var item = document.createElement("div");
    item.className = "journey-history-item";
    item.innerHTML =
      '<div>' +
      '<div class="jh-route-title">📍 ' + escapeHtml(j.startLocation) + ' &rarr; ' + escapeHtml(j.endLocation) + '</div>' +
      '<div class="jh-meta-row">' +
      '<span>📅 ' + escapeHtml(j.date) + ' ' + escapeHtml(j.time) + '</span>' +
      '<span>🛰️ ' + j.pointsCount + ' GPS fixes</span>' +
      '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
      '<div class="jh-stat-badge" style="font-size:1.1rem;">' + escapeHtml(j.distanceKm) + ' km</div>' +
      '<div style="font-size:0.8rem;color:#cbd5e1;">' + escapeHtml(j.durationFormatted) + '</div>' +
      '</div>';
    container.appendChild(item);
  });
}

/**
 * Recenters the Leaflet map on the user's current GPS position
 */
function recenterMapOnUser() {
  if (currentUserPosition && _screenshotMap) {
    hasUserManualMovedMap = false;
    _screenshotMap.setView([currentUserPosition.lat, currentUserPosition.lon], 16, { animate: true });
    if (userLocationMarker) userLocationMarker.openPopup();
  } else {
    requestUserLocation(
      function(pos) {
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        currentUserPosition = { lat: lat, lon: lon, accuracy: pos.coords.accuracy, speed: pos.coords.speed, heading: pos.coords.heading };
        updateUserMarker(lat, lon, pos.coords.accuracy, pos.coords.heading);
        if (_screenshotMap) _screenshotMap.setView([lat, lon], 16);
      },
      function(err) {
        handleLocationError(err);
      }
    );
  }
}

/**
 * Initializes journey tracking listeners, buttons, and modals
 */
function initJourneyTrackingListeners() {
  // Use My Location Buttons
  var bHomeLoc = document.getElementById("btnHomeUseMyLocation");
  if (bHomeLoc && !bHomeLoc.dataset.bound) {
    bHomeLoc.addEventListener("click", function() { handleUseMyLocationClick("inputRouteFrom"); });
    bHomeLoc.dataset.bound = "1";
  }

  var bStripLoc = document.getElementById("btnStripUseMyLocation");
  if (bStripLoc && !bStripLoc.dataset.bound) {
    bStripLoc.addEventListener("click", function() { handleUseMyLocationClick("routeStripFrom"); });
    bStripLoc.dataset.bound = "1";
  }

  var bMapLoc = document.getElementById("btnRouteUseMyLocation");
  if (bMapLoc && !bMapLoc.dataset.bound) {
    bMapLoc.addEventListener("click", function() { recenterMapOnUser(); });
    bMapLoc.dataset.bound = "1";
  }

  // Recenter button on map action bar
  var bRecenterUser = document.getElementById("btnRecenterUser");
  if (bRecenterUser && !bRecenterUser.dataset.bound) {
    bRecenterUser.addEventListener("click", function() { recenterMapOnUser(); });
    bRecenterUser.dataset.bound = "1";
  }

  // Start & Stop Journey Buttons
  var bStart = document.getElementById("btnStartJourney");
  if (bStart && !bStart.dataset.bound) {
    bStart.addEventListener("click", function() { startJourneyTracking(); });
    bStart.dataset.bound = "1";
  }

  var bStop = document.getElementById("btnStopJourney");
  if (bStop && !bStop.dataset.bound) {
    bStop.addEventListener("click", function() { stopJourneyTracking(); });
    bStop.dataset.bound = "1";
  }

  // Geolocation Permission Banner Actions
  var bEnable = document.getElementById("btnEnableLocation");
  if (bEnable && !bEnable.dataset.bound) {
    bEnable.addEventListener("click", function() {
      requestUserLocation(
        function(pos) {
          var b = document.getElementById("geoPermissionBanner");
          if (b) b.classList.add("hidden");
          var lat = pos.coords.latitude;
          var lon = pos.coords.longitude;
          currentUserPosition = { lat: lat, lon: lon, accuracy: pos.coords.accuracy, speed: pos.coords.speed, heading: pos.coords.heading };
          updateUserMarker(lat, lon, pos.coords.accuracy, pos.coords.heading);
          if (_screenshotMap) _screenshotMap.setView([lat, lon], 15);
        },
        function(err) {
          handleLocationError(err);
        }
      );
    });
    bEnable.dataset.bound = "1";
  }

  var bDismiss = document.getElementById("btnDismissGeoBanner");
  if (bDismiss && !bDismiss.dataset.bound) {
    bDismiss.addEventListener("click", function() {
      var b = document.getElementById("geoPermissionBanner");
      if (b) b.classList.add("hidden");
    });
    bDismiss.dataset.bound = "1";
  }

  // Modal Close Buttons
  var bClose1 = document.getElementById("btnCloseJourneyModal");
  var bClose2 = document.getElementById("btnConfirmCloseModal");
  var closeModalFn = function() {
    var m = document.getElementById("journeySummaryModal");
    if (m) m.classList.add("hidden");
  };
  if (bClose1 && !bClose1.dataset.bound) { bClose1.addEventListener("click", closeModalFn); bClose1.dataset.bound = "1"; }
  if (bClose2 && !bClose2.dataset.bound) { bClose2.addEventListener("click", closeModalFn); bClose2.dataset.bound = "1"; }

  // Clear Journey History Button in Dashboard
  var bClearHist = document.getElementById("btnClearJourneyHistory");
  if (bClearHist && !bClearHist.dataset.bound) {
    bClearHist.addEventListener("click", function() { clearJourneyHistory(); });
    bClearHist.dataset.bound = "1";
  }

  // Detect manual user dragging on Leaflet map to avoid fighting user pan
  if (_screenshotMap && !_screenshotMap.datasetUserPanBound) {
    _screenshotMap.on("dragstart", function() { hasUserManualMovedMap = true; });
    _screenshotMap.datasetUserPanBound = "1";
  }

  // Render journey history in dashboard immediately
  renderJourneyHistoryDashboard();
}

// Hook into DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
  initJourneyTrackingListeners();
});

// ============================================================================
// PROGRESSIVE WEB APP (PWA) SERVICE WORKER REGISTRATION
// ============================================================================
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      console.log("PWA: Service Worker registered successfully.", reg.scope);
    }).catch((err) => {
      console.warn("PWA: Service Worker registration skipped:", err);
    });
  });
}
